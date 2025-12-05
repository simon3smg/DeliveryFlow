

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  updateProfile,
  updatePassword,
  setPersistence,
  browserLocalPersistence,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc, 
  getDoc,
  query, 
  orderBy,
  where,
  onSnapshot
} from 'firebase/firestore';
import { Store, Product, Delivery, DriverLocation, User } from '../types';

// --- CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyD5QaEgdm3lpM4temD6xbo_GjCHLx5ZUYE",
  authDomain: "delivery-flow-3c8ff.firebaseapp.com",
  projectId: "delivery-flow-3c8ff",
  storageBucket: "delivery-flow-3c8ff.firebasestorage.app",
  messagingSenderId: "478740346504",
  appId: "1:478740346504:web:f8ff7295b4a26c8457113d",
  measurementId: "G-LJMRJTHJYN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Enforce persistence immediately
setPersistence(auth, browserLocalPersistence).catch(error => {
  console.error("Failed to enable persistence:", error);
});

export const isFirebaseConfigured = true;

// --- STATE MANAGEMENT ---
let currentUser: User | null = null;
let isAuthReady = false; // Flag to track if Firebase has finished initial load
const authSubscribers = new Set<(user: User | null) => void>();

// Store local simulations
let driverSimulationState: Record<string, DriverLocation> = {};
let lastKnownRealDrivers: DriverLocation[] = [];
let lastKnownDriverIds: Set<string> = new Set(); // Cache for valid driver IDs
let locationWatchId: number | null = null;
let lastDbUpdateTime = 0;
const DB_UPDATE_INTERVAL = 3000; // Update DB every 3 seconds max

// Wake Lock State
let wakeLock: any = null;

// Edmonton Distribution Center Coordinates
const BASE_LAT = 53.57057;
const BASE_LNG = -113.46816;

const notifySubscribers = (user: User | null) => {
    currentUser = user;
    authSubscribers.forEach(callback => callback(user));
};

// Listen to Firebase Auth Changes
onAuthStateChanged(auth, async (fbUser) => {
    if (fbUser) {
        let userData: any = {};
        try {
            const userDocRef = doc(db, 'users', fbUser.uid);
            const userDoc = await getDoc(userDocRef);
            userData = userDoc.exists() ? userDoc.data() : {};
        } catch (e) {
            console.warn("Error fetching user profile:", e);
        }

        const user: User = {
            id: fbUser.uid,
            name: fbUser.displayName || userData.name || fbUser.email?.split('@')[0] || 'User',
            email: fbUser.email || '',
            role: userData.role || 'driver',
            avatar: userData.avatar || ''
        };
        
        isAuthReady = true;
        notifySubscribers(user);
    } else {
        isAuthReady = true;
        notifySubscribers(null);
    }
});

const mapDoc = <T>(doc: any): T => ({ id: doc.id, ...doc.data() } as T);

// Seed Data - Updated to Edmonton
const seedStores: Partial<Store>[] = [
  { name: 'Edmonton Distribution Ctr', address: '8612 118 Ave NW, Edmonton', contactPerson: 'Manager', phone: '780-555-0100', email: 'dist@edmonton.com', lat: 53.57057, lng: -113.46816, paymentMethod: 'credit', sequence: 1 },
  { name: 'Downtown Market', address: '10200 102 Ave NW, Edmonton', contactPerson: 'John Doe', phone: '780-555-0101', email: 'john@market.com', lat: 53.5437, lng: -113.4975, paymentMethod: 'cash', sequence: 2 },
  { name: 'West Edmonton Mall Store', address: '8882 170 St NW, Edmonton', contactPerson: 'Jane Smith', phone: '780-555-0102', email: 'jane@wem.com', lat: 53.5225, lng: -113.6242, paymentMethod: 'credit', sequence: 3 },
];

