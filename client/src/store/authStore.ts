import { create } from "zustand";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;       // client-generated UUID, no backend needed
  username: string;
  createdAt: string;
}

interface StoredAccount {
  user: AuthUser;
  passwordHash: string;
}

interface AuthState {
  user: AuthUser | null;
  register: () => Promise<{ username: string; password: string }>;
  registerCustom: (username: string, password: string) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  rehydrate: () => void;
}

// ── Word lists ────────────────────────────────────────────────────────────────

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
function uuid(): string {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ── Simple client-side hash (not cryptographic, just for local auth) ──────────

async function hashPassword(password: string): Promise<string> {
  try {
    const data = new TextEncoder().encode(password + "mm-salt-v2");
    const buf = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  } catch {
    // Fallback: simple string hash
    let h = 0;
    for (let i = 0; i < password.length; i++) h = (Math.imul(31, h) + password.charCodeAt(i)) | 0;
    return String(Math.abs(h));
  }
}

// ── localStorage ──────────────────────────────────────────────────────────────

const LS_SESSION = "mm_auth_v1";     // current logged-in user
const LS_ACCOUNTS = "mm_accounts_v1"; // all registered accounts on this device

function loadSession(): AuthUser | null {
  try { return JSON.parse(localStorage.getItem(LS_SESSION) ?? "null"); } catch { return null; }
}
function saveSession(user: AuthUser | null) {
  try {
    if (user) localStorage.setItem(LS_SESSION, JSON.stringify(user));
    else localStorage.removeItem(LS_SESSION);
  } catch {}
}
function loadAccounts(): Record<string, StoredAccount> {
  try { return JSON.parse(localStorage.getItem(LS_ACCOUNTS) ?? "{}"); } catch { return {}; }
}
function saveAccounts(accounts: Record<string, StoredAccount>) {
  try { localStorage.setItem(LS_ACCOUNTS, JSON.stringify(accounts)); } catch {}
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>((set) => ({
  user: null,

  rehydrate() {
    const saved = loadSession();
    if (saved) set({ user: saved });
  },

  // Generate username + passphrase, no input needed
  async register() {
    const username = generateUsername();
    const password = generatePassphrase();
    const passwordHash = await hashPassword(password);
    const user: AuthUser = { id: uuid(), username, createdAt: new Date().toISOString() };

    const accounts = loadAccounts();
    accounts[username] = { user, passwordHash };
    saveAccounts(accounts);
    saveSession(user);
    set({ user });

    return { username, password };
  },

  // Custom username + password chosen by user
  async registerCustom(username, password) {
    if (username.trim().length < 3) throw new Error("Username must be at least 3 characters");
    if (password.trim().length < 6) throw new Error("Password must be at least 6 characters");

    const accounts = loadAccounts();
    if (accounts[username.trim()]) throw new Error("Username already taken on this device");

    const passwordHash = await hashPassword(password);
    const user: AuthUser = { id: uuid(), username: username.trim(), createdAt: new Date().toISOString() };

    accounts[username.trim()] = { user, passwordHash };
    saveAccounts(accounts);
    saveSession(user);
    set({ user });
  },

  async login(username, password) {
    const accounts = loadAccounts();
    const record = accounts[username.trim()];
    if (!record) throw new Error("No account found with that username on this device");

    const hash = await hashPassword(password);
    if (hash !== record.passwordHash) throw new Error("Incorrect password");

    saveSession(record.user);
    set({ user: record.user });
  },

  logout() {
    saveSession(null);
    set({ user: null });
  },
}));
