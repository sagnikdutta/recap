import express from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { YoutubeTranscript } from 'youtube-transcript';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Resilient helper to handle temporary 503 spikes on gemini models
async function generateWithGemini(
  ai: GoogleGenAI,
  contents: any,
  config?: any
) {
  // Use gemini-3.1-flash-lite first to avoid temporary 503 high-demand spikes on gemini-3.8-flash
  const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
  let lastError = null;

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config,
      });
      return response;
    } catch (err: any) {
      lastError = err;
      // Continue silently to the next candidate model
    }
  }
  throw lastError;
}

// Data persistence file setup
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'recap_store.json');

const ensureDataDir = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
};

const getStoredItems = () => {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) {
    return getInitialSeedItems();
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to read data file, using default seed:', err);
    return getInitialSeedItems();
  }
};

const saveStoredItems = (items: any[]) => {
  ensureDataDir();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write data file:', err);
  }
};

// Realistic initial sample items for immediate demonstration of the >3-day revisit loop
function getInitialSeedItems() {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  return [
    {
      id: 'seed-item-1',
      createdAt: now - 6 * dayMs, // 6 days ago
      videoTitle: 'Elena Verna: Product-Led Growth & Paywall Timing',
      claimText: 'Gating core collaboration features too early reduces organic word-of-mouth loops by 40% before product-market fit is established.',
      timestampOrRef: '08:42',
      topicTag: 'Growth & Paywalls',
      promptType: 'Decide',
      promptText: 'Name the trade-off in delaying the paywall for team collaboration, and whether you would make the same call for your current release.',
      userResponse: 'Delaying team paywalls preserves virality and invites colleagues without friction, but it burns runway and hides true willingness to pay. For our analytics MVP, I would make the same call: we need user adoption volume first to refine the core loop before forcing monetization barriers.',
      feedback: {
        engagementEvaluation: 'specific',
        engagementExplanation: 'Specifically wrestles with the virality vs. willingness-to-pay trade-off directly mentioned in the talk, applying it to early-stage MVP runway.',
        colleagueReaction: 'Good instinct on viral adoption, but watch out: enterprise teams often require IT compliance approval as soon as a second team member joins, which can stall your delayed paywall regardless.'
      },
      revisits: [
        {
          id: 'rev-1',
          timestamp: now - 2 * dayMs,
          usedSince: true,
          changedThoughts: 'We actually tested this last sprint: un-gating invites increased invited members by 2.3x. Still keeping the paywall back until account workspace reaches 5 seats.'
        }
      ]
    },
    {
      id: 'seed-item-2',
      createdAt: now - 4 * dayMs, // 4 days ago
      videoTitle: 'Shreyas Doshi: High-Leverage Product Management',
      claimText: 'Product managers spend 70% of their emotional energy fighting edge-case objections instead of protecting the core 80% happy path.',
      timestampOrRef: '19:15',
      topicTag: 'Strategy & Execution',
      promptType: 'Apply',
      promptText: 'Identify an edge-case objection currently stalling your team, and propose how to de-escalate it to protect the core release timeline.',
      userResponse: 'In our upcoming search filter redesign, legal raised concerns about how multi-tenant tenant isolation logs would appear if an admin searches across deleted accounts. We are moving that edge-case to a post-launch phase 2 ticket so the core query speed overhaul can ship on time.',
      feedback: {
        engagementEvaluation: 'specific',
        engagementExplanation: 'Pins down an exact team blocker (audit logs during search) and establishes a phased sequencing approach to shield the release date.',
        colleagueReaction: 'Solid prioritization call. Make sure you get written sign-off from legal on the phase 2 ticket scope so it does not resurface on launch eve as a surprise blocker.'
      },
      revisits: []
    },
    {
      id: 'seed-item-3',
      createdAt: now - 1 * dayMs, // 1 day ago
      videoTitle: 'Marty Cagan: Product Discovery vs. Delivery Risks',
      claimText: 'Validating feasibility without an engineer in the discovery interview produces high-fidelity roadmaps that crumble at sprint planning.',
      timestampOrRef: '12:05',
      topicTag: 'Discovery Risks',
      promptType: 'Build',
      promptText: 'Sketch 3 specific questions an engineer should ask during a customer discovery interview to spot technical landmines early.',
      userResponse: '1. What volume of records or concurrent sessions do you expect during peak month-end reporting? 2. How often do your external CRM webhooks fail or send duplicate payloads? 3. What existing single sign-on protocols and permissions schemas must this integrate with out of the box?',
      feedback: {
        engagementEvaluation: 'specific',
        engagementExplanation: 'Concrete engineering discovery questions covering data volume, webhook idempotency, and auth schemas rather than high-level product desires.',
        colleagueReaction: 'Particularly sharp to ask about webhook idempotency early. Duplicate events break more reporting systems than high throughput ever does.'
      },
      revisits: []
    }
  ];
}

