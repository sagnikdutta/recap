export type CognitivePromptType = 'Decide' | 'Apply' | 'Remember' | 'Build';

export interface Claim {
  id: string;
  claimText: string;
  timestampOrRef: string;
  topicTag: string;
}

export interface CognitivePrompt {
  claimId: string;
  type: CognitivePromptType;
  prompt: string;
  typeDescription: string;
}

export interface FeedbackResult {
  engagementEvaluation: 'specific' | 'generic';
  engagementExplanation: string;
  colleagueReaction: string;
}

export interface RevisitLog {
  id: string;
  timestamp: number;
  usedSince: boolean;
  changedThoughts?: string;
}

export interface SavedItem {
  id: string;
  createdAt: number;
  videoTitle?: string;
  claimText: string;
  timestampOrRef: string;
  topicTag: string;
  promptType: CognitivePromptType;
  promptText: string;
  userResponse: string;
  feedback: FeedbackResult;
  revisits: RevisitLog[];
}

export interface DashboardStats {
  totalItems: number;
  totalRevisitedItems: number;
  revisitPercentage: number;
  neverRevisitedItems: SavedItem[];
}

export interface TranscriptSegment {
  timestamp: string;
  seconds: number;
  text: string;
}

export interface YouTubeAnalysisResult {
  videoId: string;
  videoTitle: string;
  speaker: string;
  thumbnailUrl: string;
  embedUrl: string;
  duration: string;
  transcript: string;
  segments: TranscriptSegment[];
  summary: string;
  takeaways: string[];
  claims: Claim[];
  source?: string;
  note?: string;
}

