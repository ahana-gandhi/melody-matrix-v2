/**
 * promptBuilder.ts — Builds a therapeutic music prompt for Lyria.
 *
 * Fixes from v1:
 *  - Removed "~20 seconds" duration request — Lyria Realtime ignores text
 *    duration cues; clip length is controlled by the stop timer in lyria.ts
 *  - Relationship question scores are no longer treated as raw distress;
 *    the builder now accounts for inverted questions
 *  - Issue-specific slider labels added (not generic energy/focus/mood/etc.)
 */

export type Issue = "anxiety" | "depression" | "relationship" | "stress" | "sleep";
export type Instrument = "piano" | "guitar" | "violin" | "flute" | "synth";

export interface PromptContext {
  issue: Issue;
  instrument: Instrument;
  tempo: number;
  /** Array of 5 scores, one per question (0-4 scale) */
  scores: number[];
  /** The 5 questions shown to the user */
  questions: string[];
}

export interface PromptResult {
  prompt: string;
  summary: string[];
  issueTitle: string;
  instrumentLabel: string;
}

// ── Issue metadata ─────────────────────────────────────────────────────────

const issueDetails: Record<Issue, { title: string; focus: string; goal: string }> = {
  anxiety: {
    title: "Anxiety Relief",
    focus: "calming heightened worry, tension, and restlessness",
    goal: "deliver spacious, soothing textures that encourage deep breathing and release nervous energy",
  },
  depression: {
    title: "Mood Support",
    focus: "supporting low mood, fatigue, and a sense of hopelessness",
    goal: "gently elevate mood with warm harmonies, patient builds, and hopeful melodic cues",
  },
  relationship: {
    title: "Relationship Harmony",
    focus: "easing interpersonal stress and fostering emotional openness",
    goal: "promote empathy and connection through balanced dynamics and conversational motifs",
  },
  stress: {
    title: "Stress Reduction",
    focus: "reducing overwhelming pressure and mental overload",
    goal: "ground the listener with steady rhythms, restorative harmonies, and gradual tension release",
  },
  sleep: {
    title: "Sleep Support",
    focus: "guiding the listener toward restful, sustained sleep",
    goal: "create a lullaby-like atmosphere with soft transitions and minimal stimulation",
  },
};

// ── Instrument metadata ────────────────────────────────────────────────────

const instrumentTextures: Record<Instrument, { label: string; description: string }> = {
  piano: {
    label: "Piano",
    description: "warm resonant piano with gentle arpeggios and soft sustain",
  },
  guitar: {
    label: "Guitar",
    description: "fingerstyle acoustic guitar with mellow voicings and natural resonance",
  },
  violin: {
    label: "Violin",
    description: "expressive violin with smooth legato phrasing and subtle vibrato",
  },
  flute: {
    label: "Flute",
    description: "airy flute melodies with flowing phrases and feather-light articulation",
  },
  synth: {
    label: "Synthesizer",
    description: "ambient synthesizer with lush pads, evolving textures, and soft pulses",
  },
};

// ── Score labeling ─────────────────────────────────────────────────────────

const intensityLabels = ["Not at all", "Slightly", "Moderately", "Quite a bit", "Extremely"];

/** For questions where HIGH score = POSITIVE (e.g. "How supported do you feel?"),
 *  invert before labeling so the therapeutic prompt is accurate. */
const invertedQuestionIndices: Partial<Record<Issue, number[]>> = {
  relationship: [0, 2, 3], // "How supported", "How valued", "How comfortable"
};

const getEffectiveScore = (issue: Issue, idx: number, raw: number): number => {
  const inverted = invertedQuestionIndices[issue] ?? [];
  return inverted.includes(idx) ? 4 - raw : raw;
};

// ── Main export ────────────────────────────────────────────────────────────

export const buildTherapeuticPrompt = (ctx: PromptContext): PromptResult => {
  const { issue, instrument, tempo, scores, questions } = ctx;
  const issueInfo = issueDetails[issue];
  const instrumentInfo = instrumentTextures[instrument];

  const summary = questions.map((q, i) => {
    const effective = getEffectiveScore(issue, i, scores[i] ?? 0);
    const clamped = Math.max(0, Math.min(4, effective));
    const label = intensityLabels[clamped];
    return `${i + 1}. ${q.trim()} — ${label}`;
  });

  // Average effective severity 0-4
  const avgSeverity =
    summary.length
      ? scores
          .map((s, i) => getEffectiveScore(issue, i, s))
          .reduce((a, b) => a + b, 0) / scores.length
      : 2;

  // Map severity → musical guidance
  const severityGuidance =
    avgSeverity >= 3.5
      ? "The listener is experiencing significant distress — use very slow harmonic movement, minimal dynamics, and long held tones."
      : avgSeverity >= 2
      ? "The listener has moderate concern — use gentle melodic development with a sense of resolution."
      : "The listener has mild concern — a brighter, more uplifting quality is appropriate.";

  const prompt = [
    `Compose a ${tempo} BPM therapeutic music piece using ${instrumentInfo.description}.`,
    `Focus: ${issueInfo.focus}. Goal: ${issueInfo.goal}.`,
    severityGuidance,
    "Use evolving layers, smooth transitions, and avoid jarring percussion or sudden dynamic shifts.",
    "Conclude with a gentle resolution that invites calm and grounding.",
  ].join(" ");

  return {
    prompt,
    summary,
    issueTitle: issueInfo.title,
    instrumentLabel: instrumentInfo.label,
  };
};
