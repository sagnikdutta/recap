import React, { useState } from 'react';
import {
  RotateCcw,
  Clock,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Flame,
  Activity,
  BarChart2,
  TrendingUp,
  ShieldCheck,
  Plus,
} from 'lucide-react';
import { SavedItem } from '../types';
import { ResurfaceModal } from './ResurfaceModal';
import { useTheme } from '../context/ThemeContext';

interface DashboardViewProps {
  items: SavedItem[];
  onSaveRevisit: (itemId: string, usedSince: boolean, changedThoughts: string) => Promise<void>;
  onNewSession: () => void;
  onGoToLibrary: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  items,
  onSaveRevisit,
  onNewSession,
  onGoToLibrary,
}) => {
  const { isDark } = useTheme();
  const [selectedStaleItem, setSelectedStaleItem] = useState<SavedItem | null>(null);

  const totalItems = items.length;
  const revisitedItems = items.filter(
    (it) => Array.isArray(it.revisits) && it.revisits.length > 0
  );
  const totalRevisited = revisitedItems.length;

  const revisitPercentage =
    totalItems > 0 ? (totalRevisited / totalItems) * 100 : 0;
  const isBenchmarkMet = revisitPercentage >= 15;

  // Stale items: never been revisited, sorted OLDEST-FIRST
  const neverRevisitedItems = items
    .filter((it) => !Array.isArray(it.revisits) || it.revisits.length === 0)
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

  const getDaysAgo = (timestamp: number) => {
    const diffMs = Date.now() - (timestamp || Date.now());
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  };

  const getInterpretation = () => {
    if (totalItems === 0) {
      return 'No items captured yet. Run a session in Video Studio to initiate your active recall loop.';
    }
    if (revisitPercentage < 15) {
      return 'Below the 15% threshold: items are being captured without being put into practice. Revisit at least one synthesis below to cross the benchmark.';
    }
    return 'At or above the 15% retention benchmark: your active synthesis loop is successfully translating watched ideas into retained practice.';
  };

  return (
    <div className="min-h-full p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      {/* Editorial Header */}
      <div
        className={`pb-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isDark ? 'border-white/[0.08]' : 'border-slate-200/80'
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
                isDark ? 'text-red-400' : 'text-orange-600 font-bold'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Validation & Retention Telemetry
            </span>
          </div>
          <h1
            className={`text-2xl sm:text-3xl font-bold tracking-tight mt-1 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            The Revisit Metric
          </h1>
          <p
            className={`text-xs sm:text-sm mt-1 max-w-xl leading-relaxed ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            The single north-star metric: what percentage of your original syntheses do you ever actually reopen and reference?
          </p>
        </div>

        <button
          onClick={onNewSession}
          className={`px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-md transition-all cursor-pointer self-start sm:self-auto shrink-0 ${
            isDark
              ? 'bg-red-600 hover:bg-red-500 shadow-red-600/25 active:scale-[0.98]'
              : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/25 active:scale-[0.98]'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Start New Session</span>
        </button>
      </div>

      {/* HERO REVISIT RATE HUD CONTAINER */}
      <div
        id="hero-revisit-percentage-container"
        className={`rounded-3xl border p-6 sm:p-8 relative overflow-hidden transition-all shadow-xl ${
          isDark
            ? isBenchmarkMet
              ? 'bg-gradient-to-br from-[#0F1B18] via-[#0E1719] to-[#0A0E14] border-emerald-500/30'
              : 'bg-gradient-to-br from-[#191515] via-[#141217] to-[#0A0E14] border-amber-500/30'
            : isBenchmarkMet
            ? 'bg-gradient-to-br from-emerald-50 via-teal-50/40 to-white border-2 border-emerald-300'
            : 'bg-gradient-to-br from-orange-50/70 via-amber-50/30 to-white border-2 border-orange-200'
        }`}
      >
        {/* Ambient Glow */}
        <div
          className={`absolute top-0 right-0 w-96 h-96 bg-radial ${
            isBenchmarkMet ? 'from-emerald-500/10' : 'from-amber-500/10'
          } to-transparent opacity-50 pointer-events-none`}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div
              className={`text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              <Flame
                className={
                  isBenchmarkMet
                    ? 'text-emerald-500'
                    : isDark
                    ? 'text-amber-400'
                    : 'text-orange-500'
                }
              />
              <span>Active Revisit Rate (Core North Star)</span>
            </div>

            {/* Giant Number */}
            <div
              id="hero-revisit-percentage-number"
              className={`text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-none font-mono flex items-baseline ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              {Math.round(revisitPercentage)}
              <span
                className={`text-3xl sm:text-4xl font-light ml-1 ${
                  isDark ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                %
              </span>
            </div>

            {/* Benchmark Pill */}
            <div className="mt-3 flex items-center gap-2">
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-md font-mono ${
                  isBenchmarkMet
                    ? isDark
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold'
                    : isDark
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                }`}
              >
                {isBenchmarkMet ? '✓ Benchmark Reached (≥15%)' : 'Target: ≥15% Retention'}
              </span>
              <span
                className={`text-xs ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                {totalRevisited} of {totalItems} syntheses revisited
              </span>
            </div>
          </div>

          {/* Metric Status Description Box */}
          <div
            className={`md:max-w-sm p-4 rounded-2xl border backdrop-blur-md space-y-2 ${
              isDark
                ? 'bg-black/40 border-white/[0.08]'
                : 'bg-white/80 border-slate-200/90 shadow-2xs'
            }`}
          >
            <div
              className={`text-xs font-semibold flex items-center gap-1.5 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              {isBenchmarkMet ? (
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              ) : (
                <AlertTriangle
                  className={`w-4 h-4 ${
                    isDark ? 'text-amber-400' : 'text-amber-600'
                  }`}
                />
              )}
              <span>Retention Hypothesis</span>
            </div>
            <p
              className={`text-xs leading-relaxed ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              {getInterpretation()}
            </p>
          </div>
        </div>
      </div>

      {/* Stale Syntheses Queue Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
          <div>
            <h2
              className={`text-lg font-bold tracking-tight flex items-center gap-2 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              <Clock
                className={`w-4 h-4 ${
                  isDark ? 'text-red-500' : 'text-orange-500'
                }`}
              />
              <span>Unrevisited Memories (Oldest First)</span>
            </h2>
            <p
              className={`text-xs ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              Active recall prioritizes the oldest un-reopened items to prevent memory decay.
            </p>
          </div>
          <span
            className={`text-xs font-mono ${
              isDark ? 'text-slate-500' : 'text-slate-400'
            }`}
          >
            {neverRevisitedItems.length} unrevisited items
          </span>
        </div>

        {neverRevisitedItems.length === 0 ? (
          <div
            className={`p-8 rounded-3xl border text-center space-y-2 ${
              isDark
                ? 'bg-[#0D1019] border-white/[0.08]'
                : 'bg-white border-slate-200/90 shadow-2xs'
            }`}
          >
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <div
              className={`text-sm font-semibold ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              No stale syntheses!
            </div>
            <p
              className={`text-xs ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Every item in your vault has been revisited at least once.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {neverRevisitedItems.map((item, idx) => {
              const daysAgo = getDaysAgo(item.createdAt);
              return (
                <div
                  key={item.id}
                  id={`stale-item-${idx}`}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs ${
                    isDark
                      ? 'bg-[#0F131D] hover:bg-[#121624] border-white/[0.08] hover:border-red-500/30'
                      : 'bg-white hover:bg-slate-50 border-slate-200/90 hover:border-orange-300'
                  }`}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={`font-mono text-[10px] px-2 py-0.5 rounded border ${
                          isDark
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : 'bg-orange-50 text-orange-700 border-orange-200 font-semibold'
                        }`}
                      >
                        {daysAgo === 0 ? 'Today' : `${daysAgo}d old`}
                      </span>
                      <span
                        className={`text-xs truncate ${
                          isDark ? 'text-slate-400' : 'text-slate-600'
                        }`}
                      >
                        {item.videoTitle || 'Video Learning Session'}
                      </span>
                    </div>
                    <blockquote
                      className={`text-xs sm:text-sm font-serif italic line-clamp-2 ${
                        isDark ? 'text-slate-200' : 'text-slate-800'
                      }`}
                    >
                      “{item.claimText}”
                    </blockquote>
                  </div>

                  <button
                    id={`resurface-stale-btn-${idx}`}
                    onClick={() => setSelectedStaleItem(item)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs ${
                      isDark
                        ? 'bg-white/[0.06] hover:bg-red-600 text-slate-200 hover:text-white border-white/[0.08] hover:border-red-600'
                        : 'bg-orange-50 hover:bg-orange-500 text-orange-700 hover:text-white border-orange-200 hover:border-orange-500'
                    }`}
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Revisit Now</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Modal */}
      {selectedStaleItem && (
        <ResurfaceModal
          item={selectedStaleItem}
          onClose={() => setSelectedStaleItem(null)}
          onSaveRevisit={onSaveRevisit}
        />
      )}
    </div>
  );
};
