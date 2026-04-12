import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen, Plus, Trash2, Music, TrendingUp, Calendar,
  Loader2, Flame, Brain, BarChart3, Sparkles, ArrowUp, ArrowDown, Minus,
} from "lucide-react";
import { Link } from "wouter";

// ── Types ──────────────────────────────────────────────────────────────────────

interface JournalEntry {
  id: number;
  mood: number;
  energy: number;
  note: string | null;
  tags: string;
  createdAt: string;
}

interface MoodSession {
  id: number;
  issue: string;
  instrument: string;
  tempo: number;
  moodBefore: number | null;
  moodAfter: number | null;
  createdAt: string;
}

// ── localStorage ───────────────────────────────────────────────────────────────

const LS_JOURNAL = "mm_journal_v1";
const LS_SESSIONS = "mm_sessions_v1";

function loadEntries(): JournalEntry[] {
  try { return JSON.parse(localStorage.getItem(LS_JOURNAL) ?? "[]"); } catch { return []; }
}
function saveEntries(e: JournalEntry[]) {
  try { localStorage.setItem(LS_JOURNAL, JSON.stringify(e)); } catch {}
}
function loadSessions(): MoodSession[] {
  try { return JSON.parse(localStorage.getItem(LS_SESSIONS) ?? "[]"); } catch { return []; }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const moodEmoji = ["", "😔", "😕", "😐", "🙂", "😊"];
const moodLabel = ["", "Very low", "Low", "Neutral", "Good", "Great"];
const energyEmoji = ["", "🪫", "😴", "⚡", "🔆", "✨"];
const MOOD_TAGS = ["anxious", "tired", "focused", "calm", "hopeful", "stressed", "grateful", "lonely", "motivated", "overwhelmed"];
const ISSUE_LABELS: Record<string, string> = {
  anxiety: "Anxiety", depression: "Low Mood", stress: "Stress",
  relationship: "Relationships", sleep: "Sleep",
};
const ISSUE_COLORS: Record<string, string> = {
  anxiety: "bg-violet-500", depression: "bg-blue-500", stress: "bg-orange-500",
  relationship: "bg-rose-500", sleep: "bg-indigo-500",
};

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ── Streak Calculator ─────────────────────────────────────────────────────────

function calcStreak(entries: JournalEntry[]): number {
  if (!entries.length) return 0;
  const days = new Set(entries.map(e => dayKey(new Date(e.createdAt))));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i <= 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (days.has(dayKey(d))) { streak++; } else if (i > 0) break;
  }
  return streak;
}

// ── Mood Trend Line ───────────────────────────────────────────────────────────

