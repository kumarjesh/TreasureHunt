import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Users, Plus, KeyRound, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';

export const TeamLobby: React.FC = () => {
  const { createTeam, joinTeam, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'join' | 'create'>('join');
  
  // Join team state
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  
  // Create team state
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamPasscode, setNewTeamPasscode] = useState('');
  const [createError, setCreateError] = useState('');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError('');
    if (!joinCode.trim()) {
      setJoinError('Please enter a team passcode');
      return;
    }
    const res = joinTeam(joinCode);
    if (!res.success) {
      setJoinError(res.error || 'Failed to join team');
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    if (!newTeamName.trim()) {
      setCreateError('Team name is required');
      return;
    }
    const passcode = newTeamPasscode.trim() || Math.floor(1000 + Math.random() * 9000).toString();
    try {
      createTeam(newTeamName, passcode);
    } catch (err: any) {
      setCreateError(err.message || 'Error creating team');
    }
  };

  const handleQuickDemo = () => {
    // Generate an instant squad with a unique name
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const demoTeamName = `CyberWolves-${randomSuffix}`;
    const demoPasscode = `${randomSuffix}`;
    createTeam(demoTeamName, demoPasscode);
  };

  return (
    <div className="max-w-md mx-auto my-6 px-4">
      <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 text-center relative overflow-hidden">
        
        {/* Glow ambient background */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-emerald-400" />
        </div>

        <h2 className="text-2xl font-black text-white tracking-wide mb-1">
          SQUAD REGISTRATION
        </h2>
        <p className="text-xs text-slate-400 mb-6 font-mono">
          OPERATIVE: <span className="text-emerald-400 font-bold">{user?.displayName}</span>
        </p>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-900/90 rounded-2xl border border-slate-800 mb-6">
          <button
            id="tab-join-team"
            type="button"
            onClick={() => setActiveTab('join')}
            className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'join'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            Join Squad
          </button>
          <button
            id="tab-create-team"
            type="button"
            onClick={() => setActiveTab('create')}
            className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'create'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Form Squad
          </button>
        </div>

        {activeTab === 'join' ? (
          <form onSubmit={handleJoin} className="space-y-4 text-left">
            <div>
              <label className="block text-[11px] font-mono font-semibold uppercase text-slate-300 mb-1.5">
                Team Passcode
              </label>
              <input
                id="input-join-passcode"
                type="text"
                placeholder="e.g. 7741"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value)}
                maxLength={8}
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-3 text-center text-lg font-mono tracking-widest text-emerald-400 focus:outline-none focus:border-emerald-500 placeholder-slate-600 transition-colors"
              />
            </div>

            {joinError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center font-mono">
                {joinError}
              </div>
            )}

            <button
              id="btn-join-team-submit"
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm tracking-wider uppercase transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              Verify & Enter Hunt
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleCreate} className="space-y-4 text-left">
            <div>
              <label className="block text-[11px] font-mono font-semibold uppercase text-slate-300 mb-1.5">
                Squad Codename
              </label>
              <input
                id="input-create-team-name"
                type="text"
                placeholder="e.g. Apex Hackers"
                value={newTeamName}
                onChange={e => setNewTeamName(e.target.value)}
                maxLength={30}
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-100 focus:outline-none focus:border-emerald-500 placeholder-slate-600 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono font-semibold uppercase text-slate-300 mb-1.5">
                Squad Passcode (4-6 digits)
              </label>
              <input
                id="input-create-passcode"
                type="text"
                placeholder="e.g. 9842 (Auto-generates if blank)"
                value={newTeamPasscode}
                onChange={e => setNewTeamPasscode(e.target.value)}
                maxLength={8}
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm font-mono tracking-widest text-emerald-400 focus:outline-none focus:border-emerald-500 placeholder-slate-600 transition-colors"
              />
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center font-mono">
                {createError}
              </div>
            )}

            <button
              id="btn-create-team-submit"
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm tracking-wider uppercase transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              Deploy Squad
              <Sparkles className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* 1-Click Instant Squad Shortcut */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <button
            id="btn-quick-demo-team"
            type="button"
            onClick={handleQuickDemo}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-emerald-500/40 text-slate-300 text-xs font-mono flex items-center justify-center gap-2 transition-all"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Instant 1-Click Demo Squad
          </button>
        </div>

      </div>
    </div>
  );
};
