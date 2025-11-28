import React, { useState, useEffect } from 'react';
import { User, Bell, Shield, LogOut, Save, Store, Package, Loader2 } from 'lucide-react';
import { storageService } from '../services/storageService';
import { User as UserType } from '../types';
import { useNavigate, Link } from 'react-router-dom';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserType | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Subscribe to user changes
    const unsub = storageService.onAuthStateChanged((u) => {
        if (!u) {
            navigate('/login');
            return;
        }
        setUser(u);
        setFormData({ name: u.name, email: u.email });
    });
    return () => unsub();
  }, [navigate]);

  const handleSaveProfile = async () => {
    if (user) {
        setLoading(true);
        const updatedUser = { ...user, ...formData };
        try {
            await storageService.updateUser(updatedUser);
            setUser(updatedUser);
            setIsEditing(false);
            setSuccessMsg('Profile updated successfully');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch(e) {
            alert("Failed to update profile");
        } finally {
            setLoading(false);
        }
    }
  };

  const handleLogout = async () => {
    await storageService.logout();
    navigate('/login');
  };

  if (!user) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin"/></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Settings</h2>
        <p className="text-slate-500">Manage your account and application preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Profile Card */}
        <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <User size={20} className="text-indigo-600"/> Personal Information
                    </h3>
                    <button 
                        onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                        className={`text-sm font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${isEditing ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                        disabled={loading}
                    >
                        {loading && <Loader2 className="animate-spin" size={14}/>}
                        {isEditing ? 'Save Changes' : 'Edit Profile'}
                    </button>
                </div>
                
                <div className="p-8 space-y-6">
                    {successMsg && (
                        <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-sm font-semibold mb-4 flex items-center gap-2">
                            <Shield size={16} /> {successMsg}
                        </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Full Name</label>
                            <input 
                                disabled={!isEditing}
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Email Address</label>
                            <input 
                                disabled={true}
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                                title="Email cannot be changed directly"
                            />
                        </div>
                    </div>
                    
                    <div className="pt-2">
                         <span className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-500 uppercase">
                            Role: {user.role}
                         </span>
                    </div>
                </div>
            </div>

            {/* Application Management Links */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-50">
                    <h3 className="font-bold text-lg text-slate-800">Business Management</h3>
                    <p className="text-xs text-slate-400 mt-1">Quick access to manage your logistics data</p>
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <Link to="/stores" className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Store size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800">Manage Stores</h4>
                            <p className="text-xs text-slate-500">Update addresses & contacts</p>
                        </div>
                     </Link>

                     <Link to="/products" className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Package size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800">Manage Products</h4>
                            <p className="text-xs text-slate-500">Edit prices & inventory</p>
                        </div>
                     </Link>
                </div>
            </div>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden p-6 space-y-6">
                 <h3 className="font-bold text-lg text-slate-800">Preferences</h3>
                 
                 <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                         <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><Bell size={18} /></div>
                         <span className="text-sm font-medium text-slate-700">Notifications</span>
                     </div>
                     <div className="relative inline-block w-10 h-6 align-middle select-none transition duration-200 ease-in">
                        <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-4 h-4 rounded-full bg-white border-4 appearance-none cursor-pointer translate-x-4"/>
                        <label htmlFor="toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-indigo-600 cursor-pointer"></label>
                    </div>
                 </div>

                 <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                         <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><Shield size={18} /></div>
                         <span className="text-sm font-medium text-slate-700">Data Privacy</span>
                     </div>
                     <span className="text-xs text-slate-400">Active</span>
                 </div>

                 <hr className="border-slate-100" />
                 
                 <button 
                    onClick={handleLogout}
                    className="w-full py-3 border border-red-100 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                 >
                    <LogOut size={18} /> Sign Out
                 </button>
            </div>
        </div>

      </div>
    </div>
  );
};