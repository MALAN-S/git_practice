import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStoreSettings } from '../services/settings';
import api from '../services/api';
import {
  Box,
  Printer,
  Package,
  Receipt,
  ShoppingCart,
  Barcode,
  FileText,
  CreditCard,
  Layers,
  Eye,
  EyeOff,
} from 'lucide-react';

/* ───── floating decorative icons (right side) ───── */
const floatingIcons = [
  { Icon: Printer,      size: 48, bg: 'bg-blue-500',   text: 'text-white',      top: '18%', left: '8%',  delay: '0s'    },
  { Icon: Receipt,      size: 40, bg: 'bg-purple-500', text: 'text-white',      top: '10%', left: '62%', delay: '0.5s'  },
  { Icon: Package,      size: 44, bg: 'bg-amber-400',  text: 'text-white',      top: '38%', left: '35%', delay: '1s'    },
  { Icon: ShoppingCart,  size: 36, bg: 'bg-emerald-500',text: 'text-white',      top: '65%', left: '12%', delay: '1.5s'  },
  { Icon: CreditCard,   size: 40, bg: 'bg-rose-400',   text: 'text-white',      top: '52%', left: '68%', delay: '0.8s'  },
  { Icon: Layers,        size: 38, bg: 'bg-indigo-400', text: 'text-white',      top: '28%', left: '80%', delay: '1.2s'  },
  { Icon: FileText,      size: 34, bg: 'bg-teal-400',   text: 'text-white',      top: '78%', left: '50%', delay: '0.3s'  },
  { Icon: Barcode,       size: 32, bg: 'bg-orange-400', text: 'text-white',      top: '85%', left: '78%', delay: '1.8s'  },
];

/* ───── floating dots ───── */
const dots = [
  { size: 6,  bg: 'bg-blue-400',   top: '14%', left: '42%' },
  { size: 8,  bg: 'bg-amber-400',  top: '32%', left: '22%' },
  { size: 5,  bg: 'bg-slate-800',  top: '45%', left: '55%' },
  { size: 7,  bg: 'bg-purple-400', top: '70%', left: '30%' },
  { size: 6,  bg: 'bg-amber-400',  top: '60%', left: '85%' },
  { size: 5,  bg: 'bg-blue-400',   top: '90%', left: '20%' },
];

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const settings = useStoreSettings();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', { username: username.trim(), password });
      if (res.data.error) {
        setError(res.data.error);
      } else {
        login(
          { username: res.data.username, role: res.data.role, permissions: res.data.permissions || '' },
          res.data.token
        );
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(
        err.response?.data?.error || 'Invalid username or password.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* ────── Left: Login Form ────── */}
      <div className="w-full lg:w-[480px] xl:w-[520px] flex flex-col justify-center px-8 sm:px-12 lg:px-16 relative z-10">
        {/* Brand */}
        <div className="absolute top-8 left-8 sm:left-12 lg:left-16 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
            <Box className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-xl font-black text-slate-900 tracking-tight" title={settings.shopName || 'Shop'}>
            {settings.shopName || 'Shop'}
          </span>
        </div>

        <div className="max-w-[340px] mx-auto w-full">
          <h1 className="text-[32px] font-black text-slate-900 tracking-tight mb-1.5">
            Login
          </h1>
          <p className="text-sm text-slate-500 font-medium mb-8">
            Welcome back! Please enter your details.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="relative">
              <label className="absolute -top-2.5 left-3 bg-white px-1.5 text-[11px] font-semibold text-slate-500 z-10">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                placeholder="Enter your username"
                autoComplete="username"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <label className="absolute -top-2.5 left-3 bg-white px-1.5 text-[11px] font-semibold text-slate-500 z-10">
                Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="Enter your password"
                autoComplete="current-password"
                className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-300 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="text-xs font-semibold text-rose-500 bg-rose-50 px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-6 font-medium">
            Contact your administrator for account access.
          </p>
        </div>
      </div>

      {/* ────── Right: Decorative Floating Icons ────── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center">
        {/* Subtle radial background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/80 via-white to-blue-50/40" />

        {/* Floating icons */}
        {floatingIcons.map((item, i) => {
          const { Icon, size, bg, text, top, left, delay } = item;
          return (
            <div
              key={i}
              className="absolute animate-float"
              style={{
                top,
                left,
                animationDelay: delay,
              }}
            >
              <div
                className={`${bg} ${text} rounded-2xl shadow-lg flex items-center justify-center`}
                style={{ width: size, height: size }}
              >
                <Icon className="w-1/2 h-1/2 stroke-[2]" />
              </div>
            </div>
          );
        })}

        {/* Floating dots */}
        {dots.map((dot, i) => (
          <div
            key={`dot-${i}`}
            className={`absolute ${dot.bg} rounded-full animate-pulse`}
            style={{
              width: dot.size,
              height: dot.size,
              top: dot.top,
              left: dot.left,
            }}
          />
        ))}
      </div>

      {/* Float animation keyframes */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
