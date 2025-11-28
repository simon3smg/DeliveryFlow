import React, { useEffect, useRef, useState } from 'react';
import { storageService } from '../services/storageService';
import { DriverLocation } from '../types';
import { Navigation } from 'lucide-react';

// Declare Leaflet global type for CDN usage
declare const L: any;

export const LiveMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const polylinesRef = useRef<{ [key: string]: any }>({});
  
  const [drivers, setDrivers] = useState<DriverLocation[]>([]);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Center on San Francisco (mock location)
    const map = L.map(mapRef.current).setView([37.7749, -122.4194], 13);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    mapInstance.current = map;

    // Add Stores to map
    const stores = storageService.getStores();
    stores.forEach(store => {
      if (store.lat && store.lng) {
        L.marker([store.lat, store.lng], {
          icon: L.divIcon({
            className: 'bg-emerald-600 w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-xs',
            html: 'S',
            iconSize: [24, 24]
          })
        }).bindPopup(`<b>${store.name}</b><br>${store.address}`)
          .addTo(map);
      }
    });

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Poll for driver updates
  useEffect(() => {
    const interval = setInterval(() => {
      const updatedDrivers = storageService.simulateDriverMovement();
      setDrivers([...updatedDrivers]); 
      setLastUpdate(Date.now());
    }, 2000); // 2 second updates

    return () => clearInterval(interval);
  }, []);

  // Update Markers
  useEffect(() => {
    if (!mapInstance.current) return;
    const map = mapInstance.current;

    drivers.forEach(driver => {
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
              <p>Speed: ${driver.speed} km/h</p>
              <hr class="my-1 border-slate-200"/>
              <p class="font-medium">Next: ${driver.nextStopName}</p>
              <p class="font-bold text-blue-600">ETA: ${driver.eta}</p>
            </div>
          </div>
        `;
        markersRef.current[driver.driverId].setPopupContent(popupContent);

      } else {
        // Create new marker
        const icon = L.divIcon({
          className: 'bg-indigo-600 w-10 h-10 rounded-full border-4 border-white shadow-xl flex items-center justify-center text-white',
          html: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>',
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
      const trailCoords = driver.history.map(h => [h.lat, h.lng]);
      trailCoords.push([driver.lat, driver.lng]); // Add current position

      if (polylinesRef.current[driver.driverId]) {
        polylinesRef.current[driver.driverId].setLatLngs(trailCoords);
      } else {
        const polyline = L.polyline(trailCoords, { 
          color: '#4f46e5', // indigo-600 
          weight: 4, 
          opacity: 0.5,
          lineCap: 'round'
        }).addTo(map);
        polylinesRef.current[driver.driverId] = polyline;
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
           <div ref={mapRef} className="absolute inset-0 z-0" />
       </div>
       
       {/* Driver Legend / Quick List */}
       <div className="grid grid-cols-2 gap-4 pt-2">
          {drivers.map(d => (
            <div key={d.driverId} className="bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl p-3 text-xs flex items-center justify-between cursor-pointer transition-colors"
              onClick={() => {
                 if(mapInstance.current) {
                    mapInstance.current.flyTo([d.lat, d.lng], 15);
                    markersRef.current[d.driverId]?.openPopup();
                 }
              }}
            >
               <div>
                 <p className="font-bold text-slate-800 text-sm">{d.driverName}</p>
                 <p className="text-slate-500 mt-0.5">{d.status} • {d.speed} km/h</p>
               </div>
               <div className="text-right">
                  <p className="text-indigo-600 font-bold">{d.eta}</p>
                  <p className="text-[10px] text-slate-400">to {d.nextStopName?.split(' ')[0]}</p>
               </div>
            </div>
          ))}
       </div>
    </div>
  );
};