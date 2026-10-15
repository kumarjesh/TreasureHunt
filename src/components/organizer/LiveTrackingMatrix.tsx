import React, { useEffect, useState } from 'react';
import { Stage, Team, ScanLog, StageProgress } from '../../types';
import { HacksprintStore } from '../../lib/store';
import { 
  Activity, 
  ShieldAlert, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  RotateCcw, 
  Flame, 
  Clock, 
  Users,
  AlertTriangle
} from 'lucide-react';

interface LiveTrackingMatrixProps {
  stages: Stage[];
}

export const LiveTrackingMatrix: React.FC<LiveTrackingMatrixProps> = ({ stages }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([]);

  useEffect(() => {
    const sync = () => {
      setTeams(HacksprintStore.getTeams());
      setScanLogs(HacksprintStore.getScanLogs());
    };
    sync();
    const unsubscribe = HacksprintStore.subscribe(sync);
    return unsubscribe;
  }, []);

  const handleReset = () => {
    if (confirm('CAUTION: Reset all teams, progress and scan logs to factory default?')) {
      HacksprintStore.resetToInitial();
    }
  };

  const getStageStatus = (teamId: string, stageId: string, stageIndex: number, teamCurrentStage: number) => {
    const progress = HacksprintStore.getStageProgress(teamId, stageId);
    if (progress?.status === 'solved') {
      return { status: 'solved', label: 'Solved', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
    }
    if (progress?.status === 'scanned_unlocked') {
      return { status: 'unlocked', label: 'In Progress', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' };
    }
    if (stageIndex === teamCurrentStage) {
      return { status: 'searching', label: 'Seeking QR', color: 'bg-amber-500/10 text-amber-300 border-amber-500/20' };
    }
    return { status: 'locked', label: 'Locked', color: 'bg-slate-900 text-slate-500 border-slate-800' };
  };

  return (
    <div className="space-y-6">
      
      {/* Top Overview & Reset Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4" />
            Live Command & Anti-Cheat Telemetry
          </div>
          <h2 className="text-xl font-black text-white">
            Team Progress Matrix & Scan Logs
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Live cross-team synchronization and anti-cheat anomaly detection.
          </p>
        </div>

        <button
          id="btn-reset-hunt"
          type="button"
          onClick={handleReset}
          className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Hunt Competition
        </button>
      </div>

      {/* Team Progress Matrix Table */}
      <div className="glass-panel rounded-3xl p-6 overflow-x-auto">
        <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-400" />
          Squad Matrix
        </h3>

        <table className="w-full text-left text-xs font-mono border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 uppercase">
              <th className="pb-3 px-3">Squad</th>
              <th className="pb-3 px-3">Score</th>
              {stages.map((st) => (
                <th key={st.id} className="pb-3 px-3 text-center">
                  Stage {st.stageIndex + 1}
                </th>
              ))}
              <th className="pb-3 px-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {teams.map((team) => (
              <tr key={team.id} className="hover:bg-slate-900/40 transition-colors">
                <td className="py-3.5 px-3">
                  <div className="font-bold text-slate-200 text-sm font-sans">
                    {team.name}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    PASSCODE: {team.passCode} • {team.memberUids.length} Member(s)
                  </div>
                </td>

                <td className="py-3.5 px-3">
                  <span className="font-bold text-amber-400 text-sm">
                    {team.score} PTS
                  </span>
                </td>

                {stages.map((st) => {
                  const state = getStageStatus(team.id, st.id, st.stageIndex, team.currentStageIndex);
                  return (
                    <td key={st.id} className="py-3.5 px-3 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] border font-bold ${state.color}`}>
                        {state.label}
                      </span>
                    </td>
                  );
                })}

                <td className="py-3.5 px-3 text-right">
                  {team.completedAt ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1 justify-end">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Completed
                    </span>
                  ) : (
                    <span className="text-slate-400">
                      In Arena
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Anti-Cheat Scan Audit Log Feed */}
      <div className="glass-panel-glow rounded-3xl p-6 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Anti-Cheat Telemetry & Scan Audit Log
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Inspect physical scan validity and illegal sequence attempts
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {scanLogs.map((log) => (
            <div
              key={log.id}
              className={`p-3 rounded-2xl border text-xs font-mono flex items-start justify-between gap-3 ${
                log.isValid
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-950/30 border-red-500/40 text-red-300'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {log.isValid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold">
                    {log.isValid ? 'Valid Checkpoint Scan' : 'ANTI-CHEAT VIOLATION DETECTED'}
                  </div>
                  <div className="text-[11px] opacity-80 mt-0.5">
                    {log.reason}
                  </div>
                  <div className="text-[9px] text-slate-400 mt-1">
                    Team: {log.teamId} • Stage: {log.stageIndex + 1} • Nonce: {log.clientNonce.substring(0, 16)}...
                  </div>
                </div>
              </div>

              <div className="text-right text-[10px] text-slate-400 shrink-0">
                {new Date(log.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}

          {scanLogs.length === 0 && (
            <div className="text-center py-6 text-slate-500 font-mono text-xs">
              No scan events logged yet. Scans from the participant app will appear here in real-time.
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
