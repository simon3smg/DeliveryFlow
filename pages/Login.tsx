
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Truck, Lock, Mail, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { storageService } from '../services/storageService';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
        await storageService.login(email, password);
        navigate('/');
    } catch (err: any) {
        console.error(err);
        if (err.code === 'auth/invalid-credential' || err.message.includes('invalid-credential')) {
            setError("Incorrect email or password. Please try again.");
        } else if (err.code === 'auth/user-not-found') {
             setError("No account found with this email. Please register.");
        } else if (err.code === 'auth/too-many-requests') {
             setError("Too many failed attempts. Please try again later.");
        } else {
            setError("Login failed. Please check your connection.");
        }
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-800 relative animate-in fade-in zoom-in duration-300">
        
        {/* Header Section */}
        <div className="bg-slate-950 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>
          
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4 relative z-10 shadow-lg shadow-indigo-500/30 ring-1 ring-white/10">
            <Truck className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white relative z-10 tracking-tight">DeliveryFlow</h1>
          <p className="text-slate-400 text-sm mt-1 relative z-10">Sign in to manage your logistics</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-900/20 text-red-400 text-sm p-4 rounded-xl border border-red-900/30 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-800 border border-slate-700 rounded-xl focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-white placeholder:text-slate-500"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Password</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-800 border border-slate-700 rounded-xl focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-white placeholder:text-slate-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 mt-2 ${loading ? 'opacity-80 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <><Loader2 className="animate-spin" size={20}/> Signing in...</>
              ) : (
                <>Sign In <ArrowRight size={20} /></>
              )}
            </button>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-slate-800">
            <p className="text-slate-400 text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
