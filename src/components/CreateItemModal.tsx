import React, { useState } from 'react';
import { X, Plus, Sparkles, Film, Clock, Tag, RefreshCw, CheckCircle2, BookOpen } from 'lucide-react';
import { SavedItem, CognitivePromptType } from '../types';
import { useTheme } from '../context/ThemeContext';

interface CreateItemModalProps {
  onClose: () => void;
  onItemCreated: (newItem: SavedItem) => void;
}

export const CreateItemModal: React.FC<CreateItemModalProps> = ({
  onClose,
  onItemCreated,
}) => {
  const { isDark } = useTheme();
  const [videoTitle, setVideoTitle] = useState('');
  const [claimText, setClaimText] = useState('');
  const [timestampOrRef, setTimestampOrRef] = useState('');
  const [topicTag, setTopicTag] = useState('');
  const [promptType, setPromptType] = useState<CognitivePromptType>('Apply');
  const [promptText, setPromptText] = useState(
    'How will you apply this specific concept to your current roadmap or analytical model in the next 14 days?'
  );
  const [userResponse, setUserResponse] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update suggested prompt question when promptType changes
  const handlePromptTypeChange = (type: CognitivePromptType) => {
    setPromptType(type);
    switch (type) {
      case 'Decide':
        setPromptText('What is the counter-argument to this claim, and under what condition would adopting it be a mistake?');
        break;
      case 'Apply':
        setPromptText('How will you apply this specific concept to your current roadmap or analytical model in the next 14 days?');
        break;
      case 'Remember':
        setPromptText('What is the single underlying mechanism that makes this claim work in practice?');
        break;
      case 'Build':
        setPromptText('Sketch a 3-bullet implementation test: (1) Hypothesis, (2) Canary Metric, (3) Rollback Trigger.');
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimText.trim()) {
      setError('Please provide the source claim or core insight.');
      return;
    }
    if (!userResponse.trim()) {
      setError('Please write your original synthesis (at least 2 sentences).');
      return;
    }

    setIsSaving(true);
    setError(null);

    const payload = {
      videoTitle: videoTitle.trim() || 'Manual Learning Session',
      claimText: claimText.trim(),
      timestampOrRef: timestampOrRef.trim() || 'Manual Entry',
      topicTag: topicTag.trim() || 'Product Strategy',
      promptType,
      promptText: promptText.trim() || 'What is your original take on this claim?',
      userResponse: userResponse.trim(),
      feedback: {
        colleagueReaction:
          'Manual session committed directly to vault. Active recall loop primed for resurfacing in 3+ days.',
        followUpChallenge:
          'Consider what counter-metric might degrade if you over-index on this synthesis.',
      },
    };

    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to create recall session.');
      }

      const data = await res.json();
      if (data.item) {
        onItemCreated(data.item);
        onClose();
      }
    } catch (err: any) {
      console.error('Error saving manual item:', err);
      setError(err.message || 'Failed to save synthesis to vault.');
    } finally {
      setIsSaving(false);
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
            <Plus className="w-3 h-3" />
            <span>Create Session / Synthesis</span>
          </div>
          <h2
            className={`text-xl sm:text-2xl font-bold tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            Add New Recall Session
          </h2>
          <p
            className={`text-xs mt-0.5 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Directly log a key claim and your original thinking into your vault without waiting for video extraction.
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Video Title */}
          <div>
            <label
              className={`block text-xs font-semibold mb-1 flex items-center gap-1.5 ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              <Film className="w-3.5 h-3.5 text-orange-500" />
              <span>Video / Source Title</span>
            </label>
            <input
              type="text"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              placeholder="e.g. Shreyas Doshi: High Agency Product Leadership"
              className={`w-full px-3.5 py-2 rounded-xl border text-xs transition-colors ${
                isDark
                  ? 'bg-black/40 border-white/[0.08] text-slate-100 placeholder-slate-600 focus:border-red-500'
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-orange-500 shadow-2xs'
              }`}
            />
          </div>

          {/* Source Claim */}
          <div>
            <label
              className={`block text-xs font-semibold mb-1 ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              Core Claim / Key Takeaway *
            </label>
            <textarea
              rows={2}
              value={claimText}
              onChange={(e) => setClaimText(e.target.value)}
              placeholder="The provocative or foundational statement from the speaker..."
              className={`w-full px-3.5 py-2 rounded-xl border text-xs transition-colors resize-y ${
                isDark
                  ? 'bg-black/40 border-white/[0.08] text-slate-100 placeholder-slate-600 focus:border-red-500'
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-orange-500 shadow-2xs'
              }`}
              required
            />
          </div>

          {/* Timestamp, Tag, Prompt Type */}
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
                placeholder="e.g. 14:20"
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
                placeholder="e.g. Strategy, Growth"
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
                Prompt Mode
              </label>
              <select
                value={promptType}
                onChange={(e) => handlePromptTypeChange(e.target.value as CognitivePromptType)}
                className={`w-full px-3 py-2 rounded-xl border text-xs transition-colors ${
                  isDark
                    ? 'bg-black/60 border-white/[0.08] text-slate-100 focus:border-red-500'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-orange-500 shadow-2xs'
                }`}
              >
                <option value="Decide">Decide (Trade-offs)</option>
                <option value="Apply">Apply (Next 14 Days)</option>
                <option value="Remember">Remember (Mechanism)</option>
                <option value="Build">Build (Test Sketch)</option>
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
              Reflection Prompt
            </label>
            <input
              type="text"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              className={`w-full px-3.5 py-2 rounded-xl border text-xs transition-colors ${
                isDark
                  ? 'bg-black/40 border-white/[0.08] text-slate-100 placeholder-slate-600 focus:border-red-500'
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-orange-500 shadow-2xs'
              }`}
            />
          </div>

          {/* User Written Synthesis */}
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
              placeholder="Commit at least 2 sentences of original thinking. How will you use or challenge this?"
              className={`w-full px-3.5 py-2 rounded-xl border text-xs transition-colors resize-y ${
                isDark
                  ? 'bg-black/40 border-white/[0.08] text-slate-100 placeholder-slate-600 focus:border-red-500'
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-orange-500 shadow-2xs'
              }`}
              required
            />
          </div>

          {/* Footer Actions */}
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
              id="submit-manual-session-btn"
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
                  <span>Saving to Vault...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save to Vault</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
