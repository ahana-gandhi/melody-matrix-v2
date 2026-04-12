import { useState, createContext, useContext, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Key, ExternalLink } from "lucide-react";

// ── Context ────────────────────────────────────────────────────────────────

interface ApiKeyContextValue {
  geminiKey: string;
  setGeminiKey: (k: string) => void;
  showKeyModal: () => void;
}

const ApiKeyContext = createContext<ApiKeyContextValue>({
  geminiKey: "",
  setGeminiKey: () => {},
  showKeyModal: () => {},
});

export function useApiKey() {
  return useContext(ApiKeyContext);
}

// ── Provider ───────────────────────────────────────────────────────────────

const LS_KEY = "mm_gemini_key";

export function ApiKeyProvider({ children }: { children: React.ReactNode }) {
  const [geminiKey, setGeminiKeyState] = useState<string>(() => {
    // Read from localStorage on init (persists across refreshes)
    try { return localStorage.getItem(LS_KEY) ?? ""; } catch { return ""; }
  });
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

  const setGeminiKey = (k: string) => {
    setGeminiKeyState(k);
    try { localStorage.setItem(LS_KEY, k); } catch {}
  };

  const showKeyModal = () => {
    setDraft(geminiKey);
    setOpen(true);
  };

  const handleSave = () => {
    const trimmed = draft.trim();
    if (trimmed) {
      setGeminiKey(trimmed);
      setOpen(false);
    }
  };

  return (
    <ApiKeyContext.Provider value={{ geminiKey, setGeminiKey, showKeyModal }}>
      {children}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-bold">
              <Key className="h-5 w-5 text-primary" />
              Add your Gemini API key
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
              MelodyMatrix uses Google Lyria for music generation, which requires a Gemini API key.
              Your key is stored only in your browser — it is never sent to any server.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <Input
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder="AIza..."
              type="password"
              className="font-mono text-sm"
              onKeyDown={e => e.key === "Enter" && handleSave()}
              autoFocus
            />

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={!draft.trim()} className="flex-1 rounded-full font-bold">
                Save key
              </Button>
              <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full">
                Cancel
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Don't have a key?{" "}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline inline-flex items-center gap-1"
              >
                Get one free from Google AI Studio <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </ApiKeyContext.Provider>
  );
}
