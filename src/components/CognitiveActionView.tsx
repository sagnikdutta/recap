import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Send,
  Sparkles,
  Scale,
  Wrench,
  Brain,
  Layers,
  AlertCircle,
  Clock,
  Tag,
  CheckCircle2,
  RefreshCw,
  Flame,
  Info,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { Claim, CognitivePrompt, CognitivePromptType } from '../types';
import { useTheme } from '../context/ThemeContext';

interface CognitiveActionViewProps {
  claim: Claim;
  videoTitle?: string;
  onBack: () => void;
  onSubmitResponse: (
    claim: Claim,
    prompt: CognitivePrompt,
    userResponse: string,
    videoTitle?: string
  ) => void;
}

const TYPE_THEME: Record<
  CognitivePromptType,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    badgeBgDark: string;
    badgeTextDark: string;
    badgeBgLight: string;
    badgeTextLight: string;
    borderColorDark: string;
    borderColorLight: string;
    glowDark: string;
    glowLight: string;
    hint: string;
  }
> = {
  Decide: {
    label: 'Decide',
    icon: Scale,
    accentColor: 'text-amber-500',
    badgeBgDark: 'bg-amber-500/10',
    badgeTextDark: 'text-amber-400',
    badgeBgLight: 'bg-amber-50',
    badgeTextLight: 'text-amber-800 font-semibold',
    borderColorDark: 'border-amber-500/30',
    borderColorLight: 'border-amber-300',
    glowDark: 'from-amber-500/15',
    glowLight: 'from-amber-500/10',
    hint: 'Name the unspoken trade-off in the speaker’s stance, and declare if you’d make the same call in your product.',
  },
  Apply: {
    label: 'Apply',
    icon: Wrench,
    accentColor: 'text-emerald-500',
    badgeBgDark: 'bg-emerald-500/10',
    badgeTextDark: 'text-emerald-400',
    badgeBgLight: 'bg-emerald-50',
    badgeTextLight: 'text-emerald-800 font-semibold',
    borderColorDark: 'border-emerald-500/30',
    borderColorLight: 'border-emerald-300',
    glowDark: 'from-emerald-500/15',
    glowLight: 'from-emerald-500/10',
    hint: 'Translate this concept into a live roadmap feature, team blocker, or pricing experiment you are currently navigating.',
  },
  Remember: {
    label: 'Remember',
    icon: Brain,
    accentColor: 'text-purple-500',
    badgeBgDark: 'bg-purple-500/10',
    badgeTextDark: 'text-purple-400',
    badgeBgLight: 'bg-purple-50',
    badgeTextLight: 'text-purple-800 font-semibold',
    borderColorDark: 'border-purple-500/30',
    borderColorLight: 'border-purple-300',
    glowDark: 'from-purple-500/15',
    glowLight: 'from-purple-500/10',
    hint: 'Active retrieval: reconstruct the underlying mechanism or logic from memory without relying on source bullet points.',
  },
  Build: {
    label: 'Build',
    icon: Layers,
    accentColor: 'text-sky-500',
    badgeBgDark: 'bg-sky-500/10',
    badgeTextDark: 'text-sky-400',
    badgeBgLight: 'bg-sky-50',
    badgeTextLight: 'text-sky-800 font-semibold',
    borderColorDark: 'border-sky-500/30',
    borderColorLight: 'border-sky-300',
    glowDark: 'from-sky-500/15',
    glowLight: 'from-sky-500/10',
    hint: 'Outline a concrete 3-bullet specification, experiment framework, or telemetry metric implementing this idea.',
  },
};

