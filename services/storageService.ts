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
  where 
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
let currentUser: User | null = null;
const authSubscribers = new Set<(user: User | null) => void>();

let driverSimulationState: Record<string, DriverLocation> = {};

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
        
        notifySubscribers(user);
    } else {
        notifySubscribers(null);
    }
});

const mapDoc = <T>(doc: any): T => ({ id: doc.id, ...doc.data() } as T);

const seedStores: Partial<Store>[] = [
  { name: 'Downtown Market', address: '123 Market St, San Francisco', contactPerson: 'John Doe', phone: '555-0101', email: 'john@market.com', lat: 37.7941, lng: -122.3956 },
  { name: 'Westside Grocers', address: '456 Divisadero St, San Francisco', contactPerson: 'Jane Smith', phone: '555-0102', email: 'jane@grocers.com', lat: 37.7725, lng: -122.4371 },
  { name: 'Mission Bodega', address: '789 Valencia St, San Francisco', contactPerson: 'Mike Ross', phone: '555-0103', email: 'mike@bodega.com', lat: 37.7599, lng: -122.4220 },
];

const seedProducts: Partial<Product>[] = [
  { name: 'Organic Milk', sku: 'DAIRY-001', price: 4.50, unit: 'gal' },
  { name: 'Sourdough Bread', sku: 'BAKERY-022', price: 3.25, unit: 'loaf' },
  { name: 'Farm Eggs', sku: 'DAIRY-005', price: 5.00, unit: 'dozen' },
  { name: 'Spring Water', sku: 'BEV-101', price: 1.50, unit: 'bottle' },
];

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
    // 1. Set persistence
    await setPersistence(auth, browserLocalPersistence);
    
    // 2. Sign in
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    
    // 3. WAIT for the profile to be loaded by the global listener.
    const waitForProfile = async (): Promise<User> => {
        let attempts = 0;
        // Wait up to 5 seconds for the profile listener to fire
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

    // Allow time for propagation
    await new Promise(r => setTimeout(r, 500));
    
    if (!currentUser || currentUser.id !== newUser.id) {
        notifySubscribers(newUser);
    }
    
    return newUser;
  },

  logout: async () => {
    await signOut(auth);
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
    if (!fbUser || fbUser.uid !== user.id) return;

    if (user.name !== fbUser.displayName) {
        await updateProfile(fbUser, { displayName: user.name });
    }

    const userRef = doc(db, 'users', user.id);
    await updateDoc(userRef, {
        name: user.name,
        role: user.role,
        avatar: user.avatar
    });
    
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

  // --- STORES ---
  getStores: async (): Promise<Store[]> => {
    const snapshot = await getDocs(collection(db, 'stores'));
    return snapshot.docs.map(doc => mapDoc<Store>(doc));
  },
  
  addStore: async (store: Omit<Store, 'id'>) => {
    const docRef = await addDoc(collection(db, 'stores'), store);
    return { id: docRef.id, ...store };
  },
  
  updateStore: async (store: Store) => {
    const { id, ...data } = store;
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
    // If ID is numeric (mock), let firestore gen new ID, else use existing
    await addDoc(collection(db, 'deliveries'), data);
  },

  updateDelivery: async (delivery: Delivery) => {
    const { id, ...data } = delivery;
    await updateDoc(doc(db, 'deliveries', id), data);
  },

  // --- DRIVER SIMULATION ---
  getDriverLocations: () => [],
  
  simulateDriverMovement: async () => {
    let drivers: User[] = [];
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('role', '==', 'driver'));
        const snapshot = await getDocs(q);
        drivers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        
        if (currentUser && currentUser.role === 'driver' && !drivers.find(d => d.id === currentUser?.id)) {
            drivers.push(currentUser);
        }
    } catch(e) {
        console.warn("Failed to fetch drivers", e);
    }
    
    if (drivers.length === 0) return [];

    let stores: Store[] = [];
    try {
        stores = await storageService.getStores();
    } catch(e) { /* ignore */ }
    
    const baseStore = stores.length > 0 ? stores[0] : { lat: 37.7749, lng: -122.4194, name: 'Base' } as Store;

    const results: DriverLocation[] = drivers.map(driver => {
        let state = driverSimulationState[driver.id];

        if (!state) {
            state = {
                driverId: driver.id,
                driverName: driver.name,
                lat: baseStore.lat || 37.7749,
                lng: baseStore.lng || -122.4194,
                heading: Math.random() * 360,
                speed: 0,
                status: 'idle',
                nextStopName: stores.length > 1 ? stores[1].name : 'Route Start',
                eta: 'Calculating...',
                history: []
            };
        }

        const time = Date.now();
        const idHash = driver.id.split('').reduce((a,c) => a + c.charCodeAt(0), 0);
        
        const speedFactor = 0.0001;
        const radius = 0.01 + (idHash % 20) * 0.001; 
        const angle = (time * speedFactor) + (idHash % 100);
        
        const newLat = (baseStore.lat || 37.7749) + Math.sin(angle) * radius;
        const newLng = (baseStore.lng || -122.4194) + Math.cos(angle) * radius;

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
            eta: `${Math.floor(10 + (idHash % 20))} mins`
        };

        driverSimulationState[driver.id] = newState;
        return newState;
    });

    return results;
  },

  syncLocalData: async () => {}
};