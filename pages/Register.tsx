import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Truck, Lock, Mail, User, ArrowRight } from 'lucide-react';
import { storageService } from '../services/storageService';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'driver'>('driver');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
        storageService.register({
            name,
            email,
            password,
            role
        });
        // Auto login after register
        storageService.login(email, password);
        navigate('/');
    } catch (err: any) {
        setError(err.message || 'Registration failed');
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
        <div className="bg-slate-900 p-8 text-center relative">
           <div className="absolute top-0 left-0 w-full h-full bg-indigo-600/10 z-0"></div>
          <h1 className="text-2xl font-bold text-white relative z-10">Create Account</h1>
          <p className="text-slate-400 text-sm mt-1 relative z-10">Join the delivery network</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100 text-center">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
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
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Create a password"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Role</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                    type="button"
                    onClick={() => setRole('driver')}
                    className={`py-3 rounded-xl border font-medium text-sm transition-all ${role === 'driver' ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                >
                    Driver
                </button>
                <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`py-3 rounded-xl border font-medium text-sm transition-all ${role === 'admin' ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                >
                    Admin
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all transform active:scale-95 flex items-center justify-center gap-2 mt-2"
            >
               Create Account <ArrowRight size={18} />
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-600 font-bold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};