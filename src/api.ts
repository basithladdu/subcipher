import {
  DAY_OFFSET_KEY,
  MAX_GUESSES,
  STREAK_KEY,
  buildGuessRows,
  buildLeaderboard,
  buildShareText,
  getResultKey,
  getTodaysPuzzle,
  isCorrectGuess,
  scoreResult,
  toPublicPuzzle,
} from './game'
import type { GameStatus, Guess, SavedResult } from './game'

export type GuessResponse = GameStatus & { message: string }
export type ShareResponse = { message: string }
export type ReminderResponse = { enabled: boolean; message?: string }

export async function loadGameStatus(): Promise<GameStatus> {
  return await requestJson<GameStatus>('/api/daily/status') ?? buildLocalStatus()
}

export async function submitGuessToGame(guess: string, startedAt: number): Promise<GuessResponse> {
  return await requestJson<GuessResponse>('/api/attempt/guess', { method: 'POST', body: JSON.stringify({ guess }) }) ?? submitGuessLocally(guess, startedAt)
}

export async function shareResultToReddit(): Promise<ShareResponse> {
  return await requestJson<ShareResponse>('/api/score/share', { method: 'POST' }) ?? {
    message: 'Reddit sharing is available from the live Devvit daily post.',
  }
}

export async function loadReminderStatus(): Promise<ReminderResponse> {
  return await requestJson<ReminderResponse>('/api/reminder/status') ?? { enabled: false }
}

export async function enableDailyReminder(): Promise<ReminderResponse> {
  return await requestJson<ReminderResponse>('/api/reminder/opt-in', { method: 'POST' }) ?? {
    enabled: false,
    message: 'Daily reminders are available from the live Devvit post.',
  }
}

export function readStreak() {
  try {
    return JSON.parse(localStorage.getItem(STREAK_KEY) || '{"count":0,"lastSolved":""}') as { count: number; lastSolved: string }
  } catch {
    return { count: 0, lastSolved: '' }
  }
}

export function getShareText(status: GameStatus) {
  return status.result ? buildShareText(status.puzzle, status.result) : ''
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(path, { headers: { 'content-type': 'application/json', accept: 'application/json' }, ...init })
    return response.ok && response.headers.get('content-type')?.includes('application/json') ? await response.json() as T : null
  } catch {
    return null
  }
}

function buildLocalStatus(messageResult?: SavedResult | null, messageGuesses?: Guess[]): GameStatus {
  const puzzle = getTodaysPuzzle(readLocalDayOffset())
  const result = messageResult === undefined ? readSavedResult(puzzle.id, puzzle.dayKey) : messageResult
  const guesses = result?.guesses ?? messageGuesses ?? []
  return {
    puzzle: toPublicPuzzle(puzzle, Boolean(result), Math.min(2, guesses.length)),
    guesses,
    rows: buildGuessRows(puzzle, guesses),
    result,
    leaderboard: buildLeaderboard(result),
  }
}

function submitGuessLocally(rawGuess: string, startedAt: number): GuessResponse {
  const guess = rawGuess.trim()
  const puzzle = getTodaysPuzzle(readLocalDayOffset())
  const existing = readSavedResult(puzzle.id, puzzle.dayKey)
  if (existing) return { ...buildLocalStatus(existing), message: 'Official result already recorded for this daily puzzle.' }
  if (!guess) return { ...buildLocalStatus(), message: 'Enter a community name.' }

  const currentGuesses = readLocalGuesses(puzzle.id, puzzle.dayKey)
  if (currentGuesses.length >= MAX_GUESSES) return { ...buildLocalStatus(), message: `Out of guesses. Answer: ${puzzle.answer}.` }

  const nextGuesses = [...currentGuesses, { value: guess, correct: isCorrectGuess(puzzle, guess) }]
  if (nextGuesses.at(-1)?.correct || nextGuesses.length === MAX_GUESSES) {
    const solved = Boolean(nextGuesses.at(-1)?.correct)
    const seconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000))
    const savedResult: SavedResult = {
      puzzleId: puzzle.id,
      dayKey: puzzle.dayKey,
      solved,
      guesses: nextGuesses,
      score: solved ? scoreResult(nextGuesses.length, seconds) : 0,
      seconds,
      streak: updateStreak(solved, puzzle.dayKey),
    }
    localStorage.setItem(getResultKey(puzzle.id, puzzle.dayKey), JSON.stringify(savedResult))
    localStorage.removeItem(guessKey(puzzle.id, puzzle.dayKey))
    return { ...buildLocalStatus(savedResult), message: solved ? 'Solved. Your official score is locked.' : `Out of guesses. Answer: ${puzzle.answer}.` }
  }

  localStorage.setItem(guessKey(puzzle.id, puzzle.dayKey), JSON.stringify(nextGuesses))
  return { ...buildLocalStatus(null, nextGuesses), message: 'Not it. A stronger hint is now unlocked.' }
}

function updateStreak(solved: boolean, dayKey: string) {
  const current = readStreak()
  const yesterday = new Date(Date.parse(`${dayKey}T00:00:00.000Z`) - 86_400_000).toISOString().slice(0, 10)
  const next = solved ? { count: current.lastSolved === yesterday ? current.count + 1 : current.lastSolved === dayKey ? current.count : 1, lastSolved: dayKey } : { count: 0, lastSolved: '' }
  localStorage.setItem(STREAK_KEY, JSON.stringify(next))
  return next.count
}

function readSavedResult(puzzleId: string, dayKey: string) {
  try { return JSON.parse(localStorage.getItem(getResultKey(puzzleId, dayKey)) || 'null') as SavedResult | null } catch { return null }
}

function readLocalGuesses(puzzleId: string, dayKey: string) {
  try { return JSON.parse(localStorage.getItem(guessKey(puzzleId, dayKey)) || '[]') as Guess[] } catch { return [] }
}

function guessKey(puzzleId: string, dayKey: string) { return `subreddit-sleuth-guesses:${dayKey}:${puzzleId}` }
function readLocalDayOffset() { const value = Number(localStorage.getItem(DAY_OFFSET_KEY) || '0'); return Number.isFinite(value) ? value : 0 }
