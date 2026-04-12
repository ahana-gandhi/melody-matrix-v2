import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Music, BookOpen, Info, Moon, Sun, Menu, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/assessment", label: "Assessment" },
  { href: "/journal", label: "Journal" },
  { href: "/about", label: "About" },
];

function ThemeToggle() {
  const [dark, setDark] = useState(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches
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
      className="h-9 w-9"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

function CrisisBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 px-4 py-2 text-center text-sm text-amber-900 dark:text-amber-200 flex items-center justify-center gap-2">
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span>
        This app is <strong>not a substitute</strong> for professional mental health care.
        In crisis? Call or text <a href="tel:988" className="font-bold underline">988</a> (Suicide &amp; Crisis Lifeline) or text <strong>HOME</strong> to <strong>741741</strong>.
      </span>
      <button
        onClick={() => setDismissed(true)}
        className="ml-2 text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 flex-shrink-0"
        aria-label="Dismiss banner"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Crisis banner */}
      <CrisisBanner />

      {/* Nav */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-display font-medium text-lg text-foreground hover:text-primary transition-colors">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-label="MelodyMatrix" className="flex-shrink-0">
              <rect x="2" y="2" width="24" height="24" rx="6" fill="hsl(var(--primary))" opacity="0.15"/>
              <rect x="2" y="2" width="24" height="24" rx="6" stroke="hsl(var(--primary))" strokeWidth="1.5"/>
              {/* Sound wave bars */}
              <rect x="7" y="12" width="2.5" height="4" rx="1.25" fill="hsl(var(--primary))"/>
              <rect x="11" y="9" width="2.5" height="10" rx="1.25" fill="hsl(var(--primary))"/>
              <rect x="15" y="7" width="2.5" height="14" rx="1.25" fill="hsl(var(--primary))"/>
              <rect x="19" y="11" width="2.5" height="6" rx="1.25" fill="hsl(var(--primary))"/>
            </svg>
            MelodyMatrix
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  location === link.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="ml-2">
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
              <SheetContent side="right" className="w-64">
                <div className="flex flex-col gap-1 mt-6">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        location === link.href
                          ? "bg-primary/10 text-primary"
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
      <footer className="border-t border-border bg-muted/30 py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Music className="h-4 w-4" />
            <span>MelodyMatrix — AI Music for Mental Wellness</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/about" className="hover:text-foreground transition-colors">About &amp; Ethics</Link>
            <a href="tel:988" className="hover:text-foreground transition-colors font-medium">Crisis: 988</a>
          </div>
          <p className="text-xs text-center sm:text-right">
            Not a substitute for professional mental health care.
            <br />
            AI-generated music powered by Google Lyria.
          </p>
        </div>
      </footer>
    </div>
  );
}
