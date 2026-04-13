import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Send, X } from "lucide-react";

// ─── Formspree config ───────────────────────────────────────────────────────
// Responses are collected at https://formspree.io and forwarded to
// ahana.gandhi@gmail.com. No user email is ever shown or required.
// The form ID below was created for this app.
const FORMSPREE_ENDPOINT = "https://formspree.io/f/mwpovbnd";

interface FeedbackSurveyProps {
  sessionName: string;   // e.g. "Calm my anxiety · flute · 65 BPM"
  onClose: () => void;
}

const IMPACT_LABELS: Record<number, string> = {
  1: "Not at all",
  2: "A little",
  3: "Somewhat",
  4: "Quite a bit",
  5: "Significantly",
};

export function FeedbackSurvey({ sessionName, onClose }: FeedbackSurveyProps) {
  const [impact, setImpact]           = useState<number | null>(null);
  const [likedMost, setLikedMost]     = useState("");
  const [wouldChange, setWouldChange] = useState("");
  const [wouldReturn, setWouldReturn] = useState<"Yes" | "No" | "Maybe" | null>(null);
  const [submitted, setSubmitted]     = useState(false);
  const [sending, setSending]         = useState(false);
  const [error, setError]             = useState("");

  const canSubmit = impact !== null && wouldReturn !== null;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSending(true);
    setError("");

    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          session: sessionName,
          impact_rating: `${impact}/5 — ${IMPACT_LABELS[impact!]}`,
          liked_most: likedMost.trim() || "(no response)",
          would_change: wouldChange.trim() || "(no response)",
          would_return: wouldReturn,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        setError("Something went wrong — please try again.");
      }
    } catch {
      setError("Could not send. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="w-14 h-14 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
          <CheckCircle className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Thank you</p>
          <p className="text-sm text-muted-foreground mt-1">
            This genuinely helps improve the experience.
          </p>
        </div>
        <Button variant="outline" size="sm" className="rounded-full mt-2" onClick={onClose}>
          Close
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-foreground text-sm">Quick feedback</p>
          <p className="text-xs text-muted-foreground mt-0.5">2 minutes · anonymous · helps improve the app</p>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
          aria-label="Close survey"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Q1: Impact rating */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">
          How much did this session impact your mood?
        </p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((v) => (
            <button
              key={v}
              onClick={() => setImpact(v)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all duration-150 ${
                impact === v
                  ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/30"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        {impact && (
          <p className="text-xs text-primary text-right">{IMPACT_LABELS[impact]}</p>
        )}
      </div>

      {/* Q2: Liked most */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">
          What did you like most? <span className="text-muted-foreground font-normal">(optional)</span>
        </p>
        <Textarea
          value={likedMost}
          onChange={e => setLikedMost(e.target.value)}
          placeholder="The breathing animation, the music, the reflection prompt…"
          rows={2}
          className="resize-none text-sm"
        />
      </div>

      {/* Q3: Would change */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">
          What would you change? <span className="text-muted-foreground font-normal">(optional)</span>
        </p>
        <Textarea
          value={wouldChange}
          onChange={e => setWouldChange(e.target.value)}
          placeholder="Something felt off, or missing, or could be better…"
          rows={2}
          className="resize-none text-sm"
        />
      </div>

      {/* Q4: Would return */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Would you use this again?</p>
        <div className="flex gap-2">
          {(["Yes", "Maybe", "No"] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setWouldReturn(opt)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all duration-150 ${
                wouldReturn === opt
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && <p className="text-xs text-destructive text-center">{error}</p>}

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={!canSubmit || sending}
        className="w-full gap-2 rounded-full font-semibold"
      >
        <Send className="h-4 w-4" />
        {sending ? "Sending…" : "Send Feedback"}
      </Button>

      <p className="text-[11px] text-muted-foreground/60 text-center">
        Completely anonymous. Your email is never requested or stored.
      </p>
    </div>
  );
}
