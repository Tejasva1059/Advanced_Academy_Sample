import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { Lock, User as UserIcon, ShieldCheck, ArrowRight, AlertCircle, Sparkles, Award } from 'lucide-react';
import cbseLogo from '../assets/cbse_logo.png';
import schoolLogo from '../assets/advanced_academy_logo.png';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('AdminPassword123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await apiClient.post('/auth/login', { username, password });
      const { access_token, user } = response.data;
      login(access_token, user);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-emerald-950 via-slate-950 to-emerald-950 p-4 relative overflow-hidden font-sans">
      {/* Dynamic Ambient Background Elements */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-32 right-1/3 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-lg bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 sm:p-10 border border-emerald-500/20 relative z-10">
        
        {/* Top Header with Dual Badges */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center space-x-6 mb-4">
            <div className="relative group">
              <div className="w-14 h-14 rounded-full bg-white p-1.5 shadow-md border-2 border-emerald-200 group-hover:scale-105 transition-transform flex items-center justify-center">
                <img src={cbseLogo} alt="CBSE Emblem" className="w-full h-full object-contain" />
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mt-1">CBSE</span>
            </div>

            <div className="w-1 h-10 bg-slate-200 rounded-full" />

            <div className="relative group">
              <div className="w-16 h-16 rounded-full bg-white p-1.5 shadow-lg border-2 border-amber-400 group-hover:scale-105 transition-transform flex items-center justify-center">
                <img src={schoolLogo} alt="Advanced Academy Crest" className="w-full h-full object-contain" />
              </div>
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block mt-1">ESTD 1999</span>
            </div>
          </div>

          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>C.B.S.E. AFFILIATION NO. 1030183 • SCHOOL CODE: 50161</span>
          </div>

          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-display">
            ADVANCED ACADEMY
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-1 max-w-sm mx-auto">
            ISKCON Vihar Colony, Nipania Road, Indore (M.P.) • Result & Examination Portal
          </p>
        </div>

        {/* Live Notification Pill */}
        <div className="mb-6 p-2.5 bg-gradient-to-r from-emerald-50 to-amber-50 rounded-xl border border-emerald-200/80 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-slate-700">
            <Award className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">
              Sample Student Loaded: <b className="text-emerald-950 font-bold">Avaneesh Mahawar</b> (Class VIII E)
            </span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-600 text-white rounded-md shadow-xs">
            Annual 2023
          </span>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
              Username or Staff ID
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:border-emerald-500 transition-all shadow-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:border-emerald-500 transition-all shadow-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-700 via-emerald-800 to-emerald-900 hover:from-emerald-600 hover:to-emerald-800 active:scale-[0.99] text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-950/20 flex items-center justify-center space-x-2 disabled:opacity-70 cursor-pointer"
          >
            {loading ? (
              <span>Authenticating with Portal...</span>
            ) : (
              <>
                <span>Enter Academic Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Quick-Fill Roles Box */}
        <div className="mt-8 pt-5 border-t border-slate-200">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Select Demo Persona for RBAC Testing:</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Instant 1-Click
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickFill('admin', 'AdminPassword123!')}
              className={`p-2.5 text-left rounded-xl border transition-all cursor-pointer ${
                username === 'admin'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-sm font-bold ring-2 ring-emerald-400/40'
                  : 'bg-slate-50/80 border-slate-200 hover:bg-emerald-50/40 text-slate-700'
              }`}
            >
              <div className="font-bold flex items-center justify-between">
                <span>Super Admin</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-600 text-white font-semibold">ALL</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Full System & Reports</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('principal', 'PrincipalPassword123!')}
              className={`p-2.5 text-left rounded-xl border transition-all cursor-pointer ${
                username === 'principal'
                  ? 'bg-amber-50 border-amber-500 text-amber-950 shadow-sm font-bold ring-2 ring-amber-400/40'
                  : 'bg-slate-50/80 border-slate-200 hover:bg-amber-50/40 text-slate-700'
              }`}
            >
              <div className="font-bold flex items-center justify-between">
                <span>Principal</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-600 text-white font-semibold">VIEW</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">All 120 Students & Cards</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('teacher5', 'TeacherPassword123!')}
              className={`p-2.5 text-left rounded-xl border transition-all cursor-pointer ${
                username === 'teacher5'
                  ? 'bg-blue-50 border-blue-500 text-blue-950 shadow-sm font-bold ring-2 ring-blue-400/40'
                  : 'bg-slate-50/80 border-slate-200 hover:bg-blue-50/40 text-slate-700'
              }`}
            >
              <div className="font-bold flex items-center justify-between">
                <span>Teacher (Class 5)</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-600 text-white font-semibold">CLS 5</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Strict Class 5 Access</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('teacher6', 'TeacherPassword123!')}
              className={`p-2.5 text-left rounded-xl border transition-all cursor-pointer ${
                username === 'teacher6'
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-950 shadow-sm font-bold ring-2 ring-indigo-400/40'
                  : 'bg-slate-50/80 border-slate-200 hover:bg-indigo-50/40 text-slate-700'
              }`}
            >
              <div className="font-bold flex items-center justify-between">
                <span>Teacher (Class 6)</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-600 text-white font-semibold">ROSTER</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">View All + Edit Class 6</div>
            </button>
          </div>
        </div>

      </div>

      {/* Footer Info */}
      <div className="mt-6 text-center text-xs text-slate-400 relative z-10">
        Advanced Academy Indore • Unified Result Management System • CBSE Affiliated Standard
      </div>
    </div>
  );
};

export default LoginPage;
