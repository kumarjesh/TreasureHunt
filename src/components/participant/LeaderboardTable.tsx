import React, { useEffect, useState } from 'react';
import { LeaderboardEntry } from '../../types';
import { HacksprintStore } from '../../lib/store';
import { Trophy, Medal, Award, Flame, CheckCircle, Radio } from 'lucide-react';

interface LeaderboardTableProps {
  currentTeamId?: string;
  totalStages: number;
}

export const LeaderboardTable: React.FC<LeaderboardTableProps> = ({ currentTeamId, totalStages }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const update = () => {
      setEntries(HacksprintStore.getLeaderboard());
    };
    update();
    const unsubscribe = HacksprintStore.subscribe(update);
    return unsubscribe;
  }, []);

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-black text-xs">
          <Trophy className="w-4 h-4 fill-amber-400/20" />
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-7 h-7 rounded-lg bg-slate-300/20 text-slate-200 border border-slate-300/40 flex items-center justify-center font-black text-xs">
          <Medal className="w-4 h-4" />
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-7 h-7 rounded-lg bg-amber-700/20 text-amber-600 border border-amber-700/40 flex items-center justify-center font-black text-xs">
          <Award className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center font-mono text-xs font-bold">
        #{rank}
      </div>
    );
  };

  return (
    <div className="glass-panel-glow rounded-3xl p-4 sm:p-6 my-4 border border-slate-800">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white tracking-wide">
              LIVE LEADERBOARD
            </h3>
            <p className="text-[10px] font-mono text-slate-400 uppercase">
              Real-time Firestore Snapshot
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-400">
          <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
          <span>SYNC ACTIVE</span>
        </div>
      </div>

      {/* Leaderboard rows */}
      <div className="space-y-2">
        {entries.map((entry) => {
          const isMyTeam = entry.teamId === currentTeamId;
          const isFinished = entry.completedAt !== undefined;

          return (
            <div
              key={entry.teamId}
              id={`leaderboard-row-${entry.rank}`}
              className={`p-3.5 rounded-2xl flex items-center justify-between transition-all ${
                isMyTeam
                  ? 'bg-emerald-950/40 border-2 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-900/60 border border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Rank & Team Name */}
              <div className="flex items-center gap-3 min-w-0">
                {getRankBadge(entry.rank)}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-100 truncate">
                      {entry.teamName}
                    </span>
                    {isMyTeam && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500 text-slate-950">
                        YOU
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono text-slate-400">
                    <span>
                      Cleared: {entry.solvedCount}/{totalStages}
                    </span>
                    {isFinished && (
                      <span className="text-emerald-400 flex items-center gap-0.5">
                        <CheckCircle className="w-3 h-3" />
                        Finished
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Score pill */}
              <div className="text-right shrink-0">
                <div className="flex items-center gap-1 justify-end font-mono font-black text-base text-amber-400">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>{entry.score}</span>
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  POINTS
                </div>
              </div>

            </div>
          );
        })}

        {entries.length === 0 && (
          <div className="text-center py-8 text-slate-500 font-mono text-xs">
            No squads registered yet.
          </div>
        )}
      </div>

    </div>
  );
};