function MoodTrendChart({ entries }: { entries: JournalEntry[] }) {
  const recent = [...entries].slice(0, 14).reverse();
  if (recent.length < 2) return null;

  const W = 600, H = 120, PAD = 16;
  const pts = recent.map((e, i) => ({
    x: PAD + (i / (recent.length - 1)) * (W - PAD * 2),
    y: H - PAD - ((e.mood - 1) / 4) * (H - PAD * 2),
    entry: e,
  }));

  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z`;

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <TrendingUp className="h-4 w-4" /> Mood Trend — Last {recent.length} Entries
        </CardTitle>
      </CardHeader>
      <CardContent>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 100 }}>
          <defs>
            <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Grid lines */}
          {[1, 2, 3, 4, 5].map(v => {
            const y = H - PAD - ((v - 1) / 4) * (H - PAD * 2);
            return (
              <g key={v}>
                <line x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="4 4" />
                <text x={6} y={y + 4} fontSize="9" fill="hsl(var(--muted-foreground))">{v}</text>
              </g>
            );
          })}
          {/* Area fill */}
          <path d={areaD} fill="url(#moodGrad)" />
          {/* Line */}
          <path d={pathD} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* Points */}
          {pts.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="4" fill="hsl(var(--primary))" stroke="hsl(var(--card))" strokeWidth="2" />
              <title>{moodLabel[p.entry.mood]} · {new Date(p.entry.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</title>
            </g>
          ))}
        </svg>
        {/* X-axis labels */}
        <div className="flex justify-between text-xs text-muted-foreground mt-1 px-2">
          <span>{new Date(recent[0].createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
          <span>{new Date(recent[recent.length - 1].createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Before/After Sessions Chart ───────────────────────────────────────────────

function SessionsChart({ sessions }: { sessions: MoodSession[] }) {
  const withBoth = sessions.filter(s => s.moodBefore != null && s.moodAfter != null);
  if (withBoth.length < 1) return null;
  const recent = [...withBoth].slice(0, 8).reverse();

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Music className="h-4 w-4" /> Mood Before vs. After Music Sessions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-3 h-28">
          {recent.map((s) => {
            const before = s.moodBefore ?? 0;
            const after = s.moodAfter ?? 0;
            const lift = after - before;
            return (
              <div key={s.id} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                <span className={`text-xs font-bold tabular-nums ${lift > 0 ? "text-primary" : lift < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                  {lift > 0 ? `+${lift}` : lift}
                </span>
                <div className="w-full flex gap-0.5 items-end" style={{ height: 72 }}>
                  <div
                    className="flex-1 rounded-t bg-muted-foreground/30 transition-all"
                    style={{ height: `${(before / 5) * 72}px` }}
                    title={`Before: ${before}/5`}
                  />
                  <div
                    className="flex-1 rounded-t bg-primary transition-all"
                    style={{ height: `${(after / 5) * 72}px` }}
                    title={`After: ${after}/5`}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground text-center truncate w-full">
                  {ISSUE_LABELS[s.issue] ?? s.issue}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-2 bg-muted-foreground/30 rounded-sm" /> Before</span>
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-2 bg-primary rounded-sm" /> After</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Activity Heatmap (last 10 weeks) ─────────────────────────────────────────

function ActivityHeatmap({ entries }: { entries: JournalEntry[] }) {
  const moodByDay = useMemo(() => {
    const map: Record<string, number[]> = {};
    entries.forEach(e => {
      const k = dayKey(new Date(e.createdAt));
      map[k] = map[k] ? [...map[k], e.mood] : [e.mood];
    });
    return map;
  }, [entries]);

  const weeks = 10;
  const today = new Date();
  // Start from Monday of (weeks) weeks ago
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - (weeks * 7) + 1);

  const cells: { date: Date; key: string; avg: number | null }[] = [];
  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const k = dayKey(d);
    const moods = moodByDay[k];
    cells.push({ date: d, key: k, avg: moods ? moods.reduce((a, b) => a + b, 0) / moods.length : null });
  }

  function cellColor(avg: number | null) {
    if (avg === null) return "bg-muted/40";
    if (avg >= 4.5) return "bg-primary";
    if (avg >= 3.5) return "bg-primary/70";
    if (avg >= 2.5) return "bg-primary/40";
    if (avg >= 1.5) return "bg-primary/20";
    return "bg-destructive/30";
  }

  const monthLabels: { label: string; col: number }[] = [];
  cells.forEach((c, i) => {
    if (c.date.getDate() === 1 || i === 0) {
      monthLabels.push({
        label: c.date.toLocaleDateString("en-US", { month: "short" }),
        col: Math.floor(i / 7),
      });
    }
  });

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Calendar className="h-4 w-4" /> Activity — Last 10 Weeks
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Month labels */}
        <div className="flex gap-1 mb-1 pl-6">
          {Array.from({ length: weeks }, (_, w) => {
            const label = monthLabels.find(m => m.col === w);
            return (
              <div key={w} className="flex-1 text-[9px] text-muted-foreground">
                {label ? label.label : ""}
              </div>
            );
          })}
        </div>
        <div className="flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col gap-1 pr-1">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <div key={i} className="h-4 w-4 text-[9px] text-muted-foreground flex items-center">{i % 2 === 0 ? d : ""}</div>
            ))}
          </div>
          {/* Grid */}
          {Array.from({ length: weeks }, (_, w) => (
            <div key={w} className="flex flex-col gap-1 flex-1">
              {cells.slice(w * 7, w * 7 + 7).map((c, d) => (
                <div
                  key={d}
                  className={`h-4 rounded-sm ${cellColor(c.avg)} transition-colors`}
                  title={c.avg !== null
                    ? `${c.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · avg mood ${c.avg.toFixed(1)}`
                    : c.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                  }
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3 text-[10px] text-muted-foreground">
          <span>Less</span>
          {["bg-muted/40", "bg-primary/20", "bg-primary/40", "bg-primary/70", "bg-primary"].map(c => (
            <span key={c} className={`inline-block h-3 w-3 rounded-sm ${c}`} />
          ))}
          <span>More / Higher mood</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Issue breakdown ───────────────────────────────────────────────────────────

function IssueBreakdown({ sessions }: { sessions: MoodSession[] }) {
  if (!sessions.length) return null;
  const counts: Record<string, number> = {};
  sessions.forEach(s => { counts[s.issue] = (counts[s.issue] ?? 0) + 1; });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const total = sessions.length;

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Brain className="h-4 w-4" /> Sessions by Focus Area
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sorted.map(([issue, count]) => (
          <div key={issue} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-foreground">{ISSUE_LABELS[issue] ?? issue}</span>
              <span className="text-muted-foreground">{count} session{count !== 1 ? "s" : ""}</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${ISSUE_COLORS[issue] ?? "bg-primary"} transition-all`}
                style={{ width: `${(count / total) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function Journal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [sessions, setSessions] = useState<MoodSession[]>([]);
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [note, setNote] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "entries">("overview");
  const { toast } = useToast();

  useEffect(() => {
    setEntries(loadEntries());
    setSessions(loadSessions());
  }, []);

  // ── Computed stats ──────────────────────────────────────────────────────────
  const streak = useMemo(() => calcStreak(entries), [entries]);

  const avgMood = useMemo(() => {
    if (!entries.length) return null;
    return entries.slice(0, 7).reduce((s, e) => s + e.mood, 0) / Math.min(entries.length, 7);
  }, [entries]);

  const moodTrend = useMemo(() => {
    if (entries.length < 2) return 0;
    const recent = entries.slice(0, 3).reduce((s, e) => s + e.mood, 0) / Math.min(entries.length, 3);
    const older = entries.slice(3, 7).reduce((s, e) => s + e.mood, 0) / Math.min(Math.max(entries.length - 3, 0), 4) || recent;
    return recent - older;
  }, [entries]);

  const avgLift = useMemo(() => {
    const valid = sessions.filter(s => s.moodBefore != null && s.moodAfter != null);
    if (!valid.length) return null;
    return valid.reduce((s, sess) => s + (sess.moodAfter! - sess.moodBefore!), 0) / valid.length;
  }, [sessions]);

  const toggleTag = (tag: string) =>
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const handleAdd = async () => {
    setSaving(true);
    const newEntry: JournalEntry = {
      id: Date.now(), mood, energy,
      note: note.trim() || null,
      tags: JSON.stringify(selectedTags),
      createdAt: new Date().toISOString(),
    };
    const updated = [newEntry, ...entries];
    setEntries(updated);
    saveEntries(updated);
    setNote(""); setSelectedTags([]); setMood(3); setEnergy(3);
    setAdding(false); setSaving(false);
    toast({ title: "Entry saved" });
  };

  const handleDelete = (id: number) => {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    saveEntries(updated);
    toast({ title: "Entry deleted" });
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Your Progress</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {entries.length === 0
              ? "Start logging to see your mood insights here."
              : `${entries.length} journal ${entries.length === 1 ? "entry" : "entries"} · ${sessions.length} music session${sessions.length !== 1 ? "s" : ""}`
            }
          </p>
        </div>
        <Button onClick={() => { setAdding(!adding); setActiveTab("entries"); }} className="gap-2 rounded-full flex-shrink-0" variant={adding ? "outline" : "default"}>
          <Plus className="h-4 w-4" />{adding ? "Cancel" : "New Entry"}
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Streak */}
        <Card className="border-border">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Flame className="h-3.5 w-3.5 text-orange-400" />
              <span className="text-xs font-semibold uppercase tracking-wide">Streak</span>
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">{streak}<span className="text-sm font-normal text-muted-foreground ml-1">days</span></p>
          </CardContent>
        </Card>

        {/* Avg mood */}
        <Card className="border-border">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <BarChart3 className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wide">7-day avg</span>
            </div>
            <div className="flex items-center gap-1.5">
              <p className="text-2xl font-bold text-foreground tabular-nums">
                {avgMood !== null ? avgMood.toFixed(1) : "—"}
              </p>
              {moodTrend > 0.2 && <ArrowUp className="h-4 w-4 text-primary" />}
              {moodTrend < -0.2 && <ArrowDown className="h-4 w-4 text-destructive" />}
              {Math.abs(moodTrend) <= 0.2 && avgMood !== null && <Minus className="h-4 w-4 text-muted-foreground" />}
            </div>
          </CardContent>
        </Card>

        {/* Sessions */}
        <Card className="border-border">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Music className="h-3.5 w-3.5 text-violet-400" />
              <span className="text-xs font-semibold uppercase tracking-wide">Sessions</span>
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">{sessions.length}</p>
          </CardContent>
        </Card>

        {/* Avg lift */}
        <Card className="border-border">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-yellow-400" />
              <span className="text-xs font-semibold uppercase tracking-wide">Avg lift</span>
            </div>
            <p className={`text-2xl font-bold tabular-nums ${avgLift !== null && avgLift > 0 ? "text-primary" : "text-foreground"}`}>
              {avgLift !== null ? `${avgLift >= 0 ? "+" : ""}${avgLift.toFixed(1)}` : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tab switcher */}
      {(entries.length > 0 || sessions.length > 0) && (
        <div className="flex rounded-full border border-border p-1 bg-muted/30 w-fit gap-1">
          {(["overview", "entries"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all capitalize ${
                activeTab === tab
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "overview" ? "Charts & Insights" : "Journal Entries"}
            </button>
          ))}
        </div>
      )}

      {/* New entry form */}
      {adding && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">How are you feeling?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Mood: <span className="text-lg">{moodEmoji[mood]}</span> {mood}/5
                </label>
                <Slider value={[mood]} min={1} max={5} step={1} onValueChange={([v]) => setMood(v)} />
                <div className="flex justify-between text-xs text-muted-foreground"><span>Very low</span><span>Great</span></div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Energy: <span className="text-lg">{energyEmoji[energy]}</span> {energy}/5
                </label>
                <Slider value={[energy]} min={1} max={5} step={1} onValueChange={([v]) => setEnergy(v)} />
                <div className="flex justify-between text-xs text-muted-foreground"><span>Exhausted</span><span>Energized</span></div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Tags</label>
              <div className="flex flex-wrap gap-2">
                {MOOD_TAGS.map(tag => (
                  <button key={tag} onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                      selectedTags.includes(tag)
                        ? "border-primary bg-primary/15 text-primary font-semibold"
                        : "border-border bg-card text-muted-foreground hover:border-primary/50"
                    }`}
                  >{tag}</button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Notes <span className="text-muted-foreground font-normal">(optional)</span></label>
              <Textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Anything on your mind today..." rows={3} className="resize-none" />
            </div>
            <Button onClick={handleAdd} disabled={saving} className="gap-2 rounded-full">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save Entry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {entries.length === 0 && sessions.length === 0 && !adding && (
        <div className="text-center py-20 space-y-4">
          <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto" />
          <div>
            <p className="font-semibold text-foreground">Nothing here yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add a journal entry above, or complete an{" "}
              <Link href="/assessment" className="text-primary underline">assessment</Link>{" "}
              to start tracking your progress.
            </p>
          </div>
        </div>
      )}

      {/* Overview tab */}
      {activeTab === "overview" && (entries.length > 0 || sessions.length > 0) && (
        <div className="space-y-6">
          <MoodTrendChart entries={entries} />
          <SessionsChart sessions={sessions} />
          <div className="grid sm:grid-cols-2 gap-6">
            <IssueBreakdown sessions={sessions} />
            {/* Top tags */}
            {entries.length > 0 && (() => {
              const tagCounts: Record<string, number> = {};
              entries.forEach(e => {
                try { (JSON.parse(e.tags) as string[]).forEach(t => { tagCounts[t] = (tagCounts[t] ?? 0) + 1; }); } catch {}
              });
              const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
              if (!topTags.length) return null;
              return (
                <Card className="border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                      <BookOpen className="h-4 w-4" /> Most Common Feelings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {topTags.map(([tag, count]) => (
                        <Badge key={tag} variant="secondary" className="gap-1.5 text-xs px-2.5 py-1">
                          {tag} <span className="text-muted-foreground font-normal">{count}×</span>
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
          </div>
          <ActivityHeatmap entries={entries} />
        </div>
      )}

      {/* Entries tab */}
      {activeTab === "entries" && (
        <div className="space-y-3">
          {entries.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">No entries yet — add one above.</p>
          ) : (
            entries.map(entry => {
              const tags = entry.tags ? JSON.parse(entry.tags) as string[] : [];
              return (
                <Card key={entry.id} className="border-border group hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex gap-4 items-start">
                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      <span className="text-2xl">{moodEmoji[entry.mood]}</span>
                      <span className="text-xs text-muted-foreground">{entry.mood}/5</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(entry.createdAt).toLocaleDateString("en-US", {
                            weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                          })}
                          <span className="ml-2">{energyEmoji[entry.energy]} {entry.energy}/5</span>
                        </div>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {entry.note && <p className="text-sm text-foreground leading-relaxed mb-2">{entry.note}</p>}
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {tags.map(tag => <Badge key={tag} variant="secondary" className="text-xs px-2 py-0">{tag}</Badge>)}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
