import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  Clock,
  Tag,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Plus,
  Trash2,
  BookOpen,
  Check,
  Film,
  Edit3,
  Search,
  PenSquare,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { SavedItem, CognitivePromptType } from '../types';
import { ResurfaceModal } from './ResurfaceModal';
import { EditItemModal } from './EditItemModal';
import { CreateItemModal } from './CreateItemModal';
import { useTheme } from '../context/ThemeContext';

interface LibraryViewProps {
  items: SavedItem[];
  onNewSession: () => void;
  onItemCreated?: (newItem: SavedItem) => void;
  onUpdateItem?: (itemId: string, updatedFields: Partial<SavedItem>) => Promise<void>;
  onSaveRevisit: (itemId: string, usedSince: boolean, changedThoughts: string) => Promise<void>;
  onDeleteRevisit?: (itemId: string, revisitId: string) => Promise<void>;
  onResetSeedData: () => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  items,
  onNewSession,
  onItemCreated,
  onUpdateItem,
  onSaveRevisit,
  onDeleteRevisit,
  onResetSeedData,
  onDeleteItem,
}) => {
  const { isDark } = useTheme();
  const [activeResurfaceItem, setActiveResurfaceItem] = useState<SavedItem | null>(null);
  const [allowAnyAgeResurface, setAllowAnyAgeResurface] = useState(false);
  const [resurfaceError, setResurfaceError] = useState<string | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'eligible' | 'revisited'>('all');
  const [promptTypeFilter, setPromptTypeFilter] = useState<'all' | CognitivePromptType>('all');

  // Modals state
  const [editingItem, setEditingItem] = useState<SavedItem | null>(null);
  const [isManualCreateOpen, setIsManualCreateOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Helper for "days since saved"
  const getDaysAgo = (timestamp: number) => {
    const diffMs = Date.now() - (timestamp || Date.now());
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  };

  const formatDaysLabel = (timestamp: number) => {
    const days = getDaysAgo(timestamp);
    if (days === 0) return 'Saved today';
    if (days === 1) return 'Saved 1 day ago';
    return `Saved ${days} days ago`;
  };

  // Find items saved >= 3 days ago
  const eligibleItems = items.filter((it) => {
    if (allowAnyAgeResurface) return true;
    const days = getDaysAgo(it.createdAt);
    return days >= 3;
  });

  const handleResurfaceClick = () => {
    setResurfaceError(null);

    if (items.length === 0) {
      setResurfaceError('Your library is currently empty. Complete a session to begin.');
      return;
    }

    if (eligibleItems.length === 0) {
      setResurfaceError(
        'Active recall works best on memories that have had at least 3 days to cool off. None of your items are ≥3 days old yet.'
      );
      return;
    }

    const randomIndex = Math.floor(Math.random() * eligibleItems.length);
    setActiveResurfaceItem(eligibleItems[randomIndex]);
  };

  const toggleExpand = (id: string) => {
    setExpandedItemId(expandedItemId === id ? null : id);
  };

  // Filtered & searched items
  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      // Status filter
      if (filterMode === 'eligible' && getDaysAgo(it.createdAt) < 3) {
        return false;
      }
      if (filterMode === 'revisited' && (!Array.isArray(it.revisits) || it.revisits.length === 0)) {
        return false;
      }

      // Prompt Type filter
      if (promptTypeFilter !== 'all' && it.promptType !== promptTypeFilter) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = it.videoTitle?.toLowerCase().includes(q);
        const matchesClaim = it.claimText?.toLowerCase().includes(q);
        const matchesResponse = it.userResponse?.toLowerCase().includes(q);
        const matchesTag = it.topicTag?.toLowerCase().includes(q);
        const matchesRef = it.timestampOrRef?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesClaim && !matchesResponse && !matchesTag && !matchesRef) {
          return false;
        }
      }

      return true;
    });
  }, [items, filterMode, promptTypeFilter, searchQuery]);

  const handleDeleteConfirm = async (id: string) => {
    try {
      await onDeleteItem(id);
      setConfirmDeleteId(null);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <div className="min-h-full p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Top Header with CRUD action buttons */}
      <div
        className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b ${
          isDark ? 'border-white/[0.08]' : 'border-slate-200/80'
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                isDark ? 'text-red-400' : 'text-orange-600 font-bold'
              }`}
            >
              Active Recall Vault
            </span>
            <span
              className={`text-xs font-mono ${
                isDark ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              • {items.length} saved syntheses
            </span>
          </div>
          <h1
            className={`text-2xl sm:text-3xl font-bold tracking-tight mt-0.5 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            Syntheses & Revisit Archive
          </h1>
          <p
            className={`text-xs sm:text-sm mt-1 max-w-xl leading-relaxed ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            Every entry stores an original piece of your own thinking. Search, edit, resurface, or add new recall sessions at any time.
          </p>
        </div>

        {/* Action Buttons: Add New Session, Manual Entry, Resurface */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Add New Session Button */}
          <button
            type="button"
            id="library-new-session-btn"
            onClick={onNewSession}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-md transition-all cursor-pointer ${
              isDark
                ? 'bg-red-600 hover:bg-red-500 shadow-red-600/25 active:scale-[0.98]'
                : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/25 active:scale-[0.98]'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Video Session</span>
          </button>

          {/* Quick Manual Entry Button */}
          <button
            type="button"
            id="library-manual-entry-btn"
            onClick={() => setIsManualCreateOpen(true)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
              isDark
                ? 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 border-white/[0.1]'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
            }`}
          >
            <PenSquare className="w-3.5 h-3.5 text-orange-500" />
            <span>Manual Entry</span>
          </button>

          {/* Resurface Button */}
          <button
            type="button"
            id="resurface-something-btn"
            onClick={handleResurfaceClick}
            disabled={items.length === 0}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
              items.length === 0
                ? isDark
                  ? 'bg-slate-800 text-slate-600 border-white/[0.04] cursor-not-allowed'
                  : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                : isDark
                ? 'bg-white/[0.08] hover:bg-white/[0.15] text-white border-white/[0.12] active:scale-[0.98]'
                : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900 active:scale-[0.98]'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Resurface Random</span>
          </button>
        </div>
      </div>

      {/* Resurface Error Callout if applicable */}
      {resurfaceError && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-start justify-between gap-3 ${
            isDark
              ? 'bg-amber-500/10 border-amber-500/25 text-amber-300'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-start gap-2">
            <AlertCircle
              className={`w-4 h-4 shrink-0 mt-0.5 ${
                isDark ? 'text-amber-400' : 'text-amber-600'
              }`}
            />
            <div>
              <div className="font-semibold">{resurfaceError}</div>
              <div
                className={`text-[11px] mt-1 ${
                  isDark ? 'text-amber-400/80' : 'text-amber-700'
                }`}
              >
                Want to test immediately? Enable prototype bypass below.
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setAllowAnyAgeResurface(true);
              setResurfaceError(null);
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer shrink-0 ${
              isDark
                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200'
                : 'bg-amber-200 hover:bg-amber-300 text-amber-900'
            }`}
          >
            Bypass 3-Day Rule
          </button>
        </div>
      )}

      {/* Controls Bar: Search, Status Filters, and Type Filters */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search
            className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
              isDark ? 'text-slate-500' : 'text-slate-400'
            }`}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search syntheses by video title, claim, tags, or written thoughts..."
            className={`w-full pl-10 pr-4 py-2.5 rounded-2xl border text-xs transition-colors ${
              isDark
                ? 'bg-[#0F131D] border-white/[0.08] text-slate-100 placeholder-slate-500 focus:border-red-500'
                : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-orange-500 shadow-2xs'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold px-1.5 py-0.5 rounded cursor-pointer ${
                isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Bars */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter Tabs */}
            <div
              className={`flex items-center gap-1 p-1 rounded-xl border ${
                isDark
                  ? 'bg-[#0F131D] border-white/[0.08]'
                  : 'bg-white border-slate-200/90 shadow-2xs'
              }`}
            >
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  filterMode === 'all'
                    ? isDark
                      ? 'bg-white/10 text-white font-semibold'
                      : 'bg-slate-900 text-white font-semibold shadow-xs'
                    : isDark
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({items.length})
              </button>
              <button
                onClick={() => setFilterMode('eligible')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  filterMode === 'eligible'
                    ? isDark
                      ? 'bg-white/10 text-white font-semibold'
                      : 'bg-slate-900 text-white font-semibold shadow-xs'
                    : isDark
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ready ≥3d ({items.filter((it) => getDaysAgo(it.createdAt) >= 3).length})
              </button>
              <button
                onClick={() => setFilterMode('revisited')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  filterMode === 'revisited'
                    ? isDark
                      ? 'bg-white/10 text-white font-semibold'
                      : 'bg-slate-900 text-white font-semibold shadow-xs'
                    : isDark
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Revisited ({items.filter((it) => Array.isArray(it.revisits) && it.revisits.length > 0).length})
              </button>
            </div>

            {/* Prompt Type Filter Pills */}
            <div className="flex items-center gap-1 text-xs">
              {(['all', 'Decide', 'Apply', 'Remember', 'Build'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setPromptTypeFilter(type)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                    promptTypeFilter === type
                      ? isDark
                        ? 'bg-red-500/20 text-red-300 border-red-500/40'
                        : 'bg-orange-100 text-orange-800 border-orange-300 font-semibold'
                      : isDark
                      ? 'bg-white/[0.03] text-slate-400 border-white/[0.06] hover:text-white'
                      : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900'
                  }`}
                >
                  {type === 'all' ? 'All Types' : type}
                </button>
              ))}
            </div>
          </div>

          {/* Prototype Reset Tool */}
          <button
            onClick={onResetSeedData}
            className={`text-[11px] flex items-center gap-1 transition-colors cursor-pointer ${
              isDark
                ? 'text-slate-500 hover:text-slate-300'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Reload initial PM seed sample records"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Sample Data</span>
          </button>
        </div>
      </div>

      {/* Library Items Grid */}
      {filteredItems.length === 0 ? (
        <div
          className={`p-12 rounded-3xl border text-center space-y-4 shadow-sm ${
            isDark
              ? 'bg-[#0D1019] border-white/[0.08]'
              : 'bg-white border-slate-200/90'
          }`}
        >
          <BookOpen
            className={`w-10 h-10 mx-auto ${
              isDark ? 'text-slate-600' : 'text-slate-300'
            }`}
          />
          <div className="space-y-1">
            <div
              className={`text-base font-semibold ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              No syntheses found
            </div>
            <p
              className={`text-xs max-w-sm mx-auto ${
                isDark ? 'text-slate-500' : 'text-slate-500'
              }`}
            >
              {searchQuery
                ? `No items match "${searchQuery}". Try changing your search or filter.`
                : 'Your Recall Vault is empty. Start a new video session or log an insight directly.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={onNewSession}
              className={`px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all cursor-pointer shadow-md ${
                isDark
                  ? 'bg-red-600 hover:bg-red-500'
                  : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/25'
              }`}
            >
              Start Video Session
            </button>
            <button
              onClick={() => setIsManualCreateOpen(true)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isDark
                  ? 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 border-white/[0.1]'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
              }`}
            >
              Manual Synthesis Entry
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => {
            const daysAgo = getDaysAgo(item.createdAt);
            const isEligible = daysAgo >= 3;
            const isRevisited = Array.isArray(item.revisits) && item.revisits.length > 0;
            const isExpanded = expandedItemId === item.id;
            const isConfirmingDelete = confirmDeleteId === item.id;

            return (
              <div
                key={item.id}
                id={`library-card-${item.id}`}
                className={`p-5 rounded-3xl border transition-all duration-200 shadow-sm space-y-4 ${
                  isDark
                    ? 'bg-[#0F131D] hover:bg-[#121624] border-white/[0.08] hover:border-white/15'
                    : 'bg-white hover:bg-slate-50/70 border-slate-200/90 hover:border-slate-300'
                }`}
              >
                {/* Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[11px] font-semibold flex items-center gap-1.5 ${
                        isDark ? 'text-slate-300' : 'text-slate-800'
                      }`}
                    >
                      <Film
                        className={`w-3.5 h-3.5 ${
                          isDark ? 'text-red-500' : 'text-orange-500'
                        }`}
                      />
                      {item.videoTitle || 'Video Learning Session'}
                    </span>
                    <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>
                      •
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        isDark
                          ? 'bg-white/[0.05] text-slate-400 border-white/[0.06]'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {item.timestampOrRef}
                    </span>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
                        isDark
                          ? 'bg-white/[0.05] text-slate-400 border-white/[0.06]'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {item.topicTag}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border ${
                        isDark
                          ? 'bg-red-500/10 text-red-300 border-red-500/20'
                          : 'bg-orange-50 text-orange-700 border-orange-200'
                      }`}
                    >
                      {item.promptType} Mode
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isRevisited ? (
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2.5 py-0.5 rounded-full border ${
                          isDark
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold'
                        }`}
                      >
                        <Check className="w-3 h-3" />
                        Revisited ({item.revisits.length}x)
                      </span>
                    ) : isEligible ? (
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2.5 py-0.5 rounded-full border ${
                          isDark
                            ? 'bg-red-500/15 text-red-400 border-red-500/20'
                            : 'bg-orange-50 text-orange-700 border-orange-200 font-semibold'
                        }`}
                      >
                        Ready to Resurface ({daysAgo}d)
                      </span>
                    ) : (
                      <span
                        className={`text-[10px] font-mono ${
                          isDark ? 'text-slate-500' : 'text-slate-400'
                        }`}
                      >
                        Cooling off ({daysAgo}/3 days)
                      </span>
                    )}
                  </div>
                </div>

                {/* Source Claim Quote */}
                <div>
                  <div
                    className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${
                      isDark ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    Source Claim
                  </div>
                  <blockquote
                    className={`text-sm sm:text-base font-serif italic leading-snug ${
                      isDark ? 'text-slate-200' : 'text-slate-800'
                    }`}
                  >
                    “{item.claimText}”
                  </blockquote>
                </div>

                {/* User's Original Written Synthesis */}
                <div
                  className={`p-3.5 rounded-2xl border space-y-1.5 shadow-inner ${
                    isDark
                      ? 'bg-black/40 border-white/[0.06]'
                      : 'bg-slate-50 border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span
                      className={`font-semibold uppercase tracking-wider ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}
                    >
                      Your Synthesis • {item.promptType} Mode
                    </span>
                    <span
                      className={`font-mono ${
                        isDark ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      {formatDaysLabel(item.createdAt)}
                    </span>
                  </div>
                  <p
                    className={`text-xs sm:text-sm font-sans leading-relaxed ${
                      isDark ? 'text-slate-100' : 'text-slate-900'
                    }`}
                  >
                    “{item.userResponse}”
                  </p>
                </div>

                {/* Revisit Logs History (if any) */}
                {item.revisits && item.revisits.length > 0 && (
                  <div
                    className={`space-y-2 pt-1 border-t ${
                      isDark ? 'border-white/[0.06]' : 'border-slate-200/80'
                    }`}
                  >
                    <div
                      className={`text-[10px] font-semibold uppercase tracking-wider flex items-center justify-between ${
                        isDark ? 'text-emerald-400' : 'text-emerald-700 font-bold'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Revisit Activity & Application Notes ({item.revisits.length})</span>
                      </div>
                    </div>
                    {item.revisits.map((rev, revIdx) => (
                      <div
                        key={rev.id || revIdx}
                        className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                          isDark
                            ? 'bg-emerald-500/[0.04] border-emerald-500/15 text-slate-300'
                            : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                        }`}
                      >
                        <div
                          className={`flex items-center justify-between text-[10px] ${
                            isDark ? 'text-slate-500' : 'text-emerald-700'
                          }`}
                        >
                          <span className="font-mono">
                            {rev.usedSince ? 'Applied in work: YES' : 'Applied in work: NO'}
                          </span>
                          <div className="flex items-center gap-2">
                            <span>{formatDaysLabel(rev.timestamp)}</span>
                            {onDeleteRevisit && (
                              <button
                                onClick={() => onDeleteRevisit(item.id, rev.id)}
                                className={`text-slate-400 hover:text-red-500 cursor-pointer`}
                                title="Delete revisit note"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        {rev.changedThoughts && (
                          <p
                            className={`italic text-[11px] ${
                              isDark ? 'text-slate-300' : 'text-slate-700'
                            }`}
                          >
                            "{rev.changedThoughts}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Card Footer Actions: Read / Update / Delete / Resurface */}
                <div
                  className={`pt-2 border-t flex flex-wrap items-center justify-between gap-2 ${
                    isDark ? 'border-white/[0.06]' : 'border-slate-200/80'
                  }`}
                >
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className={`text-xs flex items-center gap-1 cursor-pointer transition-colors ${
                      isDark
                        ? 'text-slate-400 hover:text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>{isExpanded ? 'Hide Details' : 'View Question & Feedback'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  <div className="flex items-center gap-2">
                    {/* Delete with inline confirmation */}
                    {isConfirmingDelete ? (
                      <div className="flex items-center gap-1.5 animate-in fade-in duration-100">
                        <span className="text-[10px] text-red-500 font-semibold">Delete?</span>
                        <button
                          onClick={() => handleDeleteConfirm(item.id)}
                          className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold hover:bg-red-700 cursor-pointer"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className={`px-2 py-0.5 rounded text-[10px] border cursor-pointer ${
                            isDark
                              ? 'border-white/10 text-slate-300 hover:bg-white/5'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(item.id)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isDark
                            ? 'text-slate-500 hover:text-red-400 hover:bg-white/[0.05]'
                            : 'text-slate-400 hover:text-red-600 hover:bg-slate-100'
                        }`}
                        title="Delete from Vault"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Edit Synthesis Button (UPDATE CRUD) */}
                    {onUpdateItem && (
                      <button
                        onClick={() => setEditingItem(item)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1 transition-all cursor-pointer ${
                          isDark
                            ? 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border-white/[0.08]'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-2xs'
                        }`}
                        title="Edit Synthesis & Details"
                      >
                        <Edit3 className="w-3 h-3 text-orange-500" />
                        <span>Edit</span>
                      </button>
                    )}

                    {/* Resurface Button */}
                    <button
                      onClick={() => setActiveResurfaceItem(item)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                        isDark
                          ? 'bg-white/[0.06] hover:bg-red-600 text-slate-200 hover:text-white border-white/[0.08] hover:border-red-600'
                          : 'bg-orange-50 hover:bg-orange-500 text-orange-700 hover:text-white border-orange-200 hover:border-orange-500'
                      }`}
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Resurface</span>
                    </button>
                  </div>
                </div>

                {/* Expanded Details: Question & Colleague Feedback */}
                {isExpanded && (
                  <div
                    className={`pt-3 border-t grid grid-cols-1 md:grid-cols-2 gap-3 text-xs ${
                      isDark ? 'border-white/[0.06]' : 'border-slate-200/80'
                    }`}
                  >
                    <div
                      className={`p-3 rounded-2xl border space-y-1 ${
                        isDark
                          ? 'bg-white/[0.02] border-white/[0.04]'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div
                        className={`font-semibold ${
                          isDark ? 'text-slate-300' : 'text-slate-800'
                        }`}
                      >
                        Prompt Question
                      </div>
                      <p
                        className={`text-[11px] leading-relaxed ${
                          isDark ? 'text-slate-400' : 'text-slate-600'
                        }`}
                      >
                        {item.promptText || 'What original decision or practical application will you commit to?'}
                      </p>
                    </div>

                    <div
                      className={`p-3 rounded-2xl border space-y-1 ${
                        isDark
                          ? 'bg-white/[0.02] border-white/[0.04]'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div
                        className={`font-semibold ${
                          isDark ? 'text-slate-300' : 'text-slate-800'
                        }`}
                      >
                        Colleague Perspective
                      </div>
                      <p
                        className={`text-[11px] leading-relaxed ${
                          isDark ? 'text-slate-400' : 'text-slate-600'
                        }`}
                      >
                        {item.feedback?.colleagueReaction || 'Committed directly to vault for active recall.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Resurface Interactive Modal */}
      {activeResurfaceItem && (
        <ResurfaceModal
          item={activeResurfaceItem}
          onClose={() => setActiveResurfaceItem(null)}
          onSaveRevisit={onSaveRevisit}
        />
      )}

      {/* Edit Item Modal (UPDATE) */}
      {editingItem && onUpdateItem && (
        <EditItemModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onUpdateItem={onUpdateItem}
          onDeleteRevisit={onDeleteRevisit}
        />
      )}

      {/* Manual Create Modal (CREATE) */}
      {isManualCreateOpen && (
        <CreateItemModal
          onClose={() => setIsManualCreateOpen(false)}
          onItemCreated={(newItem) => {
            if (onItemCreated) onItemCreated(newItem);
            setIsManualCreateOpen(false);
          }}
        />
      )}
    </div>
  );
};
