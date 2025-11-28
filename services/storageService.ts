import { Store, Product, Delivery, DriverLocation, User } from '../types';

const STORAGE_KEYS = {
  STORES: 'deliveryflow_stores',
  PRODUCTS: 'deliveryflow_products',
  DELIVERIES: 'deliveryflow_deliveries',
  USERS: 'deliveryflow_users',
  CURRENT_USER: 'deliveryflow_current_user',
};

// Seed Data
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

const initialUsers: User[] = [
  { id: 'u1', name: 'Admin User', email: 'admin@deliveryflow.com', password: 'password', role: 'admin' },
  { id: 'u2', name: 'John Driver', email: 'john@deliveryflow.com', password: 'password', role: 'driver' },
  { id: 'u3', name: 'Jane Delivery', email: 'jane@deliveryflow.com', password: 'password', role: 'driver' },
];

const initialDeliveries: Delivery[] = [];

// Helper functions
const get = <T>(key: string, initial: T): T => {
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(stored);
};

const set = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Mock Driver State for Simulation
let memoryDrivers: DriverLocation[] = [
  {
    driverId: 'u2',
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
    driverId: 'u3',
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
  getStores: () => get<Store[]>(STORAGE_KEYS.STORES, initialStores),
  saveStores: (stores: Store[]) => set(STORAGE_KEYS.STORES, stores),
  
  getProducts: () => get<Product[]>(STORAGE_KEYS.PRODUCTS, initialProducts),
  saveProducts: (products: Product[]) => set(STORAGE_KEYS.PRODUCTS, products),
  
  getDeliveries: () => get<Delivery[]>(STORAGE_KEYS.DELIVERIES, initialDeliveries),
  saveDelivery: (delivery: Delivery) => {
    const current = get<Delivery[]>(STORAGE_KEYS.DELIVERIES, initialDeliveries);
    const updated = [delivery, ...current];
    set(STORAGE_KEYS.DELIVERIES, updated);
  },

  // Auth & User Management
  getUsers: () => get<User[]>(STORAGE_KEYS.USERS, initialUsers),
  
  register: (user: Omit<User, 'id'>) => {
    const users = get<User[]>(STORAGE_KEYS.USERS, initialUsers);
    if (users.find(u => u.email === user.email)) {
      throw new Error('Email already exists');
    }
    const newUser = { ...user, id: Date.now().toString() };
    set(STORAGE_KEYS.USERS, [...users, newUser]);
    return newUser;
  },

  login: (email: string, password: string): User => {
    const users = get<User[]>(STORAGE_KEYS.USERS, initialUsers);
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) throw new Error('Invalid credentials');
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    return user;
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return stored ? JSON.parse(stored) : null;
  },

  updateUser: (updatedUser: User) => {
    const users = get<User[]>(STORAGE_KEYS.USERS, initialUsers);
    const newUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    set(STORAGE_KEYS.USERS, newUsers);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedUser));
  },

  // Driver Location Simulation
  getDriverLocations: (): DriverLocation[] => {
    return memoryDrivers;
  },

  simulateDriverMovement: () => {
    // Stores for navigation targets
    const stores = get<Store[]>(STORAGE_KEYS.STORES, initialStores);

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
           // Keep position
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
  }
};