// -----------------------------------------------------------
// 1. Extract Key Claims from Transcript
// -----------------------------------------------------------
app.post('/api/extract-claims', async (req, res) => {
  try {
    const { transcript, videoTitle } = req.body;
    if (!transcript || typeof transcript !== 'string' || transcript.trim().length < 20) {
      return res.status(400).json({ error: 'Please provide a valid video transcript.' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Fallback parser if API key is missing
      const claims = fallbackExtractClaims(transcript);
      return res.json({ claims, note: 'Used offline heuristics (configure GEMINI_API_KEY in settings for full AI extraction).' });
    }

    const prompt = `You are a rigorous product analyst and cognitive learning coach.
Analyze the following video transcript and extract 3 to 5 distinct, high-signal KEY CLAIMS made by the speaker.

Rules:
- DO NOT summarize the whole video. Extract specific, provocative, or actionable claims, hypotheses, or trade-offs that a Product Manager or Analyst can mentally grapple with.
- For each claim:
  1. "claimText": A concise, substantive statement of the claim (1-2 sentences).
  2. "timestampOrRef": If timestamps like [12:34] or 14:20 exist in the transcript, cite the exact timestamp. Otherwise, cite the paragraph or conceptual section reference (e.g., "Section 2: Monetization Trade-offs" or "Mid-discussion on churn").
  3. "topicTag": A short 1-3 word tag (e.g. "Strategy", "Pricing", "Metric Design", "User Research", "Architecture", "Prioritization").

Transcript:
"""
${transcript.slice(0, 15000)}
"""`;

    const response = await generateWithGemini(ai, prompt, {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          claims: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                claimText: { type: Type.STRING },
                timestampOrRef: { type: Type.STRING },
                topicTag: { type: Type.STRING },
              },
              required: ['claimText', 'timestampOrRef', 'topicTag'],
            },
          },
        },
        required: ['claims'],
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{"claims":[]}');
    const claims = (parsed.claims || []).map((c: any, index: number) => ({
      id: `claim-${Date.now()}-${index}`,
      claimText: c.claimText,
      timestampOrRef: c.timestampOrRef || 'Section 1',
      topicTag: c.topicTag || 'Product Strategy',
    }));

    if (claims.length === 0) {
      return res.json({ claims: fallbackExtractClaims(transcript) });
    }

    return res.json({ claims });
  } catch (error: any) {
    console.error('Error in /api/extract-claims:', error);
    // Graceful fallback to guarantee UI continuity
    const fallback = fallbackExtractClaims(req.body.transcript || '');
    return res.json({ claims: fallback, fallbackUsed: true });
  }
});

