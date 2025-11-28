import React, { useState, useEffect, useRef } from 'react';
import { User, Bell, Shield, LogOut, Store, Package, Loader2, Moon, Sun, Key, Camera } from 'lucide-react';
import { storageService } from '../services/storageService';
import { User as UserType } from '../types';
import { useNavigate, Link } from 'react-router-dom';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserType | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', avatar: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Password State
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

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
        setFormData({ name: u.name, email: u.email, avatar: u.avatar || '' });
    });
    return () => unsub();
  }, [navigate]);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
    if (newMode) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
  };

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData(prev => ({ ...prev, avatar: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChangePassword = async () => {
    setPasswordMsg({ type: '', text: '' });
    if (passwordData.newPassword.length < 6) {
        setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters' });
        return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
        setPasswordMsg({ type: 'error', text: 'Passwords do not match' });
        return;
    }

    setLoading(true);
    try {
        await storageService.updateUserPassword(passwordData.newPassword);
        setPasswordMsg({ type: 'success', text: 'Password updated successfully' });
        setPasswordData({ newPassword: '', confirmPassword: '' });
        setIsChangingPassword(false);
    } catch (e: any) {
        if (e.code === 'auth/requires-recent-login') {
            setPasswordMsg({ type: 'error', text: 'For security, please logout and login again to change your password.' });
        } else {
            setPasswordMsg({ type: 'error', text: 'Failed to update password. Try again.' });
        }
    } finally {
        setLoading(false);
    }
  };

  const handleLogout = async () => {
    await storageService.logout();
    navigate('/login');
  };

  if (!user) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-indigo-600"/></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Settings</h2>
        <p className="text-slate-500 dark:text-slate-400">Manage your account and application preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Main Content Column */}
        <div className="md:col-span-2 space-y-6">
            
            {/* Profile Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors duration-300">
                <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                        <User size={20} className="text-indigo-600 dark:text-indigo-400"/> Personal Information
                    </h3>
                    <button 
                        onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                        className={`text-sm font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${isEditing ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                        disabled={loading}
                    >
                        {loading && <Loader2 className="animate-spin" size={14}/>}
                        {isEditing ? 'Save Changes' : 'Edit Profile'}
                    </button>
                </div>
                
                <div className="p-8 space-y-6">
                    {successMsg && (
                        <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-xl text-sm font-semibold mb-4 flex items-center gap-2 border border-emerald-100 dark:border-emerald-800">
                            <Shield size={16} /> {successMsg}
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
                        {/* Avatar Upload Section */}
                        <div className="relative group shrink-0">
                            <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-700 shadow-md flex items-center justify-center overflow-hidden">
                                {formData.avatar ? (
                                    <img src={formData.avatar} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={40} className="text-slate-300 dark:text-slate-600" />
                                )}
                            </div>
                            
                            {isEditing && (
                                <>
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute bottom-0 right-0 p-2 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-transform hover:scale-105"
                                        title="Upload Photo"
                                    >
                                        <Camera size={16} />
                                    </button>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        accept="image/*"
                                        onChange={handleImageChange}
                                    />
                                </>
                            )}
                        </div>
                        
                        {/* Inputs Section */}
                        <div className="flex-1 w-full grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
                                <input 
                                    disabled={!isEditing}
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
                                <input 
                                    disabled={true}
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                    title="Email cannot be changed directly"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="pt-2">
                         <span className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                            Role: {user.role}
                         </span>
                    </div>
                </div>
            </div>

            {/* Change Password Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors duration-300">
                 <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                        <Key size={20} className="text-indigo-600 dark:text-indigo-400"/> Security
                    </h3>
                </div>
                
                <div className="p-8 space-y-6">
                    {!isChangingPassword ? (
                        <div className="flex justify-between items-center">
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                                Update your password regularly to keep your account secure.
                            </div>
                            <button 
                                onClick={() => setIsChangingPassword(true)}
                                className="text-sm font-bold px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                Change Password
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            {passwordMsg.text && (
                                <div className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 border ${
                                    passwordMsg.type === 'error' 
                                    ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800' 
                                    : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800'
                                }`}>
                                    <Shield size={16} /> {passwordMsg.text}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">New Password</label>
                                    <input 
                                        type="password"
                                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                                        placeholder="Min. 6 characters"
                                        value={passwordData.newPassword}
                                        onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Confirm Password</label>
                                    <input 
                                        type="password"
                                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                                        placeholder="Re-enter password"
                                        value={passwordData.confirmPassword}
                                        onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button 
                                    onClick={() => { setIsChangingPassword(false); setPasswordMsg({type:'', text:''}); setPasswordData({newPassword:'', confirmPassword:''}); }} 
                                    className="px-4 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleChangePassword} 
                                    disabled={loading}
                                    className="px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none flex items-center gap-2"
                                >
                                    {loading && <Loader2 className="animate-spin" size={14}/>} Update Password
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Links Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors duration-300">
                <div className="p-6 border-b border-slate-50 dark:border-slate-800">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">Business Management</h3>
                    <p className="text-xs text-slate-400 mt-1">Quick access to manage your logistics data</p>
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <Link to="/stores" className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/20 transition-all group">
                        <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Store size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800 dark:text-white">Manage Stores</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Update addresses & contacts</p>
                        </div>
                     </Link>

                     <Link to="/products" className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/20 transition-all group">
                        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Package size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800 dark:text-white">Manage Products</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Edit prices & inventory</p>
                        </div>
                     </Link>
                </div>
            </div>
        </div>

        {/* Sidebar Settings Column */}
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden p-6 space-y-6 transition-colors duration-300">
                 <h3 className="font-bold text-lg text-slate-800 dark:text-white">Preferences</h3>
                 
                 {/* Dark Mode Toggle */}
                 <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                         <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400">
                             {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
                         </div>
                         <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Dark Mode</span>
                     </div>
                     <button 
                        onClick={toggleDarkMode}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${isDarkMode ? 'bg-indigo-600' : 'bg-slate-200'}`}
                     >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                     </button>
                 </div>

                 {/* Notifications Toggle */}
                 <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                         <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400"><Bell size={18} /></div>
                         <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Notifications</span>
                     </div>
                     <div className="relative inline-block w-10 h-6 align-middle select-none transition duration-200 ease-in">
                        <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-4 h-4 rounded-full bg-white border-4 appearance-none cursor-pointer translate-x-4"/>
                        <label htmlFor="toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-indigo-600 cursor-pointer"></label>
                    </div>
                 </div>

                 <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                         <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400"><Shield size={18} /></div>
                         <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Data Privacy</span>
                     </div>
                     <span className="text-xs text-slate-400">Active</span>
                 </div>

                 <hr className="border-slate-100 dark:border-slate-800" />
                 
                 <button 
                    onClick={handleLogout}
                    className="w-full py-3 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                 >
                    <LogOut size={18} /> Sign Out
                 </button>
            </div>
        </div>

      </div>
    </div>
  );
};