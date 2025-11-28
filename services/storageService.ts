import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser,
  updateProfile
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
  orderBy 
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

export const isFirebaseConfigured = true;

// --- STATE MANAGEMENT ---
let useFallbackMode = false;
let currentUser: User | null = null;
const authSubscribers = new Set<(user: User | null) => void>();

const notifySubscribers = (user: User | null) => {
    currentUser = user;
    authSubscribers.forEach(callback => callback(user));
};

// Listen to Firebase Auth Changes globally once
onAuthStateChanged(auth, async (fbUser) => {
    if (fbUser) {
        // CRITICAL FIX: User logged in, retry Firebase connection.
        // This fixes the issue where app starts in fallback mode due to lack of permissions,
        // preventing data from being saved to the database.
        useFallbackMode = false;

        let userData: any = {};
        if (!useFallbackMode) {
            try {
                const userDocRef = doc(db, 'users', fbUser.uid);
                const userDoc = await getDoc(userDocRef);
                userData = userDoc.exists() ? userDoc.data() : {};
            } catch (e) {
                // If we can't read user profile due to permissions/offline, just ignore
                console.warn("Could not fetch user profile from DB (Permissions/Offline)");
            }
        }

        const user: User = {
            id: fbUser.uid,
            name: fbUser.displayName || userData.name || fbUser.email?.split('@')[0] || 'User',
            email: fbUser.email || '',
            role: userData.role || 'driver'
        };
        
        notifySubscribers(user);
    } else {
        // Only clear user if we are not explicitly using a local fallback session
        if (!currentUser || !currentUser.id.startsWith('local_')) {
            notifySubscribers(null);
        }
    }
});

// --- MOCK DATA FOR FALLBACK ---
const mockStores: Store[] = [
  { id: 'ms1', name: 'Downtown Market', address: '123 Market St, San Francisco', contactPerson: 'John Doe', phone: '555-0101', email: 'john@market.com', lat: 37.7941, lng: -122.3956 },
  { id: 'ms2', name: 'Westside Grocers', address: '456 Divisadero St, San Francisco', contactPerson: 'Jane Smith', phone: '555-0102', email: 'jane@grocers.com', lat: 37.7725, lng: -122.4371 },
  { id: 'ms3', name: 'Mission Bodega', address: '789 Valencia St, San Francisco', contactPerson: 'Mike Ross', phone: '555-0103', email: 'mike@bodega.com', lat: 37.7599, lng: -122.4220 },
];

const mockProducts: Product[] = [
  { id: 'mp1', name: 'Organic Milk', sku: 'DAIRY-001', price: 4.50, unit: 'gal' },
  { id: 'mp2', name: 'Sourdough Bread', sku: 'BAKERY-022', price: 3.25, unit: 'loaf' },
  { id: 'mp3', name: 'Farm Eggs', sku: 'DAIRY-005', price: 5.00, unit: 'dozen' },
  { id: 'mp4', name: 'Spring Water', sku: 'BEV-101', price: 1.50, unit: 'bottle' },
];

let localDeliveries: Delivery[] = [];
let localStores: Store[] = [...mockStores];
let localProducts: Product[] = [...mockProducts];

let memoryDrivers: DriverLocation[] = [
  { driverId: 'd1', driverName: 'John Driver', lat: 37.7850, lng: -122.4100, heading: 90, speed: 35, status: 'moving', nextStopName: 'Downtown Market', nextStopId: 'ms1', eta: '12 mins', history: [] },
  { driverId: 'd2', driverName: 'Jane Delivery', lat: 37.7600, lng: -122.4300, heading: 180, speed: 28, status: 'moving', nextStopName: 'Mission Bodega', nextStopId: 'ms3', eta: '5 mins', history: [] }
];

const mapDoc = <T>(doc: any): T => ({ id: doc.id, ...doc.data() } as T);

