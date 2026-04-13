import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, ImageDown } from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────────────

export interface SessionSummaryCardProps {
  sessionName: string;      // e.g. "Calm my anxiety"
  icon: string;             // emoji
  instrument: string;
  tempo: number;
  hue: number;              // base hue for gradient
  moodBefore?: number;      // 1–5
  moodAfter?: number;       // 1–5
  date?: string;            // override date string (defaults to today)
}

const MOOD_EMOJIS = ["😞", "😕", "😐", "🙂", "😄"];

// ── Canvas drawing ──────────────────────────────────────────────────────────

function drawCard(
  canvas: HTMLCanvasElement,
  props: SessionSummaryCardProps,
) {
  const { sessionName, icon, instrument, tempo, hue, moodBefore, moodAfter, date } = props;
  const W = 800;
  const H = 420;
  canvas.width  = W;
  canvas.height = H;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // ── Background ───────────────────────────────────────────────────────────
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0,   `hsl(${hue - 15}, 30%, 7%)`);
  bgGrad.addColorStop(0.5, `hsl(${hue},      25%, 9%)`);
  bgGrad.addColorStop(1,   `hsl(${hue + 20}, 20%, 6%)`);
  ctx.fillStyle = bgGrad;
  ctx.roundRect(0, 0, W, H, 20);
  ctx.fill();

  // ── Ambient orb glow ─────────────────────────────────────────────────────
  const orbGrad = ctx.createRadialGradient(W * 0.7, H * 0.35, 0, W * 0.7, H * 0.35, 220);
  orbGrad.addColorStop(0,   `hsla(${hue}, 70%, 55%, 0.18)`);
  orbGrad.addColorStop(0.5, `hsla(${hue}, 60%, 45%, 0.08)`);
  orbGrad.addColorStop(1,   `hsla(${hue}, 50%, 30%, 0)`);
  ctx.fillStyle = orbGrad;
  ctx.fillRect(0, 0, W, H);

  // ── Subtle noise texture (tiny dots) ─────────────────────────────────────
  ctx.globalAlpha = 0.03;
  for (let i = 0; i < 600; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const r = Math.random() * 1.2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // ── Top accent line ───────────────────────────────────────────────────────
  const lineGrad = ctx.createLinearGradient(0, 0, W, 0);
  lineGrad.addColorStop(0,   `hsla(${hue}, 80%, 65%, 0)`);
  lineGrad.addColorStop(0.3, `hsla(${hue}, 80%, 65%, 0.7)`);
  lineGrad.addColorStop(0.7, `hsla(${hue + 30}, 75%, 70%, 0.7)`);
  lineGrad.addColorStop(1,   `hsla(${hue + 30}, 75%, 70%, 0)`);
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(40, 20);
  ctx.lineTo(W - 40, 20);
  ctx.stroke();

  // ── App name ─────────────────────────────────────────────────────────────
  ctx.font = "bold 13px 'DM Sans', system-ui, sans-serif";
  ctx.letterSpacing = "0.18em";
  ctx.fillStyle = `hsla(${hue}, 70%, 72%, 0.55)`;
  ctx.fillText("MELODYMATRIX", 48, 52);
  ctx.letterSpacing = "0";

  // ── Date ─────────────────────────────────────────────────────────────────
  const dateStr = date ?? new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  ctx.font = "12px 'DM Sans', system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  const dateW = ctx.measureText(dateStr).width;
  ctx.fillText(dateStr, W - 48 - dateW, 52);

  // ── Icon ─────────────────────────────────────────────────────────────────
  ctx.font = "72px serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "white";
  ctx.fillText(icon, W / 2, 148);
  ctx.textAlign = "left";

  // ── Session name ─────────────────────────────────────────────────────────
  ctx.textAlign = "center";
  ctx.font = "bold 28px 'DM Sans', system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.fillText(sessionName, W / 2, 196);

  // ── Instrument + BPM tag ─────────────────────────────────────────────────
  const tagText = `${instrument}  ·  ${tempo} BPM`;
  ctx.font = "13px 'DM Sans', system-ui, sans-serif";
  ctx.fillStyle = `hsla(${hue}, 70%, 75%, 0.65)`;
  ctx.fillText(tagText, W / 2, 222);
  ctx.textAlign = "left";

  // ── Divider ───────────────────────────────────────────────────────────────
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, 248);
  ctx.lineTo(W - 80, 248);
  ctx.stroke();

  // ── Mood shift section ────────────────────────────────────────────────────
  if (moodBefore !== undefined && moodAfter !== undefined) {
    const midX = W / 2;
    const moodY = 305;
    const colW  = 160;

    // Before
    ctx.textAlign = "center";
    ctx.font = "10px 'DM Sans', system-ui, sans-serif";
    ctx.letterSpacing = "0.15em";
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.fillText("BEFORE", midX - colW, moodY - 44);
    ctx.letterSpacing = "0";

    ctx.font = "36px serif";
    ctx.fillStyle = "white";
    ctx.fillText(MOOD_EMOJIS[moodBefore - 1], midX - colW, moodY - 6);

    ctx.font = "bold 16px 'DM Sans', system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText(`${moodBefore}/5`, midX - colW, moodY + 20);

    // Arrow
    ctx.font = "bold 18px system-ui, sans-serif";
    const lift = moodAfter - moodBefore;
    const arrowColor = lift > 0
      ? `hsl(${hue}, 75%, 68%)`
      : lift < 0
      ? "#f87171"
      : "rgba(255,255,255,0.35)";
    ctx.fillStyle = arrowColor;
    ctx.fillText(lift > 0 ? "→" : lift < 0 ? "→" : "→", midX, moodY - 10);

    const liftText = lift > 0 ? `+${lift}` : lift === 0 ? "–" : `${lift}`;
    ctx.font = "bold 12px 'DM Sans', system-ui, sans-serif";
    ctx.fillStyle = arrowColor;
    ctx.fillText(liftText, midX, moodY + 14);

    // After
    ctx.font = "10px 'DM Sans', system-ui, sans-serif";
    ctx.letterSpacing = "0.15em";
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.fillText("AFTER", midX + colW, moodY - 44);
    ctx.letterSpacing = "0";

    ctx.font = "36px serif";
    ctx.fillStyle = "white";
    ctx.fillText(MOOD_EMOJIS[moodAfter - 1], midX + colW, moodY - 6);

    ctx.font = "bold 16px 'DM Sans', system-ui, sans-serif";
    ctx.fillStyle = arrowColor;
    ctx.fillText(`${moodAfter}/5`, midX + colW, moodY + 20);

    ctx.textAlign = "left";
  } else {
    // No mood data — show centered instrument/tempo larger
    ctx.textAlign = "center";
    ctx.font = "14px 'DM Sans', system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.38)";
    ctx.fillText("Session complete", W / 2, 295);
    ctx.textAlign = "left";
  }

  // ── Bottom accent line ────────────────────────────────────────────────────
  const botGrad = ctx.createLinearGradient(0, 0, W, 0);
  botGrad.addColorStop(0,   `hsla(${hue + 20}, 70%, 65%, 0)`);
  botGrad.addColorStop(0.3, `hsla(${hue + 20}, 70%, 65%, 0.5)`);
  botGrad.addColorStop(0.7, `hsla(${hue},      75%, 68%, 0.5)`);
  botGrad.addColorStop(1,   `hsla(${hue},      75%, 68%, 0)`);
  ctx.strokeStyle = botGrad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, H - 20);
  ctx.lineTo(W - 40, H - 20);
  ctx.stroke();

  // ── Footer tagline ────────────────────────────────────────────────────────
  ctx.textAlign = "center";
  ctx.font = "11px 'DM Sans', system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillText("AI-generated music therapy · melodymatrix", W / 2, H - 32);
  ctx.textAlign = "left";
}

