import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Shield, Brain, BookOpen } from "lucide-react";

const steps = [
  { num: "01", title: "Choose your focus", desc: "Anxiety, sleep, stress, mood, or relationship challenges." },
  { num: "02", title: "Answer 5 questions", desc: "Slider-based, adapted from GAD-7, PHQ-9, ISI screening tools." },
  { num: "03", title: "Pick your sound", desc: "Instrument and tempo that feel right to you." },
  { num: "04", title: "Listen", desc: "Lyria AI streams a unique composition in real time. Download it, log it." },
];

const stats = [
  { stat: "60%", label: "report reduced anxiety after 20 min of guided music", source: "APMR, 2023" },
  { stat: "↓ Cortisol", label: "Calming music measurably lowers the primary stress hormone", source: "Frontiers in Psychology" },
  { stat: "~90 BPM", label: "Music near resting heart rate synchronizes brainwaves for calm", source: "Journal of Music Therapy" },
];

const features = [
  {
    icon: <Brain className="h-6 w-6" />,
    title: "Clinically-informed",
    desc: "Questions adapted from validated screening tools to build an accurate musical brief — not a generic playlist.",
  },
  {
    icon: <Play className="h-6 w-6" />,
    title: "Real-time AI composition",
    desc: "Google Lyria streams a unique piece based on your responses. Every session is original.",
  },
  {
    icon: <BookOpen className="h-6 w-6" />,
    title: "Mood Journal",
    desc: "Track how music affects your mood over time. Build a personal dataset of your wellness journey.",
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Ethically designed",
    desc: "We disclose every model, never claim to be therapy, and put crisis resources on every page.",
  },
];

export default function Home() {
  return (
    <div className="bg-background">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Background gradient blob */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full opacity-10 dark:opacity-20"
            style={{ background: "radial-gradient(ellipse at center, hsl(var(--primary)) 0%, transparent 70%)" }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-28">
          <div className="max-w-3xl animate-fade-in-up">
            <div className="pill-green mb-8">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
                <circle cx="6" cy="6" r="6"/>
              </svg>
              Powered by Google Lyria AI
            </div>

            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl text-foreground leading-[1.05] mb-6">
              Music shaped<br />
              <span className="text-primary">to your</span><br />
              mental state.
            </h1>

            <p className="text-muted-foreground text-xl leading-relaxed mb-3 max-w-2xl">
              MelodyMatrix takes a brief wellness assessment and composes a unique piece of music — instrument, tempo, and emotional character calibrated to you.
            </p>

            <p className="text-sm text-muted-foreground mb-10 flex items-start gap-2 max-w-lg">
              <Shield className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <span>This is an AI wellness tool, not professional mental health care. In a crisis, call or text <a href="tel:988" className="font-bold text-foreground underline">988</a>.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/assessment">
                <Button
                  size="lg"
                  className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full px-8 btn-glow transition-all"
                >
                  Begin Assessment
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/about">
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 rounded-full px-8 border-border text-foreground font-semibold"
                >
                  How It Works
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="border-y border-border/50 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid sm:grid-cols-3 gap-10">
          {stats.map((s) => (
            <div key={s.stat}>
              <p className="font-display text-4xl text-primary mb-2">{s.stat}</p>
              <p className="text-sm text-foreground leading-snug mb-1">{s.label}</p>
              <p className="text-xs text-muted-foreground">{s.source}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 px-4 sm:px-6 max-w-7xl mx-auto">
        <h2 className="font-display text-4xl text-foreground mb-3">How it works</h2>
        <p className="text-muted-foreground mb-14 text-lg">Four steps from check-in to custom track.</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s) => (
            <div key={s.num} className="group">
              <span className="font-display text-6xl text-primary/20 select-none block mb-4">{s.num}</span>
              <h3 className="font-bold text-foreground text-lg mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-card border-y border-border/50 py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-display text-4xl text-foreground mb-3">Built with care</h2>
          <p className="text-muted-foreground mb-14 text-lg">
            Features designed around your wellbeing, not engagement metrics.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-xl bg-background dark:bg-muted/20 border border-border/50 card-hover"
              >
                <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary mb-4">
                  {f.icon}
                </div>
                <h3 className="font-bold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-28 px-4 sm:px-6 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden
        >
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full opacity-8 dark:opacity-15"
            style={{ background: "radial-gradient(ellipse at center, hsl(var(--primary)) 0%, transparent 70%)" }}
          />
        </div>
        <div className="relative max-w-2xl mx-auto">
          <h2 className="font-display text-4xl sm:text-5xl text-foreground mb-4">
            Ready to listen?
          </h2>
          <p className="text-muted-foreground text-lg mb-10">
            Your first assessment takes about 2 minutes.
          </p>
          <Link href="/assessment">
            <Button
              size="lg"
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full px-10 text-base btn-glow"
            >
              Start Assessment
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
