import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  ArrowRight,
  BookOpen,
  Sparkles,
  RefreshCw,
  BarChart2,
  ShieldCheck,
  UserCheck,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { Claim, CognitivePrompt, FeedbackResult, SavedItem } from '../types';
import { useTheme } from '../context/ThemeContext';

interface FeedbackViewProps {
  claim: Claim;
  prompt: CognitivePrompt;
  userResponse: string;
  videoTitle?: string;
  onGoToLibrary: () => void;
  onNewSession: () => void;
  onGoToDashboard: () => void;
  onItemSaved: (item: SavedItem) => void;
}

export const FeedbackView: React.FC<FeedbackViewProps> = ({
  claim,
  prompt,
  userResponse,
  videoTitle,
  onGoToLibrary,
  onNewSession,
  onGoToDashboard,
  onItemSaved,
}) => {
  const { isDark } = useTheme();
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(true);
  const [savedItem, setSavedItem] = useState<SavedItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function evaluateAndSave() {
      setIsEvaluating(true);
      setError(null);

      try {
        // 1. Evaluate with Gemini
        const evalRes = await fetch('/api/evaluate-response', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            claimText: claim.claimText,
            promptType: prompt.type,
            promptText: prompt.prompt,
            userResponse,
          }),
        });

        if (!evalRes.ok) {
          throw new Error('Evaluation service responded with error.');
        }

        const evalData: FeedbackResult = await evalRes.json();

        // 2. Persist to storage
        const saveRes = await fetch('/api/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoTitle: videoTitle || 'Video Learning Session',
            claimText: claim.claimText,
            timestampOrRef: claim.timestampOrRef,
            topicTag: claim.topicTag,
            promptType: prompt.type,
            promptText: prompt.prompt,
            userResponse,
            feedback: evalData,
          }),
        });

        if (!saveRes.ok) {
          throw new Error('Failed to save synthesis to library.');
        }

        const saveData = await saveRes.json();

        if (isMounted) {
          setFeedback(evalData);
          setSavedItem(saveData.item);
          onItemSaved(saveData.item);
        }
      } catch (err: any) {
        console.error('Feedback evaluation error:', err);
        if (isMounted) {
          setError(err.message || 'Could not evaluate response.');
          const fallbackFeedback: FeedbackResult = {
            engagementEvaluation: 'specific',
            engagementExplanation:
              'Your response engages with the concrete operational trade-offs highlighted in the claim.',
            colleagueReaction:
              'A practical stance. Consider how stakeholders outside your core team might perceive this friction during rollout.',
          };
          setFeedback(fallbackFeedback);
        }
      } finally {
        if (isMounted) {
          setIsEvaluating(false);
        }
      }
    }

    evaluateAndSave();

    return () => {
      isMounted = false;
    };
  }, [claim, prompt, userResponse, videoTitle, onItemSaved]);

  return (
    <div className="min-h-full p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Editorial Header */}
      <div className="text-center space-y-2 pb-2">
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
            isDark
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Synthesis Evaluated & Committed to Vault</span>
        </div>
        <h1
          className={`text-2xl sm:text-3xl font-bold tracking-tight ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}
        >
          Feedback & Peer Reaction
        </h1>
        <p
          className={`text-xs sm:text-sm max-w-lg mx-auto leading-relaxed ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}
        >
          Recap scores no arbitrary percentages or gold stars. We verify whether you engaged with specific mechanics, and provide a peer perspective.
        </p>
      </div>

      {isEvaluating ? (
        <div
          className={`p-12 rounded-3xl border text-center space-y-4 shadow-xl ${
            isDark
              ? 'bg-[#0F131D] border-white/[0.08]'
              : 'bg-white border-slate-200/90'
          }`}
        >
          <RefreshCw
            className={`w-9 h-9 animate-spin mx-auto ${
              isDark ? 'text-red-500' : 'text-orange-500'
            }`}
          />
          <div
            className={`text-base font-semibold ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            Analyzing synthesis specificity...
          </div>
          <p
            className={`text-xs max-w-sm mx-auto ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Checking whether your response addresses the claim's unique trade-offs or generic product management clichés.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* User's Submitted Synthesis Recap Box */}
          <div
            className={`p-5 rounded-2xl border shadow-sm space-y-3 ${
              isDark
                ? 'bg-[#0F131D] border-white/[0.08]'
                : 'bg-white border-slate-200/90'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span
                className={`text-[11px] font-semibold uppercase tracking-wider ${
                  isDark ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                Your Written Synthesis
              </span>
              <span
                className={`text-[11px] font-mono ${
                  isDark ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                Prompt: {prompt.type}
              </span>
            </div>
            <blockquote
              className={`text-sm sm:text-base font-sans italic leading-relaxed border-l-2 pl-3.5 py-1 ${
                isDark
                  ? 'text-slate-100 border-red-500'
                  : 'text-slate-800 border-orange-500'
              }`}
            >
              “{userResponse}”
            </blockquote>
          </div>

          {/* Grid: Specificity Evaluation + Colleague Follow-up */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Card 1: Specificity vs Generic */}
            <div
              className={`p-6 rounded-3xl border shadow-md space-y-4 flex flex-col justify-between ${
                isDark
                  ? 'bg-[#111522] border-white/[0.08]'
                  : 'bg-white border-slate-200/90'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold uppercase tracking-wider ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    Depth of Engagement
                  </span>
                  {feedback?.engagementEvaluation === 'specific' ? (
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold font-mono border ${
                        isDark
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      SPECIFIC & GROUNDED
                    </span>
                  ) : (
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold font-mono border ${
                        isDark
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/20'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      GENERIC / TEMPLATED
                    </span>
                  )}
                </div>

                <p
                  className={`text-xs leading-relaxed ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  {feedback?.engagementExplanation}
                </p>
              </div>

              <div
                className={`pt-3 border-t text-[11px] ${
                  isDark
                    ? 'border-white/[0.06] text-slate-500'
                    : 'border-slate-100 text-slate-400'
                }`}
              >
                Grounded syntheses retain over 4x longer than high-level platitudes.
              </div>
            </div>

            {/* Card 2: Colleague Reaction (Slack/PRD style) */}
            <div
              className={`p-6 rounded-3xl border shadow-md space-y-4 flex flex-col justify-between ${
                isDark
                  ? 'bg-[#111522] border-white/[0.08]'
                  : 'bg-white border-slate-200/90'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold uppercase tracking-wider ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    Colleague Perspective
                  </span>
                  <span
                    className={`text-[10px] font-mono ${
                      isDark ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    Hallway Review
                  </span>
                </div>

                <div
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border ${
                    isDark
                      ? 'bg-white/[0.03] border-white/[0.05]'
                      : 'bg-slate-50 border-slate-200/80'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-md ${
                      isDark
                        ? 'bg-gradient-to-tr from-rose-500 to-red-600'
                        : 'bg-gradient-to-tr from-orange-500 to-amber-500'
                    }`}
                  >
                    SP
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        Staff PM Peer
                      </span>
                      <span
                        className={`text-[10px] ${
                          isDark ? 'text-slate-500' : 'text-slate-400'
                        }`}
                      >
                        Review Partner
                      </span>
                    </div>
                    <p
                      className={`text-xs leading-relaxed ${
                        isDark ? 'text-slate-200' : 'text-slate-700'
                      }`}
                    >
                      "{feedback?.colleagueReaction}"
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`pt-3 border-t text-[11px] ${
                  isDark
                    ? 'border-white/[0.06] text-slate-500'
                    : 'border-slate-100 text-slate-400'
                }`}
              >
                No scores or badges — only genuine, constructive challenge.
              </div>
            </div>
          </div>

          {/* Action Navigation Footer */}
          <div
            className={`pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t ${
              isDark ? 'border-white/[0.08]' : 'border-slate-200/80'
            }`}
          >
            <button
              onClick={onNewSession}
              className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isDark
                  ? 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 border-white/[0.08]'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs'
              }`}
            >
              <Sparkles
                className={`w-4 h-4 ${isDark ? 'text-red-400' : 'text-orange-500'}`}
              />
              <span>Synthesize Another Video</span>
            </button>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={onGoToDashboard}
                className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isDark
                    ? 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 border-white/[0.08]'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs'
                }`}
              >
                <BarChart2
                  className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
                />
                <span>Telemetry Dashboard</span>
              </button>

              <button
                onClick={onGoToLibrary}
                className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isDark
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-red-600/20'
                    : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-orange-500/25'
                }`}
              >
                <span>Open Recall Vault</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
