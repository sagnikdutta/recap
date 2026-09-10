import React from 'react';
import { Sparkles, BookOpen, BarChart2, PlaySquare, Flame, Sun, Moon, Plus, PenSquare } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface NavigationProps {
  currentTab: 'new' | 'library' | 'dashboard';
  onSelectTab: (tab: 'new' | 'library' | 'dashboard') => void;
  onStartNewSession: () => void;
  onOpenManualCreate?: () => void;
  libraryCount: number;
  revisitPercentage: number;
  onQuickResurface?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  onStartNewSession,
  onOpenManualCreate,
  libraryCount,
  revisitPercentage,
  onQuickResurface,
}) => {
  const { theme, isDark, toggleTheme, setTheme } = useTheme();
  const isBenchmarkMet = revisitPercentage >= 15;

  return (
    <aside
      className={`w-64 flex flex-col justify-between shrink-0 h-screen sticky top-0 z-30 select-none transition-colors duration-200 ${
        isDark
          ? 'bg-[#0A0D14] border-r border-white/[0.08]'
          : 'bg-white border-r border-slate-200/80 shadow-xs'
      }`}
    >
      {/* Brand & Studio Header */}
      <div>
        <div
          className={`p-5 flex items-center justify-between transition-colors ${
            isDark ? 'border-b border-white/[0.06]' : 'border-b border-slate-100'
          }`}
        >
          <button
            onClick={() => onSelectTab('new')}
            className="flex items-center gap-2.5 text-left group focus:outline-none cursor-pointer"
            id="brand-nav-button"
          >
            {/* Play Mark */}
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 ${
                isDark
                  ? 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/25'
                  : 'bg-gradient-to-br from-orange-500 to-red-500 shadow-orange-500/20'
              }`}
            >
              <PlaySquare className="w-4 h-4 text-white fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`font-sans text-lg font-bold tracking-tight transition-colors ${
                    isDark
                      ? 'text-white group-hover:text-red-400'
                      : 'text-slate-900 group-hover:text-orange-600'
                  }`}
                >
                  Recap
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase ${
                    isDark
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                      : 'bg-orange-50 text-orange-600 border border-orange-200'
                  }`}
                >
                  STUDIO
                </span>
              </div>
              <p
                className={`text-[10px] font-medium ${
                  isDark ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                Video Active Recall
              </p>
            </div>
          </button>
        </div>

        {/* User / Learner Mini Card + Quick Theme Pill */}
        <div
          className={`mx-3 my-3 p-2.5 rounded-2xl flex items-center justify-between gap-3 transition-colors ${
            isDark
              ? 'bg-white/[0.03] border border-white/[0.06]'
              : 'bg-[#F8F9FA] border border-slate-200/80 shadow-2xs'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-semibold ring-1 ${
                isDark
                  ? 'bg-gradient-to-tr from-slate-700 to-slate-600 text-white ring-white/10'
                  : 'bg-gradient-to-tr from-orange-100 to-amber-100 text-orange-900 ring-orange-200/80 font-bold'
              }`}
            >
              PM
            </div>
            <div className="min-w-0 flex-1">
              <div
                className={`text-xs font-semibold truncate ${
                  isDark ? 'text-slate-200' : 'text-slate-800'
                }`}
              >
                Product Analyst
              </div>
              <div
                className={`flex items-center gap-1 text-[10px] ${
                  isDark ? 'text-emerald-400' : 'text-emerald-600 font-medium'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Active Recall Loop
              </div>
            </div>
          </div>

          {/* Theme Toggle Pill */}
          <div
            className={`flex items-center p-0.5 rounded-full border ${
              isDark
                ? 'bg-black/40 border-white/10'
                : 'bg-white border-slate-200 shadow-2xs'
            }`}
            title={`Current: ${isDark ? 'Dark' : 'Light'} Mode. Click to toggle.`}
          >
            <button
              onClick={() => setTheme('light')}
              className={`p-1.5 rounded-full transition-all cursor-pointer ${
                !isDark
                  ? 'bg-amber-100 text-amber-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              aria-label="Switch to light mode"
              title="Light Mode"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`p-1.5 rounded-full transition-all cursor-pointer ${
                isDark
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              aria-label="Switch to dark mode"
              title="Dark Mode"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Primary Action Buttons: Start New Session & Manual Create */}
        <div className="px-3 py-2 space-y-1.5">
          <button
            id="sidebar-new-session-btn"
            onClick={onStartNewSession}
            className={`w-full py-2.5 px-3 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all cursor-pointer ${
              isDark
                ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-red-600/25'
                : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-orange-500/25'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Start New Session</span>
          </button>
          {onOpenManualCreate && (
            <button
              id="sidebar-manual-create-btn"
              onClick={onOpenManualCreate}
              className={`w-full py-1.5 px-3 rounded-xl text-[11px] font-medium flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                isDark
                  ? 'bg-white/[0.03] hover:bg-white/[0.07] border-white/[0.08] text-slate-300'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              <PenSquare className="w-3.5 h-3.5 text-slate-400" />
              <span>Manual Synthesis Entry</span>
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="px-3 py-1">
          <div
            className={`text-[10px] font-semibold uppercase tracking-wider px-3 mb-1.5 ${
              isDark ? 'text-slate-500' : 'text-slate-400'
            }`}
          >
            Learning Studio
          </div>
          <nav className="space-y-1">
            {/* Video Studio Tab */}
            <button
              id="nav-tab-new"
              onClick={() => onSelectTab('new')}
              className={`w-full px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between group cursor-pointer ${
                currentTab === 'new'
                  ? isDark
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20 shadow-sm'
                    : 'bg-orange-50 text-orange-700 border border-orange-200/90 font-semibold shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <PlaySquare
                  className={`w-4 h-4 transition-colors ${
                    currentTab === 'new'
                      ? isDark
                        ? 'text-red-400'
                        : 'text-orange-600'
                      : isDark
                      ? 'text-slate-500 group-hover:text-slate-300'
                      : 'text-slate-400 group-hover:text-slate-700'
                  }`}
                />
                <span>Video Studio</span>
              </div>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  isDark
                    ? 'bg-white/[0.05] text-slate-400'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                New
              </span>
            </button>

            {/* Recall Vault Tab */}
            <button
              id="nav-tab-library"
              onClick={() => onSelectTab('library')}
              className={`w-full px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between group cursor-pointer ${
                currentTab === 'library'
                  ? isDark
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20 shadow-sm'
                    : 'bg-orange-50 text-orange-700 border border-orange-200/90 font-semibold shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BookOpen
                  className={`w-4 h-4 transition-colors ${
                    currentTab === 'library'
                      ? isDark
                        ? 'text-red-400'
                        : 'text-orange-600'
                      : isDark
                      ? 'text-slate-500 group-hover:text-slate-300'
                      : 'text-slate-400 group-hover:text-slate-700'
                  }`}
                />
                <span>Recall Vault</span>
              </div>
              {libraryCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${
                    currentTab === 'library'
                      ? isDark
                        ? 'bg-red-500/20 text-red-300'
                        : 'bg-orange-100 text-orange-800'
                      : isDark
                      ? 'bg-white/[0.06] text-slate-300'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {libraryCount}
                </span>
              )}
            </button>

            {/* Retention Telemetry Tab */}
            <button
              id="nav-tab-dashboard"
              onClick={() => onSelectTab('dashboard')}
              className={`w-full px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between group cursor-pointer ${
                currentTab === 'dashboard'
                  ? isDark
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20 shadow-sm'
                    : 'bg-orange-50 text-orange-700 border border-orange-200/90 font-semibold shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BarChart2
                  className={`w-4 h-4 transition-colors ${
                    currentTab === 'dashboard'
                      ? isDark
                        ? 'text-red-400'
                        : 'text-orange-600'
                      : isDark
                      ? 'text-slate-500 group-hover:text-slate-300'
                      : 'text-slate-400 group-hover:text-slate-700'
                  }`}
                />
                <span>Retention Telemetry</span>
              </div>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                  isBenchmarkMet
                    ? isDark
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : isDark
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {Math.round(revisitPercentage)}%
              </span>
            </button>
          </nav>
        </div>
      </div>

      {/* Bottom Sidebar Widget: Telemetry Progress & Quick Resurface */}
      <div
        className={`p-3 space-y-3 transition-colors ${
          isDark ? 'border-t border-white/[0.06]' : 'border-t border-slate-100'
        }`}
      >
        <div
          className={`p-3 rounded-2xl border transition-colors ${
            isDark
              ? 'bg-white/[0.02] border-white/[0.05]'
              : 'bg-[#F8F9FA] border-slate-200/80 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span
              className={`flex items-center gap-1.5 font-medium ${
                isDark ? 'text-slate-400' : 'text-slate-700'
              }`}
            >
              <Flame
                className={`w-3.5 h-3.5 ${
                  isBenchmarkMet
                    ? isDark
                      ? 'text-emerald-400'
                      : 'text-emerald-500'
                    : isDark
                    ? 'text-amber-400'
                    : 'text-amber-500'
                }`}
              />
              Revisit Benchmark
            </span>
            <span
              className={`text-xs font-mono font-semibold ${
                isBenchmarkMet
                  ? isDark
                    ? 'text-emerald-400'
                    : 'text-emerald-600'
                  : isDark
                  ? 'text-amber-400'
                  : 'text-amber-600'
              }`}
            >
              {Math.round(revisitPercentage)}% / 15%
            </span>
          </div>
          {/* Progress track */}
          <div
            className={`w-full h-1.5 rounded-full overflow-hidden ${
              isDark ? 'bg-white/[0.06]' : 'bg-slate-200'
            }`}
          >
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isBenchmarkMet
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500'
              }`}
              style={{ width: `${Math.min(100, (revisitPercentage / 15) * 100)}%` }}
            />
          </div>
          <div
            className={`mt-2 text-[10px] leading-tight ${
              isDark ? 'text-slate-500' : 'text-slate-500'
            }`}
          >
            {isBenchmarkMet
              ? 'Loop validated: you are regularly practicing watched insights.'
              : 'Target ≥15% to guarantee long-term retention.'}
          </div>
        </div>

        {onQuickResurface && libraryCount > 0 && (
          <button
            onClick={onQuickResurface}
            className={`w-full py-2 px-3 rounded-xl text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md active:scale-[0.98] transition-all cursor-pointer ${
              isDark
                ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-red-500/20'
                : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-orange-500/25'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Resurface Random Memory</span>
          </button>
        )}
      </div>
    </aside>
  );
};
