export interface SampleTranscript {
  id: string;
  title: string;
  speaker: string;
  duration: string;
  context: string;
  youtubeId: string;
  views: string;
  published: string;
  category: string;
  transcript: string;
  summary?: string;
  takeaways?: string[];
  defaultClaims?: {
    id: string;
    claimText: string;
    timestampOrRef: string;
    topicTag: string;
  }[];
}

export const SAMPLE_TRANSCRIPTS: SampleTranscript[] = [
  {
    id: 'shreyas-leverage',
    title: 'High-Leverage Product Management & The Edge-Case Trap',
    speaker: 'Shreyas Doshi',
    duration: '42 mins',
    context: 'Strategy & Execution for Senior PMs',
    youtubeId: 'wZwf7r08p7w',
    views: '184K views',
    published: 'Product Strategy Masterclass',
    category: 'Product Strategy',
    summary: 'Shreyas Doshi breaks down how top product managers inadvertently succumb to the "edge-case trap" — dedicating up to 70% of team design cycles and debate to vocal minority objections while starving the core 80% happy path.\n\nThe discussion introduces the LNO (Leverage, Neutral, Overhead) framework, emphasizing that strategic positioning cannot be compensated for by raw shipping velocity.\n\nUltimately, genuine leadership requires accepting short-term friction or disappointment to ensure the core value proposition remains uncontaminated and immediately clear to the target market.',
    takeaways: [
      'Protect the core 80% happy path before solving edge cases for vocal outliers.',
      'Apply the LNO framework to reserve deep cognitive bandwidth for leverage decisions.',
      'Consensus is political self-preservation; alignment requires decisive trade-offs.',
      'Explicitly name what you are willing to break to make your core value proposition undeniable.'
    ],
    transcript: `[00:00] Welcome everyone. Today we are discussing high-leverage product management and how teams inadvertently sabotage their core velocity.
[03:15] The biggest mistake I see early-to-mid career product managers make is falling into what I call the "edge-case trap".
[07:40] Product teams will spend up to 70% of their emotional energy and design cycles debating edge-case objections raised by legal, sales, or vocal outliers, while the core 80% happy path gets neglected.
[12:10] When you design for the edge cases first, you do not create safety—you create an unnavigable labyrinth that drives away your primary customer cohort.
[19:15] Second, consider the distinction between Leverage, Neutral, and Overhead tasks (the LNO framework). High-leverage work like clarity of scope and customer positioning cannot be outsourced to incremental feature delivery.
[26:30] Third, consensus is not alignment. If you require everyone in the room to feel 100% comfortable before shipping, you are not exercising judgment, you are engaging in political self-preservation.
[34:50] The highest leverage call a PM can make is explicitly naming what they are willing to break or disappoint in the short term to make the core value proposition undeniable.`,
    defaultClaims: [
      {
        id: 'shreyas-c1',
        claimText: 'Product managers spend 70% of their emotional energy fighting edge-case objections instead of protecting the core 80% happy path.',
        timestampOrRef: '07:40',
        topicTag: 'Execution Traps',
      },
      {
        id: 'shreyas-c2',
        claimText: 'Designing for edge cases first creates an unnavigable labyrinth that alienates the primary user cohort.',
        timestampOrRef: '12:10',
        topicTag: 'Product Design',
      },
      {
        id: 'shreyas-c3',
        claimText: 'Consensus is not alignment; requiring 100% comfort before shipping is political self-preservation, not judgment.',
        timestampOrRef: '26:30',
        topicTag: 'Leadership & Alignment',
      },
      {
        id: 'shreyas-c4',
        claimText: 'The highest leverage call a PM can make is explicitly naming what they are willing to break to make the core value proposition undeniable.',
        timestampOrRef: '34:50',
        topicTag: 'Strategic Prioritization',
      },
    ],
  },
  {
    id: 'elena-plg',
    title: 'B2B Product-Led Growth & Paywall Timing',
    speaker: 'Elena Verna',
    duration: '38 mins',
    context: 'Growth Strategy & Monetization Boundaries',
    youtubeId: 'zF_K4b9i9kQ',
    views: '240K views',
    published: 'Reforge Growth Series',
    category: 'Growth & PLG',
    summary: 'Elena Verna dissects the mechanics of B2B Product-Led Growth, demonstrating why treating PLG merely as a self-serve checkout page causes catastrophic expansion stall.\n\nShe identifies the crucial inflection point: collaborative team expansion. When companies prematurely paywall inter-user invites or sharing workflows, they strangle the organic word-of-mouth loop by 40% before reaching PMF.\n\nThe sustainable monetization playbook gates administrative oversight, enterprise security, and audit compliance rather than the foundational team adoption loop.',
    takeaways: [
      'Premature paywalls on collaboration workflows destroy organic expansion loops by 40%.',
      'Monetize enterprise governance, data security, and audit controls — never initial team invites.',
      '80% of downstream churn stems from missing collaborative milestones, not initial signup counts.',
      'A retention curve that fails to flatten before Day 30 cannot be rescued by pricing gimmicks.'
    ],
    transcript: `[00:00] Let's dismantle the classic myth that slapping a self-serve checkout page onto an enterprise tool constitutes a Product-Led Growth engine.
[05:22] The critical inflection point in any B2B PLG motion is not user acquisition—it is the moment of collaborative expansion.
[08:42] Gating core collaboration features too early reduces organic word-of-mouth loops by 40% before product-market fit is established. If user A cannot invite user B to review a document without hitting a credit card modal, you have strangled your expansion flywheel in the crib.
[14:15] However, the counter-failure is giving away unlimited organizational features forever. You must monetize administrative control, security compliance, and data governance, not initial inter-team sharing.
[22:30] When product managers measure only top-of-funnel signups, they miss that 80% of churn occurs because teams never reached the secondary collaborative activation milestone.
[31:05] If your retention curve does not flatten before day 30, no amount of aggressive paywall experimentation or discount nudges will save the product.`,
    defaultClaims: [
      {
        id: 'elena-c1',
        claimText: 'Gating core collaboration features too early reduces organic word-of-mouth loops by 40% before product-market fit is established.',
        timestampOrRef: '08:42',
        topicTag: 'Monetization Timing',
      },
      {
        id: 'elena-c2',
        claimText: 'Monetize administrative control, security compliance, and data governance rather than initial inter-team collaboration invites.',
        timestampOrRef: '14:15',
        topicTag: 'Packaging & Pricing',
      },
      {
        id: 'elena-c3',
        claimText: '80% of B2B churn occurs because teams never reach secondary collaborative activation, which top-of-funnel signup metrics fail to capture.',
        timestampOrRef: '22:30',
        topicTag: 'Retention Mechanics',
      },
    ],
  },
  {
    id: 'marty-discovery',
    title: 'Continuous Product Discovery vs. Delivery Risks',
    speaker: 'Marty Cagan',
    duration: '45 mins',
    context: 'Discovery, Technical Feasibility & Value Risk',
    youtubeId: '23oP71kC90I',
    views: '310K views',
    published: 'Silicon Valley Product Group',
    category: 'Product Discovery',
    summary: 'Marty Cagan challenges the prevailing "feature factory" mindset across agile teams, establishing why continuous product discovery must precede delivery commitments.\n\nThe core framework addresses four critical risks simultaneously: value, usability, feasibility, and business viability. In particular, excluding engineers from discovery calls isolates the best source of innovation.\n\nPrototypes must be viewed strictly as disposable learning instruments that validate hypotheses in under 48 hours, measuring genuine behavioral customer sacrifices rather than polite affirmations.',
    takeaways: [
      'Address value, usability, feasibility, and viability risks concurrently in discovery.',
      'Include engineers in discovery interviews to identify technical feasibility early.',
      'Prototypes must validate core assumptions within 48 hours or they are too high-fidelity.',
      'Measure behavioral customer sacrifice (time, data, reputation) over opinion surveys.'
    ],
    transcript: `[00:00] Most tech companies are not product companies; they are feature factories operating under the illusion of agile transformation.
[06:30] True product discovery addresses four fundamental risks: value risk, usability risk, feasibility risk, and business viability risk.
[12:05] Validating feasibility without an engineer directly in the discovery interview produces high-fidelity roadmaps that crumble the moment they hit sprint planning.
[18:40] Engineers are your best source of innovation, not just code-writing resources. If you only bring them requirements after customer conversations, you have amputated half their cognitive contribution.
[27:15] Prototypes should be disposable learning instruments, not pre-production MVPs that take 6 weeks to write. If it takes more than 48 hours to validate an assumption with a customer, the prototype is too high-fidelity.
[36:20] Customer interviews that ask "Would you buy this?" provide zero signal. You must observe behavioral commitments—time, data, or reputation sacrificed—to verify real value.`,
    defaultClaims: [
      {
        id: 'marty-c1',
        claimText: 'Validating feasibility without an engineer directly in the discovery interview produces high-fidelity roadmaps that crumble at sprint planning.',
        timestampOrRef: '12:05',
        topicTag: 'Feasibility Risk',
      },
      {
        id: 'marty-c2',
        claimText: 'Engineers are your best source of innovation; bringing them only post-interview requirements amputates half their cognitive contribution.',
        timestampOrRef: '18:40',
        topicTag: 'Engineering Collaboration',
      },
      {
        id: 'marty-c3',
        claimText: 'If it takes more than 48 hours to validate a customer assumption, the prototype is too high-fidelity to serve as a learning instrument.',
        timestampOrRef: '27:15',
        topicTag: 'Rapid Prototyping',
      },
      {
        id: 'marty-c4',
        claimText: 'Asking customers "Would you buy this?" gives zero signal; you must observe behavioral sacrifices of time, data, or reputation.',
        timestampOrRef: '36:20',
        topicTag: 'Customer Validation',
      },
    ],
  },
];


