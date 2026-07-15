import { describe, expect, it } from 'vitest'
import {
  buildLeaderboard,
  buildShareText,
  getDailyKey,
  getLetterFeedback,
  getResultKey,
  getTodaysPuzzle,
  isCorrectGuess,
  normalizeGuess,
  scoreResult,
} from './game'
import type { SavedResult } from './game'

describe('subreddit normalization and validation', () => {
  it('accepts subreddit answers with common punctuation variants', () => {
    const puzzle = getTodaysPuzzle(2, Date.parse('2026-07-14T12:00:00.000Z'), 'daily-003')

    expect(normalizeGuess('R/Mechanical-Keyboards!')).toBe('mechanicalkeyboards')
    expect(isCorrectGuess(puzzle, 'mechanical keyboards')).toBe(true)
  })
})

describe('letter feedback', () => {
  it('marks green, yellow, and muted letters with duplicate-aware counts', () => {
    const result = getLetterFeedback('space'.split(''), 'spare').map((tile) => tile.state)

    expect(result).toEqual(['correct', 'correct', 'correct', 'absent', 'correct'])
  })

  it('does not over-award yellow tiles when the guess repeats a letter too many times', () => {
    const result = getLetterFeedback('breadit'.split(''), 'eeeeeee').map((tile) => tile.state)

    expect(result.filter((state) => state === 'present' || state === 'correct')).toHaveLength(1)
  })

  it('pads short guesses with empty tiles', () => {
    const result = getLetterFeedback('space'.split(''), 'spa')

    expect(result.map((tile) => tile.state)).toEqual(['correct', 'correct', 'correct', 'empty', 'empty'])
  })
})

describe('daily rotation', () => {
  const fixedNow = Date.parse('2026-07-14T12:00:00.000Z')

  it('derives stable daily keys from offsets', () => {
    expect(getDailyKey(0, fixedNow)).toBe('2026-07-14')
    expect(getDailyKey(1, fixedNow)).toBe('2026-07-15')
  })

  it('keeps a selected daily puzzle stable when a post is restored', () => {
    const original = getTodaysPuzzle(0, fixedNow)
    const locked = getTodaysPuzzle(0, fixedNow, original.id)

    expect(locked.id).toBe(original.id)
    expect(locked.answer).toBe(original.answer)
  })
})

describe('scoring and sharing', () => {
  it('rewards fewer attempts and faster solves', () => {
    expect(scoreResult(1, 10)).toBeGreaterThan(scoreResult(3, 10))
    expect(scoreResult(2, 10)).toBeGreaterThan(scoreResult(2, 120))
  })

  it('sorts the current user into the leaderboard when solved', () => {
    const rows = buildLeaderboard({
      puzzleId: 'daily-001',
      dayKey: '2026-07-14',
      solved: true,
      guesses: [{ value: 'r/space', correct: true }],
      score: 1100,
      seconds: 8,
      streak: 3,
    })

    expect(rows[0].name).toBe('u/you')
  })

  it('creates spoiler-safe share text without revealing the answer', () => {
    const puzzle = getTodaysPuzzle(0, Date.parse('2026-07-14T12:00:00.000Z'))
    const result: SavedResult = {
      puzzleId: puzzle.id,
      dayKey: puzzle.dayKey,
      solved: true,
      guesses: [
        { value: 'r/spare', correct: false },
        { value: 'r/space', correct: true },
      ],
      score: 900,
      seconds: 44,
      streak: 2,
    }
    const share = buildShareText(puzzle, result)

    expect(share).toContain('Solved in 2/6')
    expect(share).not.toContain('r/space')
  })

  it('builds per-puzzle result keys', () => {
    expect(getResultKey('daily-001', '2026-07-14')).toBe('subreddit-sleuth-result:2026-07-14:daily-001')
  })
})