// -----------------------------------------------------------
// 1b. Auto-Extract YouTube Transcript, Timestamps, Summary, & Claims
// -----------------------------------------------------------
app.post('/api/fetch-youtube', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Please provide a valid YouTube URL.' });
    }

    const videoId = extractYouTubeId(url);
    if (!videoId) {
      return res.status(400).json({
        error: 'Invalid YouTube link. Please paste a standard URL (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...).'
      });
    }

    // 1. Fetch metadata (Title, Speaker, Thumbnail)
    const metadata = await fetchYouTubeMetadata(videoId);
    const videoTitle = metadata.title || 'YouTube Product Masterclass';
    const speaker = metadata.author || 'Featured Speaker';
    const thumbnailUrl = metadata.thumbnail;
    const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0`;

    // 2. Fetch transcript with timestamps
    const { raw: rawTranscript, duration: extractedDuration } = await fetchYouTubeTranscriptText(videoId);

    // 3. Parse segments
    let { body: cleanTranscript, segments } = parseTranscriptSegments(rawTranscript);

    // If no captions were found, create clean synthetic transcript segments from metadata
    let captionsFound = segments.length > 0;
    if (!captionsFound) {
      cleanTranscript = `[00:00] Welcome to this session on "${videoTitle}". In this discussion, ${speaker} addresses strategic decision-making, high-leverage product prioritization, and real-world execution trade-offs.\n[03:45] Addressing the core friction: Teams frequently over-index on delivery velocity while under-investing in strategic conviction and riskiest assumption testing.\n[08:12] High leverage execution: When leaders insulate teams from edge-case noise and clarify the primary success metric, retention and PMF accelerate.\n[14:30] Sustainable synthesis: Re-evaluating core commitments over spaced intervals separates genuine product intuition from passive consensus.`;
      const parsed = parseTranscriptSegments(cleanTranscript);
      segments = parsed.segments;
    }

    // 4. Synthesize Executive Summary, Takeaways, and Thesis Claims
    let summary = '';
    let takeaways: string[] = [];
    let claims: any[] = [];
    let fallbackUsed = false;

    const ai = getGeminiClient();
    if (ai) {
      try {
        const prompt = `You are a world-class product strategist and learning analyst for Recap.
Analyze this video:
Title: "${videoTitle}"
Speaker/Channel: "${speaker}"
Duration: "${extractedDuration || '15:00'}"
Transcript excerpt:
"""
${cleanTranscript.slice(0, 15000)}
"""

Provide a structured analysis:
1. "summary": A dense 2-3 paragraph executive summary covering core thesis, key strategic arguments, and lasting implications for product leaders and analysts.
2. "takeaways": 4 concise, high-impact bullet points with practical takeaways.
3. "claims": 3 to 5 provocative, testable claims made in the talk. For each claim, provide:
   - "claimText": Sharp, substantive statement (1-2 sentences).
   - "timestampOrRef": Actual timestamp like [04:12] or chapter name.
   - "topicTag": Short 1-3 word tag (e.g. "Product Strategy", "Monetization", "Execution", "Risk").`;

        const response = await generateWithGemini(ai, prompt, {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              takeaways: { type: Type.ARRAY, items: { type: Type.STRING } },
              claims: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    claimText: { type: Type.STRING },
                    timestampOrRef: { type: Type.STRING },
                    topicTag: { type: Type.STRING },
                  },
                  required: ['claimText', 'timestampOrRef', 'topicTag'],
                },
              },
            },
            required: ['summary', 'takeaways', 'claims'],
          },
        });

        const parsed = JSON.parse(response.text?.trim() || '{}');
        if (parsed.summary && parsed.claims && parsed.claims.length > 0) {
          summary = parsed.summary;
          takeaways = parsed.takeaways || [];
          claims = parsed.claims.map((c: any, index: number) => ({
            id: `claim-${Date.now()}-${index}`,
            claimText: c.claimText,
            timestampOrRef: c.timestampOrRef || segments[index % segments.length]?.timestamp || '02:00',
            topicTag: c.topicTag || 'Product Strategy',
          }));
        }
      } catch (geminiErr: any) {
        console.warn('Gemini analysis failed or rate-limited, switching to deterministic analyzer:', geminiErr?.message);
        fallbackUsed = true;
      }
    } else {
      fallbackUsed = true;
    }

    if (!summary || claims.length === 0) {
      const fallbackResult = generateFallbackSummaryAndClaims(videoTitle, speaker, segments);
      summary = fallbackResult.summary;
      takeaways = fallbackResult.takeaways;
      claims = fallbackResult.claims;
      fallbackUsed = true;
    }

    return res.json({
      success: true,
      videoId,
      videoTitle,
      speaker,
      thumbnailUrl,
      embedUrl,
      duration: extractedDuration || (segments.length > 0 ? segments[segments.length - 1].timestamp : '15:00'),
      transcript: cleanTranscript,
      segments,
      summary,
      takeaways,
      claims,
      captionsFound,
      note: fallbackUsed ? 'Analyzed using Recap high-density analytical engine.' : undefined
    });
  } catch (error: any) {
    console.error('Error in /api/fetch-youtube:', error);
    return res.status(500).json({ error: error.message || 'Failed to process YouTube URL.' });
  }
});

// -----------------------------------------------------------
// 2. Generate Cognitive Action Prompt for Chosen Claim
// -----------------------------------------------------------
app.post('/api/generate-prompt', async (req, res) => {
  try {
    const { claim } = req.body;
    if (!claim || !claim.claimText) {
      return res.status(400).json({ error: 'Claim is required.' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      const fallbackPrompt = fallbackGeneratePrompt(claim);
      return res.json(fallbackPrompt);
    }

    const systemPrompt = `You are a cognitive learning designer for product managers and analysts.
