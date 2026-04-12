import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Copy, Check, ShieldCheck, LogOut, Loader2, Eye, EyeOff, KeyRound, UserRound,
} from "lucide-react";

// ── Shared sub-components ─────────────────────────────────────────────────────

function PrivacyNote() {
  return (
    <div className="flex items-start gap-2.5 rounded-md border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
      <ShieldCheck className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
      <span>
        <strong className="text-foreground">No email. No tracking.</strong>{" "}
        Your account is identified only by a generated username and passphrase. Write them down — we can't recover lost credentials.
      </span>
    </div>
  );
}

function CopyableField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      <div className="flex items-center gap-2">
        <code className="flex-1 rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-sm text-foreground">
          {value}
        </code>
        <Button
          size="icon"
          variant="ghost"
          className="h-9 w-9 flex-shrink-0 text-muted-foreground hover:text-foreground"
          onClick={handleCopy}
          aria-label={`Copy ${label}`}
        >
          {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

// ── Create Account tab ────────────────────────────────────────────────────────

function CreateAccountTab({ onDone }: { onDone: () => void }) {
  const { register } = useAuthStore();
  const { toast } = useToast();
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const creds = await register();
      setCredentials(creds);
    } catch (e: any) {
      toast({ title: "Could not create account", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (credentials) {
    return (
      <div className="space-y-5">
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-foreground">Your account is ready</p>
          <p className="text-xs text-muted-foreground">
            Save these credentials somewhere safe — this is the only time you'll see them.
          </p>
        </div>

        <CopyableField label="Username" value={credentials.username} />
        <CopyableField label="Passphrase" value={credentials.password} />

        <PrivacyNote />

        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            className="h-4 w-4 rounded accent-primary"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          <span className="text-sm text-foreground">
            I've saved my username and passphrase
          </span>
        </label>

        <Button
          onClick={onDone}
          disabled={!confirmed}
          className="w-full rounded-full font-semibold"
        >
          Done — Start Using MelodyMatrix
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground leading-relaxed">
        We'll generate a random username and passphrase for you. No email, no personal info — just a private key to your data.
      </p>

      <PrivacyNote />

      <Button
        onClick={handleCreate}
        disabled={loading}
        className="w-full rounded-full font-semibold gap-2"
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</>
        ) : (
          <><KeyRound className="h-4 w-4" /> Generate My Account</>
        )}
      </Button>
    </div>
  );
}

// ── Sign In tab ───────────────────────────────────────────────────────────────

function SignInTab({ onDone }: { onDone: () => void }) {
  const { login } = useAuthStore();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    setLoading(true);
    try {
      await login(username.trim(), password.trim());
      toast({ title: "Signed in" });
      onDone();
    } catch (e: any) {
      toast({ title: "Sign-in failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Enter the username and passphrase you wrote down when creating your account.
      </p>

      <div className="space-y-2">
        <Label htmlFor="signin-username" className="text-sm font-medium">
          Username
        </Label>
        <div className="relative">
          <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="signin-username"
            data-testid="input-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="calm-river-4821"
            className="pl-9 font-mono"
            autoComplete="username"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signin-password" className="text-sm font-medium">
          Passphrase
        </Label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="signin-password"
            data-testid="input-password"
            type={showPass ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="apple-bridge-zenith"
            className="pl-9 pr-10 font-mono"
            autoComplete="current-password"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowPass((s) => !s)}
            aria-label={showPass ? "Hide passphrase" : "Show passphrase"}
          >
            {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading || !username.trim() || !password.trim()}
        className="w-full rounded-full font-semibold gap-2"
        data-testid="button-signin"
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</>
        ) : (
          "Sign In"
        )}
      </Button>
    </form>
  );
}

// ── Signed-in state ───────────────────────────────────────────────────────────

function SignedInView({ onClose }: { onClose: () => void }) {
  const { user, logout } = useAuthStore();
  const { toast } = useToast();

  const handleLogout = () => {
    logout();
    toast({ title: "Signed out" });
    onClose();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 rounded-md border border-border bg-muted/30 p-4">
        <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
          {user?.username?.[0]?.toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-foreground truncate">{user?.username}</p>
          <p className="text-xs text-muted-foreground">Signed in · Your data syncs to this account</p>
        </div>
      </div>

      <PrivacyNote />

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Account options</p>
        <Button
          variant="outline"
          className="w-full justify-start gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
          onClick={handleLogout}
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  );
}

// ── Root modal ────────────────────────────────────────────────────────────────

interface AccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccountModal({ open, onOpenChange }: AccountModalProps) {
  const { user } = useAuthStore();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-bold text-lg">
            {user ? "Your Account" : "Account"}
          </DialogTitle>
        </DialogHeader>

        {user ? (
          <SignedInView onClose={() => onOpenChange(false)} />
        ) : (
          <Tabs defaultValue="create" className="mt-1">
            <TabsList className="w-full mb-5 bg-muted/50">
              <TabsTrigger value="create" className="flex-1 text-sm" data-testid="tab-create">
                Create Account
              </TabsTrigger>
              <TabsTrigger value="signin" className="flex-1 text-sm" data-testid="tab-signin">
                Sign In
              </TabsTrigger>
            </TabsList>
            <TabsContent value="create">
              <CreateAccountTab onDone={() => onOpenChange(false)} />
            </TabsContent>
            <TabsContent value="signin">
              <SignInTab onDone={() => onOpenChange(false)} />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
