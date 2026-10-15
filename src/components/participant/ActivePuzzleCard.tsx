import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Stage, StageProgress } from '../../types';
import { HacksprintStore } from '../../lib/store';
import { 
  Lock, 
  Unlock, 
  MapPin, 
  CheckCircle2, 
  Send, 
  AlertCircle, 
  ShieldCheck, 
  Clock, 
  HelpCircle,
  ScanLine,
  Trophy
} from 'lucide-react';

interface ActivePuzzleCardProps {
  stage: Stage | undefined;
  teamId: string;
  progress: StageProgress | undefined;
  onOpenScanner: () => void;
  onSolved: () => void;
  totalStages: number;
}

export const ActivePuzzleCard: React.FC<ActivePuzzleCardProps> = ({
  stage,
  teamId,
  progress,
  onOpenScanner,
  onSolved,
  totalStages,
}) => {
  const [answerInput, setAnswerInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);

  if (!stage) {
    return (
      <div className="glass-panel rounded-3xl p-8 text-center my-6">
        <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-4 animate-bounce" />
        <h2 className="text-2xl font-black text-white tracking-wider mb-2">
          MISSION ACCOMPLISHED!
        </h2>
        <p className="text-sm text-slate-300 font-mono mb-4">
          Your squad has cleared all checkpoints in record time.
        </p>
        <span className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-mono font-bold">
          Check Leaderboard For Final Standings
        </span>
      </div>
    );
  }

  const isUnlocked = progress?.status === 'scanned_unlocked';
  const isSolved = progress?.status === 'solved';

  const triggerVictoryConfetti = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#06b6d4', '#f59e0b', '#8b5cf6']
      });
    } catch (e) {
      console.warn('Confetti error:', e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerInput.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await HacksprintStore.submitAnswer(teamId, stage.id, answerInput);
      if (res.success) {
        setSuccessMessage(`CORRECT! +${res.pointsAwarded || stage.points} PTS AWARDED`);
        triggerVictoryConfetti();
        setAnswerInput('');
        setTimeout(() => {
          onSolved();
          setSuccessMessage(null);
        }, 1500);
      } else {
        setErrorMessage(res.error || 'Incorrect answer. Try again!');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Submission error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 my-4">
      {/* 1. Physical Location Clue Card */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border-l-4 border-l-cyan-500">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider">
            <MapPin className="w-4 h-4" />
            Checkpoint Location Clue
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
            Stage {stage.stageIndex + 1} of {totalStages}
          </span>
        </div>
        <p className="text-sm text-slate-200 leading-relaxed font-medium">
          {stage.clue}
        </p>
        {stage.locationHint && (
          <div className="mt-2 text-[11px] text-slate-400 font-mono italic">
            Hint: {stage.locationHint}
          </div>
        )}
      </div>

      {/* 2. Checkpoint Status & Puzzle Engine */}
      {!isUnlocked && !isSolved ? (
        // Locked State: Must scan QR code
        <div className="glass-panel-glow rounded-3xl p-6 text-center space-y-4 border border-emerald-500/20 relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold uppercase tracking-widest">
              Physical Checkpoint Locked
            </span>
            <h3 className="text-lg font-black text-white mt-2">
              {stage.title}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Anti-cheat guard active. You must physically arrive at the location and scan the checkpoint QR code to reveal the digital puzzle.
            </p>
          </div>

          <button
            id="btn-open-scanner"
            type="button"
            onClick={onOpenScanner}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <ScanLine className="w-5 h-5" />
            Scan Checkpoint QR Code
          </button>
        </div>
      ) : isSolved ? (
        // Already Solved State
        <div className="glass-panel rounded-3xl p-6 text-center space-y-3 border border-emerald-500/40 bg-emerald-950/20">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">
            Stage {stage.stageIndex + 1} Cleared!
          </h3>
          <p className="text-xs text-slate-300 font-mono">
            +{stage.points} Points credited to squad score.
          </p>
        </div>
      ) : (
        // Unlocked State: Puzzle Active!
        <div className="glass-panel-glow rounded-3xl p-6 space-y-5 border border-emerald-500/40 relative">
          
          {/* Anti-cheat verification banner */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>SCAN VERIFIED: SESSION ACTIVE</span>
            </div>
            <span className="text-xs font-mono font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              +{stage.points} PTS
            </span>
          </div>

          {/* Puzzle Title & Description */}
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
              Active Challenge: Stage {stage.stageIndex + 1}
            </div>
            <h3 className="text-xl font-black text-white">
              {stage.title}
            </h3>
          </div>

          {/* Question Box */}
          <div className="bg-slate-950/90 rounded-2xl p-4 border border-slate-800 font-mono text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
            {stage.puzzleQuestion}
          </div>

          {/* Optional Hint toggle */}
          {stage.plainAnswerHint && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => setShowHint(!showHint)}
                className="text-[11px] text-slate-400 hover:text-emerald-400 font-mono inline-flex items-center gap-1"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                {showHint ? 'Hide Organizer Hint' : 'Show Hint (Practice Mode)'}
              </button>
              {showHint && (
                <div className="mt-1.5 text-xs text-emerald-400/90 bg-emerald-500/10 p-2 rounded-xl font-mono text-left">
                  Hint value: <span className="font-bold">{stage.plainAnswerHint}</span>
                </div>
              )}
            </div>
          )}

          {/* Answer Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label 
                htmlFor="input-puzzle-answer"
                className="block text-[11px] font-mono text-slate-300 font-semibold uppercase mb-1.5"
              >
                Enter Solution Key:
              </label>
              <input
                id="input-puzzle-answer"
                type="text"
                autoComplete="off"
                placeholder="Type your answer here..."
                value={answerInput}
                onChange={e => setAnswerInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-emerald-500 placeholder-slate-600 transition-colors"
              />
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div 
                id="puzzle-error-message"
                className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-start gap-2 animate-shake"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div 
                id="puzzle-success-message"
                className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold flex items-center gap-2 animate-fade-in"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}

            <button
              id="btn-submit-answer"
              type="submit"
              disabled={isSubmitting || !answerInput.trim()}
              className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Validating Hash...' : 'Submit Solution'}
            </button>
          </form>

          {/* Attempts counter */}
          {progress && progress.attempts > 0 && (
            <div className="text-center text-[10px] font-mono text-slate-500">
              Attempts logged: {progress.attempts} {progress.attempts >= 4 && '(Warning: Rate limit near)'}
            </div>
          )}

        </div>
      )}
    </div>
  );
};
