import React, { useState } from 'react';
import { X, Clock, Tag, RefreshCw, Send, CheckCircle2, RotateCcw, Check, ThumbsUp, ThumbsDown } from 'lucide-react';
import { SavedItem } from '../types';
import { useTheme } from '../context/ThemeContext';

interface ResurfaceModalProps {
  item: SavedItem;
  onClose: () => void;
  onSaveRevisit: (itemId: string, usedSince: boolean, changedThoughts: string) => Promise<void>;
}

export const ResurfaceModal: React.FC<ResurfaceModalProps> = ({
  item,
  onClose,
  onSaveRevisit,
}) => {
  const { isDark } = useTheme();
  const [usedSince, setUsedSince] = useState<boolean | null>(null);
  const [changedThoughts, setChangedThoughts] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Calculate days since saved
  const daysAgo = Math.max(
    0,
    Math.floor((Date.now() - (item.createdAt || Date.now())) / (1000 * 60 * 60 * 24))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usedSince === null) return;

    setIsSubmitting(true);
    try {
      await onSaveRevisit(item.id, usedSince, changedThoughts.trim());
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to log revisit:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-150 ${
        isDark ? 'bg-black/80' : 'bg-slate-900/60'
      }`}
    >
      <div
        className={`border rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl overflow-hidden relative ${
          isDark
            ? 'bg-[#0F131D] border-white/[0.12]'
            : 'bg-white border-slate-200'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-5 right-5 p-1.5 rounded-xl transition-colors cursor-pointer ${
            isDark
              ? 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
          }`}
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="mb-5 pr-8">
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-mono font-medium mb-2 border ${
              isDark
                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                : 'bg-orange-50 text-orange-700 border-orange-200 font-semibold'
            }`}
          >
            <RotateCcw className="w-3 h-3" />
            <span>Resurfaced after {daysAgo === 0 ? 'today' : `${daysAgo} day${daysAgo === 1 ? '' : 's'}`}</span>
          </div>
          <h2
            className={`text-xl sm:text-2xl font-bold tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            Has this synthesis held up in practice?
          </h2>
          <p
            className={`text-xs mt-1 leading-relaxed ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            Active recall requires evaluating whether your past thinking informed real decisions or if your perspective evolved.
          </p>
        </div>

        {/* Original Synthesis Context Card */}
        <div
          className={`border rounded-2xl p-4 sm:p-5 mb-5 space-y-3 ${
            isDark
              ? 'bg-[#090C12] border-white/[0.08] shadow-inner'
              : 'bg-slate-50/80 border-slate-200/90'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span
              className={`font-mono text-[10px] px-2 py-0.5 rounded ${
                isDark
                  ? 'bg-white/[0.06] text-slate-300'
                  : 'bg-white text-slate-600 border border-slate-200 font-medium'
              }`}
            >
              {item.timestampOrRef}
            </span>
            <span
              className={`font-medium text-[11px] ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Prompt: {item.promptType}
            </span>
          </div>

          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Source Claim
            </div>
            <p
              className={`font-serif text-sm sm:text-base leading-snug italic ${
                isDark ? 'text-slate-200' : 'text-slate-800'
              }`}
            >
              “{item.claimText}”
            </p>
          </div>

          <div
            className={`pt-2 border-t ${
              isDark ? 'border-white/[0.06]' : 'border-slate-200'
            }`}
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Your Written Response
            </div>
            <p
              className={`text-xs sm:text-sm italic leading-relaxed p-3 rounded-xl border ${
                isDark
                  ? 'text-slate-100 bg-white/[0.02] border-white/[0.04]'
                  : 'text-slate-900 bg-white border-slate-200/80 shadow-2xs'
              }`}
            >
              “{item.userResponse}”
            </p>
          </div>
        </div>

        {/* Revisit Reflection Form */}
        {success ? (
          <div className="py-6 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <div
              className={`text-sm font-semibold ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Revisit Logged Successfully!
            </div>
            <p
              className={`text-xs ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              Your Revisit Rate on the Dashboard has been updated.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Question 1: Used since? */}
            <div>
              <label
                className={`block text-xs font-semibold mb-2 ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                1. Have you used or referenced this idea in your work since watching?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  id="revisit-used-yes"
                  onClick={() => setUsedSince(true)}
                  className={`py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                    usedSince === true
                      ? isDark
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-400 font-bold shadow-2xs'
                      : isDark
                      ? 'bg-white/[0.03] text-slate-400 border-white/[0.06] hover:bg-white/[0.06] hover:text-white'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Yes, applied it</span>
                </button>

                <button
                  type="button"
                  id="revisit-used-no"
                  onClick={() => setUsedSince(false)}
                  className={`py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                    usedSince === false
                      ? isDark
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                        : 'bg-amber-50 text-amber-800 border-amber-400 font-bold shadow-2xs'
                      : isDark
                      ? 'bg-white/[0.03] text-slate-400 border-white/[0.06] hover:bg-white/[0.06] hover:text-white'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                  <span>No, not yet</span>
                </button>
              </div>
            </div>

            {/* Question 2: Has your thinking changed? */}
            <div>
              <label
                className={`block text-xs font-semibold mb-1.5 ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                2. Has your thinking changed or evolved? (Optional)
              </label>
              <textarea
                rows={3}
                value={changedThoughts}
                onChange={(e) => setChangedThoughts(e.target.value)}
                placeholder="What new nuance or outcome emerged when testing this in the real world?"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs transition-colors resize-y ${
                  isDark
                    ? 'bg-black/40 border-white/[0.08] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-red-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 shadow-2xs'
                }`}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                  isDark
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                id="submit-revisit-btn"
                disabled={usedSince === null || isSubmitting}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
                  usedSince === null || isSubmitting
                    ? isDark
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : isDark
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-600/25'
                    : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/25'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>Log Revisit & Update Telemetry</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
