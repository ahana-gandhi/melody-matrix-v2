# MelodyMatrix v2

An AI-powered music wellness web application that generates personalized therapeutic music based on a clinically-informed mood assessment.

## What it does

MelodyMatrix asks 5 validated wellness questions (adapted from GAD-7, PHQ-9, ISI, PSS), then uses **Google Lyria** (via the Gemini API) to stream a unique ~28-second therapeutic music composition tailored to your mood, preferred instrument, and tempo.

## Features

- **Mood Assessment** — 5 clinically-informed slider questions per wellness area (anxiety, low mood, stress, relationships, sleep)
- **Real-Time AI Music** — Google Lyria streams audio live (~28 seconds, up from 10s in v1)
- **YouTube Recommendations** — Curated tracks matching your therapeutic brief
- **Mood Journal** — Log daily check-ins, track mood before/after listening, visualize trends over time
- **Session History** — Every generated session is stored server-side with mood change data
- **Dark Mode** — Full system-preference-aware dark mode with manual toggle
- **Crisis Resources** — 988 hotline and Crisis Text Line displayed prominently on every page
- **Privacy Policy & Ethics Page** — Full AI disclosure, data minimization, and HCAI principles documented

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Express + SQLite (via Drizzle ORM + better-sqlite3)
- **AI**: Google Lyria (`lyria-realtime-exp`) for music generation via WebSocket
- **Fonts**: Zodiak (display) + Work Sans (body)

## Setup

```bash
git clone https://github.com/YOUR_USERNAME/melody-matrix-v2
cd melody-matrix-v2
npm install

# Copy and fill in your API keys
cp .env.example .env
# Edit .env with your VITE_GEMINI_API_KEY (required)
# and VITE_YOUTUBE_API_KEY (optional, for recommendations)

npm run dev
```

Open http://localhost:5000

## Environment Variables

```env
VITE_GEMINI_API_KEY=your_gemini_api_key   # Required — get from aistudio.google.com
VITE_YOUTUBE_API_KEY=your_yt_key          # Optional — YouTube recommendations
```

## Ethical Design

This application is built as a demonstration of Human-Centered AI and ethical AI design:

- Full disclosure that AI (Google Lyria) generates the music
- Assessment questions adapted from validated clinical tools, disclosed openly
- **Not a substitute** for professional mental health care — stated on every page
- Crisis resources (988) displayed persistently
- Data minimization — only stores what's needed for the journal
- No advertising, no behavioral tracking, no data sales

See the [About & Ethics](/about) page within the app for full details.

## ⚠️ Not Medical Advice

This is an AI wellness exploration tool, not a clinical service. If you are in crisis, please call or text **988** (Suicide & Crisis Lifeline) or text **HOME** to **741741**.
