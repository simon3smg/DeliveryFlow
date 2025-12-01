
export interface Store {
  id: string;
  name: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
  lat?: number;
  lng?: number;
  paymentMethod: 'cash' | 'credit';
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  unit: string; // e.g., 'box', 'kg', 'unit'
}

export interface DeliveryItem {
  productId: string;
  productName: string;
  quantity: number;
  priceAtDelivery: number;
}

export interface Delivery {
  id: string;
  storeId: string;
  storeName: string; // Denormalized for easier reporting
  timestamp: string; // ISO string
  driverName: string;
  items: DeliveryItem[];
  signatureDataUrl?: string; // Base64 image of signature (Optional)
  notes?: string;
  status: 'completed' | 'pending';
  paymentMethod: 'cash' | 'credit';
  paymentStatus: 'paid' | 'pending';
  lastEditedBy?: string;
  lastEditedAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // In real app, never store plain text
  role: 'admin' | 'driver';
  avatar?: string;
  darkMode?: boolean;
}

export interface MonthlyReport {
  storeId: string;
  storeName: string;
  month: string; // YYYY-MM
  totalDeliveries: number;
  totalCost: number;
  itemsSummary: { [productName: string]: number };
}

export interface DriverLocation {
  driverId: string;
  driverName: string;
  lat: number;
  lng: number;
  heading: number; // 0-360
  speed: number; // km/h
  status: 'moving' | 'stopped' | 'idle';
  nextStopId?: string;
  nextStopName?: string;
  eta?: string; // Estimated time e.g., "14 mins"
  history: {lat: number, lng: number}[]; // Last 20 points for trail
}
