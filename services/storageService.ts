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
  query, 
  where,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { Store, Product, Delivery, DriverLocation, User } from '../types';

// --- FIREBASE CONFIGURATION ---
// REPLACE THESE VALUES WITH YOUR OWN FIREBASE CONFIG FROM THE CONSOLE
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "your-app.firebaseapp.com",
  projectId: "your-app-id",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Collection References
const COLLECTIONS = {
  STORES: 'stores',
  PRODUCTS: 'products',
  DELIVERIES: 'deliveries',
  USERS: 'users'
};

// --- INITIAL SEED DATA (For new DBs) ---
const initialStores: Store[] = [
  { id: 's1', name: 'Downtown Market', address: '123 Market St, San Francisco', contactPerson: 'John Doe', phone: '555-0101', email: 'john@market.com', lat: 37.7941, lng: -122.3956 },
  { id: 's2', name: 'Westside Grocers', address: '456 Divisadero St, San Francisco', contactPerson: 'Jane Smith', phone: '555-0102', email: 'jane@grocers.com', lat: 37.7725, lng: -122.4371 },
  { id: 's3', name: 'Mission Bodega', address: '789 Valencia St, San Francisco', contactPerson: 'Mike Ross', phone: '555-0103', email: 'mike@bodega.com', lat: 37.7599, lng: -122.4220 },
];

const initialProducts: Product[] = [
  { id: 'p1', name: 'Organic Milk', sku: 'DAIRY-001', price: 4.50, unit: 'gal' },
  { id: 'p2', name: 'Sourdough Bread', sku: 'BAKERY-022', price: 3.25, unit: 'loaf' },
  { id: 'p3', name: 'Farm Eggs', sku: 'DAIRY-005', price: 5.00, unit: 'dozen' },
  { id: 'p4', name: 'Spring Water', sku: 'BEV-101', price: 1.50, unit: 'bottle' },
  { id: 'p5', name: 'Apple Juice', sku: 'BEV-205', price: 3.75, unit: 'bottle' },
];

// Helper to check if DB is empty and seed it
const seedDatabaseIfNeeded = async () => {
  try {
    const productsSnap = await getDocs(collection(db, COLLECTIONS.PRODUCTS));
    if (productsSnap.empty) {
      console.log('Seeding Products...');
      for (const p of initialProducts) {
        // Use setDoc with specific ID to keep IDs consistent if preferred, 
        // or addDoc for auto-ID. Here we use the pre-defined IDs for simplicity in the demo.
        await setDoc(doc(db, COLLECTIONS.PRODUCTS, p.id), p);
      }
    }
    const storesSnap = await getDocs(collection(db, COLLECTIONS.STORES));
    if (storesSnap.empty) {
        console.log('Seeding Stores...');
        for (const s of initialStores) {
            await setDoc(doc(db, COLLECTIONS.STORES, s.id), s);
        }
    }
  } catch (error) {
    console.warn("Could not seed database. Check Firebase config/permissions.", error);
  }
};

// --- MOCK DRIVER STATE (Local Memory Simulation) ---
// Keeping this local for the demo as high-frequency GPS writes to Firestore might exceed free tier
let memoryDrivers: DriverLocation[] = [
  {
    driverId: 'd1',
    driverName: 'John Driver',
    lat: 37.7850,
    lng: -122.4100,
    heading: 90,
    speed: 35,
    status: 'moving',
    nextStopName: 'Downtown Market',
    nextStopId: 's1',
    eta: '12 mins',
    history: []
  },
  {
    driverId: 'd2',
    driverName: 'Jane Delivery',
    lat: 37.7600,
    lng: -122.4300,
    heading: 180,
    speed: 28,
    status: 'moving',
    nextStopName: 'Mission Bodega',
    nextStopId: 's3',
    eta: '5 mins',
    history: []
  }
];

