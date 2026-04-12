import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Music, Brain, Shield, BookOpen, Sparkles } from "lucide-react";

const benefits = [
  {
    icon: <Brain className="h-5 w-5" />,
    title: "Clinically-Informed Questions",
    description:
      "Our assessment draws on validated screening frameworks (GAD-7, PHQ-9, ISI) to build a musical brief tailored to your actual needs — not a generic playlist.",
  },
  {
    icon: <Music className="h-5 w-5" />,
    title: "Real-Time AI Composition",
    description:
      "Google Lyria streams a unique piece of music in real time based on your responses — instrument, tempo, and emotional character all adapt to you.",
  },
  {
    icon: <Shield className="h-5 w-5" />,
    title: "Transparent & Ethical",
    description:
      "MelodyMatrix is explicit about what it is: an AI wellness tool, not a therapist. We disclose every model used and encourage professional support.",
  },
  {
    icon: <BookOpen className="h-5 w-5" />,
    title: "Mood Journal",
    description:
      "Log daily check-ins, track how music affects your mood over time, and build a personal dataset of your wellness journey.",
  },
];

const scienceCards = [
  {
    stat: "60%",
    label: "of people report reduced anxiety after 20 minutes of guided music listening",
    source: "APMR, 2023",
  },
  {
    stat: "↓ Cortisol",
    label: "Calming music measurably lowers cortisol — the primary stress hormone",
    source: "Frontiers in Psychology",
  },
  {
    stat: "~90 BPM",
    label: "Music near your resting heart rate synchronizes brainwave activity to promote calm",
    source: "Journal of Music Therapy",
  },
];

export default function Home() {
  return (
    <div className="bg-background">
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="pt-20 pb-24 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-medium uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" />
              Powered by Google Lyria AI
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-medium text-foreground leading-tight mb-6">
              Music shaped{" "}
              <span className="text-primary">to your</span>{" "}
              mental state
            </h1>

            <p className="text-muted-foreground text-lg leading-relaxed mb-4 max-w-xl">
              MelodyMatrix takes a brief wellness assessment and composes a unique piece of music — instrument, tempo, and mood calibrated to your current state.
            </p>

            <p className="text-sm text-muted-foreground mb-8 max-w-xl border-l-2 border-primary/30 pl-3 italic">
              This is an AI wellness tool, not a substitute for professional mental health care. In a crisis, call or text <strong>988</strong>.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/assessment">
                <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md">
                  Begin Assessment
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline" className="gap-2">
                  How It Works
                </Button>
              </Link>
            </div>
          </div>

          {/* Visual: abstract soundwave illustration */}
          <div className="hidden lg:flex items-center justify-center animate-fade-in">
            <div className="relative w-80 h-80">
              {/* Concentric rings */}
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="absolute inset-0 rounded-full border border-primary/20"
                  style={{
                    transform: `scale(${0.25 * i})`,
                    margin: "auto",
                    width: "100%",
                    height: "100%",
                    top: `${50 - 50 * (0.25 * i)}%`,
                    left: `${50 - 50 * (0.25 * i)}%`,
                    opacity: 1 - i * 0.15,
                  }}
                />
              ))}
              {/* Center icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center animate-pulse-ring">
                  <Music className="h-10 w-10 text-primary" />
                </div>
              </div>
              {/* Floating wave bars */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-end gap-1.5">
                {[12, 22, 30, 40, 34, 24, 14, 20, 32, 26, 16].map((h, i) => (
                  <div
                    key={i}
                    className="w-2 rounded-full bg-primary/60"
                    style={{ height: `${h}px`, opacity: 0.4 + (i % 3) * 0.2 }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Science stats ───────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 bg-muted/40 border-y border-border">
        <div className="max-w-6xl mx-auto grid sm:grid-cols-3 gap-6">
          {scienceCards.map((c) => (
            <div key={c.stat} className="text-center">
              <p className="font-display text-4xl font-medium text-primary mb-2">{c.stat}</p>
              <p className="text-sm text-foreground leading-snug mb-1">{c.label}</p>
              <p className="text-xs text-muted-foreground">{c.source}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="mb-12">
          <h2 className="font-display text-3xl font-medium text-foreground mb-3">How MelodyMatrix works</h2>
          <p className="text-muted-foreground max-w-xl">
            Four steps from check-in to custom track.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { step: "01", title: "Choose your focus", desc: "Select the wellness area most relevant to you — anxiety, sleep, stress, mood, or relationship challenges." },
            { step: "02", title: "Answer 5 questions", desc: "Quick slider-based questions adapted from clinical screening tools help us calibrate the music accurately." },
            { step: "03", title: "Pick your sound", desc: "Choose an instrument and tempo that feel right. The selection shapes the character of your composition." },
            { step: "04", title: "Receive your track", desc: "Lyria AI streams a unique piece in real time. Download it, rate how it made you feel, and log it to your journal." },
          ].map((item) => (
            <div key={item.step} className="space-y-3">
              <span className="font-display text-5xl font-medium text-primary/25 select-none">{item.step}</span>
              <h3 className="font-medium text-foreground">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature cards ────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 bg-muted/30 border-y border-border">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <h2 className="font-display text-3xl font-medium text-foreground mb-3">Built with care</h2>
            <p className="text-muted-foreground max-w-xl">Features designed around your wellbeing, not engagement metrics.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {benefits.map((b) => (
              <Card key={b.title} className="border-border bg-card hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex gap-4">
                  <div className="mt-0.5 h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    {b.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground mb-1">{b.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{b.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 max-w-4xl mx-auto text-center">
        <h2 className="font-display text-3xl sm:text-4xl font-medium text-foreground mb-4">
          Ready to listen?
        </h2>
        <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
          Your first assessment takes about 2 minutes. No account needed.
        </p>
        <Link href="/assessment">
          <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md">
            Start Assessment
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </section>
    </div>
  );
}