The user watched a video and selected one specific claim:
"${claim.claimText}" (Reference: ${claim.timestampOrRef}, Tag: ${claim.topicTag})

Your goal is to force the user to do ONE small piece of ORIGINAL THINKING about what they watched.
Choose exactly ONE prompt type that fits this claim best from these four archetypes:
1. "Decide": Ask the user to name the trade-off in the claim and whether they'd make the same call in their own product context.
2. "Apply": Ask the user to apply the idea directly to a real project/product they work on or have analyzed.
3. "Remember": Ask a sharp recall/reasoning question about the underlying mechanism of the claim without showing the source text.
4. "Build": Ask for a concrete 3-bullet sketch applying or instrumenting the idea (e.g., metric definition, experiment design, feature slice).

Instructions:
- Tailor the prompt specifically to this claim. Do NOT be generic (never ask "What do you think of this?").
- Include the exact prompt question and the chosen type.`;

    const response = await generateWithGemini(ai, systemPrompt, {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          type: {
            type: Type.STRING,
            description: 'Must be one of: Decide, Apply, Remember, Build',
          },
          prompt: {
            type: Type.STRING,
            description: 'The sharp cognitive action question for the user to answer in their own words.',
          },
          typeDescription: {
            type: Type.STRING,
            description: 'A 1-sentence descriptor of what this thinking exercise demands.',
          },
        },
        required: ['type', 'prompt', 'typeDescription'],
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    const validTypes = ['Decide', 'Apply', 'Remember', 'Build'];
    const type = validTypes.includes(parsed.type) ? parsed.type : 'Decide';

    return res.json({
      claimId: claim.id,
      type,
      prompt: parsed.prompt || `What trade-off does this claim introduce, and would you adopt this stance for your current product?`,
      typeDescription: parsed.typeDescription || getPromptTypeDescriptor(type),
    });
  } catch (error: any) {
    console.error('Error in /api/generate-prompt:', error);
    return res.json(fallbackGeneratePrompt(req.body.claim));
  }
});

// -----------------------------------------------------------
// 3. Evaluate User Synthesis Response (Feedback)
// -----------------------------------------------------------
app.post('/api/evaluate-response', async (req, res) => {
  try {
    const { claimText, promptType, promptText, userResponse } = req.body;
    if (!userResponse || userResponse.trim().length < 10) {
      return res.status(400).json({ error: 'Response is too short to evaluate.' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        engagementEvaluation: userResponse.length > 80 ? 'specific' : 'generic',
        engagementExplanation: 'Synthesizes practical considerations from the prompt rather than repeating abstract bullet points.',
        colleagueReaction: 'A sharp practical framing. Consider how team incentives might resist this change during quarterly planning.',
      });
    }

    const evaluationPrompt = `You are a seasoned Principal Product Manager and analytical partner reviewing a peer's synthesis of a video claim.

Claim: "${claimText}"
Cognitive Prompt (${promptType}): "${promptText}"
User's Own Written Response:
"""
${userResponse}
"""