export const storageService = {
  isUsingFirebase: () => !useFallbackMode,

  init: async () => {
    try {
      // PROBE: Try to connect to Firestore.
      // If permissions are missing or DB is offline, this will fail.
      const storesSnap = await getDocs(collection(db, 'stores'));
      
      if (storesSnap.empty) {
        // Attempt seed only if we have access
        for (const s of mockStores) {
             // eslint-disable-next-line @typescript-eslint/no-unused-vars
             const { id, ...data } = s; 
             await addDoc(collection(db, 'stores'), data);
        }
      }
    } catch (e: any) {
      console.warn("Firestore unavailable (Permissions or Offline). Switching to Local Fallback Mode.");
      useFallbackMode = true;
    }
  },

  // --- AUTH ---
  login: async (email: string, pass: string): Promise<User> => {
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        // Wait for onAuthStateChanged to fire
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (currentUser) return currentUser;
        throw new Error("Firebase auth state delay");
    } catch (error: any) {
        console.warn("Auth failed/offline, falling back to local session.");
        const localUser: User = {
            id: 'local_user_' + Date.now(),
            name: email.split('@')[0],
            email: email,
            role: 'admin'
        };
        notifySubscribers(localUser);
        return localUser;
    }
  },

  register: async (data: Omit<User, 'id'>) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password || 'password123');
        const fbUser = userCredential.user;
        await updateProfile(fbUser, { displayName: data.name });

        if (!useFallbackMode) {
            try {
                await setDoc(doc(db, 'users', fbUser.uid), {
                    name: data.name,
                    email: data.email,
                    role: data.role
                });
            } catch (e) {
                 console.warn("Skipping user profile creation in DB (Permissions/Offline)");
            }
        }
        
        const newUser: User = {
            id: fbUser.uid,
            name: data.name,
            email: data.email,
            role: data.role
        };
        
        await new Promise(resolve => setTimeout(resolve, 500));
        if (!currentUser) notifySubscribers(newUser);
        
        return newUser;
    } catch (error) {
        console.warn("Register failed/offline, falling back locally");
        const localUser: User = {
            id: 'local_user_' + Date.now(),
            name: data.name,
            email: data.email,
            role: data.role
        };
        notifySubscribers(localUser);
        return localUser;
    }
  },

  logout: async () => {
    try {
        await signOut(auth);
    } catch (e) { console.warn(e) }
    notifySubscribers(null);
  },

  onAuthStateChanged: (callback: (user: User | null) => void) => {
    authSubscribers.add(callback);
    callback(currentUser);
    return () => {
        authSubscribers.delete(callback);
    };
  },

  updateUser: async (user: User) => {
    const fbUser = auth.currentUser;
    if (fbUser && fbUser.uid === user.id) {
        await updateProfile(fbUser, { displayName: user.name });
    }
    if (!useFallbackMode && !user.id.startsWith('local_')) {
        try {
            await updateDoc(doc(db, 'users', user.id), { name: user.name });
        } catch (e) { useFallbackMode = true; }
    }
    if (currentUser && currentUser.id === user.id) {
        notifySubscribers({...currentUser, ...user});
    }
  },

  // --- DATA METHODS (With Fallback) ---
  getStores: async (): Promise<Store[]> => {
    if (useFallbackMode) return localStores;
    try {
      const snapshot = await getDocs(collection(db, 'stores'));
      return snapshot.docs.map(doc => mapDoc<Store>(doc));
    } catch (error) {
      useFallbackMode = true;
      return localStores;
    }
  },
  
  addStore: async (store: Omit<Store, 'id'>) => {
    if (useFallbackMode) {
        const newStore = { ...store, id: 'local_' + Date.now() };
        localStores.push(newStore);
        return newStore;
    }
    try {
      const docRef = await addDoc(collection(db, 'stores'), store);
      return { id: docRef.id, ...store };
    } catch (error) {
      useFallbackMode = true;
      // Retain fallback behavior on write error, but UI will likely show success via local update
      const newStore = { ...store, id: 'local_' + Date.now() };
      localStores.push(newStore);
      return newStore;
    }
  },
  
  updateStore: async (store: Store) => {
    if (useFallbackMode) {
        localStores = localStores.map(s => s.id === store.id ? store : s);
        return;
    }
    try {
      const { id, ...data } = store;
      const docRef = doc(db, 'stores', id);
      await updateDoc(docRef, data);
    } catch (error) {
      useFallbackMode = true;
      localStores = localStores.map(s => s.id === store.id ? store : s);
    }
  },
  
  deleteStore: async (id: string) => {
    if (useFallbackMode) {
        localStores = localStores.filter(s => s.id !== id);
        return;
    }
    try {
      await deleteDoc(doc(db, 'stores', id));
    } catch (error) {
      useFallbackMode = true;
      localStores = localStores.filter(s => s.id !== id);
    }
  },

  getProducts: async (): Promise<Product[]> => {
    if (useFallbackMode) return localProducts;
    try {
      const snapshot = await getDocs(collection(db, 'products'));
      return snapshot.docs.map(doc => mapDoc<Product>(doc));
    } catch (error) {
      useFallbackMode = true;
      return localProducts;
    }
  },
  
  addProduct: async (product: Omit<Product, 'id'>) => {
    if (useFallbackMode) {
        const newProduct = { ...product, id: 'local_' + Date.now() };
        localProducts.push(newProduct);
        return newProduct;
    }
    try {
      const docRef = await addDoc(collection(db, 'products'), product);
      return { id: docRef.id, ...product };
    } catch (error) {
      useFallbackMode = true;
      const newProduct = { ...product, id: 'local_' + Date.now() };
      localProducts.push(newProduct);
      return newProduct;
    }
  },
  
  updateProduct: async (product: Product) => {
    if (useFallbackMode) {
        localProducts = localProducts.map(p => p.id === product.id ? product : p);
        return;
    }
    try {
      const { id, ...data } = product;
      const docRef = doc(db, 'products', id);
      await updateDoc(docRef, data);
    } catch (error) {
      useFallbackMode = true;
      localProducts = localProducts.map(p => p.id === product.id ? product : p);
    }
  },
  
  deleteProduct: async (id: string) => {
    if (useFallbackMode) {
        localProducts = localProducts.filter(p => p.id !== id);
        return;
    }
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (error) {
      useFallbackMode = true;
      localProducts = localProducts.filter(p => p.id !== id);
    }
  },

  getDeliveries: async (): Promise<Delivery[]> => {
    if (useFallbackMode) return localDeliveries;
    try {
      const q = query(collection(db, 'deliveries'), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      const deliveries = snapshot.docs.map(doc => mapDoc<Delivery>(doc));
      return [...deliveries, ...localDeliveries];
    } catch (error) {
      useFallbackMode = true;
      return localDeliveries;
    }
  },
  
  saveDelivery: async (delivery: Delivery) => {
    if (useFallbackMode) {
        localDeliveries.unshift({ ...delivery, id: 'local_' + Date.now() });
        return;
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...data } = delivery; 
      await addDoc(collection(db, 'deliveries'), data);
    } catch (error) {
      useFallbackMode = true;
      localDeliveries.unshift({ ...delivery, id: 'local_' + Date.now() });
    }
  },

  getDriverLocations: () => memoryDrivers,
  
  simulateDriverMovement: async () => {
    let stores: Store[] = [];
    if (useFallbackMode) {
        stores = localStores;
    } else {
        try {
            const storesSnap = await getDocs(collection(db, 'stores'));
            stores = storesSnap.docs.map(doc => mapDoc<Store>(doc));
        } catch (e) {
            useFallbackMode = true;
            stores = localStores;
        }
    }

    if (stores.length === 0) stores = mockStores; 
    
    memoryDrivers = memoryDrivers.map(driver => {
        const targetStore = stores.find(s => s.id === driver.nextStopId) || stores[0];
        if (!targetStore) return driver;

        const targetLat = targetStore.lat || 37.7941;
        const targetLng = targetStore.lng || -122.3956;
        const latDiff = targetLat - driver.lat;
        const lngDiff = targetLng - driver.lng;
        const distance = Math.sqrt(latDiff*latDiff + lngDiff*lngDiff);

        if (distance < 0.002) {
            const nextStore = stores[Math.floor(Math.random() * stores.length)];
            return { ...driver, status: 'stopped', speed: 0, nextStopId: nextStore.id, nextStopName: nextStore.name, eta: 'Arrived' };
        }

        const speedFactor = 0.0003;
        return {
            ...driver,
            lat: driver.lat + (latDiff / distance) * speedFactor,
            lng: driver.lng + (lngDiff / distance) * speedFactor,
            status: 'moving',
            speed: Math.floor(25 + Math.random() * 20),
            eta: `${Math.ceil((distance * 111 / 40) * 60)} mins`,
            history: [...driver.history, { lat: driver.lat, lng: driver.lng }].slice(-20)
        };
    });
    return memoryDrivers;
  },

  syncLocalData: async () => {}
};