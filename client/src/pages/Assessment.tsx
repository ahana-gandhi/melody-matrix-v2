import { useState } from "react";
import { useAssessmentStore } from "@/store/assessmentStore";
import { useAuthStore } from "@/store/authStore";
import { buildTherapeuticPrompt, type Issue, type Instrument } from "@/lib/promptBuilder";
import { generateMusic } from "@/services/lyria";
import { searchYouTube, type YouTubeVideo } from "@/services/youtube";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { AudioPlayer } from "@/components/AudioPlayer";
import { BreathingExercise } from "@/components/BreathingExercise";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  ArrowLeft, ArrowRight, Loader2, AlertCircle, RefreshCw,
  CheckCircle, ExternalLink, Music, Info,
} from "lucide-react";
import confetti from "canvas-confetti";

// ── Data ───────────────────────────────────────────────────────────────────

const issues: { id: Issue; title: string; subtitle: string; icon: string }[] = [
  { id: "anxiety",      title: "Anxiety",       subtitle: "Nervousness, worry, restlessness, or panic", icon: "🫁" },
  { id: "depression",   title: "Low Mood",       subtitle: "Sadness, fatigue, hopelessness, or low motivation", icon: "🌧" },
  { id: "stress",       title: "Stress",         subtitle: "Overwhelm, pressure, or difficulty coping", icon: "⚡" },
  { id: "relationship", title: "Relationships",  subtitle: "Interpersonal tension or emotional distance", icon: "🤝" },
  { id: "sleep",        title: "Sleep",          subtitle: "Trouble falling or staying asleep", icon: "🌙" },
];

const instruments: { id: Instrument; label: string; description: string }[] = [
  { id: "piano",  label: "Piano",        description: "Warm, resonant, expressive" },
  { id: "guitar", label: "Guitar",       description: "Acoustic, fingerstyle, grounded" },
  { id: "violin", label: "Violin",       description: "Legato, emotional, soaring" },
  { id: "flute",  label: "Flute",        description: "Airy, delicate, light" },
  { id: "synth",  label: "Synthesizer",  description: "Ambient, layered, immersive" },
];

// Clinically-informed questions per issue.
// Adapted from GAD-7 (anxiety), PHQ-9 (depression), ISI (sleep), PSS (stress).
// Note: relationship questions 0, 2, 3 are positively scored (handled in promptBuilder).
const questionBank: Record<Issue, string[]> = {
  anxiety: [
    "How strongly do you feel nervous, anxious, or on edge?",
    "How much trouble do you have stopping or controlling your worries?",
    "How difficult is it for you to relax?",
    "How much have you been bothered by feeling afraid something awful might happen?",
    "How much have your worries interfered with daily tasks or enjoyment?",
  ],
  depression: [
    "How often have you felt little interest or pleasure in doing things you usually enjoy?",
    "How much have you been feeling down, hopeless, or empty?",
    "How much trouble have you had with low energy or fatigue?",
    "How much have you been self-critical or feeling like a burden to others?",
    "How much has your mood affected your ability to work, socialize, or care for yourself?",
  ],
  stress: [
    "How overwhelmed do you feel by your current responsibilities?",
    "How difficult is it to manage your time and prioritize tasks?",
    "How much has stress affected your physical health (headaches, tension, sleep)?",
    "How hard is it to find time to rest or decompress?",
    "How much distress or frustration does your current stress level cause?",
  ],
  relationship: [
    "How supported do you feel by the important people in your life?",        // inverted
    "How often do you experience conflict or tension in key relationships?",
    "How valued or respected do you feel in your relationships?",              // inverted
    "How comfortable do you feel communicating honestly with others?",         // inverted
    "How much distress do your relationship challenges cause you day-to-day?",
  ],
  sleep: [
    "How difficult is it for you to fall asleep at night?",
    "How often do you wake up during the night and struggle to return to sleep?",
    "How rested or refreshed do you feel when you wake up in the morning?",
    "How much do your sleep problems interfere with your daytime functioning?",
    "How distressed or frustrated are you by your current sleep quality?",
  ],
};

const scaleLabels = ["None / Never", "Slightly", "Moderately", "Quite a bit", "Extremely"];

// ── Progress indicator ────────────────────────────────────────────────────

