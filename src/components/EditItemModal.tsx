import React, { useState } from 'react';
import { X, Save, Trash2, Edit3, Film, Clock, Tag, RefreshCw, CheckCircle2 } from 'lucide-react';
import { SavedItem, CognitivePromptType } from '../types';
import { useTheme } from '../context/ThemeContext';

interface EditItemModalProps {
  item: SavedItem;
  onClose: () => void;
  onUpdateItem: (itemId: string, updatedFields: Partial<SavedItem>) => Promise<void>;
  onDeleteRevisit?: (itemId: string, revisitId: string) => Promise<void>;
}

export const EditItemModal: React.FC<EditItemModalProps> = ({
  item,
  onClose,
  onUpdateItem,
  onDeleteRevisit,
}) => {
  const { isDark } = useTheme();
  const [videoTitle, setVideoTitle] = useState(item.videoTitle || '');
  const [claimText, setClaimText] = useState(item.claimText || '');
  const [timestampOrRef, setTimestampOrRef] = useState(item.timestampOrRef || '');
  const [topicTag, setTopicTag] = useState(item.topicTag || '');
  const [promptType, setPromptType] = useState<CognitivePromptType>(item.promptType || 'Decide');
  const [promptText, setPromptText] = useState(item.promptText || '');
  const [userResponse, setUserResponse] = useState(item.userResponse || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimText.trim() || !userResponse.trim()) {
      setError('Source claim and your written synthesis are required.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onUpdateItem(item.id, {
        videoTitle: videoTitle.trim() || 'Video Learning Session',
        claimText: claimText.trim(),
        timestampOrRef: timestampOrRef.trim() || 'Reference',
        topicTag: topicTag.trim() || 'Product Strategy',
        promptType,
        promptText: promptText.trim(),
        userResponse: userResponse.trim(),
      });
      setSaveSuccess(true);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      console.error('Failed to update item:', err);
      setError(err.message || 'Failed to update synthesis.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRevisitLog = async (revisitId: string) => {
    if (!onDeleteRevisit) return;
    if (confirm('Delete this revisit activity record?')) {
      try {
        await onDeleteRevisit(item.id, revisitId);
      } catch (err) {
        console.error('Failed to delete revisit:', err);
      }
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-150 ${
        isDark ? 'bg-black/80' : 'bg-slate-900/60'
      }`}
    >
      <div
        className={`border rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl overflow-y-auto max-h-[90vh] relative ${
          isDark
            ? 'bg-[#0F131D] border-white/[0.12] text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
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

        {/* Header */}
        <div className="mb-5 pr-8">
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-mono font-medium mb-1.5 border ${
              isDark
                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                : 'bg-orange-50 text-orange-700 border-orange-200 font-semibold'
            }`}
          >
            <Edit3 className="w-3 h-3" />
            <span>Edit Recall Synthesis</span>
          </div>
          <h2
            className={`text-xl sm:text-2xl font-bold tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            Update Artifact Details
          </h2>
          <p
            className={`text-xs mt-0.5 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Modify the source claim, metadata, or refine your written synthesis.
          </p>
        </div>

        {error && (
          <div
            className={`p-3 rounded-xl border text-xs mb-4 ${
              isDark
                ? 'bg-red-500/10 border-red-500/30 text-red-300'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            {error}
          </div>
        )}

        {saveSuccess ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <div className="text-base font-semibold">Changes Saved!</div>
            <p className="text-xs text-slate-400">
              The artifact in your vault has been updated.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Video Title */}
            <div>
              <label
                className={`block text-xs font-semibold mb-1 flex items-center gap-1.5 ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                <Film className="w-3.5 h-3.5 text-orange-500" />
                <span>Video / Talk Title</span>
              </label>
              <input
                type="text"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="e.g. Elena Verna: Product-Led Growth"
                className={`w-full px-3.5 py-2 rounded-xl border text-xs transition-colors ${
                  isDark
                    ? 'bg-black/40 border-white/[0.08] text-slate-100 placeholder-slate-600 focus:border-red-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-orange-500 shadow-2xs'
                }`}
              />
            </div>

            {/* Claim Text */}
            <div>
              <label
                className={`block text-xs font-semibold mb-1 ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                Source Claim / Key Takeaway *
              </label>
              <textarea
                rows={3}
                value={claimText}
                onChange={(e) => setClaimText(e.target.value)}
                placeholder="The exact claim or thesis from the video..."
                className={`w-full px-3.5 py-2 rounded-xl border text-xs transition-colors resize-y ${
                  isDark
                    ? 'bg-black/40 border-white/[0.08] text-slate-100 placeholder-slate-600 focus:border-red-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-orange-500 shadow-2xs'
                }`}
                required
              />
            </div>

            {/* Row: Timestamp, Topic Tag, Prompt Type */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label
                  className={`block text-xs font-semibold mb-1 flex items-center gap-1.5 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>Timestamp / Ref</span>
                </label>
                <input
                  type="text"
                  value={timestampOrRef}
                  onChange={(e) => setTimestampOrRef(e.target.value)}
                  placeholder="e.g. 08:42"
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-mono transition-colors ${
                    isDark
                      ? 'bg-black/40 border-white/[0.08] text-slate-100 placeholder-slate-600 focus:border-red-500'
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-orange-500 shadow-2xs'
                  }`}
                />
              </div>

              <div>
                <label
                  className={`block text-xs font-semibold mb-1 flex items-center gap-1.5 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  <Tag className="w-3 h-3 text-slate-400" />
                  <span>Topic Tag</span>
                </label>
                <input
                  type="text"
                  value={topicTag}
                  onChange={(e) => setTopicTag(e.target.value)}
                  placeholder="e.g. Growth & Paywalls"
                  className={`w-full px-3 py-2 rounded-xl border text-xs transition-colors ${
                    isDark
                      ? 'bg-black/40 border-white/[0.08] text-slate-100 placeholder-slate-600 focus:border-red-500'
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-orange-500 shadow-2xs'
                  }`}
                />
              </div>

              <div>
                <label
                  className={`block text-xs font-semibold mb-1 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  Prompt Type
                </label>
                <select
                  value={promptType}
                  onChange={(e) => setPromptType(e.target.value as CognitivePromptType)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs transition-colors ${
                    isDark
                      ? 'bg-black/60 border-white/[0.08] text-slate-100 focus:border-red-500'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-orange-500 shadow-2xs'
                  }`}
                >
                  <option value="Decide">Decide (Trade-offs)</option>
                  <option value="Apply">Apply (Real project)</option>
                  <option value="Remember">Remember (Recall mechanism)</option>
                  <option value="Build">Build (3-bullet sketch)</option>
                </select>
              </div>
            </div>

            {/* Prompt Question */}
            <div>
              <label
                className={`block text-xs font-semibold mb-1 ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                Cognitive Prompt Question
              </label>
              <input
                type="text"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="The question forcing original thinking..."
                className={`w-full px-3.5 py-2 rounded-xl border text-xs transition-colors ${
                  isDark
                    ? 'bg-black/40 border-white/[0.08] text-slate-100 placeholder-slate-600 focus:border-red-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-orange-500 shadow-2xs'
                }`}
              />
            </div>

            {/* User Written Response */}
            <div>
              <label
                className={`block text-xs font-semibold mb-1 ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                Your Written Synthesis / Original Thinking *
              </label>
              <textarea
                rows={4}
                value={userResponse}
                onChange={(e) => setUserResponse(e.target.value)}
                placeholder="Your original analysis, decision, or concrete application..."
                className={`w-full px-3.5 py-2 rounded-xl border text-xs transition-colors resize-y ${
                  isDark
                    ? 'bg-black/40 border-white/[0.08] text-slate-100 placeholder-slate-600 focus:border-red-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-orange-500 shadow-2xs'
                }`}
                required
              />
            </div>

            {/* Revisit Logs Management (if any exist) */}
            {item.revisits && item.revisits.length > 0 && (
              <div
                className={`p-3 rounded-2xl border space-y-2 ${
                  isDark
                    ? 'bg-white/[0.02] border-white/[0.06]'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Associated Revisit Logs ({item.revisits.length})
                </div>
                <div className="space-y-2">
                  {item.revisits.map((rev) => (
                    <div
                      key={rev.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                        isDark
                          ? 'bg-black/30 border-white/[0.06]'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-mono text-[10px] text-slate-500">
                          {rev.usedSince ? '✓ Applied in practice' : '○ Not applied yet'}
                        </div>
                        {rev.changedThoughts && (
                          <div className="text-xs italic truncate mt-0.5">
                            "{rev.changedThoughts}"
                          </div>
                        )}
                      </div>
                      {onDeleteRevisit && (
                        <button
                          type="button"
                          onClick={() => handleDeleteRevisitLog(rev.id)}
                          className={`p-1.5 rounded-lg text-slate-400 hover:text-red-500 transition-colors cursor-pointer`}
                          title="Delete revisit log"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3">
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
                id="save-edited-item-btn"
                disabled={isSaving}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow-md transition-all cursor-pointer ${
                  isDark
                    ? 'bg-red-600 hover:bg-red-500 shadow-red-600/25'
                    : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/25'
                }`}
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
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
