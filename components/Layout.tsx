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
  User
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { User as UserType } from '../types';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  // Check Auth
  useEffect(() => {
    // Use the listener to get current user correctly
    const unsubscribe = storageService.onAuthStateChanged((user) => {
        setCurrentUser(user);
    });
    return () => unsubscribe();
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
    <div className="min-h-screen flex bg-slate-50">
      
      {/* Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 no-print flex flex-col shadow-2xl
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
        <div className="p-4 border-t border-slate-800">
           <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer group">
             <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-sm shadow-inner border border-slate-700">
                {currentUser?.name?.charAt(0) || <User size={16}/>}
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
        <div className="md:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center no-print">
          <div className="flex items-center gap-3">
             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 -ml-2 text-slate-600">
               {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
             </button>
             <h1 className="font-bold text-lg text-slate-800">{getPageTitle()}</h1>
          </div>
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
            {currentUser?.name?.charAt(0)}
          </div>
        </div>

        {/* Desktop Header */}
        <header className="hidden md:flex bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-20 px-8 py-4 justify-between items-center no-print">
            <div>
               <h2 className="text-2xl font-bold text-slate-800">{getPageTitle()}</h2>
               <p className="text-sm text-slate-500">Overview of your activity</p>
            </div>

            <div className="flex items-center gap-6">
                <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                   <input 
                      type="text" 
                      placeholder="Search..." 
                      className="pl-10 pr-4 py-2 rounded-full bg-slate-100 border-none text-sm focus:ring-2 focus:ring-indigo-500 w-64 transition-all"
                   />
                </div>
                <button className="relative p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                   <Bell size={20} />
                   <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
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