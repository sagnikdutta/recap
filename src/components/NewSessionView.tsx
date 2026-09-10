import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  ArrowRight,
  Clock,
  Tag,
  FileText,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Film,
  Search,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Check,
  BookOpen,
  ListOrdered,
  Video,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';
import { Claim, TranscriptSegment } from '../types';
import { SAMPLE_TRANSCRIPTS, SampleTranscript } from '../data/sampleTranscripts';
import { useTheme } from '../context/ThemeContext';

interface NewSessionViewProps {
  onSelectClaim: (claim: Claim, videoTitle: string) => void;
}

export const NewSessionView: React.FC<NewSessionViewProps> = ({ onSelectClaim }) => {
  const { isDark } = useTheme();

  // Active sample or custom video
  const [selectedSample, setSelectedSample] = useState<SampleTranscript>(SAMPLE_TRANSCRIPTS[1]); // Elena Verna by default
  const [videoTitle, setVideoTitle] = useState(selectedSample.title);
  const [speakerName, setSpeakerName] = useState(selectedSample.speaker);
  const [videoDuration, setVideoDuration] = useState(selectedSample.duration);
  const [transcript, setTranscript] = useState(selectedSample.transcript);

  // YouTube Ingestion State
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isFetchingYoutube, setIsFetchingYoutube] = useState(false);
  const [youtubeError, setYoutubeError] = useState<string | null>(null);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [currentEmbedUrl, setCurrentEmbedUrl] = useState<string | null>(null);
  const [youtubeSuccessMsg, setYoutubeSuccessMsg] = useState<string | null>(null);

  // Summary & Takeaways State
  const [videoSummary, setVideoSummary] = useState<string>(
    selectedSample.summary ||
      'Elena Verna dissects the mechanics of B2B Product-Led Growth, demonstrating why treating PLG merely as a self-serve checkout page causes catastrophic expansion stall.'
  );
  const [videoTakeaways, setVideoTakeaways] = useState<string[]>(
    selectedSample.takeaways || [
      'Premature paywalls on collaboration workflows destroy organic expansion loops by 40%.',
      'Monetize enterprise governance, data security, and audit controls — never initial team invites.',
      '80% of downstream churn stems from missing collaborative milestones, not initial signup counts.',
      'A retention curve that fails to flatten before Day 30 cannot be rescued by pricing gimmicks.'
    ]
  );

  // Timestamped Segments
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>(() =>
    parseSegmentsFromText(selectedSample.transcript)
  );

  // Active Dock Tab
  const [activeTab, setActiveTab] = useState<'claims' | 'summary' | 'transcript' | 'raw'>('claims');

  // Search in Transcript
  const [transcriptSearch, setTranscriptSearch] = useState('');

  // Copy Feedback states
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedTranscript, setCopiedTranscript] = useState(false);

  // Simulated Player state for sample videos
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeSec, setCurrentTimeSec] = useState(522); // 08:42 in seconds
  const totalDurationSec = 2280; // 38 mins
  const [activeSegmentSec, setActiveSegmentSec] = useState<number | null>(null);

  // Extraction state for manual transcript
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedClaims, setExtractedClaims] = useState<Claim[]>(
    selectedSample.defaultClaims || []
  );

  // Claim CRUD state
  const [isAddingClaim, setIsAddingClaim] = useState(false);
  const [newClaimText, setNewClaimText] = useState('');
  const [newClaimTimestamp, setNewClaimTimestamp] = useState('08:42');
  const [newClaimTag, setNewClaimTag] = useState('Product Strategy');

  const [editingClaimIndex, setEditingClaimIndex] = useState<number | null>(null);
  const [editClaimText, setEditClaimText] = useState('');
  const [editClaimTimestamp, setEditClaimTimestamp] = useState('');
  const [editClaimTag, setEditClaimTag] = useState('');

  // Helper: Parse segments from formatted transcript text
  function parseSegmentsFromText(text: string): TranscriptSegment[] {
    const segments: TranscriptSegment[] = [];
    const regex = /\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*([^[]+)/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const rawTime = match[1];
      const lineText = match[2].trim();
      if (lineText) {
        const parts = rawTime.split(':').map(Number);
        let sec = 0;
        if (parts.length === 2) {
          sec = parts[0] * 60 + parts[1];
        } else if (parts.length === 3) {
          sec = parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
        segments.push({ timestamp: rawTime, seconds: sec, text: lineText });
      }
    }

    if (segments.length === 0 && text.trim()) {
      const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 15);
      lines.forEach((line, idx) => {
        const sec = idx * 30;
        const mins = Math.floor(sec / 60);
        const rem = sec % 60;
        const timeStr = `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
        segments.push({ timestamp: timeStr, seconds: sec, text: line });
      });
    }

    return segments;
  }

  // Filtered segments based on search
  const filteredSegments = useMemo(() => {
    if (!transcriptSearch.trim()) return transcriptSegments;
    const query = transcriptSearch.toLowerCase();
    return transcriptSegments.filter((seg) =>
      seg.text.toLowerCase().includes(query) || seg.timestamp.includes(query)
    );
  }, [transcriptSegments, transcriptSearch]);

  // YouTube Ingestion Handler
  const handleFetchYoutube = async (overrideUrl?: string) => {
    const targetUrl = (overrideUrl || youtubeUrl).trim();
    if (!targetUrl) {
      setYoutubeError('Please paste a valid YouTube URL first.');
      return;
    }

    setIsFetchingYoutube(true);
    setYoutubeError(null);
    setYoutubeSuccessMsg(null);

    try {
      const response = await fetch('/api/fetch-youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch YouTube transcript and summary.');
      }

      // Populate all states automatically
      setCurrentVideoId(data.videoId);
      setCurrentEmbedUrl(data.embedUrl);
      setVideoTitle(data.videoTitle || 'YouTube Video Analysis');
      setSpeakerName(data.speaker || 'YouTube Speaker');
      setVideoDuration(data.duration || '15:00');
      setTranscript(data.transcript || '');
      setTranscriptSegments(data.segments || parseSegmentsFromText(data.transcript || ''));
      setVideoSummary(data.summary || '');
      setVideoTakeaways(data.takeaways || []);
      setExtractedClaims(data.claims || []);
      setActiveTab('claims');
      setYoutubeSuccessMsg(`Successfully extracted transcript, timestamps, summary, and ${data.claims?.length || 0} claims!`);
      setError(null);
    } catch (err: any) {
      console.error('YouTube ingestion error:', err);
      setYoutubeError(err.message || 'Unable to fetch video transcript. Check the link or try another.');
    } finally {
      setIsFetchingYoutube(false);
    }
  };

  // Switch to a curated sample talk
  const handleSelectSample = (sample: SampleTranscript) => {
    setSelectedSample(sample);
    setCurrentVideoId(null);
    setCurrentEmbedUrl(null);
    setVideoTitle(`${sample.speaker}: ${sample.title}`);
    setSpeakerName(sample.speaker);
    setVideoDuration(sample.duration);
    setTranscript(sample.transcript);
    setTranscriptSegments(parseSegmentsFromText(sample.transcript));
    setVideoSummary(sample.summary || `Analysis of ${sample.title} by ${sample.speaker}.`);
    setVideoTakeaways(sample.takeaways || ['High-leverage focus separates strategic PMs from delivery taskmasters.']);
    setExtractedClaims(sample.defaultClaims || []);
    setIsPlaying(false);
    setCurrentTimeSec(195);
    setYoutubeSuccessMsg(null);
    setYoutubeError(null);
    setError(null);
  };

  // Convert seconds to mm:ss format
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Jump player to specific timestamp
  const handleSeekTo = (timestampStr: string, secValue?: number) => {
    let seconds = secValue;
    if (seconds === undefined) {
      const match = timestampStr.match(/(\d+):(\d+)/);
      if (match) {
        seconds = parseInt(match[1]) * 60 + parseInt(match[2]);
      } else {
        seconds = 0;
      }
    }

    setCurrentTimeSec(seconds);
    setActiveSegmentSec(seconds);

    if (currentVideoId) {
      setCurrentEmbedUrl(`https://www.youtube.com/embed/${currentVideoId}?start=${seconds}&autoplay=1&rel=0`);
    } else {
      setIsPlaying(true);
    }
  };

  // Copy Summary to clipboard
  const handleCopySummary = () => {
    const textToCopy = `${videoTitle}\nSpeaker: ${speakerName}\n\nEXECUTIVE SUMMARY:\n${videoSummary}\n\nKEY TAKEAWAYS:\n${videoTakeaways.map((t, i) => `${i + 1}. ${t}`).join('\n')}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  // Copy Full Transcript to clipboard
  const handleCopyTranscript = () => {
    navigator.clipboard.writeText(transcript);
    setCopiedTranscript(true);
    setTimeout(() => setCopiedTranscript(false), 2000);
  };

  // Handlers for Claim CRUD
  const handleAddClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClaimText.trim()) return;
    const newClaim: Claim = {
      id: `custom-claim-${Date.now()}`,
      claimText: newClaimText.trim(),
      timestampOrRef: newClaimTimestamp.trim() || 'Custom Ref',
      topicTag: newClaimTag.trim() || 'Key Insight',
    };
    setExtractedClaims((prev) => [newClaim, ...prev]);
    setNewClaimText('');
    setIsAddingClaim(false);
  };

  const handleStartEditClaim = (index: number, claim: Claim) => {
    setEditingClaimIndex(index);
    setEditClaimText(claim.claimText);
    setEditClaimTimestamp(claim.timestampOrRef);
    setEditClaimTag(claim.topicTag);
  };

  const handleSaveEditClaim = (index: number) => {
    if (!editClaimText.trim()) return;
    setExtractedClaims((prev) =>
      prev.map((c, i) =>
        i === index
          ? {
              ...c,
              claimText: editClaimText.trim(),
              timestampOrRef: editClaimTimestamp.trim() || c.timestampOrRef,
              topicTag: editClaimTag.trim() || c.topicTag,
            }
          : c
      )
    );
    setEditingClaimIndex(null);
  };

  const handleDeleteClaim = (index: number) => {
    setExtractedClaims((prev) => prev.filter((_, i) => i !== index));
  };

  // Extract claims via server API for manual transcript
  const handleExtractClaims = async () => {
    if (!transcript.trim()) {
      setError('Please provide a video transcript to extract claims.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/extract-claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: transcript.trim(),
          videoTitle: videoTitle.trim() || selectedSample.title,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to extract claims.');
      }

      const data = await response.json();
      if (Array.isArray(data.claims) && data.claims.length > 0) {
        setExtractedClaims(data.claims);
        setActiveTab('claims');
      } else {
        throw new Error('No distinct claims could be extracted.');
      }
    } catch (err: any) {
      console.error('Extraction error:', err);
      setError(err.message || 'An error occurred during analysis.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-full p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Context */}
      <div
        className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 transition-colors ${
          isDark ? 'border-b border-white/[0.08]' : 'border-b border-slate-200/80'
        }`}
      >
        <div>
          <h1
            className={`text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            <Film className={`w-5 h-5 ${isDark ? 'text-red-500' : 'text-orange-500'}`} />
            <span>Video Learning Studio</span>
          </h1>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Paste any YouTube URL or choose a featured talk. Recap extracts transcripts, timestamps, executive summary, and testable claims automatically.
          </p>
        </div>

        {/* Quick Sample Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          <span
            className={`text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap mr-1 ${
              isDark ? 'text-slate-500' : 'text-slate-400'
            }`}
          >
            Curated Talks:
          </span>
          {SAMPLE_TRANSCRIPTS.map((sample) => {
            const isSelected = !currentVideoId && selectedSample.id === sample.id;
            return (
              <button
                key={sample.id}
                onClick={() => handleSelectSample(sample)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? isDark
                      ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                      : 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : isDark
                    ? 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white border border-white/[0.06]'
                    : 'bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200 shadow-2xs'
                }`}
              >
                {sample.speaker}
              </button>
            );
          })}
        </div>
      </div>

      {/* 🌟 AUTOMATED YOUTUBE INGESTION BAR */}
      <div
        id="youtube-url-ingestion-box"
        className={`p-4 sm:p-5 rounded-3xl border transition-all duration-300 relative overflow-hidden ${
          isDark
            ? 'bg-gradient-to-r from-[#121624] via-[#0F1420] to-[#14101A] border-white/[0.09] shadow-xl'
            : 'bg-gradient-to-r from-orange-50/70 via-white to-amber-50/50 border-orange-200/80 shadow-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-xl flex items-center justify-center text-white shadow-sm ${
                isDark ? 'bg-red-600' : 'bg-red-500'
              }`}
            >
              <Video className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Auto-Ingest YouTube Video
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                    isDark
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-red-50 text-red-600 border border-red-200 font-semibold'
                  }`}
                >
                  Instant Pipeline
                </span>
              </div>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Automatically fetches video transcript, timestamp markers, AI executive summary, and 3–5 recall claims.
              </p>
            </div>
          </div>

          {/* Quick example button */}
          <div className="flex items-center gap-1.5 self-start sm:self-center">
            <span className={`text-[10px] uppercase font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Try:
            </span>
            <button
              type="button"
              onClick={() => {
                setYoutubeUrl('https://www.youtube.com/watch?v=UF8uR6Z6KLc');
                handleFetchYoutube('https://www.youtube.com/watch?v=UF8uR6Z6KLc');
              }}
              className={`text-[11px] px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                isDark
                  ? 'bg-white/[0.04] text-slate-300 hover:text-white border-white/[0.08]'
                  : 'bg-white text-slate-700 hover:text-slate-900 border-slate-200 shadow-2xs'
              }`}
            >
              Steve Jobs Stanford Talk
            </button>
            <button
              type="button"
              onClick={() => {
                setYoutubeUrl('https://www.youtube.com/watch?v=zF_K4b9i9kQ');
                handleFetchYoutube('https://www.youtube.com/watch?v=zF_K4b9i9kQ');
              }}
              className={`text-[11px] px-2 py-0.5 rounded-lg border transition-colors cursor-pointer hidden md:inline-block ${
                isDark
                  ? 'bg-white/[0.04] text-slate-300 hover:text-white border-white/[0.08]'
                  : 'bg-white text-slate-700 hover:text-slate-900 border-slate-200 shadow-2xs'
              }`}
            >
              Elena Verna PLG
            </button>
          </div>
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleFetchYoutube();
          }}
          className="flex flex-col sm:flex-row items-center gap-2"
        >
          <div className="relative flex-1 w-full">
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => {
                setYoutubeUrl(e.target.value);
                if (youtubeError) setYoutubeError(null);
              }}
              placeholder="Paste YouTube Video URL (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...)"
              disabled={isFetchingYoutube}
              className={`w-full pl-3.5 pr-10 py-2.5 rounded-2xl text-xs font-mono transition-all focus:outline-none ${
                isDark
                  ? 'bg-black/50 border border-white/[0.1] text-white placeholder-slate-500 focus:border-red-500'
                  : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-orange-500 shadow-2xs'
              }`}
            />
            {youtubeUrl && (
              <button
                type="button"
                onClick={() => setYoutubeUrl('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isFetchingYoutube || !youtubeUrl.trim()}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md whitespace-nowrap ${
              isFetchingYoutube || !youtubeUrl.trim()
                ? isDark
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : isDark
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
                : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/30'
            }`}
          >
            {isFetchingYoutube ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Ingesting Video & Transcript...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto-Analyze Video</span>
              </>
            )}
          </button>
        </form>

        {/* Error Feedback */}
        {youtubeError && (
          <div
            className={`mt-3 p-3 rounded-xl border text-xs flex items-start gap-2 ${
              isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Ingestion notice:</span> {youtubeError}
            </div>
          </div>
        )}

        {/* Success Feedback */}
        {youtubeSuccessMsg && (
          <div
            className={`mt-3 p-3 rounded-xl border text-xs flex items-center justify-between gap-2 animate-in fade-in ${
              isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{youtubeSuccessMsg}</span>
            </div>
            <span className="font-mono text-[10px] opacity-75">Ready to Recall</span>
          </div>
        )}
      </div>

      {/* Main Studio Grid: Video Player on Left, Claims / Summary / Transcript Dock on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Video Theater Canvas (7 or 8 columns) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {/* Ambient Video Frame with cinematic styling */}
          <div
            className={`relative rounded-3xl overflow-hidden transition-all ${
              isDark ? 'bg-[#0F131C] border border-white/[0.08] shadow-2xl' : 'bg-white border border-slate-200/90 shadow-sm'
            }`}
          >
            {/* 16:9 Aspect Ratio Video Viewport */}
            <div className="aspect-video w-full bg-black relative flex flex-col justify-between overflow-hidden">
              {currentVideoId ? (
                // Interactive YouTube Iframe Player
                <iframe
                  id="recap-yt-iframe"
                  src={currentEmbedUrl || `https://www.youtube.com/embed/${currentVideoId}?autoplay=0&enablejsapi=1&rel=0`}
                  title={videoTitle}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                // Sample Video Stage Simulation
                <div className="w-full h-full bg-gradient-to-br from-slate-950 via-[#0E131E] to-[#141926] relative flex flex-col justify-between p-6">
                  {/* Subtle Ambient Backlight Glow */}
                  <div
                    className={`absolute inset-0 bg-radial ${
                      isDark ? 'from-red-600/10' : 'from-orange-500/15'
                    } via-transparent to-transparent opacity-60 pointer-events-none`}
                  />

                  {/* Video Player Header Overlay */}
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-white text-[10px] font-bold tracking-wider uppercase flex items-center gap-1 ${
                          isDark ? 'bg-red-600' : 'bg-orange-500'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                        PM MASTERCLASS
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-white/10 text-slate-300 text-[10px] font-mono">
                        {selectedSample.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-400 bg-black/40 px-2 py-0.5 rounded-md backdrop-blur-md">
                        {selectedSample.views}
                      </span>
                    </div>
                  </div>

                  {/* Center Playback Graphic / Speaker Hero Stage */}
                  <div className="relative z-10 my-auto text-center space-y-3 py-4">
                    <div
                      className={`inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl text-white backdrop-blur-md border shadow-2xl transition-all hover:scale-105 cursor-pointer ${
                        isDark
                          ? 'bg-white/10 hover:bg-red-600/90 border-white/15'
                          : 'bg-white/15 hover:bg-orange-500/90 border-white/20'
                      }`}
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? (
                        <Pause className="w-8 h-8 fill-current" />
                      ) : (
                        <Play className="w-8 h-8 fill-current ml-1" />
                      )}
                    </div>
                    <div>
                      <div className="text-lg sm:text-xl font-bold text-white tracking-tight">
                        {videoTitle}
                      </div>
                      <div className="text-xs text-slate-300 mt-0.5">
                        {speakerName} • {selectedSample.context}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Video Controls Bar */}
                  <div className="relative z-10 space-y-2 pt-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent -mx-6 -mb-6 px-6 pb-4">
                    {/* Scrubber with Claim Timestamp Markers */}
                    <div className="relative w-full group/scrubber cursor-pointer py-1">
                      <div className="w-full h-1.5 group-hover/scrubber:h-2 rounded-full bg-white/20 transition-all overflow-hidden relative">
                        <div
                          className={`h-full rounded-full relative ${
                            isDark ? 'bg-red-600' : 'bg-orange-500'
                          }`}
                          style={{ width: `${(currentTimeSec / totalDurationSec) * 100}%` }}
                        />
                      </div>

                      {/* Extracted Claim Markers on Scrubber */}
                      {extractedClaims.map((c, i) => {
                        const match = c.timestampOrRef.match(/(\d+):(\d+)/);
                        const timestampSec = match
                          ? parseInt(match[1]) * 60 + parseInt(match[2])
                          : (i + 1) * 350;
                        const percent = Math.min(95, Math.max(5, (timestampSec / totalDurationSec) * 100));

                        return (
                          <div
                            key={c.id || i}
                            title={`Claim: ${c.claimText.slice(0, 50)}...`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSeekTo(c.timestampOrRef, timestampSec);
                            }}
                            style={{ left: `${percent}%` }}
                            className="absolute top-0 -translate-x-1/2 w-2 h-3.5 bg-amber-400 rounded-xs shadow-md ring-1 ring-black/50 hover:scale-125 transition-transform"
                          />
                        );
                      })}
                    </div>

                    {/* Control Icons & Timers */}
                    <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setIsPlaying(!isPlaying)}
                          className="hover:text-white transition-colors cursor-pointer"
                        >
                          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                        </button>
                        <button
                          onClick={() => setCurrentTimeSec(Math.max(0, currentTimeSec - 10))}
                          className="hover:text-white transition-colors cursor-pointer text-[11px] font-mono"
                          title="Rewind 10s"
                        >
                          -10s
                        </button>
                        <span className="font-mono text-[11px] text-slate-300">
                          {formatTime(currentTimeSec)} / {videoDuration}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-slate-400 font-mono">
                          Click amber markers to jump
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Video Context Footer */}
            <div
              className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isDark ? 'bg-[#0D1019] border-t border-white/[0.06]' : 'bg-slate-50/70 border-t border-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-sm ${
                    currentVideoId
                      ? isDark
                        ? 'bg-red-600'
                        : 'bg-red-500'
                      : isDark
                      ? 'bg-gradient-to-tr from-red-600 to-amber-500'
                      : 'bg-gradient-to-tr from-orange-500 to-amber-500'
                  }`}
                >
                  {speakerName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {speakerName}
                    </span>
                    <span
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                        isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700 font-bold'
                      }`}
                    >
                      ✓
                    </span>
                    {currentVideoId && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                        YouTube Live
                      </span>
                    )}
                  </div>
                  <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Duration: {videoDuration} • {transcriptSegments.length} timestamp markers
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'summary'
                      ? isDark
                        ? 'bg-red-600 text-white'
                        : 'bg-orange-500 text-white'
                      : isDark
                      ? 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 border border-white/[0.08]'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80 shadow-2xs'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>View Summary</span>
                </button>

                <button
                  onClick={() => setActiveTab('transcript')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'transcript'
                      ? isDark
                        ? 'bg-red-600 text-white'
                        : 'bg-orange-500 text-white'
                      : isDark
                      ? 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 border border-white/[0.08]'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80 shadow-2xs'
                  }`}
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                  <span>Timestamps ({transcriptSegments.length})</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Notice Banner */}
          <div
            className={`p-3.5 rounded-2xl flex items-center justify-between text-xs transition-colors ${
              isDark
                ? 'bg-white/[0.02] border border-white/[0.05] text-slate-400'
                : 'bg-orange-50/60 border border-orange-200/70 text-slate-700 shadow-2xs'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isDark ? 'bg-red-500' : 'bg-orange-500'}`}></span>
              Recap avoids passive summarization — click any claim on the right to commit original thinking.
            </span>
            <span className={`font-mono text-[11px] ${isDark ? 'text-slate-500' : 'text-orange-700 font-semibold'}`}>
              Spaced Synthesis
            </span>
          </div>
        </div>

        {/* Right Column: Claims Queue, Summary, & Transcript Dock (5 or 4 columns) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          {/* Tabs: 1. Core Claims | 2. Summary | 3. Timestamps | 4. Raw Input */}
          <div
            className={`grid grid-cols-4 p-1 rounded-2xl border transition-colors ${
              isDark ? 'bg-[#0D1019] border-white/[0.08]' : 'bg-slate-100/90 border-slate-200/80 shadow-2xs'
            }`}
          >
            <button
              onClick={() => setActiveTab('claims')}
              className={`py-1.5 px-1 text-[11px] font-semibold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'claims'
                  ? isDark
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-white text-slate-900 shadow-xs font-bold'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Claims ({extractedClaims.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('summary')}
              className={`py-1.5 px-1 text-[11px] font-semibold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'summary'
                  ? isDark
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-white text-slate-900 shadow-xs font-bold'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3 h-3" />
              <span>Summary</span>
            </button>

            <button
              onClick={() => setActiveTab('transcript')}
              className={`py-1.5 px-1 text-[11px] font-semibold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'transcript'
                  ? isDark
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-white text-slate-900 shadow-xs font-bold'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Timestamps</span>
            </button>

            <button
              onClick={() => setActiveTab('raw')}
              className={`py-1.5 px-1 text-[11px] font-semibold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'raw'
                  ? isDark
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-white text-slate-900 shadow-xs font-bold'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>Manual</span>
            </button>
          </div>

          {/* TAB 1: EXTRACTED KEY CLAIMS QUEUE */}
          {activeTab === 'claims' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Select ONE claim to synthesize:
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingClaim(!isAddingClaim)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-all cursor-pointer ${
                    isDark
                      ? 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 border-white/[0.1]'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-2xs'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5 text-orange-500" />
                  <span>{isAddingClaim ? 'Cancel' : 'Add Claim'}</span>
                </button>
              </div>

              {/* Inline Add Custom Claim Form */}
              {isAddingClaim && (
                <form
                  onSubmit={handleAddClaim}
                  className={`p-4 rounded-2xl border space-y-3 shadow-md animate-in fade-in duration-150 ${
                    isDark ? 'bg-[#0F131D] border-red-500/30' : 'bg-orange-50/50 border-orange-200'
                  }`}
                >
                  <div className="text-xs font-bold text-orange-500 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Custom Claim</span>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold mb-1 text-slate-400">
                      Claim Statement / Thesis
                    </label>
                    <textarea
                      rows={2}
                      value={newClaimText}
                      onChange={(e) => setNewClaimText(e.target.value)}
                      placeholder="e.g. Freemium without virality burns CAC faster than sales-led..."
                      className={`w-full px-3 py-2 rounded-xl border text-xs resize-y ${
                        isDark
                          ? 'bg-black/40 border-white/10 text-white placeholder-slate-600 focus:border-red-500'
                          : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-orange-500'
                      }`}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold mb-1 text-slate-400">Timestamp</label>
                      <input
                        type="text"
                        value={newClaimTimestamp}
                        onChange={(e) => setNewClaimTimestamp(e.target.value)}
                        placeholder="08:42"
                        className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono ${
                          isDark ? 'bg-black/40 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold mb-1 text-slate-400">Topic Tag</label>
                      <input
                        type="text"
                        value={newClaimTag}
                        onChange={(e) => setNewClaimTag(e.target.value)}
                        placeholder="Product Strategy"
                        className={`w-full px-2.5 py-1.5 rounded-lg border text-xs ${
                          isDark ? 'bg-black/40 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingClaim(false)}
                      className="px-3 py-1 rounded-lg text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={`px-3.5 py-1 rounded-lg text-xs font-bold text-white shadow cursor-pointer ${
                        isDark ? 'bg-red-600 hover:bg-red-500' : 'bg-orange-500 hover:bg-orange-600'
                      }`}
                    >
                      Save Claim
                    </button>
                  </div>
                </form>
              )}

              {extractedClaims.length === 0 ? (
                <div
                  className={`p-8 rounded-3xl border text-center space-y-3 ${
                    isDark ? 'bg-[#0D1019] border-white/[0.08]' : 'bg-white border-slate-200/90 shadow-sm'
                  }`}
                >
                  <Sparkles className={`w-8 h-8 mx-auto animate-pulse ${isDark ? 'text-slate-500' : 'text-orange-400'}`} />
                  <div className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                    No claims extracted yet
                  </div>
                  <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                    Paste a YouTube link above or choose a featured talk to analyze.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
                  {extractedClaims.map((claim, idx) => {
                    const isEditing = editingClaimIndex === idx;

                    return (
                      <div
                        key={claim.id || idx}
                        id={`claim-card-${idx}`}
                        className={`group p-4 rounded-2xl border transition-all duration-200 space-y-3 ${
                          isDark
                            ? 'bg-[#0F131D] hover:bg-[#141926] border-white/[0.08] hover:border-red-500/40 shadow-md'
                            : 'bg-white hover:bg-orange-50/20 border-slate-200/90 hover:border-orange-300 shadow-2xs hover:shadow-md'
                        }`}
                      >
                        {isEditing ? (
                          <div className="space-y-3">
                            <div className="text-xs font-bold text-orange-500">Edit Claim #{idx + 1}</div>
                            <textarea
                              rows={2}
                              value={editClaimText}
                              onChange={(e) => setEditClaimText(e.target.value)}
                              className={`w-full px-3 py-2 rounded-xl border text-xs resize-y ${
                                isDark ? 'bg-black/40 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900'
                              }`}
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={editClaimTimestamp}
                                onChange={(e) => setEditClaimTimestamp(e.target.value)}
                                placeholder="Timestamp"
                                className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono ${
                                  isDark ? 'bg-black/40 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900'
                                }`}
                              />
                              <input
                                type="text"
                                value={editClaimTag}
                                onChange={(e) => setEditClaimTag(e.target.value)}
                                placeholder="Topic Tag"
                                className={`px-2.5 py-1.5 rounded-lg border text-xs ${
                                  isDark ? 'bg-black/40 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900'
                                }`}
                              />
                            </div>
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingClaimIndex(null)}
                                className="px-2.5 py-1 text-xs text-slate-400 hover:text-white cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEditClaim(idx)}
                                className={`px-3 py-1 text-xs font-bold text-white rounded-lg cursor-pointer ${
                                  isDark ? 'bg-red-600' : 'bg-orange-500'
                                }`}
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleSeekTo(claim.timestampOrRef)}
                                  title="Jump video to this timestamp"
                                  className={`inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                                    isDark
                                      ? 'bg-red-500/10 hover:bg-red-500/25 text-red-400 border-red-500/20'
                                      : 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200 font-semibold'
                                  }`}
                                >
                                  <Clock className="w-3 h-3" />
                                  <span>{claim.timestampOrRef}</span>
                                </button>
                                <span
                                  className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md border ${
                                    isDark
                                      ? 'bg-white/[0.05] text-slate-400 border-white/[0.06]'
                                      : 'bg-slate-100 text-slate-600 border-slate-200'
                                  }`}
                                >
                                  <Tag className="w-3 h-3" />
                                  {claim.topicTag}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditClaim(idx, claim)}
                                  className="p-1 rounded text-slate-400 hover:text-slate-200 cursor-pointer"
                                  title="Edit Claim"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteClaim(idx)}
                                  className="p-1 rounded text-slate-400 hover:text-red-400 cursor-pointer"
                                  title="Delete Claim"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                                <span className={`text-[10px] font-mono ml-1 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                                  #{idx + 1}
                                </span>
                              </div>
                            </div>

                            {/* Claim statement */}
                            <blockquote
                              className={`text-sm font-medium leading-snug font-serif italic transition-colors ${
                                isDark ? 'text-slate-100 group-hover:text-white' : 'text-slate-800 group-hover:text-slate-950'
                              }`}
                            >
                              “{claim.claimText}”
                            </blockquote>

                            {/* Action Button */}
                            <div
                              className={`pt-2 flex items-center justify-between ${
                                isDark ? 'border-t border-white/[0.06]' : 'border-t border-slate-100'
                              }`}
                            >
                              <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                Active Recall Prompt
                              </span>
                              <button
                                id={`select-claim-btn-${idx}`}
                                onClick={() => onSelectClaim(claim, videoTitle)}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                                  isDark
                                    ? 'bg-white/[0.05] group-hover:bg-red-600 text-slate-200 group-hover:text-white border border-white/[0.1] group-hover:border-red-600'
                                    : 'bg-slate-50 group-hover:bg-orange-500 text-slate-700 group-hover:text-white border border-slate-200 group-hover:border-orange-500'
                                }`}
                              >
                                <span>Challenge & Synthesize</span>
                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EXECUTIVE SUMMARY & STRATEGIC TAKEAWAYS */}
          {activeTab === 'summary' && (
            <div
              className={`p-5 rounded-3xl border space-y-4 max-h-[620px] overflow-y-auto ${
                isDark ? 'bg-[#0D1019] border-white/[0.08]' : 'bg-white border-slate-200/90 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                <div>
                  <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Executive Synthesis
                  </h3>
                  <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    High-signal strategic overview & core thesis
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className={`px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 border transition-all cursor-pointer ${
                    isDark
                      ? 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 border-white/[0.1]'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                >
                  {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSummary ? 'Copied!' : 'Copy Summary'}</span>
                </button>
              </div>

              {/* Summary Text */}
              <div className="space-y-2.5 text-xs leading-relaxed">
                {videoSummary.split('\n\n').map((paragraph, pIdx) => (
                  <p
                    key={pIdx}
                    className={`font-serif leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-700'}`}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Strategic Takeaways Box */}
              {videoTakeaways && videoTakeaways.length > 0 && (
                <div
                  className={`p-4 rounded-2xl border space-y-2.5 ${
                    isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-orange-50/50 border-orange-200/70'
                  }`}
                >
                  <div className="text-[11px] font-bold uppercase tracking-wider text-orange-500 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>4 Strategic Takeaways</span>
                  </div>
                  <ul className="space-y-2">
                    {videoTakeaways.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                        <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action: Switch to Claims to Recall */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('claims')}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 text-white transition-all shadow-md cursor-pointer ${
                    isDark ? 'bg-red-600 hover:bg-red-500' : 'bg-orange-500 hover:bg-orange-600'
                  }`}
                >
                  <span>Select a Claim to Challenge</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: INTERACTIVE TIMESTAMPED TRANSCRIPT */}
          {activeTab === 'transcript' && (
            <div
              className={`p-4 rounded-3xl border space-y-3 max-h-[620px] flex flex-col ${
                isDark ? 'bg-[#0D1019] border-white/[0.08]' : 'bg-white border-slate-200/90 shadow-sm'
              }`}
            >
              {/* Header & Search */}
              <div className="space-y-2 shrink-0">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Timestamped Transcript ({filteredSegments.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyTranscript}
                    className={`px-2 py-0.5 rounded text-[11px] flex items-center gap-1 border transition-all cursor-pointer ${
                      isDark
                        ? 'bg-white/[0.05] text-slate-300 border-white/[0.1]'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {copiedTranscript ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedTranscript ? 'Copied' : 'Copy All'}</span>
                  </button>
                </div>

                {/* Filter Input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={transcriptSearch}
                    onChange={(e) => setTranscriptSearch(e.target.value)}
                    placeholder="Search words in transcript..."
                    className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs transition-colors focus:outline-none ${
                      isDark
                        ? 'bg-black/40 border border-white/[0.08] text-white placeholder-slate-600 focus:border-red-500'
                        : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-orange-500'
                    }`}
                  />
                  {transcriptSearch && (
                    <button
                      onClick={() => setTranscriptSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Scrollable Segment List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {filteredSegments.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    No transcript segments matching &ldquo;{transcriptSearch}&rdquo;.
                  </div>
                ) : (
                  filteredSegments.map((seg, sIdx) => {
                    const isActive = activeSegmentSec === seg.seconds;
                    return (
                      <div
                        key={sIdx}
                        onClick={() => handleSeekTo(seg.timestamp, seg.seconds)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer text-xs group ${
                          isActive
                            ? isDark
                              ? 'bg-red-950/40 border-red-500/50 text-white'
                              : 'bg-orange-50 border-orange-300 text-slate-900'
                            : isDark
                            ? 'bg-white/[0.02] hover:bg-white/[0.06] border-white/[0.05] text-slate-300'
                            : 'bg-slate-50/60 hover:bg-slate-100 border-slate-200/70 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${
                              isActive
                                ? 'bg-red-500 text-white'
                                : isDark
                                ? 'bg-white/10 text-slate-300 group-hover:text-red-400'
                                : 'bg-slate-200 text-slate-700 group-hover:text-orange-600'
                            }`}
                          >
                            <Play className="w-2.5 h-2.5 fill-current" />
                            {seg.timestamp}
                          </span>
                          <span className="text-[10px] text-slate-500">Jump to video</span>
                        </div>
                        <p className="leading-relaxed font-sans">{seg.text}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 4: MANUAL / RAW INPUT */}
          {activeTab === 'raw' && (
            <div
              className={`p-4 rounded-3xl border space-y-4 ${
                isDark ? 'bg-[#0D1019] border-white/[0.08]' : 'bg-white border-slate-200/90 shadow-sm'
              }`}
            >
              <div>
                <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Video Title or Context
                </label>
                <input
                  type="text"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="e.g. Elena Verna on B2B Product-Led Growth"
                  className={`w-full px-3 py-2 rounded-xl text-xs transition-colors focus:outline-none ${
                    isDark
                      ? 'bg-black/40 border border-white/[0.08] text-white placeholder-slate-600 focus:border-red-500'
                      : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-orange-500'
                  }`}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`block text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Pasted Transcript / Captions
                  </label>
                  <span className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {transcript.length.toLocaleString()} chars
                  </span>
                </div>
                <textarea
                  rows={10}
                  value={transcript}
                  onChange={(e) => {
                    setTranscript(e.target.value);
                    setTranscriptSegments(parseSegmentsFromText(e.target.value));
                  }}
                  placeholder="Paste copied video transcript or raw captions with timestamps [08:42]..."
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-mono leading-relaxed transition-colors resize-y focus:outline-none ${
                    isDark
                      ? 'bg-black/40 border border-white/[0.08] text-slate-200 placeholder-slate-600 focus:border-red-500'
                      : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-orange-500'
                  }`}
                />
              </div>

              {error && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                    isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-700'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>{error}</div>
                </div>
              )}

              <button
                onClick={handleExtractClaims}
                disabled={isLoading || !transcript.trim()}
                className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                  isLoading || !transcript.trim()
                    ? isDark
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : isDark
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/25'
                    : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/25'
                }`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Extracting Claims with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Extract 3–5 Key Claims</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