export const storageService = {
  
  // --- STORES ---
  getStores: async (): Promise<Store[]> => {
    try {
        const snapshot = await getDocs(collection(db, COLLECTIONS.STORES));
        return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Store));
    } catch (e) {
        // Fallback for demo if firebase fails (e.g. bad config)
        console.error("Firebase Error (Stores):", e);
        return [];
    }
  },

  saveStores: async (stores: Store[]) => {
    // This function signature from the old local-storage version accepted the whole array.
    // For Firestore, we typically add/update individually. 
    // This is a bulk overwrite helper for compatibility, but inefficient for real DBs.
    // We will stick to individual add/update/delete in the UI components for better practice,
    // but keep this for legacy calls if any.
    console.warn("Bulk saveStores called - consider using add/updateStore individual methods");
  },

  addStore: async (store: Omit<Store, 'id'>) => {
    const docRef = await addDoc(collection(db, COLLECTIONS.STORES), store);
    return { ...store, id: docRef.id };
  },

  updateStore: async (store: Store) => {
    const storeRef = doc(db, COLLECTIONS.STORES, store.id);
    const { id, ...data } = store; // Remove ID from data payload
    await updateDoc(storeRef, data);
  },

  deleteStore: async (id: string) => {
    await deleteDoc(doc(db, COLLECTIONS.STORES, id));
  },

  // --- PRODUCTS ---
  getProducts: async (): Promise<Product[]> => {
    try {
        const snapshot = await getDocs(collection(db, COLLECTIONS.PRODUCTS));
        return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Product));
    } catch (e) {
        console.error("Firebase Error (Products):", e);
        return [];
    }
  },

  saveProducts: async (products: Product[]) => {
      // Bulk overwrite compat
  },

  addProduct: async (product: Omit<Product, 'id'>) => {
    const docRef = await addDoc(collection(db, COLLECTIONS.PRODUCTS), product);
    return { ...product, id: docRef.id };
  },

  updateProduct: async (product: Product) => {
    const ref = doc(db, COLLECTIONS.PRODUCTS, product.id);
    const { id, ...data } = product;
    await updateDoc(ref, data);
  },

  deleteProduct: async (id: string) => {
    await deleteDoc(doc(db, COLLECTIONS.PRODUCTS, id));
  },

  // --- DELIVERIES ---
  getDeliveries: async (): Promise<Delivery[]> => {
    try {
        const q = query(collection(db, COLLECTIONS.DELIVERIES)); // Can add orderBy here
        const snapshot = await getDocs(q);
        // Sort in memory for now
        const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Delivery));
        return data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (e) {
        console.error("Firebase Error (Deliveries):", e);
        return [];
    }
  },

  saveDelivery: async (delivery: Delivery) => {
    // If ID is numeric timestamp string (from frontend gen), we can let Firestore gen ID or use it
    const { id, ...data } = delivery;
    await addDoc(collection(db, COLLECTIONS.DELIVERIES), data);
  },

  // --- AUTHENTICATION ---
  // Using Firebase Auth + Firestore 'users' collection for extra profile data

  register: async (userData: Omit<User, 'id'>) => {
    // 1. Create Auth User
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password || 'password123');
    const firebaseUser = userCredential.user;

    // 2. Create Firestore Profile
    const newUser: User = {
        id: firebaseUser.uid,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        avatar: userData.avatar
    };
    
    await setDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), newUser);
    
    // 3. Update Profile Name
    await updateProfile(firebaseUser, { displayName: userData.name });
    
    return newUser;
  },

  login: async (email: string, password: string): Promise<User> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    
    // Fetch role and extra data from Firestore
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, uid));
    if (userDoc.exists()) {
        return userDoc.data() as User;
    } else {
        // Fallback if firestore doc missing but auth exists
        return {
            id: uid,
            name: userCredential.user.displayName || 'User',
            email: email,
            role: 'driver' // Default
        };
    }
  },

  logout: async () => {
    await signOut(auth);
  },

  // Observer for Auth State
  onAuthStateChanged: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            try {
                const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid));
                if (userDoc.exists()) {
                    callback(userDoc.data() as User);
                } else {
                     callback({
                        id: firebaseUser.uid,
                        name: firebaseUser.displayName || 'User',
                        email: firebaseUser.email || '',
                        role: 'driver'
                    });
                }
            } catch (e) {
                console.error("Error fetching user profile", e);
                callback(null);
            }
        } else {
            callback(null);
        }
    });
  },

  updateUser: async (updatedUser: User) => {
      // We don't update email/password here, just profile data
      const ref = doc(db, COLLECTIONS.USERS, updatedUser.id);
      await updateDoc(ref, updatedUser);
  },

  // --- DRIVER SIMULATION (Hybrid: Remote Stores, Local Simulation) ---
  getDriverLocations: (): DriverLocation[] => {
    return memoryDrivers;
  },

  simulateDriverMovement: async () => {
    // Ensure we have stores for navigation targets
    // In a real app we'd fetch these once or subscribe
    // For simulation tick, we'll try to get them from cache or fetch lightly
    // To avoid async complexity in the animation loop, we'll assume stores are loaded 
    // or just fetch them if the array is empty in the map component.
    
    // NOTE: This function calculates new positions.
    // In a real app, this logic happens on the driver's phone, and they upload coords.
    
    // We need stores to know where to drive to.
    let stores: Store[] = [];
    try {
        const snap = await getDocs(collection(db, COLLECTIONS.STORES));
        stores = snap.docs.map(d => d.data() as Store);
    } catch {
        stores = initialStores;
    }
    
    if (stores.length === 0) stores = initialStores;

    memoryDrivers = memoryDrivers.map(driver => {
      // Find target store coords
      const targetStore = stores.find(s => s.id === driver.nextStopId) || stores[0];
      const targetLat = targetStore.lat || 37.7749;
      const targetLng = targetStore.lng || -122.4194;

      // Move driver slightly towards target (0.0005 deg is approx 50 meters)
      const latDiff = targetLat - driver.lat;
      const lngDiff = targetLng - driver.lng;
      const distance = Math.sqrt(latDiff*latDiff + lngDiff*lngDiff);

      // If arrived (close enough), swap target to random other store
      if (distance < 0.002) {
         const nextStore = stores[Math.floor(Math.random() * stores.length)];
         return {
           ...driver,
           status: 'stopped',
           speed: 0,
           nextStopId: nextStore.id,
           nextStopName: nextStore.name,
           eta: 'Arrived',
         };
      }

      // Move logic
      const speedFactor = 0.0003; // Movement step size
      const newLat = driver.lat + (latDiff / distance) * speedFactor;
      const newLng = driver.lng + (lngDiff / distance) * speedFactor;

      // Calculate ETA (Mock: distance / speed)
      const distKm = distance * 111; // rough deg to km
      const speedKmH = 40; 
      const etaMins = Math.ceil((distKm / speedKmH) * 60);

      // Update history trail
      const newHistory = [...driver.history, { lat: driver.lat, lng: driver.lng }];
      if (newHistory.length > 20) newHistory.shift();

      return {
        ...driver,
        lat: newLat,
        lng: newLng,
        status: 'moving',
        speed: Math.floor(25 + Math.random() * 20),
        eta: `${etaMins} mins`,
        history: newHistory
      };
    });
    
    return memoryDrivers;
  },

  // Helper to trigger seed
  init: async () => {
      await seedDatabaseIfNeeded();
  }
};

// Initialize once
storageService.init();
