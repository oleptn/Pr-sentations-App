# PresentAI

An AI-powered presentation practice coach. Upload your slides, practice out
loud, and get specific, actionable feedback — coverage gaps, timing per slide,
delivery, structure, and the tough questions a real audience would ask.

This is **not** a presentation builder, teleprompter, or live-coaching tool.
It's a *practice coach* you talk to between drafts.

## Stack

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui**-style components
- **Supabase** for auth, Postgres, and file storage
- **OpenAI** — Whisper for transcription, GPT-4o-mini for structured feedback
- **react-pdf** for client-side slide rendering
- Deployed on **Vercel**

## Quick start

### 1. Install

```bash
npm install
```

### 2. Set up Supabase

Create a project on [supabase.com](https://supabase.com). From the SQL editor,
run the migration:

```bash
# either: open the SQL editor and paste:
supabase/migrations/0001_init.sql

# or: with the Supabase CLI linked:
supabase db push
```

The migration creates the schema, RLS policies, and the two storage buckets
(`presentations`, `recordings`).

### 3. Configure environment

Copy `.env.example` to `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini      # optional, default shown
OPENAI_WHISPER_MODEL=whisper-1
```

### 4. Run

```bash
npm run dev
```

Visit `http://localhost:3000`.

## How it works

```
Upload PDF
   │
   ▼
[POST /api/presentations]
   ├─ extract text per page (pdfjs)
   ├─ upload PDF to Supabase Storage
   └─ insert presentations row (incl. slide_texts)

Start practice  →  /presentations/[id]/practice
   │
   ▼  fullscreen room
   ├─ react-pdf renders the current slide
   ├─ MediaRecorder captures audio in chunks
   ├─ slide changes recorded as timing segments in client state
   └─ "End session"
        │
        ├─ POST /api/sessions/[id]/transcribe   (Whisper)
        ├─ POST /api/sessions/[id]/finalize      (save timings + duration)
        └─ POST /api/sessions/[id]/report        (GPT-4o-mini, JSON schema)
                  │
                  ▼
            /sessions/[id]  →  feedback report
```

## Feedback report

The AI report has 5 sections:

1. **Information coverage** — per-slide: what you mentioned, what you missed.
2. **Time management** — actual vs target, per-slide assessment.
3. **Delivery** — filler word counts, pace (wpm), repetition, clarity.
4. **Structure** — flow + main-argument clarity, strengths, weaknesses, fixes.
5. **Audience questions** — 3–5 critical questions a real reviewer would ask.

The prompt forces specificity: it instructs the model to reference exact
slides, exact phrases from the transcript, and exact durations — and avoids
generic advice.

## Project layout

```
src/
├── app/
│   ├── (auth)/            login, signup
│   ├── (app)/             dashboard, presentations, sessions/[id]
│   ├── (practice)/        fullscreen practice room
│   ├── api/
│   │   ├── presentations/         upload + serve PDF
│   │   └── sessions/[id]/         transcribe, finalize, report
│   ├── layout.tsx
│   └── page.tsx           landing
├── components/
│   ├── ui/                base primitives (button, card, ...)
│   ├── practice/          PracticeRoom, PDFViewer, Timer
│   ├── presentation/      UploadForm
│   ├── report/            section components
│   └── layout/            AppNav
├── lib/
│   ├── supabase/          browser, server, middleware
│   ├── openai/            client, transcribe, report (prompt + schema)
│   ├── pdf/               extract-text (pdfjs server-side)
│   └── utils.ts
├── types/                 database & report types
└── middleware.ts          auth gate
supabase/migrations/0001_init.sql
```

## Architectural decisions

- **Server actions vs API routes** — API routes for anything that uploads
  binary (PDF, audio) or calls OpenAI; server-side reads via the SSR Supabase
  client elsewhere.
- **PDF rendering on the client** — `react-pdf` with a dynamic import keeps
  pdfjs out of the server bundle. The PDF itself is fetched through a
  same-origin route that re-authorizes via Supabase before downloading from
  storage — avoiding signed-URL leaks.
- **Slide timings in client state** — we only persist the final array on End
  Session. No network chatter during practice.
- **Report generated synchronously** — MVP. If generation grew slow, this is
  the obvious place to add a job queue.
- **`response_format: json_schema`** — the report shape is strictly typed at
  the OpenAI boundary, so the UI never has to defensively parse.
- **RLS everywhere** — every table and every storage bucket scopes objects
  by `auth.uid()` matching the first folder segment of the path.

## Limits & known gaps (MVP)

- PDF only, up to 25MB.
- Audio capped at 25MB (Whisper's hard limit) — roughly 30+ minutes at WebM/Opus.
- No background jobs; long reports block the End Session flow.
- No emotion/webcam/realtime coaching by design.
