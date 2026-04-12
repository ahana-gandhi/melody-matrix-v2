import { create } from "zustand";
import type { Issue, Instrument } from "@/lib/promptBuilder";

export type { Issue, Instrument };

interface AssessmentState {
  selectedIssue: Issue | null;
  setSelectedIssue: (issue: Issue) => void;

  scores: number[]; // 5 slider values, 0-4
  setScore: (idx: number, value: number) => void;

  selectedInstrument: Instrument | null;
  setSelectedInstrument: (i: Instrument) => void;

  tempo: number;
  setTempo: (bpm: number) => void;

  generatedTrackUrl: string | null;
  setGeneratedTrackUrl: (url: string | null) => void;

  sessionId: number | null;
  setSessionId: (id: number | null) => void;

  currentStep: number;
  setCurrentStep: (s: number) => void;
  nextStep: () => void;
  prevStep: () => void;

  reset: () => void;
}

const defaultScores = [2, 2, 2, 2, 2];

export const useAssessmentStore = create<AssessmentState>((set) => ({
  selectedIssue: null,
  setSelectedIssue: (issue) => set({ selectedIssue: issue }),

  scores: [...defaultScores],
  setScore: (idx, value) =>
    set((s) => {
      const next = [...s.scores];
      next[idx] = value;
      return { scores: next };
    }),

  selectedInstrument: null,
  setSelectedInstrument: (i) => set({ selectedInstrument: i }),

  tempo: 90,
  setTempo: (bpm) => set({ tempo: bpm }),

  generatedTrackUrl: null,
  setGeneratedTrackUrl: (url) => set({ generatedTrackUrl: url }),

  sessionId: null,
  setSessionId: (id) => set({ sessionId: id }),

  currentStep: 1,
  setCurrentStep: (s) => set({ currentStep: s }),
  nextStep: () => set((s) => ({ currentStep: Math.min(s.currentStep + 1, 4) })),
  prevStep: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 1) })),

  reset: () =>
    set({
      selectedIssue: null,
      scores: [...defaultScores],
      selectedInstrument: null,
      tempo: 90,
      generatedTrackUrl: null,
      sessionId: null,
      currentStep: 1,
    }),
}));