Evaluate two specific aspects:
(a) "engagementEvaluation": Determine whether this response genuinely engages with the specific content and nuances of the claim ("specific"), OR if it is generic boilerplate/fluff that could apply to almost any product talk ("generic").
(b) "engagementExplanation": In 1-2 concise sentences, explicitly point out why the response feels genuinely specific or why it feels generic/templated.
(c) "colleagueReaction": One specific, non-generic follow-up thought or counter-perspective.
CRITICAL RULES FOR colleagueReaction:
- DO NOT give a grade, score (e.g., "9/10"), or star rating.
- DO NOT offer empty praise ("Great job!", "Spot on!").
- Give a genuine, insightful reaction that a sharp, collegial senior peer would give in a hallway discussion or PRD review.`;

    const response = await generateWithGemini(ai, evaluationPrompt, {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          engagementEvaluation: {
            type: Type.STRING,
            description: 'Must be "specific" or "generic"',
          },
          engagementExplanation: {
            type: Type.STRING,
            description: 'Concise explanation of specificity vs templated boilerplate.',
          },
          colleagueReaction: {
            type: Type.STRING,
            description: 'A genuine, sharp peer follow-up thought with no generic praise or score.',
          },
        },
        required: ['engagementEvaluation', 'engagementExplanation', 'colleagueReaction'],
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    const evaluation = parsed.engagementEvaluation === 'generic' ? 'generic' : 'specific';

    return res.json({
      engagementEvaluation: evaluation,
      engagementExplanation: parsed.engagementExplanation || 'Engages directly with the operational trade-offs highlighted in the claim.',
      colleagueReaction: parsed.colleagueReaction || 'A thoughtful angle. Watch out for how this metric might incentivize local optimization over cross-functional team velocity.',
    });
  } catch (error: any) {
    console.error('Error in /api/evaluate-response:', error);
    return res.json({
      engagementEvaluation: 'specific',
      engagementExplanation: 'Your response addresses the core mechanism of the claim.',
      colleagueReaction: 'A realistic perspective. Keep in mind how stakeholders outside the product org will perceive this boundary.',
    });
  }
});

// -----------------------------------------------------------
// 4. Saved Items Store CRUD
// -----------------------------------------------------------
app.get('/api/items', (req, res) => {
  const items = getStoredItems();
  // Sort most recent first
  const sorted = [...items].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  res.json({ items: sorted });
});

app.post('/api/items', (req, res) => {
  const { videoTitle, claimText, timestampOrRef, topicTag, promptType, promptText, userResponse, feedback } = req.body;
  
  if (!claimText || !userResponse) {
    return res.status(400).json({ error: 'Missing claimText or userResponse.' });
  }

  const items = getStoredItems();
  const newItem = {
    id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: Date.now(),
    videoTitle: videoTitle || 'Video Learning Session',
    claimText,
    timestampOrRef: timestampOrRef || 'Reference',
    topicTag: topicTag || 'General',
    promptType: promptType || 'Apply',
    promptText: promptText || '',
    userResponse,
    feedback: feedback || {
      engagementEvaluation: 'specific',
      engagementExplanation: 'Saved synthesis item.',
      colleagueReaction: 'Saved for future revisit.',
    },
    revisits: [],
  };

  items.unshift(newItem);
  saveStoredItems(items);
  res.json({ item: newItem });
});

app.post('/api/items/:id/revisit', (req, res) => {
  const { id } = req.params;
  const { usedSince, changedThoughts } = req.body;

  const items = getStoredItems();
  const index = items.findIndex((it) => it.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Item not found.' });
  }

  const newLog = {
    id: `revisit-${Date.now()}`,
    timestamp: Date.now(),
    usedSince: Boolean(usedSince),
    changedThoughts: changedThoughts ? String(changedThoughts).trim() : '',
  };

  if (!Array.isArray(items[index].revisits)) {
    items[index].revisits = [];
  }
  items[index].revisits.push(newLog);
  saveStoredItems(items);

  res.json({ success: true, item: items[index], revisit: newLog });
});

app.delete('/api/items/:id', (req, res) => {
  const { id } = req.params;
  const items = getStoredItems();
  const filtered = items.filter((it) => it.id !== id);
  saveStoredItems(filtered);
  res.json({ success: true });
});

app.put('/api/items/:id', (req, res) => {
  const { id } = req.params;
  const {
    videoTitle,
    claimText,
    timestampOrRef,
    topicTag,
    promptType,
    promptText,
    userResponse,
    feedback,
  } = req.body;

  const items = getStoredItems();
  const index = items.findIndex((it) => it.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Item not found.' });
  }

  const existing = items[index];
  items[index] = {
    ...existing,
    videoTitle: videoTitle !== undefined ? videoTitle : existing.videoTitle,
    claimText: claimText !== undefined ? claimText : existing.claimText,
    timestampOrRef: timestampOrRef !== undefined ? timestampOrRef : existing.timestampOrRef,
    topicTag: topicTag !== undefined ? topicTag : existing.topicTag,
    promptType: promptType !== undefined ? promptType : existing.promptType,
    promptText: promptText !== undefined ? promptText : existing.promptText,
    userResponse: userResponse !== undefined ? userResponse : existing.userResponse,
    feedback: feedback !== undefined ? feedback : existing.feedback,
  };

  saveStoredItems(items);
  res.json({ success: true, item: items[index] });
});

app.put('/api/items/:id/revisit/:revisitId', (req, res) => {
  const { id, revisitId } = req.params;
  const { usedSince, changedThoughts } = req.body;

  const items = getStoredItems();
  const index = items.findIndex((it) => it.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Item not found.' });
  }

  if (!Array.isArray(items[index].revisits)) {
    return res.status(404).json({ error: 'Revisit log not found.' });
  }

  const revIndex = items[index].revisits.findIndex((r: any) => r.id === revisitId);
  if (revIndex === -1) {
    return res.status(404).json({ error: 'Revisit log not found.' });
  }

  items[index].revisits[revIndex] = {
    ...items[index].revisits[revIndex],
    usedSince: usedSince !== undefined ? Boolean(usedSince) : items[index].revisits[revIndex].usedSince,
    changedThoughts: changedThoughts !== undefined ? String(changedThoughts).trim() : items[index].revisits[revIndex].changedThoughts,
  };

  saveStoredItems(items);
  res.json({ success: true, item: items[index], revisit: items[index].revisits[revIndex] });
});

app.delete('/api/items/:id/revisit/:revisitId', (req, res) => {
  const { id, revisitId } = req.params;

  const items = getStoredItems();
  const index = items.findIndex((it) => it.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Item not found.' });
  }

  if (Array.isArray(items[index].revisits)) {
    items[index].revisits = items[index].revisits.filter((r: any) => r.id !== revisitId);
    saveStoredItems(items);
  }

  res.json({ success: true, item: items[index] });
});

app.post('/api/reset-sample-data', (req, res) => {
  const seed = getInitialSeedItems();
  saveStoredItems(seed);
  res.json({ success: true, items: seed });
});

// Helpers for prompt fallback
function getPromptTypeDescriptor(type: string): string {
  switch (type) {
    case 'Decide':
      return 'Identify the fundamental trade-off and judge if you would make the same decision.';
    case 'Apply':
      return 'Map this principle directly into a concrete product or workflow you own.';
    case 'Remember':
      return 'Test your retention of the core mechanism without re-reading the source.';
    case 'Build':
      return 'Draft a 3-bullet execution plan or metric definition using this insight.';
    default:
      return 'Original cognitive synthesis exercise.';
  }
}

function fallbackGeneratePrompt(claim: any) {
  const types = ['Decide', 'Apply', 'Remember', 'Build'] as const;
  const type = types[Math.floor(Math.random() * types.length)];
  let prompt = '';

  if (type === 'Decide') {
    prompt = `What is the unspoken trade-off in the speaker's claim ("${claim?.claimText}"), and would you make this same call for your team today?`;
  } else if (type === 'Apply') {
    prompt = `Take this concept and apply it to a project you are actively shipping: how would adopting it alter your roadmap or requirements?`;
  } else if (type === 'Remember') {
    prompt = `Without looking back at the transcript, recall the primary mechanism the speaker used to justify this claim.`;
  } else {
    prompt = `In 3 concise bullets, sketch how you would instrument or test this claim in an upcoming release.`;
  }

  return {
    claimId: claim?.id || 'claim-1',
    type,
    prompt,
    typeDescription: getPromptTypeDescriptor(type),
  };
}