export const CognitiveActionView: React.FC<CognitiveActionViewProps> = ({
  claim,
  videoTitle,
  onBack,
  onSubmitResponse,
}) => {
  const { isDark } = useTheme();
  const [promptData, setPromptData] = useState<CognitivePrompt | null>(null);
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(true);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [userResponse, setUserResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch prompt from server
  useEffect(() => {
    let isMounted = true;
    async function fetchPrompt() {
      setIsLoadingPrompt(true);
      setPromptError(null);
      try {
        const response = await fetch('/api/generate-prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ claim }),
        });
        if (!response.ok) {
          throw new Error('Failed to generate prompt.');
        }
        const data = await response.json();
        if (isMounted) {
          setPromptData(data);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Prompt generation failed:', err);
          setPromptData({
            claimId: claim.id,
            type: 'Decide',
            prompt: `What trade-off does this claim introduce, and would you adopt this stance for your current product?`,
            typeDescription: 'Name the trade-offs and evaluate whether you would make the same judgment call.',
          });
        }
      } finally {
        if (isMounted) {
          setIsLoadingPrompt(false);
        }
      }
    }
    fetchPrompt();
    return () => {
      isMounted = false;
    };
  }, [claim]);

  // Sentence count detector (split by periods, exclamation marks, or questions)
  const sentences = userResponse
    .trim()
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);
  const sentenceCount = sentences.length;
  const hasTwoSentences = sentenceCount >= 2;
  const wordCount = userResponse.trim() ? userResponse.trim().split(/\s+/).length : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptData || !hasTwoSentences || isSubmitting) return;

    setIsSubmitting(true);
    onSubmitResponse(claim, promptData, userResponse.trim(), videoTitle);
  };

  const currentType = promptData?.type || 'Decide';
  const theme = TYPE_THEME[currentType];
  const IconComponent = theme.icon;

  return (
    <div className="min-h-full p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Top Breadcrumb Navigation */}
      <div
        className={`flex items-center justify-between pb-4 border-b transition-colors ${
          isDark ? 'border-white/[0.08]' : 'border-slate-200/80'
        }`}
      >
        <button
          onClick={onBack}
          className={`flex items-center gap-2 text-xs font-medium transition-colors cursor-pointer group ${
            isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Claims Queue</span>
        </button>

        <div className="flex items-center gap-2">
          <span
            className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border ${
              isDark
                ? 'text-slate-400 bg-white/[0.04] border-white/[0.06]'
                : 'text-slate-600 bg-white border-slate-200 shadow-2xs'
            }`}
          >
            {videoTitle || 'Video Learning Session'}
          </span>
        </div>
      </div>

      {/* Main Studio Workbench Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Center: The Cognitive Action Stage (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Source Claim Context Banner */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border relative overflow-hidden transition-all ${
              isDark
                ? 'bg-[#0E121B] border-white/[0.08] shadow-lg'
                : 'bg-white border-slate-200/90 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider ${
                  isDark ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                Selected Video Claim
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-md border ${
                    isDark
                      ? 'bg-red-500/10 text-red-400 border-red-500/20'
                      : 'bg-orange-50 text-orange-700 border-orange-200 font-semibold'
                  }`}
                >
                  {claim.timestampOrRef}
                </span>
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${
                    isDark
                      ? 'bg-white/[0.05] text-slate-400 border-white/[0.06]'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {claim.topicTag}
                </span>
              </div>
            </div>
            <blockquote
              className={`text-base sm:text-lg font-serif italic leading-snug ${
                isDark ? 'text-slate-200' : 'text-slate-800'
              }`}
            >
              “{claim.claimText}”
            </blockquote>
          </div>

          {/* THE COGNITIVE PROMPT CHALLENGE CARD */}
          <div
            className={`p-6 sm:p-7 rounded-3xl border shadow-xl relative overflow-hidden space-y-4 transition-all ${
              isDark
                ? `bg-gradient-to-b from-[#111522] to-[#0D1019] ${theme.borderColorDark}`
                : `bg-white ${theme.borderColorLight}`
            }`}
          >
            {/* Ambient Type Glow */}
            <div
              className={`absolute top-0 right-0 w-80 h-80 bg-radial ${
                isDark ? theme.glowDark : theme.glowLight
              } to-transparent opacity-30 pointer-events-none`}
            />

            {isLoadingPrompt ? (
              <div className="py-12 text-center space-y-3">
                <RefreshCw
                  className={`w-8 h-8 animate-spin mx-auto ${
                    isDark ? 'text-red-500' : 'text-orange-500'
                  }`}
                />
                <div
                  className={`text-sm font-medium ${
                    isDark ? 'text-slate-300' : 'text-slate-800'
                  }`}
                >
                  Synthesizing Cognitive Prompt with Gemini...
                </div>
                <p
                  className={`text-xs ${
                    isDark ? 'text-slate-500' : 'text-slate-500'
                  }`}
                >
                  Generating a sharp recall challenge tailored strictly to this claim.
                </p>
              </div>
            ) : (
              <>
                {/* Archetype Badge & Type descriptor */}
                <div className="flex items-center justify-between gap-3 relative z-10">
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${
                      isDark
                        ? `${theme.badgeBgDark} ${theme.badgeTextDark} ${theme.borderColorDark}`
                        : `${theme.badgeBgLight} ${theme.badgeTextLight} ${theme.borderColorLight}`
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    <span>PROMPT TYPE: {theme.label}</span>
                  </div>
                  <span
                    className={`text-[11px] font-mono ${
                      isDark ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    Active Recall Challenge
                  </span>
                </div>

                {/* Prompt Question */}
                <div className="relative z-10">
                  <h2
                    className={`text-lg sm:text-xl font-bold tracking-tight leading-snug ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {promptData?.prompt}
                  </h2>
                  <p
                    className={`text-xs mt-1.5 leading-relaxed ${
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    {promptData?.typeDescription || theme.hint}
                  </p>
                </div>

                {/* Interactive Synthesis Editor */}
                <form onSubmit={handleSubmit} className="relative z-10 pt-2 space-y-3">
                  <div
                    className={`rounded-2xl border transition-all p-3 sm:p-4 space-y-2 shadow-inner ${
                      isDark
                        ? 'bg-[#090C12] border-white/[0.1] focus-within:border-red-500'
                        : 'bg-slate-50 border-slate-200 focus-within:border-orange-500 focus-within:bg-white'
                    }`}
                  >
                    {/* Editor Toolbar & Live Sentence Validator */}
                    <div
                      className={`flex items-center justify-between text-[11px] pb-2 border-b ${
                        isDark ? 'border-white/[0.06]' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-medium ${
                            isDark ? 'text-slate-400' : 'text-slate-600'
                          }`}
                        >
                          Original Synthesis
                        </span>
                        {/* Sentence checks */}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-colors ${
                            sentenceCount >= 1
                              ? isDark
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isDark
                              ? 'bg-white/[0.05] text-slate-500'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Sentence 1
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-colors ${
                            hasTwoSentences
                              ? isDark
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isDark
                              ? 'bg-white/[0.05] text-slate-500'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Sentence 2+
                        </span>
                      </div>
                      <div
                        className={`font-mono ${
                          isDark ? 'text-slate-500' : 'text-slate-400'
                        }`}
                      >
                        {wordCount} words • {userResponse.length} chars
                      </div>
                    </div>

                    {/* Textarea */}
                    <textarea
                      rows={7}
                      value={userResponse}
                      onChange={(e) => setUserResponse(e.target.value)}
                      placeholder="Write 2+ sentences of your own original synthesis. Wrestle with the specific trade-offs or application..."
                      className={`w-full bg-transparent text-sm leading-relaxed resize-y font-sans focus:outline-none ${
                        isDark
                          ? 'text-slate-100 placeholder-slate-600'
                          : 'text-slate-900 placeholder-slate-400'
                      }`}
                      autoFocus
                    />
                  </div>

                  {/* Submission Footer */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <div
                      className={`text-[11px] flex items-center gap-1.5 ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}
                    >
                      <Info
                        className={`w-3.5 h-3.5 ${
                          isDark ? 'text-slate-500' : 'text-slate-400'
                        }`}
                      />
                      <span>
                        Must be at least 2 full sentences of your own perspective.
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={!hasTwoSentences || isSubmitting}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                        !hasTwoSentences || isSubmitting
                          ? isDark
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : isDark
                          ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-red-600/25 active:scale-[0.99]'
                          : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-orange-500/25 active:scale-[0.99]'
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Evaluating Synthesis...</span>
                        </>
                      ) : (
                        <>
                          <span>Submit & Evaluate</span>
                          <Send className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>

        {/* Right Column: Active Recall Guidance & Cognitive Spark (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Why Synthesis Over Summarization Card */}
          <div
            className={`p-5 rounded-3xl border shadow-sm space-y-3 transition-all ${
              isDark
                ? 'bg-[#0D1019] border-white/[0.08]'
                : 'bg-white border-slate-200/90'
            }`}
          >
            <div
              className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              <ShieldCheck
                className={`w-4 h-4 ${isDark ? 'text-red-500' : 'text-orange-500'}`}
              />
              <span>Cognitive Action Rules</span>
            </div>
            <div
              className={`space-y-2.5 text-xs leading-relaxed ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              <div
                className={`p-3 rounded-2xl border ${
                  isDark
                    ? 'bg-white/[0.03] border-white/[0.05]'
                    : 'bg-slate-50 border-slate-200/80'
                }`}
              >
                <div
                  className={`font-semibold mb-0.5 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  1. No Generic Boilerplate
                </div>
                <p
                  className={`text-[11px] ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  Avoid answers that could apply to any product talk. Reference specific mechanics, metrics, or teams.
                </p>
              </div>

              <div
                className={`p-3 rounded-2xl border ${
                  isDark
                    ? 'bg-white/[0.03] border-white/[0.05]'
                    : 'bg-slate-50 border-slate-200/80'
                }`}
              >
                <div
                  className={`font-semibold mb-0.5 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  2. 2+ Sentences Minimum
                </div>
                <p
                  className={`text-[11px] ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  One sentence rarely unpacks the nuance. Use the second sentence to resolve the tension or identify the downside.
                </p>
              </div>

              <div
                className={`p-3 rounded-2xl border ${
                  isDark
                    ? 'bg-white/[0.03] border-white/[0.05]'
                    : 'bg-slate-50 border-slate-200/80'
                }`}
              >
                <div
                  className={`font-semibold mb-0.5 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  3. Resurfaced in ≥3 Days
                </div>
                <p
                  className={`text-[11px] ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  Recap will prompt you later to verify whether this synthesis actually informed your daily work.
                </p>
              </div>
            </div>
          </div>

          {/* Thought Sparks for Current Archetype */}
          <div
            className={`p-4 rounded-2xl border space-y-2 text-xs transition-all ${
              isDark
                ? 'bg-white/[0.02] border-white/[0.06]'
                : 'bg-orange-50/50 border-orange-200/70'
            }`}
          >
            <div
              className={`text-[10px] font-semibold uppercase tracking-wider ${
                isDark ? 'text-slate-500' : 'text-orange-950 font-bold'
              }`}
            >
              Thinking Sparks for {theme.label}
            </div>
            <ul
              className={`space-y-1.5 text-[11px] ${
                isDark ? 'text-slate-400' : 'text-slate-700'
              }`}
            >
              <li className="flex items-start gap-1.5">
                <span
                  className={`font-bold ${
                    isDark ? 'text-red-500' : 'text-orange-500'
                  }`}
                >
                  •
                </span>
                <span>Who loses if you implement this stance tomorrow?</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span
                  className={`font-bold ${
                    isDark ? 'text-red-500' : 'text-orange-500'
                  }`}
                >
                  •
                </span>
                <span>What metric will look worse before it gets better?</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span
                  className={`font-bold ${
                    isDark ? 'text-red-500' : 'text-orange-500'
                  }`}
                >
                  •
                </span>
                <span>What edge case are you deliberately sacrificing?</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
