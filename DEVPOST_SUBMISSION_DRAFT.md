# SubCipher: Devpost Submission Draft

Use this copy after the Devvit app has been uploaded and a public demo post has been created. Replace only the bracketed URLs and verify every claim against the live post before submitting.

## Title

SubCipher

## Tagline

One image, one riddle, six guesses: identify today's mystery subreddit.

## Project Description

SubCipher is a daily deduction game for Reddit. Each puzzle points to one mystery subreddit through an original visual clue and a riddle. Players have six guesses. The board gives familiar Wordle feedback: green for the right letter in the right position, yellow for a letter in the answer but the wrong position, and muted tiles for letters that are not in the answer. Misses unlock stronger evidence, so every guess has a cost and a purpose.

The answer is not a random trivia fact. Players infer a community from its habits, vocabulary, recurring jokes, and visual culture. That makes the Reddit comments useful: people compare near misses, explain the reference, and reveal how they recognized the community.

There is one official puzzle per day. A server-side daily lock gives every player the same answer, while attempts, scores, streaks, and leaderboard records are stored server-side. After solving, a player can copy a spoiler-safe result and choose to post it to the daily Reddit score thread.

## Features

- Daily, date-locked puzzle selection.
- Original visual clues and written riddles.
- Six-guess Wordle-style feedback with duplicate-letter handling.
- Progressive hints after wrong attempts.
- Server-authoritative attempts, results, scoring, streaks, and leaderboard.
- Explicit, spoiler-safe score sharing to the daily score thread.
- Redis snapshot of the full daily puzzle and scheduler-safe daily custom-post creation.

## Why It Fits Reddit

The clue is not a fact lookup. Players identify a community from the way Redditors use it. The daily post creates a shared moment for fast recognizers, careful deducers, and commenters who want to compare scores without spoiling the answer.

## Retention

The retention loop is deliberately simple: one official solve per day, six attempts, progressive evidence, a streak, and a leaderboard. A new daily post gives the community a reason to return, while the shared answer gives the comment thread a common subject.

## Technical Notes

Built with React, TypeScript, Vite, Hono, and Devvit Web. The server uses Devvit Redis for attempts, results, streaks, leaderboard records, the daily puzzle lock, and score-thread state. The client does not decide the answer or score. Player-keyed records expire automatically, and the scheduled endpoint creates the daily custom post. The clue artwork is original SVG, so the game does not copy or scrape third-party Reddit media.

## Testing Instructions

1. Open the public demo post below on Reddit.
2. Read the image clue and riddle.
3. Enter a subreddit guess such as `space` or `r/space`.
4. Inspect the green, yellow, and muted feedback tiles.
5. Make an incorrect guess to reveal the next hint.
6. Solve within six guesses and inspect the score, streak, leaderboard, and explicit "Post result to Reddit" action.

## Required Links

- Devvit app listing: `[PASTE developers.reddit.com/apps/sub-cipher URL]`
- Public test subreddit: `[PASTE public subreddit URL]`
- Public demo post: `[PASTE Reddit custom post URL]`
- Public source repository, optional: `[PASTE repository URL]`
- Demonstration video, optional: `[PASTE video URL]`

## 55-Second Demonstration Script

0-05 seconds: Show the daily post and its visual clue. "This is SubCipher, a daily game where you identify a Reddit community from its culture."

05-16 seconds: Show the riddle and enter one wrong guess. Point out exact-position, wrong-position, and absent-letter feedback.

16-25 seconds: Show a newly unlocked hint and the next guess.

25-35 seconds: Solve the puzzle. Show the score, daily streak, leaderboard, and the explicit score-post action.

35-47 seconds: Open the dedicated leaderboard view and compare the official standings.

47-55 seconds: Post the spoiler-safe result to the pinned score thread and explain that the scheduler locks tomorrow's shared puzzle.

## Submission Check

- [ ] App uploaded and developer listing URL opens publicly.
- [ ] App installed in a public test subreddit with fewer than 200 members.
- [ ] Public demo custom post is running and opens while signed out.
- [ ] README matches the final behavior.
- [ ] Devpost text and video only claim visible, live functionality.
- [ ] Devpost form submitted before July 16, 2026, 6:30 AM IST.