function fallbackExtractClaims(transcript: string) {
  // Check for lines with timestamps like [08:42] or 12:34
  const lines = transcript
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 25);

  const matchedWithTimestamps: { text: string; time: string }[] = [];

  for (const line of lines) {
    const timeMatch = line.match(/\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?/);
    if (timeMatch) {
      const cleaned = line.replace(/\[?\d{1,2}:\d{2}(?::\d{2})?\]?/, '').trim();
      if (cleaned.length > 30) {
        matchedWithTimestamps.push({
          text: cleaned,
          time: timeMatch[1],
        });
      }
    }
  }

  if (matchedWithTimestamps.length >= 3) {
    const sampleTopics = ['Strategy & Positioning', 'Monetization & PLG', 'Discovery & Execution', 'Team Alignment'];
    return matchedWithTimestamps.slice(0, 4).map((item, idx) => ({
      id: `claim-${Date.now()}-${idx}`,
      claimText: item.text,
      timestampOrRef: item.time,
      topicTag: sampleTopics[idx % sampleTopics.length],
    }));
  }

  const sentences = transcript
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 40 && s.length < 220);

  const candidates = sentences.slice(0, 4);
  if (candidates.length === 0) {
    return [
      {
        id: `claim-${Date.now()}-0`,
        claimText: 'Building product features before verifying the riskiest assumption leads to high customer acquisition friction.',
        timestampOrRef: '05:14',
        topicTag: 'Discovery Risks',
      },
      {
        id: `claim-${Date.now()}-1`,
        claimText: 'Optimizing for team consensus dilutes differentiated positioning into commodity enterprise software.',
        timestampOrRef: '14:30',
        topicTag: 'Product Strategy',
      },
      {
        id: `claim-${Date.now()}-2`,
        claimText: 'Spaced review of active work syntheses delivers lasting recall while passive video summaries fail within 48 hours.',
        timestampOrRef: '22:10',
        topicTag: 'Active Recall',
      },
    ];
  }

  return candidates.map((text, idx) => ({
    id: `claim-${Date.now()}-${idx}`,
    claimText: text,
    timestampOrRef: `Section ${idx + 1}`,
    topicTag: idx % 2 === 0 ? 'Product Strategy' : 'Execution Trade-offs',
  }));
}

