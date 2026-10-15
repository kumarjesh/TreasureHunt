import React, { useState } from 'react';
import { Stage, PuzzleType } from '../../types';
import { HacksprintStore } from '../../lib/store';
import { hashAnswer } from '../../lib/security';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Layers, 
  MapPin, 
  HelpCircle, 
  Key, 
  ShieldCheck 
} from 'lucide-react';

interface StageListEditorProps {
  stages: Stage[];
  onRefresh: () => void;
}

export const StageListEditor: React.FC<StageListEditorProps> = ({ stages, onRefresh }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingStageId, setEditingStageId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [clue, setClue] = useState('');
  const [puzzleQuestion, setPuzzleQuestion] = useState('');
  const [puzzleType, setPuzzleType] = useState<PuzzleType>('text');
  const [plainAnswer, setPlainAnswer] = useState('');
  const [points, setPoints] = useState('100');
  const [locationHint, setLocationHint] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const resetForm = () => {
    setTitle('');
    setClue('');
    setPuzzleQuestion('');
    setPuzzleType('text');
    setPlainAnswer('');
    setPoints('100');
    setLocationHint('');
    setIsCreating(false);
    setEditingStageId(null);
    setFormError('');
  };

  const handleStartEdit = (stage: Stage) => {
    setEditingStageId(stage.id);
    setIsCreating(true);
    setTitle(stage.title);
    setClue(stage.clue);
    setPuzzleQuestion(stage.puzzleQuestion);
    setPuzzleType(stage.puzzleType);
    setPlainAnswer(stage.plainAnswerHint || '');
    setPoints(stage.points.toString());
    setLocationHint(stage.locationHint || '');
  };

  const handleSaveStage = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim() || !clue.trim() || !puzzleQuestion.trim() || !plainAnswer.trim()) {
      setFormError('Please fill in all required fields.');
      return;
    }

    setIsSaving(true);
    try {
      const hashed = await hashAnswer(plainAnswer);
      const pointsNum = parseInt(points, 10) || 100;
      const secretToken = `HS_SEC_${Math.random().toString(36).substring(2, 8).toUpperCase()}_${Date.now().toString(36).substring(4)}`;

      if (editingStageId) {
        HacksprintStore.updateStage(editingStageId, {
          title: title.trim(),
          clue: clue.trim(),
          puzzleQuestion: puzzleQuestion.trim(),
          puzzleType,
          correctAnswerHash: hashed,
          plainAnswerHint: plainAnswer.trim(),
          points: pointsNum,
          locationHint: locationHint.trim() || undefined
        });
      } else {
        HacksprintStore.addStage({
          huntId: 'hunt-cyber-matrix',
          title: title.trim(),
          clue: clue.trim(),
          puzzleQuestion: puzzleQuestion.trim(),
          puzzleType,
          correctAnswerHash: hashed,
          plainAnswerHint: plainAnswer.trim(),
          qrSecretToken: secretToken,
          points: pointsNum,
          locationHint: locationHint.trim() || undefined
        });
      }

      resetForm();
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save stage');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (stageId: string) => {
    if (confirm('Are you sure you want to delete this stage? Subsequent stages will be re-indexed automatically.')) {
      HacksprintStore.deleteStage(stageId);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" />
            Stage Sequencing & Configuration
          </div>
          <h2 className="text-xl font-black text-white">
            Hunt Stages & Checkpoints ({stages.length})
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure checkpoint physical clues, digital puzzles, and SHA-256 validation keys.
          </p>
        </div>

        {!isCreating && (
          <button
            id="btn-create-stage"
            type="button"
            onClick={() => {
              resetForm();
              setIsCreating(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20"
          >
            <Plus className="w-4 h-4" />
            Add Checkpoint Stage
          </button>
        )}
      </div>

      {/* Create / Edit Form Modal */}
      {isCreating && (
        <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 border border-cyan-500/40 animate-fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
            <h3 className="text-base font-black text-white tracking-wide flex items-center gap-2">
              <Key className="w-5 h-5 text-cyan-400" />
              {editingStageId ? 'Edit Checkpoint Stage' : 'Design New Checkpoint Stage'}
            </h3>
            <button
              type="button"
              onClick={resetForm}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSaveStage} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-300 mb-1.5">
                  Stage Title *
                </label>
                <input
                  id="input-stage-title"
                  type="text"
                  placeholder="e.g. The Cryptographic Vault"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 placeholder-slate-600 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-slate-300 mb-1.5">
                    Points *
                  </label>
                  <input
                    id="input-stage-points"
                    type="number"
                    placeholder="100"
                    value={points}
                    onChange={e => setPoints(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-amber-400 font-mono font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-slate-300 mb-1.5">
                    Puzzle Type
                  </label>
                  <select
                    value={puzzleType}
                    onChange={e => setPuzzleType(e.target.value as PuzzleType)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  >
                    <option value="text">Text / Codeword</option>
                    <option value="number">Numeric Code</option>
                    <option value="choice">Multiple Choice</option>
                    <option value="code">Source Code</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase text-slate-300 mb-1.5">
                Physical Location Clue (Where to find the QR code) *
              </label>
              <textarea
                id="input-stage-clue"
                rows={2}
                placeholder="Describe physical landmarks, floor number, room or object where QR code is hidden..."
                value={clue}
                onChange={e => setClue(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 placeholder-slate-600 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase text-slate-300 mb-1.5">
                Digital Challenge / Puzzle Question *
              </label>
              <textarea
                id="input-stage-question"
                rows={3}
                placeholder="The riddle, cipher, binary challenge, or question displayed once QR code is scanned..."
                value={puzzleQuestion}
                onChange={e => setPuzzleQuestion(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 placeholder-slate-600 font-mono"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-300 mb-1.5">
                  Correct Answer (Plain Text Key) *
                </label>
                <input
                  id="input-stage-answer"
                  type="text"
                  placeholder="e.g. SPRINT (Auto-hashes with SHA-256)"
                  value={plainAnswer}
                  onChange={e => setPlainAnswer(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-emerald-400 focus:outline-none focus:border-cyan-500 placeholder-slate-600"
                />
                <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                  Normalized & securely hashed before storage
                </span>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-300 mb-1.5">
                  Optional Location Hint
                </label>
                <input
                  id="input-stage-hint"
                  type="text"
                  placeholder="e.g. Behind the whiteboard"
                  value={locationHint}
                  onChange={e => setLocationHint(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 placeholder-slate-600 font-medium"
                />
              </div>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
                {formError}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-xl text-xs font-mono text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                id="btn-save-stage-submit"
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition-all"
              >
                <Check className="w-4 h-4" />
                {isSaving ? 'Encrypting & Saving...' : 'Save Stage'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stages List */}
      <div className="space-y-3">
        {stages.map((stage) => (
          <div
            key={stage.id}
            id={`stage-card-${stage.stageIndex}`}
            className="glass-panel rounded-2xl p-5 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono font-bold text-xs flex items-center justify-center">
                  #{stage.stageIndex + 1}
                </span>
                <h4 className="text-base font-bold text-white truncate">
                  {stage.title}
                </h4>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                  +{stage.points} PTS
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {stage.puzzleType.toUpperCase()}
                </span>
              </div>

              <div className="text-xs text-slate-300 flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span className="line-clamp-1">{stage.clue}</span>
              </div>

              <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
                <span>Secret Nonce: <code className="text-slate-300">{stage.qrSecretToken}</code></span>
                <span>Expected Key: <code className="text-emerald-400 font-bold">{stage.plainAnswerHint || 'Hashed'}</code></span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleStartEdit(stage)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
                title="Edit Stage"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(stage.id)}
                className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors border border-red-500/20"
                title="Delete Stage"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {stages.length === 0 && (
          <div className="glass-panel rounded-2xl p-8 text-center text-slate-400 font-mono text-xs">
            No stages created yet. Click "Add Checkpoint Stage" to build your treasure hunt.
          </div>
        )}
      </div>

    </div>
  );
};
