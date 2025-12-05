

import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Truck, 
  Store as StoreIcon, 
  Package, 
  FileText, 
  Bell,
  Search,
  LogOut,
  User,
  Wifi,
  WifiOff
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { User as UserType } from '../types';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Enforce Dark Mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('darkMode', 'true');
  }, []);

  // Check Auth & Connection Status
  useEffect(() => {
    // Check connection status initially
    setIsOnline(storageService.isUsingFirebase());
    
    // Subscribe to Auth Changes
    const unsubscribe = storageService.onAuthStateChanged((user) => {
        setCurrentUser(user);
        setIsOnline(storageService.isUsingFirebase());

        // Tracking Logic: Automatically track driver position when logged in
        if (user && user.role === 'driver') {
            console.log("Initializing driver tracking...");
            storageService.startTracking();
        } else {
            storageService.stopTracking();
        }
    });
    return () => {
        unsubscribe();
        storageService.stopTracking();
    };
  }, []); 

  // If we are on login/register pages, don't show the main layout
  if (location.pathname === '/login' || location.pathname === '/register') {
      return <>{children}</>;
  }

  const handleLogout = async () => {
      await storageService.logout();
      navigate('/login');
  }

  const navItems = [
    { path: '/', label: 'Home', icon: <LayoutDashboard size={20} /> },
    { path: '/deliveries', label: 'Deliveries', icon: <Truck size={20} /> },
    { path: '/stores', label: 'Stores', icon: <StoreIcon size={20} /> },
    { path: '/products', label: 'Products', icon: <Package size={20} /> },
    { path: '/reports', label: 'Reports', icon: <FileText size={20} /> },
  ];

  const getPageTitle = () => {
    if (location.pathname === '/settings') return 'Settings';
    const item = navItems.find(i => i.path === location.pathname);
    return item ? item.label : 'Dashboard';
  };

  const isPathActive = (path: string) => location.pathname === path;

  return (
    <div className="w-full min-h-screen flex bg-slate-950 text-slate-100 font-sans transition-colors duration-300">
      
      {/* Desktop Sidebar */}
      <aside 
        className="hidden md:flex w-72 bg-slate-900 text-white flex-col shadow-2xl border-r border-slate-800 shrink-0 h-screen sticky top-0"
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
          {navItems.map((item) => {
            const isActive = isPathActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group
                  ${isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                `}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-slate-800 space-y-4">
           {/* Connection Status Badge */}
           <div className="flex flex-col gap-2">
               <div className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 ${isOnline ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                   {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
                   <span>{isOnline ? 'Cloud Connected' : 'Offline / Local'}</span>
               </div>
               
               {/* New GPS Badge for Drivers */}
               {currentUser?.role === 'driver' && (
                   <div className="px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 bg-blue-500/10 text-blue-400 border border-blue-500/20">
                       <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                       </span>
                       <span>GPS Tracking Active</span>
                   </div>
               )}
           </div>

           <div 
             onClick={() => navigate('/settings')}
             className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer group"
             title="Go to Settings"
           >
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
             <button 
                onClick={(e) => {
                    e.stopPropagation();
                    handleLogout();
                }} 
                title="Sign Out"
                className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors z-10"
             >
                 <LogOut size={16} className="text-slate-500 hover:text-white" />
             </button>
           </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        
        {/* Mobile Header - Simplified */}
        <div className="md:hidden bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex justify-between items-center no-print sticky top-0 z-30">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-500/30">
                <Truck className="text-white" size={16} /> 
             </div>
             <h1 className="font-bold text-lg text-white tracking-tight">{getPageTitle()}</h1>
          </div>
          <div className="flex items-center gap-3">
            {currentUser?.role === 'driver' && (
               <div className="relative flex h-2.5 w-2.5" title="GPS Active">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
               </div>
            )}
            <div 
                className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 text-indigo-300 flex items-center justify-center font-bold text-xs overflow-hidden cursor-pointer shadow-sm active:scale-95 transition-transform"
                onClick={() => navigate('/settings')}
            >
                {currentUser?.avatar ? (
                <img src={currentUser.avatar} alt="User" className="w-full h-full object-cover" />
                ) : (
                currentUser?.name?.charAt(0) || <User size={16}/>
                )}
            </div>
          </div>
        </div>

        {/* Desktop Header */}
        <header className="hidden md:flex bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-20 px-8 py-4 justify-between items-center no-print transition-colors duration-300">
            <div>
               <h2 className="text-2xl font-bold text-white">{getPageTitle()}</h2>
               <p className="text-sm text-slate-400">Overview of your activity</p>
            </div>

            <div className="flex items-center gap-6">
                <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                   <input 
                      type="text" 
                      placeholder="Search..." 
                      className="pl-10 pr-4 py-2 rounded-full bg-slate-800 text-white border-none text-sm focus:ring-2 focus:ring-indigo-500 w-64 md:w-80 lg:w-96 xl:w-[28rem] transition-all"
                   />
                </div>
                <button className="relative p-2 text-slate-400 hover:text-indigo-400 transition-colors">
                   <Bell size={20} />
                   <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-900"></span>
                </button>
            </div>
        </header>

        {/* Scrollable Main Content */}
        {/* Added padding bottom on mobile to account for Bottom Nav */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-24 md:p-6 lg:p-8 md:pb-10 scroll-smooth">
          <div className="w-full mx-auto max-w-7xl">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex justify-around items-center px-2 py-2 pb-safe z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
           {navItems.map((item) => {
             const isActive = isPathActive(item.path);
             return (
               <Link
                 key={item.path}
                 to={item.path}
                 className={`
                   flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all w-16
                   ${isActive 
                     ? 'text-indigo-400 font-bold' 
                     : 'text-slate-400 hover:text-slate-300'}
                 `}
               >
                  <div className={isActive ? "transform scale-110 transition-transform" : ""}>
                     {item.icon}
                   </div>
                   <span className="text-[10px] font-medium tracking-tight truncate w-full text-center">{item.label}</span>
               </Link>
             );
           })}
        </nav>

      </div>
    </div>
  );
};
