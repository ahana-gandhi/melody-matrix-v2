import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus, Trash2, Music, TrendingUp, Calendar, Loader2 } from "lucide-react";
import { Link } from "wouter";

// ── Types ──────────────────────────────────────────────────────────────────

interface LocalJournalEntry {
  id: number;
  mood: number;
  energy: number;
  note: string | null;
  tags: string;
  createdAt: string;
}

interface LocalMoodSession {
  id: number;
  issue: string;
  instrument: string;
  tempo: number;
  moodBefore: number | null;
  moodAfter: number | null;
  createdAt: string;
}

// ── Local storage helpers (with graceful fallback) ─────────────────────────

const LS_JOURNAL = "mm_journal_v1";
const LS_SESSIONS = "mm_sessions_v1";

function loadEntries(): LocalJournalEntry[] {
  try {
    const raw = localStorage.getItem(LS_JOURNAL);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveEntries(entries: LocalJournalEntry[]) {
  try { localStorage.setItem(LS_JOURNAL, JSON.stringify(entries)); } catch {}
}

function loadSessions(): LocalMoodSession[] {
  try {
    const raw = localStorage.getItem(LS_SESSIONS);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

// ── Helpers ────────────────────────────────────────────────────────────────

const moodEmoji = ["", "😔", "😕", "😐", "🙂", "😊"];
const energyEmoji = ["", "🪫", "😴", "⚡", "🔆", "✨"];
const MOOD_TAGS = ["anxious", "tired", "focused", "calm", "hopeful", "stressed", "grateful", "lonely", "motivated", "overwhelmed"];

function MoodChart({ sessions }: { sessions: LocalMoodSession[] }) {
  const withBoth = sessions.filter(s => s.moodBefore && s.moodAfter);
  if (withBoth.length < 2) return null;
  const recent = withBoth.slice(0, 10).reverse();

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <TrendingUp className="h-4 w-4" /> Mood Before / After Sessions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2 h-24">
          {recent.map((s) => (
            <div key={s.id} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex gap-0.5">
                {s.moodBefore && (
                  <div
                    className="flex-1 rounded-t bg-muted-foreground/30"
                    style={{ height: `${(s.moodBefore / 5) * 80}px` }}
                    title={`Before: ${s.moodBefore}`}
                  />
                )}
                {s.moodAfter && (
                  <div
                    className="flex-1 rounded-t bg-primary"
                    style={{ height: `${(s.moodAfter / 5) * 80}px` }}
                    title={`After: ${s.moodAfter}`}
                  />
                )}
              </div>
              <span className="text-xs text-muted-foreground tabular-nums">
                {new Date(s.createdAt).toLocaleDateString("en-US", { month: "numeric", day: "numeric" })}
              </span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 bg-muted-foreground/30 rounded-sm" /> Before</span>
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 bg-primary rounded-sm" /> After</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function Journal() {
  const [entries, setEntries] = useState<LocalJournalEntry[]>([]);
  const [sessions, setSessions] = useState<LocalMoodSession[]>([]);
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [note, setNote] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Load from localStorage on mount
  useEffect(() => {
    setEntries(loadEntries());
    setSessions(loadSessions());
  }, []);

  const avgMoodImprovement = sessions
    .filter(s => s.moodBefore && s.moodAfter)
    .reduce((sum, s) => sum + (s.moodAfter! - s.moodBefore!), 0) /
    Math.max(sessions.filter(s => s.moodBefore && s.moodAfter).length, 1);

  const toggleTag = (tag: string) =>
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const handleAdd = async () => {
    setSaving(true);
    const newEntry: LocalJournalEntry = {
      id: Date.now(),
      mood,
      energy,
      note: note.trim() || null,
      tags: JSON.stringify(selectedTags),
      createdAt: new Date().toISOString(),
    };
    const updated = [newEntry, ...entries];
    setEntries(updated);
    saveEntries(updated);
    setNote("");
    setSelectedTags([]);
    setMood(3);
    setEnergy(3);
    setAdding(false);
    setSaving(false);
    toast({ title: "Entry saved" });
  };

  const handleDelete = (id: number) => {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    saveEntries(updated);
    toast({ title: "Entry deleted" });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Mood Journal</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track how you feel day-to-day. Entries are saved in your browser.
          </p>
        </div>
        <Button
          onClick={() => setAdding(!adding)}
          className="gap-2 rounded-full"
          variant={adding ? "outline" : "default"}
        >
          <Plus className="h-4 w-4" />
          {adding ? "Cancel" : "New Entry"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total entries", value: entries.length, icon: <BookOpen className="h-4 w-4" /> },
          { label: "Music sessions", value: sessions.length, icon: <Music className="h-4 w-4" /> },
          {
            label: "Avg. mood lift",
            value: sessions.filter(s => s.moodBefore && s.moodAfter).length > 0
              ? `${avgMoodImprovement >= 0 ? "+" : ""}${avgMoodImprovement.toFixed(1)}`
              : "—",
            icon: <TrendingUp className="h-4 w-4" />,
          },
        ].map(s => (
          <Card key={s.label} className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                {s.icon}
              </div>
              <div>
                <p className="text-xl font-bold text-foreground tabular-nums">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mood chart */}
      <MoodChart sessions={sessions} />

      {/* New entry form */}
      {adding && (
        <Card className="border-primary/20 bg-primary/5 animate-scale-in">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">How are you feeling?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Mood: <span className="text-lg">{moodEmoji[mood]}</span> {mood}/5
                </label>
                <Slider value={[mood]} min={1} max={5} step={1} onValueChange={([v]) => setMood(v)} aria-label="Mood" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Very low</span><span>Great</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Energy: <span className="text-lg">{energyEmoji[energy]}</span> {energy}/5
                </label>
                <Slider value={[energy]} min={1} max={5} step={1} onValueChange={([v]) => setEnergy(v)} aria-label="Energy" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Exhausted</span><span>Energized</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Tags</label>
              <div className="flex flex-wrap gap-2">
                {MOOD_TAGS.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                      selectedTags.includes(tag)
                        ? "border-primary bg-primary/15 text-primary font-semibold"
                        : "border-border bg-card text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Notes <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Anything on your mind today..."
                rows={3}
                className="resize-none"
              />
            </div>

            <Button onClick={handleAdd} disabled={saving} className="gap-2 rounded-full">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Entry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Entry list */}
      {entries.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <BookOpen className="h-10 w-10 text-muted-foreground/40 mx-auto" />
          <p className="text-muted-foreground font-semibold">No journal entries yet</p>
          <p className="text-sm text-muted-foreground">
            Add your first entry above, or complete an{" "}
            <Link href="/assessment" className="text-primary underline">assessment</Link>{" "}
            to automatically log a session.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="font-bold text-lg text-foreground">Recent Entries</h2>
          {entries.map(entry => {
            const tags = entry.tags ? JSON.parse(entry.tags) as string[] : [];
            return (
              <Card key={entry.id} className="border-border group hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex gap-4 items-start">
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <span className="text-2xl" title={`Mood: ${entry.mood}/5`}>{moodEmoji[entry.mood]}</span>
                    <span className="text-xs text-muted-foreground">{entry.mood}/5</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(entry.createdAt).toLocaleDateString("en-US", {
                          weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                        })}
                        <span className="ml-2">{energyEmoji[entry.energy]} Energy {entry.energy}/5</span>
                      </div>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        aria-label="Delete entry"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {entry.note && <p className="text-sm text-foreground leading-relaxed mb-2">{entry.note}</p>}
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs px-2 py-0">{tag}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