// ── Component ────────────────────────────────────────────────────────────────

export function SessionSummaryCard(props: SessionSummaryCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendered, setRendered] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Draw on first mount
  const handleCanvasRef = (el: HTMLCanvasElement | null) => {
    (canvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = el;
    if (el && !rendered) {
      drawCard(el, props);
      setRendered(true);
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDownloading(true);

    canvas.toBlob((blob) => {
      if (!blob) { setDownloading(false); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `melodymatrix-session-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloading(false);
    }, "image/png");
  };

  return (
    <div className="space-y-3">
      {/* Heading */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <ImageDown className="h-4 w-4 text-primary" />
            Session Card
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Save a snapshot of this session</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-full"
          onClick={handleDownload}
          disabled={downloading || !rendered}
        >
          <Download className="h-3.5 w-3.5" />
          {downloading ? "Saving…" : "Save Card"}
        </Button>
      </div>

      {/* Canvas preview */}
      <div
        className="rounded-xl overflow-hidden border border-border/50 shadow-lg shadow-black/30"
        style={{ background: `hsl(${props.hue}, 20%, 6%)` }}
      >
        <canvas
          ref={handleCanvasRef}
          style={{ width: "100%", height: "auto", display: "block" }}
          aria-label="Session summary card"
        />
      </div>
    </div>
  );
}
