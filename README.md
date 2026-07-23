# Keyverse

Keyverse is a rhythm-based typing game — users type song lyrics in sync with the music while the app tracks their WPM, accuracy, and score in real time. It's built as a full-stack SSR app running on Cloudflare Workers.

---

## Architecture

The app is built on **TanStack Start** (React + file-based routing with SSR) and deployed to **Cloudflare Workers** via Wrangler. The client and server bundles are built separately by Vite and served as a single Worker.

- **Frontend** — React 19, TanStack Router, Tailwind CSS v4, Radix UI primitives, Motion for animations
- **Backend** — TanStack Start server functions running on Cloudflare Workers (no separate API server)
- **Database** — Supabase (Postgres) with Row Level Security. Auth is handled entirely through Supabase's built-in email/password and Google OAuth flows
- **Caching** — Cloudflare KV (`API_CACHE` binding) used to cache YouTube search results and reduce external API calls
- **Email** — Cloudflare Email Workers (`CONTACT_EMAIL` binding) for the contact form

---

## Project Structure

```
src/
├── routes/              # File-based pages (TanStack Router convention)
│   ├── index.tsx        # Home / song search
│   ├── play.$trackId.tsx  # YouTube player + lyric sync engine
│   ├── verses.tsx       # Custom lyrics editor
│   ├── leaderboard.tsx
│   ├── profile.tsx
│   └── articles.*       # SEO content pages
├── server/
│   ├── api/             # Server functions (leaderboard, scores, profile, votes, contact)
│   └── auth/            # Signup and login server functions
├── lib/
│   ├── lrc.ts           # LRC timestamp parser — converts lyric files to timed cue arrays
│   ├── auth-context.tsx # Global auth state (Supabase session)
│   ├── custom-lyrics.ts # Handles user-submitted lyric overrides
│   ├── supabase.ts      # Supabase browser client (singleton)
│   └── articles.ts      # Static article content
├── components/ui/       # Shared UI components (shadcn-style, built on Radix)
├── server.ts            # Cloudflare Worker entry — handles SSR + API routing
└── styles.css           # Global styles + Tailwind config
supabase/
└── migrations/          # SQL migrations in numbered order (run these manually via Supabase SQL editor)
docs/
└── SUPABASE_SETUP.md    # Step-by-step guide to setting up the Supabase project
```

---

## How the Game Works

The core gameplay loop lives in `src/routes/play.$trackId.tsx`:

1. A YouTube video is loaded via `react-youtube` and controlled through the IFrame API
2. The LRC file for the selected track is fetched and parsed by `src/lib/lrc.ts` into an array of `{ time, text }` cues
3. A `requestAnimationFrame` loop syncs the current lyric line to the video timestamp
4. Keystrokes are compared character-by-character against the active lyric line to compute correctness
5. WPM is calculated as `(correct characters / 5) / elapsed minutes` on each frame
6. On completion, the score is submitted to `server/api/save-score.ts` which writes to Supabase

---

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key (safe to expose client-side) |

Copy `.env.example` to `.env` and fill in the values. For the full database setup, see [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md).

---

## Database

Migrations live in `supabase/migrations/` and must be run manually in the Supabase SQL editor in order:

| File | What it does |
|---|---|
| `00_initial_schema.sql` | Creates `profiles`, `songs`, `scores` tables, leaderboard views, RLS policies, and the auto-profile-on-signup trigger |
| `01_profile_email.sql` | Adds email field to profiles |
| `02_video_votes.sql` | Adds the `video_votes` table for community video quality ratings |

---

## Deployment

The app deploys to **Cloudflare Workers**. The Wrangler config is at [`wrangler.jsonc`](wrangler.jsonc) — it defines the Worker name, KV namespace binding, email binding, and the `dist/` output paths for both the client and server bundles.

CI runs lint and build automatically on every push to `main` and on all pull requests via `.github/workflows/ci.yml`.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines. Security issues should go to [support@keyverse.me](mailto:support@keyverse.me) — do not open a public issue.

---

## License

[MIT](LICENSE)
