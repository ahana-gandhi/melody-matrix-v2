import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Brain, AlertCircle, Heart } from "lucide-react";

const principles = [
  {
    icon: <Shield className="h-5 w-5" />,
    title: "Full AI transparency",
    body: "MelodyMatrix uses Google Lyria — a generative AI music model — and is not built or supervised by licensed mental health professionals. Every interaction is AI-mediated. We disclose this openly because you deserve to know exactly what system is talking to you.",
  },
  {
    icon: <Brain className="h-5 w-5" />,
    title: "Clinically-informed, not clinical",
    body: "Our questions are adapted from validated tools (GAD-7, PHQ-9, ISI, PSS) for the sole purpose of building a better musical brief. We do not store diagnostic data. We do not diagnose. Your responses inform the music — nothing more.",
  },
  {
    icon: <AlertCircle className="h-5 w-5" />,
    title: "Crisis safety first",
    body: "If you are experiencing a mental health emergency, MelodyMatrix is not the right tool. Please contact the 988 Suicide & Crisis Lifeline (call or text 988), the Crisis Text Line (text HOME to 741741), or go to your nearest emergency room.",
  },
  {
    icon: <Heart className="h-5 w-5" />,
    title: "Data minimization",
    body: "We do not store your assessment responses beyond your current session. We do not sell your data, share it with advertisers, or use it for AI training. Your API keys live only in your environment file and are never sent to our servers.",
  },
];

const hcaiPoints = [
  {
    term: "Transparency",
    desc: "The system discloses that AI generates the music, which model is used, and what the AI cannot do. Users are never misled about the nature of the system.",
  },
  {
    term: "Informed consent",
    desc: "Users are told before the assessment what their data is used for and how it is stored. The disclaimer appears prominently — not buried in a terms-of-service document.",
  },
  {
    term: "Human oversight",
    desc: "The app actively encourages users to seek human professional support when needed. It never positions itself as equivalent to a therapist.",
  },
  {
    term: "Data minimization",
    desc: "Only the data necessary to generate music is used — your assessment responses build the music prompt and nothing more. No behavioral tracking, no advertising.",
  },
  {
    term: "Non-maleficence",
    desc: "Crisis resources (988) appear on every page. The app recognizes the vulnerability of its subject matter and designs accordingly.",
  },
];

export default function About() {
  return (
    <div className="bg-background">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div
            className="absolute top-0 right-0 w-[600px] h-[400px] opacity-10 dark:opacity-15"
            style={{ background: "radial-gradient(ellipse at top right, hsl(var(--primary)) 0%, transparent 70%)" }}
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-20">
          <div className="pill-green mb-8">About &amp; Ethics</div>
          <h1 className="font-display text-5xl sm:text-6xl text-foreground leading-[1.05] mb-6 max-w-3xl">
            Why I built<br /><span className="text-primary">MelodyMatrix.</span>
          </h1>
          <p className="text-muted-foreground text-xl leading-relaxed max-w-2xl">
            A student project at the intersection of AI, music, and mental wellness — built to show that powerful AI can also be responsible AI.
          </p>
        </div>
      </section>

      {/* ── Personal motivation ── */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div>
            <h2 className="font-display text-3xl text-foreground mb-6">The motivation</h2>
            <div className="space-y-5 text-muted-foreground leading-relaxed">
              <p>
                I've always believed that the most powerful technology is the kind that quietly improves a person's day. Music has that quality — it's one of the few things that can shift your emotional state in minutes without any side effects.
              </p>
              <p>
                As someone preparing research at the intersection of machine learning and human experience, I kept noticing a gap: AI systems that interact with people in sensitive contexts often fail them. They over-claim. They don't disclose their limitations. They collect data without real consent.
              </p>
              <p>
                MelodyMatrix is my attempt to do it differently. The app takes a real human need — managing emotional state through sound — and addresses it with an AI system that is honest about what it is, careful with data, and designed to amplify human agency rather than replace it.
              </p>
              <p>
                Every design decision, from where the crisis resources appear to how the assessment questions are worded, was made with one question in mind: <em className="text-foreground font-medium">what would a person actually need to feel safe using this?</em>
              </p>
            </div>
          </div>

          <div>
            <h2 className="font-display text-3xl text-foreground mb-6">The approach</h2>
            <div className="space-y-5 text-muted-foreground leading-relaxed">
              <p>
                The assessment questions are adapted from clinically validated tools — GAD-7 for anxiety, PHQ-9 for depression, ISI for sleep, and PSS for stress. They are used solely to build a better musical brief for the AI. They are not used to diagnose anything.
              </p>
              <p>
                The music generation uses Google Lyria, a state-of-the-art generative model that streams real-time compositions via WebSocket. Unlike a playlist recommendation, every track is unique — composed fresh based on your specific responses.
              </p>
              <p className="text-foreground font-medium">
                This is a project about demonstrating that AI can be built to serve people well — transparently, carefully, and without sacrificing usefulness.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Not a substitute ── */}
      <section className="py-8 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex gap-4 p-6 rounded-2xl border border-amber-500/40 bg-amber-50 dark:bg-amber-950/30">
          <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-900 dark:text-amber-200 mb-1">Not a substitute for professional mental health care</p>
            <p className="text-sm text-amber-800 dark:text-amber-300/80 leading-relaxed mb-2">
              Music therapy delivered by a licensed music therapist is a recognized clinical intervention. This app is not that.
              If you are experiencing significant distress, please reach out to a licensed mental health professional.
            </p>
            <p className="text-sm font-bold text-amber-900 dark:text-amber-300">
              In crisis? Call or text <a href="tel:988" className="underline">988</a> (24/7). Text <strong>HOME</strong> to <strong>741741</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* ── Ethical design principles ── */}
      <section className="py-20 px-4 sm:px-6 bg-card border-y border-border/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-display text-3xl text-foreground mb-3">Ethical design principles</h2>
          <p className="text-muted-foreground mb-12 max-w-xl">
            Each of these is a concrete design decision, not a marketing claim.
          </p>

          <div className="grid sm:grid-cols-2 gap-5">
            {principles.map((p) => (
              <div key={p.title} className="p-6 rounded-xl bg-background dark:bg-muted/20 border border-border/50">
                <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary mb-4">
                  {p.icon}
                </div>
                <h3 className="font-bold text-foreground mb-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HCAI principles ── */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <h2 className="font-display text-3xl text-foreground mb-3">Human-centered AI design</h2>
        <p className="text-muted-foreground mb-12 max-w-xl">
          This project demonstrates several principles from the HCAI literature — each implemented as a concrete feature, not a slide bullet.
        </p>

        <div className="space-y-6">
          {hcaiPoints.map((p, i) => (
            <div key={p.term} className="flex gap-6 items-start">
              <span className="font-display text-4xl text-primary/20 select-none flex-shrink-0 w-8 text-right">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="font-bold text-foreground mb-1">{p.term}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Links ── */}
      <section className="py-12 px-4 sm:px-6 border-t border-border/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-4">
          <Link href="/privacy">
            <Button variant="outline" className="gap-2 rounded-full border-border">
              Privacy Policy <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <a href="https://deepmind.google/technologies/music-ai-tools/" target="_blank" rel="noreferrer">
            <Button variant="ghost" className="gap-2 text-muted-foreground rounded-full">
              Google Lyria Documentation
            </Button>
          </a>
        </div>
      </section>
    </div>
  );
}
