# SubCipher

Daily community-deduction game prototype for Reddit's Games with a Hook Hackathon.

## Concept

Players see a generated visual clue, a riddle, and progressively unlocked hints, then guess the mystery subreddit in six attempts. Each guess gets Wordle-style letter feedback: green for the right letter in the right place, yellow for the right letter in the wrong place, and muted tiles for letters not in the answer. A correct solve records score, attempt count, solve time, and streak. The result panel produces spoiler-safe comment text.

This is intentionally not a plain trivia clone. The retention hook is:

- one official daily solve,
- streaks,
- daily leaderboard,
- spoiler-safe comment sharing.

## How To Play

1. Open the daily post/app.
2. Study the visual clue.
3. Read the riddle.
4. Guess a subreddit such as `r/space`.
5. Use the green/yellow/muted letter board to refine the next guess.
6. Each wrong guess unlocks another hint.
7. Solve within six guesses.
8. Share the spoiler-safe result text in comments.

## Current Prototype Status

Implemented and verified locally on July 15, 2026:

- React/TypeScript app.
- Curated daily puzzle rotation.
- Generated image clues.
- Riddle clue per puzzle.
- Wordle-style letter feedback board.
- Six-guess flow.
- Progressive hint reveal.
- Score calculation.
- API-first game state with an explicitly mocked localStorage fallback for Vite preview.
- Devvit server routes for daily status, guesses, and leaderboard.
- Redis-backed persistence model in the Devvit server bundle.
- Server-timed official scores; the client cannot provide or alter solve duration.
- Devvit leaderboards contain only Redis-backed Reddit results; local preview mode uses clearly non-production demo rows.
- Devvit Scheduler endpoint for creating the daily custom post.
- Moderator-only subreddit menu action for creating or reopening today's custom post.
- Spoiler-safe result text.
- Player-facing navigation is limited to Play and Leaderboard.

Not implemented:

- User-submitted clue packs or moderator clue review.
- Archive/practice mode.
- Devvit integration tests; current automated tests cover the pure puzzle engine.

Not yet verified on Reddit:

- Live Reddit developer account authentication.
- Devvit upload/playtest on a real subreddit.
- Public demo post URL.
- Devpost submission/app listing.

The app has a `devvit.json` post/server/scheduler config and a bundled CommonJS server entry at `dist/server/index.cjs` after `npm run build`. On July 15, `npm test` passed 10/10 tests, `npm run lint` passed, and `npm run build` passed. These checks do not prove that upload, playtest, scheduler execution, Reddit posting, or notifications work on Reddit.

## Local Commands

```bash
npm install
npm run dev
npm run test
npm run build
npm run devvit:playtest
npm run devvit:upload
```

## Devvit Mapping

Use the copied Devvit docs in `../copied-context/devvit-docs/`.

Recommended production keys:

- `daily:{yyyy-mm-dd}:{subreddit}:puzzle`
- `daily:{dailyId}:leaderboard`
- `user:{userId}:profile`

Recommended endpoints/actions:

- `GET /api/daily/status`
- `POST /api/attempt/guess`
- `POST /api/admin/daily-post` (moderator-only operational recovery)
- `POST /internal/scheduler/daily-post`
- `POST /internal/menu/create-daily-post` (moderator-only launch action)
- custom post entry point for the playable game

## Daily Operation

The game should not require a person to create a puzzle every day.

Current prototype:

- Rotates seeded puzzles by date.
- Stores one local result per daily puzzle.

Production Devvit version:

- Scheduler snapshots one full daily puzzle in Redis, then creates at most one daily custom post through `/internal/scheduler/daily-post`.
- Redis stores attempts, streaks, and leaderboard state.
- The idempotent manual recovery endpoint is moderator-gated and unlinked from the player-facing custom post.

## Devvit Status

Included now:

- `devvit.json` with a static custom-post entrypoint using the Vite `dist` output.
- `devvit.json` server entry pointing at `dist/server/index.cjs`.
- Redis and Reddit API permissions in `devvit.json`.
- Daily scheduler task mapped to `/internal/scheduler/daily-post`.
- `src/server/index.ts` Hono server using `@devvit/web/server`.
- A production checklist in `DEVVIT_PRODUCTION_CHECKLIST.md`.

Still blocked or unverified externally:

- Reddit developer account authentication.
- App upload/playtest.
- Public test subreddit and demo post creation.
- Devpost registration/submission.

Do not put an app-listing or demo-post URL in a submission until those URLs have been opened and verified.

## Rights/Safety Choice

The MVP uses generated visual clues instead of copying top-post images. That is deliberate. The Devpost rules require entrants to own or be authorized to use submitted materials. Live scraping random Reddit post images would be fragile and legally risky for a deadline submission.
