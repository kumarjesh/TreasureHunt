import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { HacksprintStore } from '../lib/store';
import { Stage, Team, Hunt } from '../types';
import { StageListEditor } from '../components/organizer/StageListEditor';
import { QRCodeGeneratorCard } from '../components/organizer/QRCodeGeneratorCard';
import { LiveTrackingMatrix } from '../components/organizer/LiveTrackingMatrix';
import { 
  Shield, 
  Layers, 
  QrCode, 
  Activity, 
  Users, 
  Trophy, 
  Flame, 
  Smartphone,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const OrganizerDashboard: React.FC = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'stages' | 'qrcodes' | 'telemetry'>('stages');
  
  const [hunt, setHunt] = useState<Hunt>(HacksprintStore.getHunt());
  const [stages, setStages] = useState<Stage[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  const refreshData = () => {
    setHunt(HacksprintStore.getHunt());
    setStages(HacksprintStore.getStages());
    setTeams(HacksprintStore.getTeams());
  };

  useEffect(() => {
    refreshData();
    const unsubscribe = HacksprintStore.subscribe(refreshData);
    return unsubscribe;
  }, []);

  if (!user || role !== 'organizer') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="glass-panel-glow rounded-3xl p-8 text-center max-w-md border border-cyan-500/30">
          <Shield className="w-12 h-12 text-cyan-400 mx-auto mb-3" />
          <h2 className="text-xl font-black text-white mb-2">Organizer Access Required</h2>
          <p className="text-xs text-slate-300 font-mono mb-6">
            You must be authenticated as a Hunt Director to access the organizer console.
          </p>
          <a
            href="/login"
            className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors shadow-lg shadow-cyan-500/20"
          >
            Switch to Organizer Login
          </a>
        </div>
      </div>
    );
  }

  const totalPoints = stages.reduce((acc, s) => acc + s.points, 0);
  const highestScore = teams.reduce((max, t) => Math.max(max, t.score), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner / Event HUD */}
      <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 border border-cyan-500/30 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                ACTIVE COMPETITION
              </span>
              <span className="text-xs font-mono text-slate-400">
                ID: {hunt.id}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
              {hunt.title}
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              {hunt.description}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/participant')}
              className="px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-xs font-mono font-bold flex items-center gap-2 transition-all"
            >
              <Smartphone className="w-4 h-4" />
              Preview Participant App
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800">
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div className="text-[11px] font-mono text-slate-400 uppercase">Checkpoints</div>
            <div className="text-2xl font-black text-white mt-1">{stages.length} Stages</div>
            <div className="text-[10px] text-cyan-400 font-mono mt-0.5">{totalPoints} Max PTS</div>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div className="text-[11px] font-mono text-slate-400 uppercase">Active Squads</div>
            <div className="text-2xl font-black text-white mt-1">{teams.length} Teams</div>
            <div className="text-[10px] text-emerald-400 font-mono mt-0.5">Live Realtime Sync</div>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div className="text-[11px] font-mono text-slate-400 uppercase">Top Arena Score</div>
            <div className="text-2xl font-black text-amber-400 mt-1">{highestScore} PTS</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Leading squad score</div>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div className="text-[11px] font-mono text-slate-400 uppercase">Anti-Cheat Mode</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">ACTIVE</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Session-Token Guard</div>
          </div>
        </div>
      </div>

      {/* Organizer Navigation Tabs */}
      <div className="flex border-b border-slate-800 space-x-2">
        <button
          id="tab-organizer-stages"
          onClick={() => setActiveTab('stages')}
          className={`pb-3 px-4 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'stages'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          1. Stage Builder ({stages.length})
        </button>

        <button
          id="tab-organizer-qrcodes"
          onClick={() => setActiveTab('qrcodes')}
          className={`pb-3 px-4 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'qrcodes'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <QrCode className="w-4 h-4" />
          2. QR Generation & Print
        </button>

        <button
          id="tab-organizer-telemetry"
          onClick={() => setActiveTab('telemetry')}
          className={`pb-3 px-4 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'telemetry'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          3. Live Tracking & Anti-Cheat
        </button>
      </div>

      {/* Main Tab Panels */}
      {activeTab === 'stages' && (
        <StageListEditor
          stages={stages}
          onRefresh={refreshData}
        />
      )}

      {activeTab === 'qrcodes' && (
        <QRCodeGeneratorCard
          stages={stages}
        />
      )}

      {activeTab === 'telemetry' && (
        <LiveTrackingMatrix
          stages={stages}
        />
      )}

    </div>
  );
};