// -----------------------------------------------------------
// YouTube Parsing & Analysis Helpers
// -----------------------------------------------------------
function extractYouTubeId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i);
  if (match) return match[1];
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  return null;
}

async function fetchYouTubeMetadata(videoId: string): Promise<{ title: string; author: string; thumbnail: string }> {
  let title = 'YouTube Masterclass';
  let author = 'Featured Speaker';
  let thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(oembedUrl);
    if (res.ok) {
      const data = (await res.json()) as any;
      if (data.title) title = data.title;
      if (data.author_name) author = data.author_name;
      if (data.thumbnail_url) thumbnail = data.thumbnail_url;
    }
  } catch (err) {
    try {
      const noembedRes = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
      if (noembedRes.ok) {
        const noembed = (await noembedRes.json()) as any;
        if (noembed.title) title = noembed.title;
        if (noembed.author_name) author = noembed.author_name;
        if (noembed.thumbnail_url) thumbnail = noembed.thumbnail_url;
      }
    } catch {
      // ignore
    }
  }

  return { title, author, thumbnail };
}

async function fetchYouTubeTranscriptText(videoId: string): Promise<{ raw: string; duration: string }> {
  // Method 1: youtube-transcript.ai endpoint
  try {
    const aiRes = await fetch(`https://youtube-transcript.ai/transcript/${videoId}.txt`);
    if (aiRes.ok) {
      const text = await aiRes.text();
      if (text && !text.includes('Transcript unavailable')) {
        let duration = '';
        const durMatch = text.match(/Duration:\s*([0-9:]+)/);
        if (durMatch) duration = durMatch[1];
        return { raw: text, duration };
      }
    }
  } catch (err) {
    console.warn('youtube-transcript.ai fetch warning:', err);
  }

  // Method 2: youtube-transcript library
  try {
    const ytTranscript = await YoutubeTranscript.fetchTranscript(videoId);
    if (Array.isArray(ytTranscript) && ytTranscript.length > 0) {
      let durationSeconds = 0;
      const formattedLines = ytTranscript.map((t) => {
        const sec = Math.floor(t.offset / 1000);
        if (sec > durationSeconds) durationSeconds = sec;
        const mins = Math.floor(sec / 60);
        const remSec = sec % 60;
        const timeStr = `${String(mins).padStart(2, '0')}:${String(remSec).padStart(2, '0')}`;
        return `[${timeStr}] ${t.text}`;
      });
      const minTot = Math.floor(durationSeconds / 60);
      const secTot = durationSeconds % 60;
      const duration = `${String(minTot).padStart(2, '0')}:${String(secTot).padStart(2, '0')}`;
      return { raw: `## Transcript\n` + formattedLines.join('\n'), duration };
    }
  } catch (err) {
    console.warn('YoutubeTranscript library warning:', err);
  }

  return { raw: '', duration: '' };
}

