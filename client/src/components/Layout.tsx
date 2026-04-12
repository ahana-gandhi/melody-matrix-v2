import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Moon, Sun, Menu, X, AlertCircle, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuthStore } from "@/store/authStore";
import { AccountModal } from "@/components/AccountModal";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/assessment", label: "Assessment" },
  { href: "/presets", label: "Presets" },
  { href: "/guided", label: "Guided" },
  { href: "/journal", label: "Journal" },
  { href: "/about", label: "About" },
];

function ThemeToggle() {
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setDark((d) => !d)}
      className="h-9 w-9 text-muted-foreground hover:text-foreground"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

function CrisisBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div className="bg-amber-950/60 dark:bg-amber-950/60 border-b border-amber-800/50 px-4 py-2 text-center text-xs text-amber-200 flex items-center justify-center gap-2">
      <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 text-amber-400" />
      <span>
        Not a substitute for professional mental health care.
        In crisis? Call or text{" "}
        <a href="tel:988" className="font-bold underline text-amber-300">988</a>{" "}
        or text <strong>HOME</strong> to <strong>741741</strong>.
      </span>
      <button
        onClick={() => setDismissed(true)}
        className="ml-2 text-amber-500 hover:text-amber-200 flex-shrink-0"
        aria-label="Dismiss banner"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function AccountButton() {
  const { user, rehydrate } = useAuthStore();
  const [modalOpen, setModalOpen] = useState(false);

  // Rehydrate from localStorage on first render
  useEffect(() => { rehydrate(); }, []);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setModalOpen(true)}
        className="gap-2 rounded-full px-3 h-9 text-sm font-semibold text-muted-foreground hover:text-foreground"
        aria-label={user ? `Account: ${user.username}` : "Sign in"}
        data-testid="button-account"
      >
        <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
          user ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        }`}>
          {user ? user.username[0].toUpperCase() : <UserRound className="h-3.5 w-3.5" />}
        </div>
        <span className="hidden sm:inline max-w-[100px] truncate">
          {user ? user.username : "Sign in"}
        </span>
      </Button>
      <AccountModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Crisis banner */}
      <CrisisBanner />

      {/* Nav — Spotify-style: dark, no border, backdrop blur */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-label="MelodyMatrix" className="flex-shrink-0">
              <circle cx="16" cy="16" r="16" fill="hsl(var(--primary))"/>
              {/* Sound wave bars — centered */}
              <rect x="8"  y="14" width="3" height="4"  rx="1.5" fill="hsl(var(--primary-foreground))"/>
              <rect x="13" y="10" width="3" height="12" rx="1.5" fill="hsl(var(--primary-foreground))"/>
              <rect x="18" y="8"  width="3" height="16" rx="1.5" fill="hsl(var(--primary-foreground))"/>
              <rect x="23" y="12" width="3" height="8"  rx="1.5" fill="hsl(var(--primary-foreground))"/>
            </svg>
            <span className="font-bold text-lg tracking-tight text-foreground group-hover:text-primary transition-colors">
              MelodyMatrix
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  location === link.href
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="ml-3 pl-3 border-l border-border flex items-center gap-1">
              <AccountButton />
              <ThemeToggle />
            </div>
          </div>

          {/* Mobile menu */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 bg-card">
                <div className="flex flex-col gap-1 mt-8">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
                        location === link.href
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </header>

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <svg width="20" height="20" viewBox="0 0 32 32" fill="none" aria-hidden className="flex-shrink-0">
                <circle cx="16" cy="16" r="16" fill="hsl(var(--primary))"/>
                <rect x="8"  y="14" width="3" height="4"  rx="1.5" fill="hsl(var(--primary-foreground))"/>
                <rect x="13" y="10" width="3" height="12" rx="1.5" fill="hsl(var(--primary-foreground))"/>
                <rect x="18" y="8"  width="3" height="16" rx="1.5" fill="hsl(var(--primary-foreground))"/>
                <rect x="23" y="12" width="3" height="8"  rx="1.5" fill="hsl(var(--primary-foreground))"/>
              </svg>
              <span className="font-bold text-foreground">MelodyMatrix</span>
            </div>
            <p className="text-xs text-muted-foreground max-w-xs">
              AI-powered music for mental wellness. Not a substitute for professional care.
            </p>
          </div>
          <div className="flex flex-col sm:items-end gap-2 text-sm">
            <div className="flex items-center gap-4 text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link href="/about" className="hover:text-foreground transition-colors">About &amp; Ethics</Link>
              <a href="tel:988" className="hover:text-foreground transition-colors font-semibold text-primary">Crisis: 988</a>
            </div>
            <p className="text-xs text-muted-foreground">
              Powered by Google Lyria AI · Built with care
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
