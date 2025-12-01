
import React, { useEffect, useRef, useState } from 'react';
import { storageService } from '../services/storageService';
import { DriverLocation, Store } from '../types';
import { Navigation } from 'lucide-react';

// Declare Leaflet global type for CDN usage
declare const L: any;

const FACTORY_LOCATION = {
  lat: 53.5706,
  lng: -113.4682,
  address: "8612 118th Avenue Northwest, Edmonton, Alberta, Canada",
  name: "Factory"
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

// Helper to format "last seen"
const getTimeAgo = (timestamp?: number) => {
    if (!timestamp) return 'Offline';
    const diff = Date.now() - timestamp;
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
};

export const LiveMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const storeMarkersRef = useRef<{ [key: string]: any }>({}); // Separate ref for store markers
  const polylinesRef = useRef<{ [key: string]: any }>({});
  const isMountedRef = useRef(true);
  
  const [drivers, setDrivers] = useState<DriverLocation[]>([]);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Initialize Map
  useEffect(() => {
    isMountedRef.current = true;
    
    // Check if container exists
    if (!mapRef.current) return;

    // Cleanup existing instance if any (strict mode safe)
    if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        markersRef.current = {};
        storeMarkersRef.current = {};
        polylinesRef.current = {};
    }

    // Center on Factory
    const map = L.map(mapRef.current, {
        zoomControl: false // We can add it manually if needed, or keep default
    }).setView([FACTORY_LOCATION.lat, FACTORY_LOCATION.lng], 12);
    
    L.control.zoom({ position: 'topleft' }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    mapInstance.current = map;

    // --- Add Factory Marker ---
    const factoryIcon = L.divIcon({
        className: 'bg-emerald-600 w-6 h-6 rounded-md border-2 border-white shadow-xl flex items-center justify-center text-white relative z-[1000]',
        html: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4 8 4v14"/><path d="M17 21v-8H7v8"/></svg>`,
        iconSize: [24, 24],
        iconAnchor: [12, 24],
        popupAnchor: [0, -24]
    });

    const factoryMarker = L.marker([FACTORY_LOCATION.lat, FACTORY_LOCATION.lng], { icon: factoryIcon, zIndexOffset: 1000 })
      .addTo(map)
      .bindPopup(`
        <div class="p-2 min-w-[200px] font-sans">
            <div class="flex items-center gap-2 mb-2">
                <div class="bg-emerald-600 text-white p-1 rounded-md">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4 8 4v14"/><path d="M17 21v-8H7v8"/></svg>
                </div>
                <div>
                    <h3 class="font-bold text-slate-900 leading-tight">Factory / Distribution Center</h3>
                    <p class="text-[10px] text-slate-500 font-medium">Origin Point</p>
                </div>
            </div>
            <p class="text-xs text-slate-600 border-t border-slate-100 pt-2 leading-relaxed">${FACTORY_LOCATION.address}</p>
        </div>
      `);

    return () => {
      isMountedRef.current = false;
      if (mapInstance.current) {
          mapInstance.current.remove();
          mapInstance.current = null;
      }
      markersRef.current = {};
      storeMarkersRef.current = {};
      polylinesRef.current = {};
    };
  }, []);

  // --- Geocoding Helper ---
  const geocodeAddress = async (address: string) => {
    try {
        // Force Edmonton context
        let searchAddress = address;
        if (!searchAddress.toLowerCase().includes('edmonton')) {
            searchAddress += ", Edmonton, Alberta, Canada";
        } else if (!searchAddress.toLowerCase().includes('canada')) {
            searchAddress += ", Canada";
        }

        const query = encodeURIComponent(searchAddress);
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&viewbox=-113.713,53.666,-113.293,53.400&bounded=1&limit=1`);
        const data = await response.json();
        if (data && data.length > 0) {
            return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        }
    } catch (e) {
        console.warn("Geocoding failed for", address);
    }
    return null;
  };

  // --- Subscribe to Stores (Real-time) ---
  useEffect(() => {
    const unsubscribe = storageService.subscribeToStores(async (stores) => {
        if (!isMountedRef.current || !mapInstance.current) return;
        const map = mapInstance.current;

        // Clear existing store markers
        Object.values(storeMarkersRef.current).forEach((marker: any) => map.removeLayer(marker));
        storeMarkersRef.current = {};

        // Process new stores
        for (const store of stores) {
            if (!isMountedRef.current) return;

            let { lat, lng } = store;
            
            // If coordinates are missing, try to geocode on the fly
            if (!lat || !lng) {
                    if (store.address) {
                    const coords = await geocodeAddress(store.address);
                    if (coords) {
                        lat = coords.lat;
                        lng = coords.lng;
                    }
                    }
            }

            if (!lat || !lng) continue;

            // Check overlap with factory
            const distToFactory = calculateDistance(lat, lng, FACTORY_LOCATION.lat, FACTORY_LOCATION.lng);
            const isFactory = distToFactory < 0.1;

            if (!isFactory) {
                const distDisplay = distToFactory.toFixed(1);
                
                const marker = L.marker([lat, lng], {
                icon: L.divIcon({
                    className: 'bg-indigo-600 w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-xs hover:scale-110 transition-transform',
                    html: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
                    iconSize: [24, 24],
                    iconAnchor: [12, 24],
                    popupAnchor: [0, -24]
                })
                }).bindPopup(`
                    <div class="p-2 min-w-[180px] font-sans">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="bg-indigo-100 text-indigo-700 p-0.5 px-1.5 rounded text-[10px] font-bold uppercase tracking-wider">Store</span>
                        </div>
                        <h3 class="font-bold text-slate-900 text-sm mb-1">${store.name}</h3>
                        <p class="text-xs text-slate-500 mb-2 leading-tight">${store.address}</p>
                        
                        <div class="space-y-1 border-t border-slate-100 pt-2 mt-2">
                            <div class="flex items-center justify-between">
                                <span class="text-[10px] font-bold text-slate-400 uppercase">Distance</span>
                                <span class="text-xs font-bold text-slate-700 flex items-center gap-1">
                                    ${distDisplay} km
                                </span>
                            </div>
                        </div>
                    </div>
                `).addTo(map);

                storeMarkersRef.current[store.id] = marker;
            }
        }
    });

    return () => unsubscribe();
  }, []);

  // Poll for driver updates
  useEffect(() => {
    let active = true;
    const interval = setInterval(async () => {
      if (!active) return;
      try {
        const updatedDrivers = await storageService.simulateDriverMovement();
        if (active) {
            setDrivers([...updatedDrivers]); 
            setLastUpdate(Date.now());
        }
      } catch (e) {
          console.error("Driver sync error", e);
      }
    }, 2000); 

    return () => { active = false; clearInterval(interval); };
  }, []);

  // Update Driver Markers
  useEffect(() => {
    if (!mapInstance.current || !isMountedRef.current) return;
    const map = mapInstance.current;

    drivers.forEach(driver => {
      const lastSeen = getTimeAgo(driver.timestamp);

      // 1. Update or Create Marker
      if (markersRef.current[driver.driverId]) {
        // Smoothly move marker
        markersRef.current[driver.driverId].setLatLng([driver.lat, driver.lng]);
        
        // Update popup content
        const popupContent = `
          <div class="p-1 font-sans">
            <h3 class="font-bold text-slate-800 text-sm">${driver.driverName}</h3>
            <div class="text-xs text-slate-600 mt-1 space-y-1">
              <p>Status: <span class="${driver.status === 'moving' ? 'text-blue-600' : 'text-amber-600'} font-semibold uppercase">${driver.status}</span></p>
              <p>Speed: ${driver.speed.toFixed(1)} km/h</p>
              <p>Last Seen: <span class="font-semibold text-slate-800">${lastSeen}</span></p>
              <hr class="my-1 border-slate-200"/>
              <p class="font-medium">Next: ${driver.nextStopName || 'Assigned Route'}</p>
              <p class="font-bold text-blue-600">ETA: ${driver.eta || 'Calculating...'}</p>
            </div>
          </div>
        `;
        
        // Only set content if popup exists, otherwise bind it
        if (markersRef.current[driver.driverId].getPopup()) {
             markersRef.current[driver.driverId].setPopupContent(popupContent);
        } else {
             markersRef.current[driver.driverId].bindPopup(popupContent);
        }

      } else {
        // Create new marker
        const icon = L.divIcon({
          className: 'bg-blue-600 w-8 h-8 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-white',
          html: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -16]
        });

        const marker = L.marker([driver.lat, driver.lng], { icon })
          .addTo(map)
          .bindPopup(`Initializing...`);
        
        markersRef.current[driver.driverId] = marker;
      }

      // 2. Update History Trail (Polyline)
      if (driver.history && driver.history.length > 0) {
        const trailCoords = driver.history.map(h => [h.lat, h.lng]);
        trailCoords.push([driver.lat, driver.lng]); // Add current position

        if (polylinesRef.current[driver.driverId]) {
          polylinesRef.current[driver.driverId].setLatLngs(trailCoords);
        } else {
          const polyline = L.polyline(trailCoords, { 
            color: '#2563eb', // blue-600 
            weight: 3, 
            opacity: 0.6,
            lineCap: 'round',
            dashArray: '5, 10'
          }).addTo(map);
          polylinesRef.current[driver.driverId] = polyline;
        }
      }
    });

  }, [drivers, lastUpdate]);

  return (
    <div className="space-y-4 h-full flex flex-col">
       <div className="flex justify-between items-center px-1">
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <Navigation size={20} className="text-indigo-600"/> Live Fleet Tracking
          </h3>
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full flex items-center gap-2 border border-emerald-100">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Real-time
          </span>
       </div>
       
       <div className="flex-1 relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
           <div ref={mapRef} className="absolute inset-0 z-0 bg-slate-50" />
       </div>
       
       {/* Driver Legend / Quick List */}
       <div className="grid grid-cols-2 gap-4 pt-2 overflow-y-auto max-h-32">
          {drivers.map(d => (
            <div key={d.driverId} className="bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl p-3 text-xs flex items-center justify-between cursor-pointer transition-colors"
              onClick={() => {
                 if(mapInstance.current) {
                    mapInstance.current.flyTo([d.lat, d.lng], 15);
                    markersRef.current[d.driverId]?.openPopup();
                 }
              }}
            >
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                 <div>
                    <p className="font-bold text-slate-800 text-sm">{d.driverName}</p>
                    <p className="text-slate-500 mt-0.5">{d.status}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{getTimeAgo(d.timestamp)}</p>
                 </div>
               </div>
               <div className="text-right">
                  <p className="text-indigo-600 font-bold">{d.speed.toFixed(0)} km/h</p>
               </div>
            </div>
          ))}
          {drivers.length === 0 && (
              <div className="col-span-2 text-center text-slate-400 text-xs py-2">
                  Waiting for drivers to connect...
              </div>
          )}
       </div>
    </div>
  );
};
