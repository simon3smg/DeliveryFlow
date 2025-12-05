
import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Deliveries } from './pages/Deliveries';
import { Stores } from './pages/Stores';
import { Products } from './pages/Products';
import { Reports } from './pages/Reports';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Settings } from './pages/Settings';
import { storageService } from './services/storageService';
import { User } from './types';
import { Loader2 } from 'lucide-react';

// 1 Hour in milliseconds
const INACTIVITY_LIMIT = 1 * 60 * 60 * 1000;

// Async Auth Protection
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = storageService.onAuthStateChanged((u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-indigo-400">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  
  // Initialize Database Connection Probe
  useEffect(() => {
    try {
        storageService.init();
    } catch (e) {
        console.error("Failed to init storage service:", e);
    }
  }, []);

  // Inactivity Logic
  useEffect(() => {
    const updateActivity = () => {
      localStorage.setItem('lastActivity', Date.now().toString());
    };

    const checkInactivity = () => {
      const lastActivity = localStorage.getItem('lastActivity');
      
      if (lastActivity) {
        const lastTime = parseInt(lastActivity);
        const now = Date.now();
        
        // Safety check for corrupted/future timestamps
        if (isNaN(lastTime) || lastTime > now) {
            updateActivity();
            return;
        }

        if (now - lastTime > INACTIVITY_LIMIT) {
           console.log("Session timed out due to inactivity");
           storageService.logout();
        }
      } else {
        // Initialize if not present (prevents immediate logout on fresh load)
        updateActivity();
      }
    };

    // Set initial activity on mount to reset the clock on refresh
    updateActivity();

    // Listeners for user interaction
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => window.addEventListener(event, updateActivity));

    // Check every minute
    const intervalId = setInterval(checkInactivity, 60000); 

    return () => {
      events.forEach(event => window.removeEventListener(event, updateActivity));
      clearInterval(intervalId);
    };
  }, []);

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/deliveries" element={<PrivateRoute><Deliveries /></PrivateRoute>} />
          <Route path="/stores" element={<PrivateRoute><Stores /></PrivateRoute>} />
          <Route path="/products" element={<PrivateRoute><Products /></PrivateRoute>} />
          <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
