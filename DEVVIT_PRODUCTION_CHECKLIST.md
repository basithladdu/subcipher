# Devvit Production Checklist

This project now has a working React prototype, a Devvit Web `devvit.json`, and a Hono server bundle wired to `@devvit/web/server`. The remaining production work is account-bound upload/playtest and live subreddit verification.

## Why Server Support Is Needed

The Vite preview still falls back to `localStorage` because it does not run Devvit server endpoints. The Devvit build path uses `/api/` routes and Redis through `src/server/index.ts`, so official scores, streaks, and leaderboard have a server-authoritative path once deployed through Devvit.

Devvit docs point to this production shape:

- `devvit.json` defines post entrypoints, server entry, permissions, scheduler, and scripts.
- Redis stores persistent game state.
- Scheduler creates/rotates recurring daily content.
- Custom posts host the playable game.
- Devvit CLI uploads/playtests the app through a Reddit developer account.

## Implemented Server Pieces

Current server bundle:

- `/api/daily/status`
- `/api/attempt/guess`
- `/api/score/share` (explicit user action to reply to the daily score thread)
- `/api/admin/daily-post` (moderator-only recovery)
- `/internal/scheduler/daily-post`
- `/internal/menu/create-daily-post` (moderator-only manual launch/recovery, unlinked from player UI)

Current `devvit.json` includes:

```json
{
  "server": {
    "dir": "dist/server",
    "entry": "index.cjs"
  },
  "permissions": {
    "redis": true,
    "reddit": {
      "enable": true,
      "asUser": ["SUBMIT_POST", "SUBMIT_COMMENT"]
    }
  },
  "scheduler": {
    "tasks": {
      "daily-post": {
        "endpoint": "/internal/scheduler/daily-post",
        "cron": "0 0 * * *"
      }
    }
  }
}
```

Redis keys:

- `daily:{yyyy-mm-dd}:puzzle`
- `daily:{yyyy-mm-dd}:post`
- `attempts:{yyyy-mm-dd}:{puzzleId}`
- `results:{yyyy-mm-dd}:{puzzleId}`
- `leaderboard:{yyyy-mm-dd}:{puzzleId}`
- `users:streaks`
- `shares:{yyyy-mm-dd}:{puzzleId}`

Player-keyed Redis records expire after 31 days.

## Verified Locally

- `npm run build` builds the Vite client and `dist/server/index.cjs`.
- `npm run lint` passes.
- `npm run test` passes.
- Browser preview verified riddle, Wordle tile feedback, the dedicated leaderboard, and a player-facing UI with no Admin tab.

## External Blockers

These need account/browser confirmation:

- Reddit developer account / Devvit token.
- Test subreddit selection.
- Devvit upload/playtest.
- Public demo post URL.
- Devpost registration/submission, because Devpost requires personal account fields.