function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
              i + 1 < step
                ? "bg-primary text-primary-foreground"
                : i + 1 === step
                ? "bg-primary/20 border-2 border-primary text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {i + 1 < step ? <CheckCircle className="h-3.5 w-3.5" /> : i + 1}
          </div>
          {i < total - 1 && (
            <div className={`h-0.5 w-8 sm:w-16 rounded-full transition-all ${i + 1 < step ? "bg-primary" : "bg-border"}`} />
          )}
        </div>
      ))}
      <span className="ml-2 text-xs text-muted-foreground">Step {step} of {total}</span>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function Assessment() {
  const {
    selectedIssue, setSelectedIssue,
    scores, setScore,
    selectedInstrument, setSelectedInstrument,
    tempo, setTempo,
    generatedTrackUrl, setGeneratedTrackUrl,
    sessionId, setSessionId,
    currentStep, nextStep, prevStep, reset,
  } = useAssessmentStore();

  const { user } = useAuthStore();
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState("");
  const [genProgress, setGenProgress] = useState(0);
  const [promptSummary, setPromptSummary] = useState<string[]>([]);
  const [issueTitle, setIssueTitle] = useState("");
  const [instrumentLabel, setInstrumentLabel] = useState("");
  const [moodBefore, setMoodBefore] = useState(3);
  const [moodAfter, setMoodAfter] = useState(3);
  const [ytVideos, setYtVideos] = useState<YouTubeVideo[]>([]);
  const [ytQuery, setYtQuery] = useState("");
  const [fetchingYt, setFetchingYt] = useState(false);

  const activeQuestions = selectedIssue ? questionBank[selectedIssue] : questionBank.anxiety;

  const handleGenerate = async () => {
    if (!selectedIssue || !selectedInstrument) {
      toast({ title: "Please complete all selections", variant: "destructive" });
      return;
    }
    const { prompt, summary, issueTitle: iTitle, instrumentLabel: iLabel } =
      buildTherapeuticPrompt({
        issue: selectedIssue,
        instrument: selectedInstrument,
        tempo,
        scores,
        questions: activeQuestions,
      });

    setPromptSummary(summary);
    setIssueTitle(iTitle);
    setInstrumentLabel(iLabel);
    setGenerating(true);
    setGenStatus("Connecting to Lyria...");
    setGenProgress(0);

    try {
      const url = await generateMusic(
        { prompt, instrument: selectedInstrument, tempo },
        (status, pct) => { setGenStatus(status); setGenProgress(pct); }
      );

      setGeneratedTrackUrl(url);

      // Persist session to localStorage (works on Vercel static)
      try {
        const LS_SESSIONS = "mm_sessions_v1";
        const existingSessions = JSON.parse(localStorage.getItem(LS_SESSIONS) ?? "[]");
        const newSession = {
          id: Date.now(),
          issue: selectedIssue,
          instrument: selectedInstrument,
          tempo,
          moodBefore,
          moodAfter: null,
          createdAt: new Date().toISOString(),
        };
        // Store session id so we can update moodAfter later
        const sessionLocalId = newSession.id;
        setSessionId(sessionLocalId);
        localStorage.setItem(LS_SESSIONS, JSON.stringify([newSession, ...existingSessions]));
      } catch { /* non-critical */ }

      // Also try backend (non-critical, may not be available on static deploy)
      try {
        const res = await apiRequest("POST", "/api/sessions", {
          ...(user ? { userId: user.id } : {}),
          issue: selectedIssue,
          instrument: selectedInstrument,
          tempo,
          intensityScores: JSON.stringify(scores),
          promptUsed: prompt,
          moodBefore,
        });
        if (res.ok) {
          const session = await res.json();
          // Override with backend id if available
          setSessionId(session.id);
        }
      } catch { /* non-critical */ }

      nextStep();
      setTimeout(() => {
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 }, colors: ["#9333ea", "#a855f7", "#c084fc"] });
      }, 300);
      toast({ title: "Your track is ready!" });
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleGetRecommendations = async () => {
    if (!selectedIssue || !selectedInstrument) return;
    const { prompt } = buildTherapeuticPrompt({ issue: selectedIssue, instrument: selectedInstrument, tempo, scores, questions: activeQuestions });
    setFetchingYt(true);
    try {
      const { videos, searchQuery } = await searchYouTube(prompt, 4);
      setYtVideos(videos);
      setYtQuery(searchQuery);
    } catch (e: any) {
      toast({ title: "Could not fetch recommendations", description: e.message, variant: "destructive" });
    } finally {
      setFetchingYt(false);
    }
  };

  // Mood after is tracked locally for session context only — no journal storage

  const handleReset = () => {
    reset();
    setPromptSummary([]);
    setYtVideos([]);
    setYtQuery("");
    setMoodBefore(3);
    setMoodAfter(3);
  };

  // ── Render steps ───────────────────────────────────────────────────────

  const renderStep = () => {
    // Step 1: Issue selection
    if (currentStep === 1) return (
      <div className="animate-fade-in-up space-y-8">
        {/* AI Disclaimer */}
        <div className="flex gap-3 p-4 rounded-md border border-primary/20 bg-primary/5 text-sm text-foreground">
          <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium mb-1">About this assessment</p>
            <p className="text-muted-foreground leading-relaxed">
              These questions are adapted from validated clinical screening tools (GAD-7, PHQ-9, ISI). They are used only to personalize your AI-generated music — this app does <strong>not</strong> diagnose any condition and is <strong>not a substitute</strong> for professional mental health care.
              If you are in crisis, call or text <a href="tel:988" className="text-primary font-semibold underline">988</a>.
            </p>
          </div>
        </div>

        <div>
          <h2 className="font-display text-2xl font-medium text-foreground mb-2">
            What are you navigating right now?
          </h2>
          <p className="text-muted-foreground mb-6">Choose the area that feels most relevant. You can always come back.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {issues.map((issue) => (
              <button
                key={issue.id}
                data-testid={`issue-${issue.id}`}
                onClick={() => setSelectedIssue(issue.id)}
                className={`text-left p-5 rounded-md border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  selectedIssue === issue.id
                    ? "border-primary bg-primary/8 shadow-sm ring-1 ring-primary"
                    : "border-border bg-card hover:border-primary/50 hover:shadow-sm"
                }`}
              >
                <div className="text-3xl mb-3" aria-hidden>{issue.icon}</div>
                <h3 className="font-medium text-foreground mb-1">{issue.title}</h3>
                <p className="text-xs text-muted-foreground leading-snug">{issue.subtitle}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Mood before */}
        <div className="max-w-md space-y-3">
          <label className="block text-sm font-medium text-foreground">
            How would you rate your mood right now? <span className="text-muted-foreground font-normal">(1 = very low, 5 = great)</span>
          </label>
          <div className="flex items-center gap-4">
            <Slider
              value={[moodBefore]}
              min={1} max={5} step={1}
              onValueChange={([v]) => setMoodBefore(v)}
              className="flex-1"
              aria-label="Current mood rating"
            />
            <span className="text-lg font-semibold text-primary w-6 text-center tabular-nums">{moodBefore}</span>
          </div>
          <p className="text-xs text-muted-foreground">We'll ask again after you listen to measure any change.</p>
        </div>

        <div className="flex justify-end">
          <Button onClick={nextStep} disabled={!selectedIssue} className="gap-2">
            Next: Questions <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );

    // Step 2: Questions
    if (currentStep === 2) return (
      <div className="animate-fade-in-up space-y-8">
        <div>
          <h2 className="font-display text-2xl font-medium text-foreground mb-2">
            Tell us more about your experience
          </h2>
          <p className="text-muted-foreground">
            Rate how much each applies to you over the past week. There are no right or wrong answers.
          </p>
        </div>

        <div className="space-y-8 max-w-2xl">
          {activeQuestions.map((q, idx) => (
            <div key={idx} className="space-y-3">
              <label className="block text-sm font-medium text-foreground leading-snug">
                {idx + 1}. {q}
              </label>
              <Slider
                value={[scores[idx]]}
                min={0} max={4} step={1}
                onValueChange={([v]) => setScore(idx, v)}
                aria-label={q}
                data-testid={`question-${idx}`}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                {scaleLabels.map((l) => (
                  <span key={l} className="text-center" style={{ width: "20%" }}>{l}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={prevStep} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <Button onClick={nextStep} className="gap-2">
            Next: Music Setup <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );

    // Step 3: Instrument + Tempo + Generate
    if (currentStep === 3) return (
      <div className="animate-fade-in-up space-y-10">
        <div>
          <h2 className="font-display text-2xl font-medium text-foreground mb-2">Customize your music</h2>
          <p className="text-muted-foreground">Choose the sound and pace that feel right for you.</p>
        </div>

        {/* Instrument grid */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Instrument</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {instruments.map((inst) => (
              <button
                key={inst.id}
                data-testid={`instrument-${inst.id}`}
                onClick={() => setSelectedInstrument(inst.id)}
                className={`p-4 rounded-md border text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  selectedInstrument === inst.id
                    ? "border-primary bg-primary/8 shadow-sm ring-1 ring-primary"
                    : "border-border bg-card hover:border-primary/40 hover:shadow-sm"
                }`}
              >
                <p className="text-sm font-medium text-foreground">{inst.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{inst.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Tempo */}
        <div className="max-w-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Tempo</h3>
            <span className="text-sm font-semibold text-primary tabular-nums">{tempo} BPM</span>
          </div>
          <Slider
            value={[tempo]}
            min={60} max={180} step={5}
            onValueChange={([v]) => setTempo(v)}
            aria-label="Tempo in beats per minute"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>60 — Relaxation / Sleep</span>
            <span>120 — Focus / Balance</span>
            <span>180 — Energy</span>
          </div>
        </div>

        {/* YouTube recommendations */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Curated YouTube Tracks</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Find real music that matches your therapeutic brief</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGetRecommendations}
              disabled={!selectedInstrument || fetchingYt}
              className="gap-1.5"
            >
              {fetchingYt ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Music className="h-3.5 w-3.5" />}
              {fetchingYt ? "Searching..." : "Get Recommendations"}
            </Button>
          </div>

          {ytVideos.length > 0 && (
            <div className="space-y-2">
              {ytQuery && <p className="text-xs text-muted-foreground">Search: <em>{ytQuery}</em></p>}
              <div className="grid sm:grid-cols-2 gap-3">
                {ytVideos.map((v) => (
                  <a
                    key={v.link}
                    href={v.link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex gap-3 rounded-md border border-border bg-card hover:shadow-md transition-shadow overflow-hidden group"
                  >
                    {v.thumbnail ? (
                      <img src={v.thumbnail} alt={v.title} className="h-20 w-32 object-cover flex-shrink-0" loading="lazy" />
                    ) : (
                      <div className="h-20 w-32 bg-muted flex items-center justify-center flex-shrink-0">
                        <Music className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="py-3 pr-3 flex flex-col justify-between min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground line-clamp-2 leading-snug">{v.title}</p>
                      <div className="flex items-center gap-1 text-xs text-primary font-medium mt-1">
                        <ExternalLink className="h-3 w-3" />
                        Open on YouTube
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Breathing exercise + generation status */}
        {generating && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-5 space-y-3">
              <BreathingExercise issue={selectedIssue ?? undefined} active={generating} />
              <Progress value={genProgress} className="h-1" />
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between">
          <Button variant="outline" onClick={prevStep} disabled={generating} className="gap-2 rounded-full">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!selectedInstrument || generating}
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md rounded-full font-bold"
          >
            {generating ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Generating… {genProgress}%</>
            ) : (
              <>Generate My Music <Music className="h-4 w-4" /></>
            )}
          </Button>
        </div>
      </div>
    );

    // Step 4: Results
    if (currentStep === 4) return (
      <div className="animate-scale-in space-y-8">
        <div className="text-center">
          <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="font-display text-2xl font-medium text-foreground mb-2">
            Your track is ready
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            A unique piece composed by Lyria AI based on your assessment. Listen, then rate how it made you feel.
          </p>
        </div>

        {/* Session summary */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Session Summary</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <p className="text-foreground font-medium">{issueTitle} · {instrumentLabel} · {tempo} BPM</p>
            <div className="grid sm:grid-cols-2 gap-2 mt-3">
              {promptSummary.map((line) => (
                <p key={line} className="text-xs text-muted-foreground border border-border rounded px-3 py-2 bg-muted/30">
                  {line}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Audio player */}
        {generatedTrackUrl && (
          <AudioPlayer
            audioUrl={generatedTrackUrl}
            trackName={`${issueTitle} · ${instrumentLabel} · ${tempo} BPM`}
            loop
          />
        )}

        {/* Mood after */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-5 space-y-3">
            <p className="text-sm font-medium text-foreground">How do you feel after listening?</p>
            <div className="flex items-center gap-4">
              <Slider
                value={[moodAfter]}
                min={1} max={5} step={1}
                onValueChange={([v]) => setMoodAfter(v)}
                className="flex-1"
                aria-label="Mood after listening"
              />
              <span className="text-lg font-semibold text-primary w-6 text-center tabular-nums">{moodAfter}</span>
            </div>
            <p className="text-xs text-muted-foreground">1 = no change or worse, 5 = significantly better</p>
          </CardContent>
        </Card>

        {/* Ethical disclaimer */}
        <div className="flex gap-3 p-4 rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-sm">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-amber-900 dark:text-amber-200">
            <p className="font-medium mb-0.5">A note about AI wellness tools</p>
            <p className="text-xs leading-relaxed">
              This music was generated by an AI model — not a licensed music therapist. It can complement your wellness routine but should not replace professional care.
              If you're experiencing persistent distress, please reach out to a licensed mental health professional or call <a href="tel:988" className="font-bold underline">988</a>.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleReset} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" /> Start a New Session
          </Button>
        </div>
      </div>
    );

    return null;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <StepIndicator step={currentStep} total={4} />
      {renderStep()}
    </div>
  );
}
