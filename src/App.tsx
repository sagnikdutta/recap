import React, { useState, useEffect, useCallback } from 'react';
import { Navigation } from './components/Navigation';
import { NewSessionView } from './components/NewSessionView';
import { CognitiveActionView } from './components/CognitiveActionView';
import { FeedbackView } from './components/FeedbackView';
import { LibraryView } from './components/LibraryView';
import { DashboardView } from './components/DashboardView';
import { ResurfaceModal } from './components/ResurfaceModal';
import { CreateItemModal } from './components/CreateItemModal';
import { Claim, CognitivePrompt, SavedItem } from './types';
import { PlaySquare, BookOpen, BarChart2, Sparkles, Menu, X, Sun, Moon, Plus, PenSquare, CheckCircle2 } from 'lucide-react';
import { useTheme } from './context/ThemeContext';

export default function App() {
  const { isDark, toggleTheme, theme, setTheme } = useTheme();
  const [currentTab, setCurrentTab] = useState<'new' | 'library' | 'dashboard'>('new');
  
  // New session sub-steps: 'input' -> 'action' -> 'feedback'
  const [sessionStep, setSessionStep] = useState<'input' | 'action' | 'feedback'>('input');
  
  // Session key to force fresh reset of NewSessionView
  const [sessionKey, setSessionKey] = useState(0);

  // Active workflow session state
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [videoTitle, setVideoTitle] = useState<string>('');
  const [activePrompt, setActivePrompt] = useState<CognitivePrompt | null>(null);
  const [userResponse, setUserResponse] = useState<string>('');

  // Global library items
  const [items, setItems] = useState<SavedItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);

  // Quick Resurface Modal trigger from Sidebar
  const [quickResurfaceItem, setQuickResurfaceItem] = useState<SavedItem | null>(null);

  // Manual Create Modal trigger
  const [isManualCreateOpen, setIsManualCreateOpen] = useState(false);

  // Feedback toast for session actions
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Mobile drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Display brief toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  // Fetch all saved items
  const loadItems = useCallback(async () => {
    try {
      const res = await fetch('/api/items');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.items)) {
          setItems(data.items);
        }
      }
    } catch (err) {
      console.error('Failed to load items:', err);
    } finally {
      setIsLoadingItems(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Handler: user chooses one extracted claim in Screen 1
  const handleSelectClaim = (claim: Claim, title: string) => {
    setSelectedClaim(claim);
    setVideoTitle(title);
    setSessionStep('action');
  };

  // Handler: user submits their 2+ sentence response in Screen 2
  const handleSubmitResponse = (
    claim: Claim,
    prompt: CognitivePrompt,
    response: string,
    title?: string
  ) => {
    setSelectedClaim(claim);
    setActivePrompt(prompt);
    setUserResponse(response);
    if (title) setVideoTitle(title);
    setSessionStep('feedback');
  };

  // Handler: item was saved in Screen 3 (Feedback)
  const handleItemSaved = (newItem: SavedItem) => {
    setItems((prev) => {
      const exists = prev.some((it) => it.id === newItem.id);
      if (exists) return prev;
      return [newItem, ...prev];
    });
  };

  // Handler: user logs a revisit in Library or Dashboard
  const handleSaveRevisit = async (
    itemId: string,
    usedSince: boolean,
    changedThoughts: string
  ) => {
    try {
      const res = await fetch(`/api/items/${itemId}/revisit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usedSince, changedThoughts }),
      });
      if (res.ok) {
        const data = await res.json();
        setItems((prev) =>
          prev.map((it) => (it.id === itemId ? data.item : it))
        );
      }
    } catch (err) {
      console.error('Failed to save revisit:', err);
    }
  };

  // Reset/seed sample library items
  const handleResetSeedData = async () => {
    try {
      const res = await fetch('/api/reset-sample-data', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.items)) {
          setItems(data.items);
        }
      }
    } catch (err) {
      console.error('Failed to reset sample data:', err);
    }
  };

  // Delete item from library
  const handleDeleteItem = async (id: string) => {
    try {
      const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems((prev) => prev.filter((it) => it.id !== id));
        showToast('Item deleted from Vault');
      }
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  // Update item in library
  const handleUpdateItem = async (itemId: string, updatedFields: Partial<SavedItem>) => {
    try {
      const res = await fetch(`/api/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.item) {
          setItems((prev) => prev.map((it) => (it.id === itemId ? data.item : it)));
          showToast('Insight updated in Vault');
        }
      }
    } catch (err) {
      console.error('Failed to update item:', err);
    }
  };

  // Delete revisit log
  const handleDeleteRevisit = async (itemId: string, revisitId: string) => {
    try {
      const res = await fetch(`/api/items/${itemId}/revisit/${revisitId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.item) {
          setItems((prev) => prev.map((it) => (it.id === itemId ? data.item : it)));
          showToast('Revisit log removed');
        }
      }
    } catch (err) {
      console.error('Failed to delete revisit note:', err);
    }
  };

  // Start brand new session
  const handleStartNewSession = () => {
    setSelectedClaim(null);
    setActivePrompt(null);
    setUserResponse('');
    setVideoTitle('');
    setSessionStep('input');
    setCurrentTab('new');
    setSessionKey((prev) => prev + 1);
    showToast('New learning session initialized');
  };

  // Quick resurface trigger from sidebar
  const handleQuickResurface = () => {
    if (items.length === 0) return;
    const randomIndex = Math.floor(Math.random() * items.length);
    setQuickResurfaceItem(items[randomIndex]);
  };

  // Calculate live revisit percentage
  const totalItems = items.length;
  const revisitedCount = items.filter(
    (it) => Array.isArray(it.revisits) && it.revisits.length > 0
  ).length;
  const revisitPercentage =
    totalItems > 0 ? (revisitedCount / totalItems) * 100 : 0;

  return (
    <div
      className={`min-h-screen flex flex-col md:flex-row antialiased transition-colors duration-200 ${
        isDark
          ? 'bg-[#080A0F] text-slate-100 selection:bg-red-500 selection:text-white'
          : 'bg-[#F5F6F9] text-slate-800 selection:bg-orange-500 selection:text-white'
      }`}
    >
      {/* Mobile Top App Bar */}
      <div
        className={`md:hidden flex items-center justify-between p-4 sticky top-0 z-40 transition-colors ${
          isDark
            ? 'bg-[#0A0D14] border-b border-white/[0.08]'
            : 'bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-md ${
              isDark
                ? 'bg-red-600 shadow-red-600/30'
                : 'bg-gradient-to-br from-orange-500 to-red-500 shadow-orange-500/25'
            }`}
          >
            <PlaySquare className="w-4 h-4 fill-white" />
          </div>
          <span
            className={`font-bold text-base tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            Recap Studio
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              isDark
                ? 'bg-white/[0.05] border-white/10 text-amber-300 hover:text-amber-200'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900'
            }`}
            aria-label="Toggle theme"
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              isDark
                ? 'bg-white/[0.05] text-slate-300 hover:text-white'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div
          className={`md:hidden border-b p-4 space-y-2 sticky top-[61px] z-30 shadow-2xl transition-colors ${
            isDark
              ? 'bg-[#0B0E15] border-white/[0.08]'
              : 'bg-white border-slate-200'
          }`}
        >
          {/* Quick Primary Actions */}
          <div className="space-y-1.5 pb-2 border-b border-slate-200/40 dark:border-white/[0.08]">
            <button
              onClick={() => {
                handleStartNewSession();
                setMobileMenuOpen(false);
              }}
              className={`w-full py-2.5 px-3 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer ${
                isDark
                  ? 'bg-gradient-to-r from-red-600 to-rose-600'
                  : 'bg-gradient-to-r from-orange-500 to-red-500'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Start New Session</span>
            </button>
            <button
              onClick={() => {
                setIsManualCreateOpen(true);
                setMobileMenuOpen(false);
              }}
              className={`w-full py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 border cursor-pointer ${
                isDark
                  ? 'bg-white/[0.03] text-slate-300 border-white/[0.08]'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <PenSquare className="w-3.5 h-3.5 text-orange-500" />
              <span>Manual Synthesis Entry</span>
            </button>
          </div>

          <button
            onClick={() => {
              setCurrentTab('new');
              setMobileMenuOpen(false);
            }}
            className={`w-full p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 cursor-pointer ${
              currentTab === 'new'
                ? isDark
                  ? 'bg-red-600 text-white'
                  : 'bg-orange-500 text-white shadow-xs'
                : isDark
                ? 'text-slate-300 hover:bg-white/[0.05]'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <PlaySquare className="w-4 h-4" />
            <span>Video Studio</span>
          </button>
          <button
            onClick={() => {
              setCurrentTab('library');
              setMobileMenuOpen(false);
            }}
            className={`w-full p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer ${
              currentTab === 'library'
                ? isDark
                  ? 'bg-red-600 text-white'
                  : 'bg-orange-500 text-white shadow-xs'
                : isDark
                ? 'text-slate-300 hover:bg-white/[0.05]'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-4 h-4" />
              <span>Recall Vault</span>
            </div>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                isDark ? 'bg-black/40 text-slate-300' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {items.length}
            </span>
          </button>
          <button
            onClick={() => {
              setCurrentTab('dashboard');
              setMobileMenuOpen(false);
            }}
            className={`w-full p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer ${
              currentTab === 'dashboard'
                ? isDark
                  ? 'bg-red-600 text-white'
                  : 'bg-orange-500 text-white shadow-xs'
                : isDark
                ? 'text-slate-300 hover:bg-white/[0.05]'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <BarChart2 className="w-4 h-4" />
              <span>Retention Telemetry</span>
            </div>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                isDark ? 'bg-black/40 text-slate-300' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {Math.round(revisitPercentage)}%
            </span>
          </button>
        </div>
      )}

      {/* Desktop Left Studio Sidebar */}
      <div className="hidden md:block shrink-0">
        <Navigation
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            if (tab === 'new' && sessionStep === 'feedback') {
              setSessionStep('input');
            }
          }}
          onStartNewSession={handleStartNewSession}
          onOpenManualCreate={() => setIsManualCreateOpen(true)}
          libraryCount={items.length}
          revisitPercentage={revisitPercentage}
          onQuickResurface={handleQuickResurface}
        />
      </div>

      {/* Main Studio Viewport Container */}
      <div className="flex-1 min-w-0 flex flex-col overflow-y-auto">
        <main className="flex-1">
          {currentTab === 'new' && (
            <>
              {sessionStep === 'input' && (
                <NewSessionView
                  key={sessionKey}
                  onSelectClaim={handleSelectClaim}
                />
              )}

              {sessionStep === 'action' && selectedClaim && (
                <CognitiveActionView
                  claim={selectedClaim}
                  videoTitle={videoTitle}
                  onBack={() => setSessionStep('input')}
                  onSubmitResponse={handleSubmitResponse}
                />
              )}

              {sessionStep === 'feedback' && selectedClaim && activePrompt && (
                <FeedbackView
                  claim={selectedClaim}
                  prompt={activePrompt}
                  userResponse={userResponse}
                  videoTitle={videoTitle}
                  onGoToLibrary={() => setCurrentTab('library')}
                  onNewSession={handleStartNewSession}
                  onGoToDashboard={() => setCurrentTab('dashboard')}
                  onItemSaved={handleItemSaved}
                />
              )}
            </>
          )}

          {currentTab === 'library' && (
            <LibraryView
              items={items}
              onNewSession={handleStartNewSession}
              onItemCreated={handleItemSaved}
              onUpdateItem={handleUpdateItem}
              onSaveRevisit={handleSaveRevisit}
              onDeleteRevisit={handleDeleteRevisit}
              onResetSeedData={handleResetSeedData}
              onDeleteItem={handleDeleteItem}
            />
          )}

          {currentTab === 'dashboard' && (
            <DashboardView
              items={items}
              onSaveRevisit={handleSaveRevisit}
              onNewSession={handleStartNewSession}
              onGoToLibrary={() => setCurrentTab('library')}
            />
          )}
        </main>

        {/* Studio Footer */}
        <footer
          className={`border-t py-5 px-6 text-xs transition-colors ${
            isDark
              ? 'border-white/[0.06] text-slate-500 bg-black/20'
              : 'border-slate-200/80 text-slate-500 bg-white/60'
          }`}
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isDark ? 'bg-red-500' : 'bg-orange-500'
                }`}
              ></span>
              <span
                className={`font-semibold ${
                  isDark ? 'text-slate-400' : 'text-slate-700'
                }`}
              >
                Recap Studio
              </span>
              <span>• Video Active Recall for Product Managers & Analysts</span>
            </div>
            <div
              className={`text-[11px] font-mono ${
                isDark ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              Active Recall beats passive summarization by 4.5x
            </div>
          </div>
        </footer>
      </div>

      {/* Global Quick Resurface Modal */}
      {quickResurfaceItem && (
        <ResurfaceModal
          item={quickResurfaceItem}
          onClose={() => setQuickResurfaceItem(null)}
          onSaveRevisit={handleSaveRevisit}
        />
      )}

      {/* Manual Synthesis Item Creation Modal */}
      {isManualCreateOpen && (
        <CreateItemModal
          onClose={() => setIsManualCreateOpen(false)}
          onItemCreated={(newItem) => {
            handleItemSaved(newItem);
            setIsManualCreateOpen(false);
            showToast('New synthesis item logged in Vault');
          }}
        />
      )}

      {/* Transient Action Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div
            className={`px-4 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2 shadow-2xl border ${
              isDark
                ? 'bg-[#111624] text-slate-100 border-white/10 shadow-black/60'
                : 'bg-white text-slate-800 border-slate-200 shadow-slate-900/10'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
