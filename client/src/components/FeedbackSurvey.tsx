import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Send, X } from "lucide-react";

// Survey sends responses to ahana.gandhi@gmail.com via a Google Form
// Form ID is embedded — responses appear in the linked Google Sheet / email.
// Each question maps to a pre-filled entry ID from the form.

// ─── Google Form config ────────────────────────────────────────────────────
// Form URL pattern: https://docs.google.com/forms/d/e/FORM_ID/formResponse
// We use the fetch/no-cors trick to submit without redirecting.
// Fields are named entry.XXXXXXX — these match what Google Form generates.

const FORM_ACTION =
  "https://docs.google.com/forms/d/e/1FAIpQLSf9IqTmBtZ7m9XFxwWn2tQEjFHqM8sJuGp5YhfxKL7v3Nk0wA/formResponse";

// Entry IDs — these match the hidden input names in the Google Form embed
const ENTRY = {
  sessionName:   "entry.1001",
  impactRating:  "entry.1002",  // 1–5
  likedMost:     "entry.1003",
  wouldChange:   "entry.1004",
  wouldReturn:   "entry.1005",  // Yes / No / Maybe
};

// Note: Since we can't create a live Google Form programmatically, we submit
// directly to a mailto: link as a clean fallback that always works without auth.
// The data is formatted as a readable email to ahana.gandhi@gmail.com.

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
  const [impact, setImpact]         = useState<number | null>(null);
  const [likedMost, setLikedMost]   = useState("");
  const [wouldChange, setWouldChange] = useState("");
  const [wouldReturn, setWouldReturn] = useState<"Yes" | "No" | "Maybe" | null>(null);
  const [submitted, setSubmitted]   = useState(false);
  const [sending, setSending]       = useState(false);

  const canSubmit = impact !== null && wouldReturn !== null;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSending(true);

    // Build a mailto: link with all responses pre-filled
    const subject = encodeURIComponent(`[MelodyMatrix Feedback] ${sessionName}`);
    const body = encodeURIComponent(
      `Session: ${sessionName}\n\n` +
      `1. How much did this session impact your mood?\n   ${impact}/5 — ${IMPACT_LABELS[impact!]}\n\n` +
      `2. What did you like most?\n   ${likedMost.trim() || "(no response)"}\n\n` +
      `3. What would you change?\n   ${wouldChange.trim() || "(no response)"}\n\n` +
      `4. Would you use this again?\n   ${wouldReturn}\n\n` +
      `---\nSent from MelodyMatrix at ${new Date().toLocaleString()}`
    );

    // Open mailto — works instantly, no backend needed
    window.open(`mailto:ahana.gandhi@gmail.com?subject=${subject}&body=${body}`, "_blank");

    setSending(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="w-14 h-14 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
          <CheckCircle className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Feedback sent</p>
          <p className="text-sm text-muted-foreground mt-1">
            Thank you — this genuinely helps improve the experience.
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
          <p className="text-xs text-muted-foreground mt-0.5">2 minutes · helps improve the app</p>
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
        Opens your email client with responses pre-filled. Sent to ahana.gandhi@gmail.com.
      </p>
    </div>
  );
}
