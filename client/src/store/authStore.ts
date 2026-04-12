import { create } from "zustand";
import { apiRequest } from "@/lib/queryClient";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: number;
  username: string;
  createdAt: string;
}

interface AuthState {
  user: AuthUser | null;
  // Actions
  register: () => Promise<{ username: string; password: string }>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  // Rehydrate from localStorage on app boot
  rehydrate: () => void;
}

// ── Word lists for username generation ────────────────────────────────────────

const ADJECTIVES = [
  "calm", "gentle", "still", "bright", "quiet", "soft", "warm", "clear",
  "serene", "tender", "mellow", "peaceful", "steady", "azure", "lunar",
  "amber", "velvet", "golden", "silver", "misty",
];

const NOUNS = [
  "river", "melody", "wave", "breeze", "ember", "dawn", "cloud", "forest",
  "stone", "spark", "rain", "tide", "echo", "bloom", "haze", "star",
  "valley", "ridge", "petal", "note",
];

const PASSPHRASE_WORDS = [
  "apple", "bridge", "candle", "drift", "echo", "frost", "grove", "haven",
  "iris", "jade", "kindle", "lagoon", "maple", "nova", "ocean", "prism",
  "quartz", "ripple", "sunset", "thorn", "umbra", "voyage", "willow",
  "xenon", "yarrow", "zenith", "amber", "beacon", "cedar", "dusk",
  "ember", "fable", "glade", "harbor", "inlet", "jewel", "knoll",
  "linden", "mallow", "nectar", "opal", "pastel", "quill", "rowan",
  "shore", "tidal", "umber", "vernal", "wistful", "xylem",
];

// ── Generators ────────────────────────────────────────────────────────────────

function generateUsername(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${adj}-${noun}-${num}`;
}

function generatePassphrase(): string {
  const pick = () => PASSPHRASE_WORDS[Math.floor(Math.random() * PASSPHRASE_WORDS.length)];
  return `${pick()}-${pick()}-${pick()}`;
}

// ── localStorage helpers ───────────────────────────────────────────────────────

const LS_KEY = "mm_auth_v1";

function persistUser(user: AuthUser | null) {
  try {
    if (user) {
      localStorage.setItem(LS_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(LS_KEY);
    }
  } catch {}
}

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>((set) => ({
  user: null,

  rehydrate() {
    const saved = loadUser();
    if (saved) set({ user: saved });
  },

  async register() {
    const username = generateUsername();
    const password = generatePassphrase();

    const res = await apiRequest("POST", "/api/auth/register", { username, password });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Registration failed" }));
      throw new Error(err.error || "Registration failed");
    }
    const { user } = await res.json();
    persistUser(user);
    set({ user });
    return { username, password };
  },

  async login(username, password) {
    const res = await apiRequest("POST", "/api/auth/login", { username, password });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Invalid credentials" }));
      throw new Error(err.error || "Invalid credentials");
    }
    const { user } = await res.json();
    persistUser(user);
    set({ user });
  },

  logout() {
    persistUser(null);
    set({ user: null });
  },
}));
