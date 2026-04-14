import { X, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

// Tally form — opens as a Tally popup overlay (no redirect, no iframe sizing issues)
const TALLY_URL = "https://tally.so/r/yPEAk0";

interface FeedbackSurveyProps {
  sessionName: string;
  onClose: () => void;
}

export function FeedbackSurvey({ sessionName, onClose }: FeedbackSurveyProps) {
  const handleOpen = () => {
    // Pass session name as a hidden prefill so responses are tagged by session
    const url = `${TALLY_URL}?session=${encodeURIComponent(sessionName)}`;
    window.open(url, "_blank", "noopener,noreferrer,width=680,height=620,left=200,top=100");
    onClose();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-foreground text-sm">Quick feedback</p>
          <p className="text-xs text-muted-foreground mt-0.5">2 min · anonymous · helps improve the app</p>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">
        5 quick questions about your experience. Opens in a small window — takes about 90 seconds.
      </p>

      <Button onClick={handleOpen} className="w-full gap-2 rounded-full font-semibold">
        <MessageSquare className="h-4 w-4" />
        Open Feedback Form
      </Button>

      <p className="text-[11px] text-muted-foreground/50 text-center">
        Completely anonymous. No account or email required.
      </p>
    </div>
  );
}