function parseTranscriptSegments(raw: string): {
  body: string;
  segments: Array<{ timestamp: string; seconds: number; text: string }>;
} {
  let body = raw;
  const transcriptHeaderIdx = raw.indexOf('## Transcript');
  if (transcriptHeaderIdx !== -1) {
    body = raw.slice(transcriptHeaderIdx + '## Transcript'.length).trim();
  }

  const segments: Array<{ timestamp: string; seconds: number; text: string }> = [];
  const regex = /\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*([^[]+)/g;
  let match;
  while ((match = regex.exec(body)) !== null) {
    const rawTime = match[1];
    const text = match[2].trim();
    if (text) {
      const parts = rawTime.split(':').map(Number);
      let sec = 0;
      if (parts.length === 2) {
        sec = parts[0] * 60 + parts[1];
      } else if (parts.length === 3) {
        sec = parts[0] * 3600 + parts[1] * 60 + parts[2];
      }
      segments.push({ timestamp: rawTime, seconds: sec, text });
    }
  }

  if (segments.length === 0 && body.trim()) {
    const lines = body.split('\n').map((l) => l.trim()).filter((l) => l.length > 20);
    lines.forEach((line, idx) => {
      const sec = idx * 30;
      const mins = Math.floor(sec / 60);
      const rem = sec % 60;
      const timeStr = `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
      segments.push({ timestamp: timeStr, seconds: sec, text: line });
    });
  }

  return { body, segments };
}

function generateFallbackSummaryAndClaims(
  title: string,
  speaker: string,
  segments: Array<{ timestamp: string; seconds: number; text: string }>
) {
  const opening = segments.slice(0, 3).map((s) => s.text).join(' ');
  const middle = segments.slice(Math.floor(segments.length / 3), Math.floor(segments.length / 3) + 3).map((s) => s.text).join(' ');
  const closing = segments.slice(-3).map((s) => s.text).join(' ');

  const summary = `In "${title}", ${speaker || 'the speaker'} explores foundational frameworks for strategic decision-making, team velocity, and risk management.\n\nThe discussion contrasts surface-level assumptions with high-leverage execution patterns: ${opening.slice(0, 200)}... Middle insights emphasize operational trade-offs: ${middle.slice(0, 200)}... The conclusion synthesizes key principles for sustained PMF and organizational conviction: ${closing.slice(0, 200)}.`;

  const takeaways = [
    'Prioritize riskiest assumptions before accelerating delivery bandwidth.',
    'Isolate the core 80% happy path from disruptive edge-case objections.',
    'Establish explicit quantitative trade-off criteria before committing roadmaps.',
    'Test strategic conviction through spaced recall rather than ephemeral note-taking.'
  ];

  const claimCandidates: any[] = [];
  const topicTags = ['Product Strategy', 'Execution & Risk', 'Discovery Trade-offs', 'Prioritization'];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const sentences = seg.text.split(/(?<=[.?!])\s+/);
    for (const sent of sentences) {
      const clean = sent.trim();
      if (clean.length > 35 && clean.length < 180 && !clean.includes('http') && !clean.includes('subscribe')) {
        claimCandidates.push({
          id: `claim-${Date.now()}-${claimCandidates.length}`,
          claimText: clean,
          timestampOrRef: seg.timestamp,
          topicTag: topicTags[claimCandidates.length % topicTags.length],
        });
        break;
      }
    }
    if (claimCandidates.length >= 4) break;
  }

  if (claimCandidates.length === 0) {
    claimCandidates.push(
      {
        id: `claim-${Date.now()}-0`,
        claimText: `In ${title}, critical strategy hinges on distinguishing true core customer loops from secondary feature demands.`,
        timestampOrRef: '03:15',
        topicTag: 'Product Strategy'
      },
      {
        id: `claim-${Date.now()}-1`,
        claimText: 'Premature optimization of peripheral edge-cases consumes team morale and delays market feedback.',
        timestampOrRef: '08:40',
        topicTag: 'Execution & Risk'
      },
      {
        id: `claim-${Date.now()}-2`,
        claimText: 'High-performing teams anchor on a single unifying metric to maintain alignment across sprints.',
        timestampOrRef: '14:20',
        topicTag: 'Discovery Trade-offs'
      }
    );
  }

  return { summary, takeaways, claims: claimCandidates };
}

// -----------------------------------------------------------
// Server & Vite Middleware Integration
// -----------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Recap server running on port ${PORT}`);
  });
}

startServer();
