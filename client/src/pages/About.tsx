import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Brain, Music, AlertCircle, ArrowRight, ExternalLink } from "lucide-react";

const ethicsPoints = [
  {
    icon: <Shield className="h-5 w-5" />,
    title: "Full AI Disclosure",
    body: "MelodyMatrix uses Google Lyria (a generative AI music model) and is not built or supervised by licensed mental health professionals. Every interaction is AI-mediated. We disclose this openly because you deserve to know exactly what system is responding to you.",
  },
  {
    icon: <Brain className="h-5 w-5" />,
    title: "Clinically-Informed, Not Clinical",
    body: "Our assessment questions are adapted from validated screening tools (GAD-7, PHQ-9, ISI, PSS) for the sole purpose of building a better musical brief. We do not store diagnostic data, and we do not diagnose any condition. Your responses inform the music, nothing more.",
  },
  {
    icon: <AlertCircle className="h-5 w-5" />,
    title: "Crisis Safety First",
    body: "If you are experiencing a mental health emergency, MelodyMatrix is not the right tool. Please contact the 988 Suicide & Crisis Lifeline (call or text 988), the Crisis Text Line (text HOME to 741741), or go to your nearest emergency room.",
  },
  {
    icon: <Music className="h-5 w-5" />,
    title: "Data Minimization",
    body: "We store session data (mood scores and generated prompts) only to power your mood journal. We do not sell your data, share it with advertisers, or use it for AI model training. Your API keys live only in your environment file and are never transmitted to our servers.",
  },
];

const techStack = [
  { name: "Google Lyria", role: "Music generation AI", note: "lyria-realtime-exp model via WebSocket streaming" },
  { name: "Gemini API", role: "API gateway", note: "Used only for Lyria music generation" },
  { name: "YouTube Data API v3", role: "Music recommendations", note: "Client-side search; key exposed in bundle (see Privacy Policy)" },
  { name: "React + Vite", role: "Frontend framework", note: "TypeScript, Tailwind CSS, shadcn/ui" },
  { name: "Express + SQLite", role: "Backend / database", note: "Session and journal data stored server-side" },
];

export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-16">
      {/* Hero */}
      <section className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium uppercase tracking-wider">
          About &amp; Ethics
        </div>
        <h1 className="font-display text-4xl font-medium text-foreground leading-tight">
          What MelodyMatrix is — and what it isn't
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
          MelodyMatrix was built as a demonstration of responsible, human-centered AI design. Transparency about how the system works, what data it uses, and its limitations is core to that mission.
        </p>
      </section>

      {/* Not a substitute warning */}
      <div className="flex gap-4 p-5 rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40">
        <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-amber-900 dark:text-amber-200">
          <p className="font-semibold mb-1">Not a substitute for professional mental health care</p>
          <p className="text-sm leading-relaxed">
            Music therapy delivered by a licensed music therapist is a recognized clinical intervention. This app is not that. It is an AI-powered wellness exploration tool. If you are experiencing significant distress, please reach out to a licensed mental health professional.
          </p>
          <p className="text-sm font-semibold mt-2">
            In crisis? Call or text <a href="tel:988" className="underline">988</a> (24/7 Suicide &amp; Crisis Lifeline).
            Text <strong>HOME</strong> to <strong>741741</strong> for the Crisis Text Line.
          </p>
        </div>
      </div>

      {/* Ethics principles */}
      <section className="space-y-6">
        <h2 className="font-display text-2xl font-medium text-foreground">Ethical design principles</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {ethicsPoints.map((p) => (
            <Card key={p.title} className="border-border">
              <CardContent className="p-5 flex gap-4">
                <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 mt-0.5">
                  {p.icon}
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">{p.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.body}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Technology transparency */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-medium text-foreground">Technology used</h2>
        <p className="text-muted-foreground text-sm">Full transparency about every model and service powering this application.</p>
        <div className="border border-border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-foreground">Service</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground">Role</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground hidden sm:table-cell">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {techStack.map((t) => (
                <tr key={t.name} className="bg-card">
                  <td className="px-4 py-3 font-medium text-foreground">{t.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.role}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs hidden sm:table-cell">{t.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Human-centered AI context */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-medium text-foreground">Human-centered AI design</h2>
        <div className="prose prose-sm max-w-none text-muted-foreground space-y-4">
          <p>
            This project demonstrates several principles from the human-centered AI (HCAI) literature:
          </p>
          <ul className="list-none space-y-3 pl-0">
            {[
              { term: "Transparency", desc: "The system discloses that AI generates the music, which model is used, and what the AI cannot do. Users are never misled about the nature of the system." },
              { term: "Informed consent", desc: "Users are told before the assessment what their data is used for and how it is stored. The disclaimer appears prominently — not buried in a terms-of-service document." },
              { term: "Human oversight", desc: "The app actively encourages users to seek human professional support when needed. It never positions itself as equivalent to a therapist." },
              { term: "Data minimization", desc: "Only the data necessary to generate music and power the mood journal is collected. No behavioral tracking, no advertising." },
              { term: "Non-maleficence", desc: "Crisis resources (988) appear on every page. The app recognizes the vulnerability of its subject matter and designs accordingly." },
            ].map((p) => (
              <li key={p.term} className="flex gap-3">
                <span className="font-semibold text-foreground flex-shrink-0">{p.term}:</span>
                <span>{p.desc}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Links */}
      <section className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-border">
        <Link href="/privacy">
          <Button variant="outline" className="gap-2">Privacy Policy <ArrowRight className="h-4 w-4" /></Button>
        </Link>
        <a
          href="https://deepmind.google/technologies/music-ai-tools/"
          target="_blank"
          rel="noreferrer"
        >
          <Button variant="ghost" className="gap-2 text-muted-foreground">
            Google Lyria Documentation <ExternalLink className="h-4 w-4" />
          </Button>
        </a>
      </section>
    </div>
  );
}