const seedProducts: Partial<Product>[] = [
  { name: 'Organic Milk', sku: 'DAIRY-001', price: 4.50, unit: 'gal' },
  { name: 'Sourdough Bread', sku: 'BAKERY-022', price: 3.25, unit: 'loaf' },
  { name: 'Farm Eggs', sku: 'DAIRY-005', price: 5.00, unit: 'dozen' },
  { name: 'Spring Water', sku: 'BEV-101', price: 1.50, unit: 'bottle' },
];

// Helper: Geocode Address
const geocodeAddress = async (address: string): Promise<{lat: number, lng: number} | null> => {
    try {
        // Normalize Edmonton addresses for better Nominatim results
        // Expands common abbreviations which can cause geocoding to fail
        let searchAddress = address
            .replace(/\bAve\b\.?/g, 'Avenue')
            .replace(/\bSt\b\.?/g, 'Street')
            .replace(/\bRd\b\.?/g, 'Road')
            .replace(/\bBlvd\b\.?/g, 'Boulevard')
            .replace(/\bNW\b/g, 'Northwest')
            .replace(/\bSW\b/g, 'Southwest')
            .replace(/\bNE\b/g, 'Northeast')
            .replace(/\bSE\b/g, 'Southeast');

        // Ensure Edmonton context
        if (!searchAddress.toLowerCase().includes('edmonton')) {
            searchAddress += ", Edmonton, Alberta, Canada";
        }

        const query = encodeURIComponent(searchAddress);
        // Using a general query with limit=1. removed strict viewbox to prevent false negatives
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`;
        
        const response = await fetch(url, {
             headers: { 'Accept': 'application/json' }
        });
        
        if (!response.ok) return null;
        
        const data = await response.json();
        if (data && data.length > 0) {
            return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        }
    } catch (e) {
        console.warn("Geocoding service failed for:", address);
    }
    return null;
};

// Internal helper to request wake lock
const requestWakeLock = async () => {
    // Only attempt if supported and not already active
    if ('wakeLock' in navigator && !wakeLock) {
        try {
            wakeLock = await (navigator as any).wakeLock.request('screen');
            console.log("Wake Lock active: Screen will stay on to track location.");
            wakeLock.addEventListener('release', () => {
                console.log('Wake Lock was released');
                wakeLock = null;
            });
        } catch (err: any) {
            // We swallow the error here to prevent console spam
            // The UI will retry on user interaction
            if (err.name !== 'NotAllowedError') {
                 console.warn("Wake Lock error:", err);
            }
        }
    }
};

export const storageService = {
  isUsingFirebase: () => true,

  init: async () => {
    try {
      const storesRef = collection(db, 'stores');
      const snapshot = await getDocs(storesRef);
      if (snapshot.empty && auth.currentUser) {
        console.log("Seeding database...");
        for (const s of seedStores) await addDoc(collection(db, 'stores'), s);
        for (const p of seedProducts) await addDoc(collection(db, 'products'), p);
      }
    } catch (e) {
      console.log("Database connection active");
    }
  },

  // --- AUTH ---
  login: async (email: string, pass: string): Promise<User> => {
    await setPersistence(auth, browserLocalPersistence);
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    
    // Wait for profile load
    const waitForProfile = async (): Promise<User> => {
        let attempts = 0;
        while (attempts < 50) { 
            if (currentUser && currentUser.id === cred.user.uid) {
                return currentUser;
            }
            await new Promise(r => setTimeout(r, 100));
            attempts++;
        }
        return { 
            id: cred.user.uid, 
            name: cred.user.displayName || 'Loading...', 
            email: email, 
            role: 'driver' 
        };
    };
    return waitForProfile();
  },

  register: async (data: Omit<User, 'id'>) => {
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password || 'password123');
    const fbUser = userCredential.user;
    
    await updateProfile(fbUser, { displayName: data.name });

    await setDoc(doc(db, 'users', fbUser.uid), {
        name: data.name,
        email: data.email,
        role: data.role,
        avatar: ''
    });
    
    const newUser: User = {
        id: fbUser.uid,
        name: data.name,
        email: data.email,
        role: data.role
    };

    await new Promise(r => setTimeout(r, 500));
    if (!currentUser || currentUser.id !== newUser.id) {
        notifySubscribers(newUser);
    }
    return newUser;
  },

  logout: async () => {
    storageService.stopTracking();
    await signOut(auth);
  },

  onAuthStateChanged: (callback: (user: User | null) => void) => {
    authSubscribers.add(callback);
    // Only fire immediate callback if we are sure of the auth state
    if (isAuthReady) {
        callback(currentUser);
    }
    return () => {
        authSubscribers.delete(callback);
    };
  },

  updateUser: async (user: User) => {
    const fbUser = auth.currentUser;
    if (!fbUser || fbUser.uid !== user.id) return;

    if (user.name !== fbUser.displayName) {
        await updateProfile(fbUser, { displayName: user.name });
    }

    const userRef = doc(db, 'users', user.id);
    const updateData: any = {
        name: user.name,
        role: user.role,
        avatar: user.avatar
    };

    await updateDoc(userRef, updateData);
    
    if (currentUser && currentUser.id === user.id) {
        notifySubscribers({...currentUser, ...user});
    }
  },

  updateUserPassword: async (newPassword: string) => {
    const fbUser = auth.currentUser;
    if (fbUser) {
        await updatePassword(fbUser, newPassword);
    } else {
        throw new Error("No user logged in");
    }
  },

  // --- LOCATION TRACKING ---
  startTracking: async () => {
    if (!navigator.geolocation) {
        console.warn("Geolocation not supported");
        return;
    }
    
    // Clear existing watch if any
    if (locationWatchId !== null) return;

    // --- WAKE LOCK START ---
    // Attempt request. If it fails due to lack of gesture, ensureWakeLock will handle it later.
    await requestWakeLock();

    console.log("Starting location tracking...");
    locationWatchId = navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude, heading, speed } = position.coords;
            // Update local and remote
            storageService.updateDriverLocation(latitude, longitude, heading || 0, speed || 0);
        },
        (err) => {
            console.warn("Location tracking error:", err);
            // On catastrophic error, try to clean up
            if (err.code === err.PERMISSION_DENIED) {
                 storageService.stopTracking();
            }
        },
        {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 15000 // Increased timeout for better stability
        }
    );
  },

  // Public method to be called on user interaction
  ensureWakeLock: async () => {
    if (!wakeLock && locationWatchId !== null) {
        await requestWakeLock();
    }
  },
  
  isWakeLockActive: () => !!wakeLock,

  stopTracking: () => {
    if (locationWatchId !== null) {
        console.log("Stopping location tracking...");
        navigator.geolocation.clearWatch(locationWatchId);
        locationWatchId = null;
    }
    // Release Wake Lock
    if (wakeLock) {
        wakeLock.release()
            .then(() => {
                wakeLock = null;
                console.log("Wake Lock released");
            })
            .catch((e: any) => console.log("Error releasing wake lock", e));
    }
  },

  updateDriverLocation: async (lat: number, lng: number, heading: number = 0, speed: number = 0) => {
    if (!currentUser || currentUser.role !== 'driver') return;
    
    const timestamp = Date.now();
    const data = {
        driverId: currentUser.id,
        driverName: currentUser.name,
        lat,
        lng,
        heading,
        speed,
        timestamp: timestamp,
        status: (speed && speed > 0.5) ? 'moving' : 'stopped' as 'moving' | 'stopped'
    };

    // 1. Update Local Caches immediately for responsive UI
    const prevHistory = driverSimulationState[currentUser.id]?.history || [];
    const newHistory = [...prevHistory, {lat, lng}].slice(-25); // Keep last 25 points locally

    driverSimulationState[currentUser.id] = {
        ...data,
        status: data.status,
        history: newHistory,
        eta: 'GPS Active'
    };

    // 2. Update Real Driver Cache (Used for map display if offline)
    const cachedIndex = lastKnownRealDrivers.findIndex(d => d.driverId === currentUser?.id);
    if (cachedIndex >= 0) {
        lastKnownRealDrivers[cachedIndex] = { ...lastKnownRealDrivers[cachedIndex], ...data, history: newHistory };
    } else {
        lastKnownRealDrivers.push({ ...data, history: newHistory } as DriverLocation);
    }

    // 3. Update Firestore (Throttled)
    const now = Date.now();
    if (now - lastDbUpdateTime > DB_UPDATE_INTERVAL) {
        try {
          const locationRef = doc(db, 'driver_locations', currentUser.id);
          // Note: We don't necessarily need to push history to Firestore every time if we just want current loc
          // But to be safe for other users, we send the data.
          await setDoc(locationRef, data, { merge: true });
          lastDbUpdateTime = now;
        } catch (e) {
          console.warn("Error updating location (offline mode active):", e);
        }
    }
  },

  // --- STORES ---
  getStores: async (): Promise<Store[]> => {
    const snapshot = await getDocs(collection(db, 'stores'));
    return snapshot.docs
      .map(doc => mapDoc<Store>(doc))
      .sort((a, b) => (a.sequence || 999) - (b.sequence || 999));
  },
  
  subscribeToStores: (callback: (stores: Store[]) => void) => {
    const q = query(collection(db, 'stores'));
    return onSnapshot(q, (snapshot) => {
        const stores = snapshot.docs
          .map(doc => mapDoc<Store>(doc))
          .sort((a, b) => (a.sequence || 999) - (b.sequence || 999));
        callback(stores);
    });
  },
  
  addStore: async (store: Omit<Store, 'id'>) => {
    // Auto-geocode if coordinates are missing
    if (!store.lat || !store.lng) {
        const coords = await geocodeAddress(store.address);
        if (coords) {
            store.lat = coords.lat;
            store.lng = coords.lng;
        }
    }
    const docRef = await addDoc(collection(db, 'stores'), store);
    return { id: docRef.id, ...store };
  },
  
  updateStore: async (store: Store) => {
    const { id, ...data } = store;
    
    // Auto-geocode if coordinates are missing in the update or address changed
    if (!data.lat || !data.lng) {
        const coords = await geocodeAddress(data.address);
        if (coords) {
            data.lat = coords.lat;
            data.lng = coords.lng;
        }
    }

    await updateDoc(doc(db, 'stores', id), data);
  },
  
  deleteStore: async (id: string) => {
    await deleteDoc(doc(db, 'stores', id));
  },

  // --- PRODUCTS ---
  getProducts: async (): Promise<Product[]> => {
    const snapshot = await getDocs(collection(db, 'products'));
    return snapshot.docs.map(doc => mapDoc<Product>(doc));
  },
  
  addProduct: async (product: Omit<Product, 'id'>) => {
    const docRef = await addDoc(collection(db, 'products'), product);
    return { id: docRef.id, ...product };
  },
  
  updateProduct: async (product: Product) => {
    const { id, ...data } = product;
    await updateDoc(doc(db, 'products', id), data);
  },
  
  deleteProduct: async (id: string) => {
    await deleteDoc(doc(db, 'products', id));
  },

  // --- DELIVERIES ---
  getDeliveries: async (): Promise<Delivery[]> => {
    const q = query(collection(db, 'deliveries'), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => mapDoc<Delivery>(doc));
  },
  
  saveDelivery: async (delivery: Delivery) => {
    const { id, ...data } = delivery; 
    await addDoc(collection(db, 'deliveries'), data);
  },

  updateDelivery: async (delivery: Delivery) => {
    const { id, ...data } = delivery;
    await updateDoc(doc(db, 'deliveries', id), data);
  },
  
  deleteDelivery: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'deliveries', id));
    } catch (error) {
      console.error("Error deleting delivery doc:", id, error);
      throw error;
    }
  },

  // --- DRIVER SIMULATION & REALTIME ---
  getDriverLocations: () => [],
  
  simulateDriverMovement: async () => {
    // 1. Fetch Real Locations from DB with Offline Fallback
    let realDrivers: DriverLocation[] = [];
    try {
        const querySnapshot = await getDocs(collection(db, 'driver_locations'));
        realDrivers = querySnapshot.docs.map(doc => doc.data() as DriverLocation);
        lastKnownRealDrivers = realDrivers; // Update cache on success
    } catch(e) { 
        console.warn("Using offline driver cache");
        realDrivers = lastKnownRealDrivers;
    }

    // 2. Fetch Users to simulate those who don't have real location data
    let users: User[] = [];
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('role', '==', 'driver'));
        const snapshot = await getDocs(q);
        users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        
        // Update verified driver ID cache
        lastKnownDriverIds = new Set(users.map(u => u.id));
    } catch(e) { /* ignore */ }

    // Filter out admins or non-drivers from real location data if we have verified driver info
    if (lastKnownDriverIds.size > 0) {
        realDrivers = realDrivers.filter(rd => lastKnownDriverIds.has(rd.driverId));
    }

    // If no real drivers and no users, return empty
    if (users.length === 0 && realDrivers.length === 0) return [];

    let stores: Store[] = [];
    try {
        stores = await storageService.getStores();
    } catch(e) { /* ignore */ }
    
    // Use Edmonton Base
    const baseLat = stores.length > 0 && stores[0].lat ? stores[0].lat : BASE_LAT;
    const baseLng = stores.length > 0 && stores[0].lng ? stores[0].lng : BASE_LNG;

    // 3. Process Simulation for users without real-time data
    const simulatedDrivers: DriverLocation[] = users
        .filter(u => !realDrivers.find(rd => rd.driverId === u.id)) // Filter out real drivers
        .map(driver => {
            let state = driverSimulationState[driver.id];

            if (!state) {
                state = {
                    driverId: driver.id,
                    driverName: driver.name,
                    lat: baseLat,
                    lng: baseLng,
                    heading: Math.random() * 360,
                    speed: 0,
                    status: 'idle',
                    nextStopName: stores.length > 1 ? stores[1].name : 'Route Start',
                    eta: 'Calculating...',
                    history: [],
                    timestamp: Date.now()
                };
            }

            // Move them (Simulation logic)
            const time = Date.now();
            const idHash = driver.id.split('').reduce((a,c) => a + c.charCodeAt(0), 0);
            
            const speedFactor = 0.0001;
            const radius = 0.01 + (idHash % 20) * 0.001; 
            const angle = (time * speedFactor) + (idHash % 100);
            
            const newLat = baseLat + Math.sin(angle) * radius;
            const newLng = baseLng + Math.cos(angle) * radius;

            const dLat = newLat - state.lat;
            const dLng = newLng - state.lng;
            const heading = (Math.atan2(dLng, dLat) * 180 / Math.PI + 360) % 360;

            const newHistory = [...state.history, {lat: newLat, lng: newLng}].slice(-15);

            const newState: DriverLocation = {
                ...state,
                driverName: driver.name,
                lat: newLat,
                lng: newLng,
                heading: heading,
                speed: Math.floor(20 + (idHash % 30)),
                status: 'moving',
                history: newHistory,
                eta: `${Math.floor(10 + (idHash % 20))} mins`,
                timestamp: Date.now()
            };

            driverSimulationState[driver.id] = newState;
            return newState;
        });

    // 4. Combine Real and Simulated
    // For real drivers, we ensure history exists
    const processedRealDrivers = realDrivers.map(rd => ({
        ...rd,
        history: rd.history || [], // Ensure history array exists
        status: rd.status || 'moving',
        nextStopName: rd.nextStopName || 'En Route'
    }));

    return [...processedRealDrivers, ...simulatedDrivers];
  },

  syncLocalData: async () => {}
};

// Global Listener for visibility change to re-acquire wake lock if needed
if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', async () => {
        if (document.visibilityState === 'visible' && locationWatchId !== null) {
            await storageService.ensureWakeLock();
        }
    });
}
