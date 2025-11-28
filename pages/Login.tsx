import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Truck, Lock, Mail, ArrowRight } from 'lucide-react';
import { storageService } from '../services/storageService';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Simulate network delay
      setTimeout(() => {
        try {
          storageService.login(email, password);
          navigate('/');
        } catch (err: any) {
          setError(err.message || 'Login failed');
          setLoading(false);
        }
      }, 800);
    } catch (err) {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
        <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-indigo-600/10 z-0"></div>
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 relative z-10 shadow-lg shadow-indigo-500/30">
            <Truck className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white relative z-10 tracking-tight">DeliveryFlow</h1>
          <p className="text-slate-400 text-sm mt-1 relative z-10">Sign in to start your route</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100 flex items-center justify-center">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all transform active:scale-95 flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                'Signing in...'
              ) : (
                <>Sign In <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-indigo-600 font-bold hover:underline">
                Create Account
              </Link>
            </p>
            <div className="mt-4 pt-4 border-t border-slate-100">
               <p className="text-xs text-slate-400 mb-2">Demo Credentials:</p>
               <div className="flex justify-center gap-2 text-xs">
                 <button onClick={() => {setEmail('admin@deliveryflow.com'); setPassword('password');}} className="bg-slate-100 px-2 py-1 rounded hover:bg-slate-200 text-slate-600">Admin</button>
                 <button onClick={() => {setEmail('john@deliveryflow.com'); setPassword('password');}} className="bg-slate-100 px-2 py-1 rounded hover:bg-slate-200 text-slate-600">Driver</button>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};