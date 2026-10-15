import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { HacksprintStore } from '../lib/store';
import { Stage, StageProgress } from '../types';
import { decodeQRPayload, verifyScanEligibility } from '../lib/security';
import { TeamLobby } from '../components/participant/TeamLobby';
import { ActivePuzzleCard } from '../components/participant/ActivePuzzleCard';
import { QRScannerModal } from '../components/participant/QRScannerModal';
import { LeaderboardTable } from '../components/participant/LeaderboardTable';
import { 
  Compass, 
  ScanLine, 
  Trophy, 
  Flame, 
  Users, 
  ShieldAlert, 
  CheckCircle2, 
  X,
  Sparkles
} from 'lucide-react';

export const ParticipantDashboard: React.FC = () => {
  const { user, team, refreshTeam } = useAuth();
  const [activeTab, setActiveTab] = useState<'mission' | 'leaderboard'>('mission');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [stages, setStages] = useState<Stage[]>([]);
  const [progressList, setProgressList] = useState<StageProgress[]>([]);
  const [alertNotice, setAlertNotice] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  // Sync data from store
  useEffect(() => {
    const syncData = () => {
      setStages(HacksprintStore.getStages());
      if (team) {
        setProgressList(HacksprintStore.getTeamProgress(team.id));
      }
    };

    syncData();
    const unsubscribe = HacksprintStore.subscribe(syncData);
    return unsubscribe;
  }, [team?.id]);

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="glass-panel rounded-3xl p-8 text-center max-w-sm">
          <p className="text-sm text-slate-300 font-mono mb-4">Please log in to participate.</p>
          <a href="/login" className="px-6 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs uppercase tracking-wider">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  // If user has not joined or created a squad yet, show the Team Lobby
  if (!team) {
    return (
      <div className="py-6 px-4">
        <TeamLobby />
      </div>
    );
  }

  // Find active stage
  const currentStage = stages.find(s => s.stageIndex === team.currentStageIndex);
  const currentProgress = currentStage 
    ? progressList.find(p => p.stageId === currentStage.id) 
    : undefined;

  const totalStages = stages.length;
  const progressPct = totalStages > 0 
    ? Math.min(100, Math.round((team.currentStageIndex / totalStages) * 100))
    : 0;

  // Handle scanned QR payload
  const handleScanSuccess = (rawPayload: string) => {
    setScannerOpen(false);
    setAlertNotice(null);

    const payload = decodeQRPayload(rawPayload);
    if (!payload) {
      const errorMsg = 'Invalid QR Format: This code does not contain a recognized HACKSPRINT checkpoint signature.';
      setAlertNotice({ type: 'error', message: errorMsg });
      HacksprintStore.logScanAttempt({
        teamId: team.id,
        stageId: 'unknown',
        stageIndex: -1,
        userId: user.uid,
        isValid: false,
        reason: 'Malformed QR signature',
        clientNonce: 'nonce-err'
      });
      return;
    }

    const verification = verifyScanEligibility(team, payload, stages);

    if (!verification.valid || !verification.stage || !verification.sessionToken) {
      const errorMsg = verification.error || 'Checkpoint scan verification failed.';
      setAlertNotice({ type: 'error', message: errorMsg });
      HacksprintStore.logScanAttempt({
        teamId: team.id,
        stageId: payload.stageId,
        stageIndex: payload.stageIndex,
        userId: user.uid,
        isValid: false,
        reason: errorMsg,
        clientNonce: payload.secret
      });
      return;
    }

    // Success! Unlock stage with session token
    HacksprintStore.unlockStageWithScan(team.id, verification.stage, verification.sessionToken);
    HacksprintStore.logScanAttempt({
      teamId: team.id,
      stageId: verification.stage.id,
      stageIndex: verification.stage.stageIndex,
      userId: user.uid,
      isValid: true,
      reason: `Authorized unlock of ${verification.stage.title}`,
      clientNonce: verification.sessionToken
    });

    setAlertNotice({
      type: 'success',
      message: `CHECKPOINT VERIFIED! Stage ${verification.stage.stageIndex + 1} puzzle unlocked. Solve it below!`
    });
    setActiveTab('mission');
  };

  return (
    <div className="mobile-viewport-shell pb-24 pt-4 px-3 sm:px-4">
      
      {/* Squad Status HUD */}
      <div className="glass-panel-glow rounded-3xl p-4 sm:p-5 mb-4 border border-emerald-500/30 relative overflow-hidden">
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-md shadow-emerald-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-base text-white tracking-wide">
                  {team.name}
                </h2>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  CODE: {team.passCode}
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400">
                ACTIVE SQUAD • {team.memberUids.length} OPERATIVE(S)
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center gap-1 justify-end font-mono font-black text-lg text-amber-400">
              <Flame className="w-5 h-5 fill-amber-400 text-amber-400" />
              <span>{team.score}</span>
            </div>
            <div className="text-[9px] font-mono uppercase text-slate-400">
              Squad Score
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1.5">
            <span>Mission Progress</span>
            <span className="text-emerald-400 font-bold">
              Stage {Math.min(team.currentStageIndex + 1, totalStages)} of {totalStages} ({progressPct}%)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-500 rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

      </div>

      {/* Real-time Alert / Anti-Cheat Banner */}
      {alertNotice && (
        <div 
          id="anti-cheat-alert-banner"
          className={`p-3.5 rounded-2xl mb-4 font-mono text-xs flex items-start justify-between gap-3 animate-fade-in ${
            alertNotice.type === 'error'
              ? 'bg-red-500/15 border border-red-500/40 text-red-300'
              : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
          }`}
        >
          <div className="flex items-start gap-2">
            {alertNotice.type === 'error' ? (
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            )}
            <span className="leading-snug">{alertNotice.message}</span>
          </div>
          <button 
            onClick={() => setAlertNotice(null)}
            className="text-slate-400 hover:text-white shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Tab Content */}
      {activeTab === 'mission' ? (
        <ActivePuzzleCard
          stage={currentStage}
          teamId={team.id}
          progress={currentProgress}
          onOpenScanner={() => setScannerOpen(true)}
          onSolved={() => {
            refreshTeam();
            setAlertNotice({
              type: 'success',
              message: 'Challenge solved! Next checkpoint location revealed above.'
            });
          }}
          totalStages={totalStages}
        />
      ) : (
        <LeaderboardTable 
          currentTeamId={team.id}
          totalStages={totalStages}
        />
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800">
        <div className="max-w-md mx-auto grid grid-cols-3 p-2 gap-2">
          
          <button
            id="tab-btn-mission"
            onClick={() => setActiveTab('mission')}
            className={`py-2 px-3 rounded-2xl flex flex-col items-center justify-center transition-all ${
              activeTab === 'mission'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Mission</span>
          </button>

          <button
            id="tab-btn-scanner"
            onClick={() => setScannerOpen(true)}
            className="py-2 px-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-black flex flex-col items-center justify-center shadow-lg shadow-emerald-500/25 active:scale-95 transition-transform"
          >
            <ScanLine className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-black uppercase tracking-wider">Scan QR</span>
          </button>

          <button
            id="tab-btn-leaderboard"
            onClick={() => setActiveTab('leaderboard')}
            className={`py-2 px-3 rounded-2xl flex flex-col items-center justify-center transition-all ${
              activeTab === 'leaderboard'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Rankings</span>
          </button>

        </div>
      </nav>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        currentStageIndex={team.currentStageIndex}
      />

    </div>
  );
};
