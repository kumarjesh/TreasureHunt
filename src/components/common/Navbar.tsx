import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Zap, Shield, User, LogOut, Smartphone, Monitor, Radio } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CloudSync } from '../../lib/cloudSync';

export const Navbar: React.FC = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [cloudConnected, setCloudConnected] = useState(CloudSync.isConnected());

  useEffect(() => {
    return CloudSync.onStatusChange((connected) => {
      setCloudConnected(connected);
    });
  }, []);

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={() => navigate('/')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Zap className="w-6 h-6 text-slate-950 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                HACKSPRINT
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                v1.0
              </span>
              <span className="inline-flex items-center gap-1.5 text-[9px] font-mono px-2 py-0.5 rounded-full bg-slate-900/90 border border-slate-800">
                <span className={`w-1.5 h-1.5 rounded-full ${cloudConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span className={cloudConnected ? 'text-emerald-300 font-bold' : 'text-amber-300'}>
                  {cloudConnected ? 'Live Cloud' : 'Syncing'}
                </span>
              </span>
            </div>
            <p className="text-[10px] text-slate-400 tracking-wider uppercase font-mono">
              Digital Treasure Hunt
            </p>
          </div>
        </div>

        {/* Center / Role Switcher for Fast Dev & Evaluation */}
        {user && (
          <div className="hidden sm:flex items-center gap-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => navigate('/participant')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                location.pathname.startsWith('/participant')
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Participant View
            </button>
            <button
              onClick={() => navigate('/organizer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                location.pathname.startsWith('/organizer')
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              Organizer View
            </button>
          </div>
        )}

        {/* Right Auth info & actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <div className="text-xs font-bold text-slate-200 flex items-center justify-end gap-1">
                  {role === 'organizer' ? (
                    <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  {user.displayName}
                </div>
                <div className="text-[10px] uppercase font-mono text-slate-400">
                  {role}
                </div>
              </div>

              <button
                onClick={logout}
                title="Log out"
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700/60 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-emerald-500/20"
            >
              Enter Arena
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
