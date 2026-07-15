# Daily Cryptic Community Mode

## Canonical puzzle

One puzzle is selected deterministically for each UTC date and snapshotted in Redis at `daily:{date}:puzzle` per subreddit installation. Restoring a post uses the stored puzzle id, so content cannot change mid-day.

## Format

Each cryptic entry contains a definition, explainable wordplay, matching enumeration, an original abstract illustration, progressive context evidence, and normalized accepted aliases. Normalization lowercases input and removes `r/`, spaces, punctuation, and separators.

The 14-day pool mixes direct community riddles and cryptic clues. Cryptic seeds include explicit `clueFormat`, `enumeration`, and `wordplay` metadata. Definitions and constructions must be moderator-reviewed before release; misleading homophones, unchecked abbreviations, and enumeration mismatches should be rejected.

## Attempt and scoring rules

- Six guesses maximum.
- The server keeps the answer and aliases; the public payload exposes only answer length and earned letter evidence.
- The first two misses reveal deterministic letters; the third reveals the cryptic clue; the fourth reveals context.
- Every evidence unlock costs an attempt. Score falls by 140 points per extra attempt, with only a small capped time bonus.
- Redis locks one official result per Reddit user and puzzle day; refresh restores attempts and results.
- A solve updates the daily Redis leaderboard and consecutive-day streak.
- Sharing requires explicit user action and posts only score, attempt marks, and streak—not the answer.

## Content review

Current production code has a curated static seed pool. A future clue-pack workflow must store pending submissions separately, require moderator approval, validate enumeration and aliases, verify source rights, and only then copy approved content into the eligible pool. That workflow is not implemented and must not be claimed in Devpost.
