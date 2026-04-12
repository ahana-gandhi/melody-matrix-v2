import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus, Trash2, Calendar } from "lucide-react";
import { Link } from "wouter";

// ── Types & localStorage ───────────────────────────────────────────────────────

interface JournalEntry {
  id: number;
  mood: number;
  energy: number;
  note: string | null;
  tags: string;
  createdAt: string;
}

const LS_JOURNAL = "mm_journal_v1";

function loadEntries(): JournalEntry[] {
  try { return JSON.parse(localStorage.getItem(LS_JOURNAL) ?? "[]"); } catch { return []; }
}
function saveEntries(e: JournalEntry[]) {
  try { localStorage.setItem(LS_JOURNAL, JSON.stringify(e)); } catch {}
}

const moodEmoji = ["", "😔", "😕", "😐", "🙂", "😊"];
const energyEmoji = ["", "🪫", "😴", "⚡", "🔆", "✨"];
const MOOD_TAGS = ["anxious", "tired", "focused", "calm", "hopeful", "stressed", "grateful", "lonely", "motivated", "overwhelmed"];

// ── Main ───────────────────────────────────────────────────────────────────────

export default function Journal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [note, setNote] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const { toast } = useToast();

  useEffect(() => { setEntries(loadEntries()); }, []);

  const toggleTag = (tag: string) =>
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const handleAdd = () => {
    const newEntry: JournalEntry = {
      id: Date.now(), mood, energy,
      note: note.trim() || null,
      tags: JSON.stringify(selectedTags),
      createdAt: new Date().toISOString(),
    };
    const updated = [newEntry, ...entries];
    setEntries(updated);
    saveEntries(updated);
    setNote(""); setSelectedTags([]); setMood(3); setEnergy(3); setAdding(false);
    toast({ title: "Entry saved" });
  };

  const handleDelete = (id: number) => {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    saveEntries(updated);
    toast({ title: "Entry deleted" });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Mood Journal</h1>
          <p className="text-muted-foreground text-sm mt-1">Quick entries saved in your browser.</p>
        </div>
        <Button onClick={() => setAdding(!adding)} className="gap-2 rounded-full" variant={adding ? "outline" : "default"}>
          <Plus className="h-4 w-4" />{adding ? "Cancel" : "New Entry"}
        </Button>
      </div>

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
              <Textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Anything on your mind..." rows={3} className="resize-none" />
            </div>
            <Button onClick={handleAdd} className="gap-2 rounded-full">Save Entry</Button>
          </CardContent>
        </Card>
      )}

      {entries.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <BookOpen className="h-10 w-10 text-muted-foreground/40 mx-auto" />
          <p className="text-muted-foreground font-semibold">No journal entries yet</p>
          <p className="text-sm text-muted-foreground">
            Add your first entry above, or try an{" "}
            <Link href="/assessment" className="text-primary underline">assessment</Link>.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map(entry => {
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
                      <button onClick={() => handleDelete(entry.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
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
          })}
        </div>
      )}
    </div>
  );
}
