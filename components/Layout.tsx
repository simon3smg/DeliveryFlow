import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Truck, 
  Store as StoreIcon, 
  Package, 
  FileText, 
  Menu,
  X,
  Bell,
  Search,
  LogOut,
  Settings,
  User,
  Wifi,
  WifiOff
} from 'lucide-react';
import { storageService, isFirebaseConfigured } from '../services/storageService';
import { User as UserType } from '../types';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  // Check Dark Mode Preference on Mount
  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Check Auth & Connection Status
  useEffect(() => {
    // Check connection status initially and on route changes
    const checkStatus = () => setIsOnline(storageService.isUsingFirebase());
    checkStatus();
    
    const unsubscribe = storageService.onAuthStateChanged((user) => {
        setCurrentUser(user);
        checkStatus(); // Re-check status when auth changes
    });
    return () => unsubscribe();
  }, [location]);

  // If we are on login/register pages, don't show the main layout
  if (location.pathname === '/login' || location.pathname === '/register') {
      return <>{children}</>;
  }

  const handleLogout = async () => {
      await storageService.logout();
      navigate('/login');
  }

  const navItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/deliveries', label: 'Deliveries', icon: <Truck size={20} /> },
    { path: '/stores', label: 'Stores', icon: <StoreIcon size={20} /> },
    { path: '/products', label: 'Products', icon: <Package size={20} /> },
    { path: '/reports', label: 'Reports', icon: <FileText size={20} /> },
    { path: '/settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  const getPageTitle = () => {
    const item = navItems.find(i => i.path === location.pathname);
    return item ? item.label : 'Dashboard';
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      
      {/* Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 no-print flex flex-col shadow-2xl border-r border-slate-800
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Brand */}
        <div className="p-8 pb-4">
          <div className="flex items-center gap-3 text-white mb-8">
             <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Truck className="text-white" size={20} /> 
             </div>
             <div>
                <h1 className="font-bold text-xl tracking-tight">DeliveryFlow</h1>
                <p className="text-xs text-slate-400 font-medium tracking-wide">LOGISTICS ADMIN</p>
             </div>
          </div>

          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">
            Menu
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group
                ${isActive 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
              `}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-slate-800 space-y-4">
           
           {/* Connection Status Badge */}
           <div className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 ${isOnline ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
               {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
               <span>{isOnline ? 'Cloud Connected' : 'Offline / Local'}</span>
           </div>

           <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer group">
             <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-sm shadow-inner border border-slate-700 overflow-hidden shrink-0">
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt="User" className="w-full h-full object-cover" />
                ) : (
                  currentUser?.name?.charAt(0) || <User size={16}/>
                )}
             </div>
             <div className="flex-1 min-w-0">
               <p className="text-sm font-semibold truncate group-hover:text-indigo-400 transition-colors">{currentUser?.name || 'Guest'}</p>
               <p className="text-xs text-slate-500 truncate capitalize">{currentUser?.role || 'Viewer'}</p>
             </div>
             <button onClick={handleLogout} title="Sign Out">
                 <LogOut size={16} className="text-slate-500 hover:text-white" />
             </button>
           </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Mobile Header */}
        <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex justify-between items-center no-print">
          <div className="flex items-center gap-3">
             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 -ml-2 text-slate-600 dark:text-slate-300">
               {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
             </button>
             <h1 className="font-bold text-lg text-slate-800 dark:text-white">{getPageTitle()}</h1>
          </div>
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-200 flex items-center justify-center font-bold text-xs overflow-hidden">
            {currentUser?.avatar ? (
              <img src={currentUser.avatar} alt="User" className="w-full h-full object-cover" />
            ) : (
              currentUser?.name?.charAt(0)
            )}
          </div>
        </div>

        {/* Desktop Header */}
        <header className="hidden md:flex bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800 sticky top-0 z-20 px-8 py-4 justify-between items-center no-print transition-colors duration-300">
            <div>
               <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{getPageTitle()}</h2>
               <p className="text-sm text-slate-500 dark:text-slate-400">Overview of your activity</p>
            </div>

            <div className="flex items-center gap-6">
                <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                   <input 
                      type="text" 
                      placeholder="Search..." 
                      className="pl-10 pr-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 dark:text-white border-none text-sm focus:ring-2 focus:ring-indigo-500 w-64 transition-all"
                   />
                </div>
                <button className="relative p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                   <Bell size={20} />
                   <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                </button>
            </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto pb-10">
            {children}
          </div>
        </main>

      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};