import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, 
  Smartphone, 
  Monitor, 
  Shield, 
  User, 
  ArrowRight, 
  Sparkles,
  Lock,
  Flame
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginAsOrganizer, loginAsParticipant, quickDemoLogin } = useAuth();
  const navigate = useNavigate();
  const [roleSelection, setRoleSelection] = useState<'participant' | 'organizer'>('participant');
  
  // Custom inputs
  const [participantName, setParticipantName] = useState('');
  const [organizerEmail, setOrganizerEmail] = useState('');
  const [organizerPassword, setOrganizerPassword] = useState('');

  const handleParticipantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = participantName.trim() || 'AgentHunter';
    loginAsParticipant(name);
    navigate('/participant');
  };

  const handleOrganizerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginAsOrganizer(organizerEmail || 'organizer@hacksprint.dev');
    navigate('/organizer');
  };

  const handleQuickDemo = (role: 'participant' | 'organizer') => {
    quickDemoLogin(role);
    if (role === 'organizer') {
      navigate('/organizer');
    } else {
      navigate('/participant');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-panel-glow rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-emerald-500/30">
        
        {/* Glow ambient background elements */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Title */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/25">
            <Zap className="w-8 h-8 text-slate-950 fill-current" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-wider">
            HACKSPRINT
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1 uppercase tracking-wider">
            Role-Based Authentication Gate
          </p>
        </div>

        {/* Role Toggle */}
        <div className="grid grid-cols-2 p-1 bg-slate-900/90 rounded-2xl border border-slate-800 mb-6">
          <button
            id="role-select-participant"
            type="button"
            onClick={() => setRoleSelection('participant')}
            className={`py-2.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center gap-1.5 ${
              roleSelection === 'participant'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Participant
          </button>

          <button
            id="role-select-organizer"
            type="button"
            onClick={() => setRoleSelection('organizer')}
            className={`py-2.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center gap-1.5 ${
              roleSelection === 'organizer'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            Organizer
          </button>
        </div>

        {/* Dynamic Role Form */}
        {roleSelection === 'participant' ? (
          <form onSubmit={handleParticipantSubmit} className="space-y-4">
            <div>
              <label 
                htmlFor="input-participant-name"
                className="block text-[11px] font-mono font-semibold uppercase text-slate-300 mb-1.5"
              >
                Operative Codename
              </label>
              <div className="relative">
                <input
                  id="input-participant-name"
                  type="text"
                  placeholder="e.g. CyberGhost or CipherNinja"
                  value={participantName}
                  onChange={e => setParticipantName(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-3 text-sm font-semibold text-slate-100 focus:outline-none focus:border-emerald-500 placeholder-slate-600 transition-colors"
                />
                <User className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            <button
              id="btn-login-participant"
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              Enter as Participant
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleOrganizerSubmit} className="space-y-4">
            <div>
              <label 
                htmlFor="input-organizer-email"
                className="block text-[11px] font-mono font-semibold uppercase text-slate-300 mb-1.5"
              >
                Director Email
              </label>
              <input
                id="input-organizer-email"
                type="email"
                placeholder="organizer@hacksprint.dev"
                value={organizerEmail}
                onChange={e => setOrganizerEmail(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 placeholder-slate-600 transition-colors"
              />
            </div>

            <div>
              <label 
                htmlFor="input-organizer-password"
                className="block text-[11px] font-mono font-semibold uppercase text-slate-300 mb-1.5"
              >
                Password / Security Key
              </label>
              <input
                id="input-organizer-password"
                type="password"
                placeholder="••••••••••••"
                value={organizerPassword}
                onChange={e => setOrganizerPassword(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 placeholder-slate-600 transition-colors"
              />
            </div>

            <button
              id="btn-login-organizer"
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
            >
              Enter Organizer Console
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* 1-Click Fast Demo Buttons */}
        <div className="mt-8 pt-6 border-t border-slate-800 space-y-2">
          <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 text-center mb-2">
            Instant Demo Bypass (Hackathon Mode):
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              id="btn-demo-participant"
              type="button"
              onClick={() => handleQuickDemo('participant')}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-emerald-500/10 border border-slate-800 hover:border-emerald-500/40 text-left transition-all group"
            >
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono font-bold mb-0.5">
                <Smartphone className="w-3.5 h-3.5" />
                Participant
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                1-Click Hunter Login
              </div>
            </button>

            <button
              id="btn-demo-organizer"
              type="button"
              onClick={() => handleQuickDemo('organizer')}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-cyan-500/10 border border-slate-800 hover:border-cyan-500/40 text-left transition-all group"
            >
              <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-mono font-bold mb-0.5">
                <Shield className="w-3.5 h-3.5" />
                Organizer
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                1-Click Director Console
              </div>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
