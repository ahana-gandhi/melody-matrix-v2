import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      <div>
        <Link href="/about">
          <Button variant="ghost" size="sm" className="gap-2 mb-4 -ml-2 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </Link>
        <h1 className="font-display text-4xl font-medium text-foreground mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: April 2026</p>
      </div>

      <div className="space-y-8 text-muted-foreground leading-relaxed text-sm">

        <section className="space-y-3">
          <h2 className="font-display text-xl font-medium text-foreground">1. What MelodyMatrix is</h2>
          <p>MelodyMatrix is a personal AI wellness project — not a commercial product, healthcare provider, or clinical service. It uses Google Lyria (a generative AI music model) to compose therapeutic music based on your self-reported wellness assessment.</p>
          <p className="font-semibold text-foreground">This application is not a substitute for professional mental health care. In a crisis, please call or text 988 (Suicide &amp; Crisis Lifeline) or text HOME to 741741 (Crisis Text Line).</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-medium text-foreground">2. Data we collect</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong className="text-foreground">Assessment responses:</strong> Slider scores (0–4) for 5 wellness questions and your selected issue area, instrument, and tempo. These are used only to build the music generation prompt.</li>
            <li><strong className="text-foreground">Mood ratings:</strong> Optional before/after mood scores (1–5) you provide during a session. These stay in your browser for the duration of your session only and are not persisted.</li>
            <li><strong className="text-foreground">Session metadata:</strong> Issue type, instrument, and tempo used to build the music prompt. No audio is stored — the audio blob lives only in your browser memory for the current session.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-medium text-foreground">3. Data we do NOT collect</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>We do not collect your name, email, or any identifying information unless you voluntarily create an account.</li>
            <li>We do not track behavior for advertising purposes.</li>
            <li>We do not sell or share your data with third parties.</li>
            <li>We do not use your data to train AI models.</li>
            <li>We do not store cookies beyond what is necessary for session management.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-medium text-foreground">4. Third-party APIs</h2>
          <p>This application uses the following third-party services:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong className="text-foreground">Google Lyria / Gemini API:</strong> Your music generation prompt is sent to Google's servers to generate audio. Google's privacy policy applies to this data: <a href="https://policies.google.com/privacy" className="text-primary underline" target="_blank" rel="noreferrer">policies.google.com/privacy</a>.</li>
            <li><strong className="text-foreground">YouTube Data API v3:</strong> Search queries (derived from your assessment) are sent to YouTube to find music recommendations. The API key is currently exposed in the browser bundle — do not use sensitive keys in this environment. Google's privacy policy applies.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-medium text-foreground">5. Security</h2>
          <p>Assessment data is stored in a SQLite database on the application server. API keys (Gemini, YouTube) are loaded from environment variables and should never be committed to version control. We recommend moving API calls behind a server-side proxy in any public deployment to prevent key exposure.</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-medium text-foreground">6. Your rights</h2>
          <p>Because we do not persist your data beyond your session, there is nothing stored to delete. If you have questions about data handling, contact the project maintainer via the GitHub repository.</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-medium text-foreground">7. Children</h2>
          <p>This application addresses mental health topics that may not be appropriate for all audiences. We recommend use only by individuals 13 and older, and strongly encourage parental involvement for users under 18.</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-medium text-foreground">8. Changes to this policy</h2>
          <p>This policy may be updated as the application evolves. The "last updated" date at the top of this page reflects when changes were last made.</p>
        </section>

      </div>
    </div>
  );
}
