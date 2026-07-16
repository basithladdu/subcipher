import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { EntrypointHeight, context, createServer, getServerPort, notifications, redis, reddit } from '@devvit/web/server'
import type { MenuItemRequest, UiResponse } from '@devvit/web/shared'
import {
  MAX_GUESSES,
  EVIDENCE_ORDER,
  buildGuessRows,
  buildShareText,
  getDailyKey,
  getNextEvidence,
  getTodaysPuzzle,
  isCorrectGuess,
  normalizeGuess,
  pickRevealIndexes,
  scoreResult,
  toPublicPuzzle,
} from '../game'
import type { EvidenceKey, GameStatus, Guess, LeaderboardEntry, Puzzle, SavedResult } from '../game'

const app = new Hono()
const PLAYER_DATA_TTL_SECONDS = 31 * 24 * 60 * 60
type RedditThingId = `t1_${string}` | `t3_${string}`
type RedditPostId = `t3_${string}`

app.get('/api/daily/status', async (c) => {
  const dayOffset = readDayOffset(c.req.query('dayOffset'))
  return c.json(await buildStatus(dayOffset))
})

app.post('/api/attempt/guess', async (c) => {
  const body = await readJson<{ guess?: string; dayOffset?: number }>(c.req)
  const dayOffset = readDayOffset(body.dayOffset)
  const rawGuess = (body.guess ?? '').trim()

  if (!rawGuess) {
    return c.json({ ...await buildStatus(dayOffset), message: 'Enter a subreddit name.' })
  }

  const puzzle = await getDailyPuzzle(dayOffset)
  const userKey = getUserKey()
  const storedResult = await readResult(puzzle.id, puzzle.dayKey, userKey)
  if (storedResult) {
    return c.json({
      ...await buildStatus(dayOffset, storedResult),
      message: 'Official result already recorded for this daily puzzle.',
    })
  }

  const attempt = await getOrCreateAttempt(puzzle.id, puzzle.dayKey, userKey)
  const currentGuesses = attempt.guesses
  if (currentGuesses.length >= MAX_GUESSES) {
    return c.json({
      ...await buildStatus(dayOffset),
      message: `Out of guesses. Answer: ${puzzle.answer}.`,
    })
  }

  const correct = isCorrectGuess(puzzle, rawGuess)
  const nextGuesses = [...currentGuesses, { value: rawGuess, correct }]

  if (correct || nextGuesses.length === MAX_GUESSES) {
    const seconds = Math.max(1, Math.round((Date.now() - attempt.startedAt) / 1000))
    const cluesUsed = Math.max(0, attempt.revealedEvidence.length - 1)
    const score = correct ? scoreResult(nextGuesses.length, seconds, cluesUsed) : 0
    const streak = await updateStreak(userKey, correct, puzzle.dayKey)
    const result: SavedResult = {
      puzzleId: puzzle.id,
      dayKey: puzzle.dayKey,
      solved: correct,
      guesses: nextGuesses,
      score,
      seconds,
      streak,
      cluesUsed,
    }
    await writeResult(puzzle.id, puzzle.dayKey, userKey, result)
    await clearAttempt(puzzle.id, puzzle.dayKey, userKey)
    if (correct) await writeLeaderboard(puzzle.id, puzzle.dayKey, result)

    return c.json({
      ...await buildStatus(dayOffset, result),
      message: correct ? 'Solved. Your official score is locked.' : `Out of guesses. Answer: ${puzzle.answer}.`,
    })
  }

  await writeAttempt(puzzle.id, puzzle.dayKey, userKey, {
    guesses: nextGuesses,
    startedAt: attempt.startedAt,
    revealedEvidence: attempt.revealedEvidence,
  })
  return c.json({
      ...await buildStatus(dayOffset, null, nextGuesses),
    message: 'Not it. Choose the next evidence item when you are ready.',
  })
})

app.post('/api/evidence/reveal', async (c) => {
  const body = await readJson<{ kind?: EvidenceKey }>(c.req)
  const puzzle = await getDailyPuzzle(0)
  const userKey = getUserKey()
  const storedResult = await readResult(puzzle.id, puzzle.dayKey, userKey)
  if (storedResult) return c.json({ ...await buildStatus(0, storedResult), message: 'This daily result is already locked.' })

  const attempt = await getOrCreateAttempt(puzzle.id, puzzle.dayKey, userKey)
  const next = getNextEvidence(attempt.revealedEvidence)
  if (!next) return c.json({ ...await buildStatus(0, null, attempt.guesses), message: 'All evidence is already revealed.' })
  if (body.kind !== next) return c.json({ ...await buildStatus(0, null, attempt.guesses), message: 'Reveal the evidence in order.' }, 400)

  const updatedAttempt = { ...attempt, revealedEvidence: [...attempt.revealedEvidence, next] }
  await writeAttempt(puzzle.id, puzzle.dayKey, userKey, updatedAttempt)
  return c.json({
    ...await buildStatus(0, null, updatedAttempt.guesses),
    message: `Unlocked ${next === 'photo' ? 'the source photo' : next === 'caption' ? 'the caption fragment' : 'a letter'}.`,
  })
})

app.post('/internal/scheduler/daily-post', async (c) => {
  return c.json(await createDailyPost())
})

app.post('/api/admin/daily-post', async (c) => {
  if (!await canModerate()) return c.json({ message: 'Moderator permission is required.' }, 403)
  return c.json(await createDailyPost())
})

app.get('/api/reminder/status', async (c) => {
  if (!context.userId) return c.json({ enabled: false })
  return c.json({ enabled: await notifications.isOptedIn(context.userId as `t2_${string}`) })
})

app.post('/api/reminder/opt-in', async (c) => {
  const result = await notifications.optInCurrentUser()
  return c.json({
    enabled: result.success,
    message: result.success ? 'Daily reminders are on. We will let you know when the next case is posted.' : (result.message ?? 'Daily reminders could not be enabled.'),
  })
})

app.post('/internal/menu/create-daily-post', async (c) => {
  try {
    await c.req.json<MenuItemRequest>()
    const outcome = await createDailyPost()
    if (outcome.status === 'posting') {
      return c.json<UiResponse>({
        showToast: { text: "Today's case is being created. Try again in a moment.", appearance: 'neutral' },
      })
    }

    const post = await reddit.getPostById(outcome.postId as RedditPostId)
    return c.json<UiResponse>({ navigateTo: post })
  } catch (error) {
    console.error('Failed to create or open the daily SubCipher post.', error)
    const detail = error instanceof Error ? error.message : 'Devvit request failed.'
    return c.json<UiResponse>({
      showToast: { text: `Could not create today's game post: ${detail}`, appearance: 'neutral' },
    })
  }
})

app.post('/api/score/share', async (c) => {
  const puzzle = await getDailyPuzzle(0)
  const userKey = getUserKey()
  const result = await readResult(puzzle.id, puzzle.dayKey, userKey)
  if (!result) return c.json({ message: 'Finish the daily puzzle before sharing.' }, 400)

  if (await redis.hGet(shareKey(puzzle.id, puzzle.dayKey), userKey)) {
    return c.json({ message: 'Your official result has already been posted today.' })
  }

  const scoreThreadId = await redis.get(dailyScoreThreadKey(puzzle.dayKey))
  if (!scoreThreadId) return c.json({ message: 'The daily score thread is not ready yet.' }, 409)

  try {
    await reddit.submitComment({
      id: scoreThreadId as never,
      text: buildShareText(puzzle, result),
      runAs: 'USER',
    })
    await redis.hSet(shareKey(puzzle.id, puzzle.dayKey), { [userKey]: '1' })
    await redis.expire(shareKey(puzzle.id, puzzle.dayKey), PLAYER_DATA_TTL_SECONDS)
    return c.json({ message: 'Your spoiler-safe result was posted to the daily score thread.' })
  } catch {
    return c.json({ message: 'Reddit could not post your result yet. Try again from the live daily post.' }, 502)
  }
})

async function createDailyPost() {
  const subredditName = await getCurrentSubredditName()

  const puzzle = await getDailyPuzzle(0)
  const postKey = dailyPostKey(puzzle.dayKey)
  let existingPostId = await redis.get(postKey)
  if (isExpiredPostingClaim(existingPostId)) {
    await redis.del(postKey)
    existingPostId = undefined
  }

  if (existingPostId && !existingPostId.startsWith('posting:')) {
    const scoreThreadId = await ensureDailyScoreThread(existingPostId as RedditThingId, puzzle.dayKey).catch((error) => {
      console.error('Failed to ensure the daily score thread.', error)
      return undefined
    })
    return { status: 'exists', dayKey: puzzle.dayKey, puzzleId: puzzle.id, postId: existingPostId, scoreThreadId }
  }

  const claim = `posting:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`
  await redis.set(postKey, claim, { nx: true, expiration: new Date(Date.now() + 10 * 60_000) })
  if (await redis.get(postKey) !== claim) {
    return { status: 'posting', dayKey: puzzle.dayKey, puzzleId: puzzle.id }
  }

  try {
    const post = await reddit.submitCustomPost({
      subredditName,
      title: `SubCipher ${puzzle.date}: trace today's mystery community`,
      runAs: 'APP',
      entry: 'default',
      postData: { dayKey: puzzle.dayKey, puzzleId: puzzle.id },
      textFallback: {
        text: 'Play SubCipher: inspect the post image, unlock letters, then guess the mystery subreddit.',
      },
      styles: {
        height: EntrypointHeight.TALL,
        backgroundColor: '#F8FAFCFF',
        backgroundColorDark: '#0F172AFF',
      },
    })

    // The custom post is live at this point. Do not make its visibility depend on
    // optional follow-up work such as the score thread or reminder notifications.
    await redis.set(postKey, post.id)
    const scoreThreadId = await ensureDailyScoreThread(post.id, puzzle.dayKey).catch((error) => {
      console.error('Failed to create the daily score thread.', error)
      return undefined
    })
    await notifyDailyPlayers(post.id as RedditPostId).catch((error) => {
      console.error('Failed to notify daily SubCipher players.', error)
    })
    return { status: 'ok', dayKey: puzzle.dayKey, puzzleId: puzzle.id, postId: post.id, scoreThreadId }
  } catch (error) {
    if (await redis.get(postKey) === claim) await redis.del(postKey)
    throw error
  }
}

function isExpiredPostingClaim(value: string | undefined) {
  if (!value?.startsWith('posting:')) return false
  const startedAt = Number(value.split(':')[1])
  return Number.isFinite(startedAt) && Date.now() - startedAt > 2 * 60_000
}

async function notifyDailyPlayers(postId: RedditPostId) {
  const recipients: Array<{ userId: `t2_${string}`; link: RedditPostId; data: Record<string, string> }> = []
  for await (const userId of notifications.listOptedInUsersIterator()) {
    recipients.push({ userId: userId as `t2_${string}`, link: postId, data: {} })
    if (recipients.length === 1000) {
      await notifications.enqueue({
        title: "Today's SubCipher case is ready",
        body: 'Play now to keep your streak alive.',
        recipients: recipients.splice(0),
      })
    }
  }

  if (recipients.length) {
    await notifications.enqueue({
      title: "Today's SubCipher case is ready",
      body: 'Play now to keep your streak alive.',
      recipients,
    })
  }
}

async function ensureDailyScoreThread(postId: RedditThingId, dayKey: string) {
  const key = dailyScoreThreadKey(dayKey)
  const existingThreadId = await redis.get(key)
  if (existingThreadId) return existingThreadId

  const scoreThread = await reddit.submitComment({
    id: postId,
    text: 'Daily score thread: post your spoiler-safe result here after you finish. Keep the answer out of comments so everyone can play.',
  })
  await scoreThread.distinguish(true)
  await redis.set(key, scoreThread.id)
  return scoreThread.id
}

async function buildStatus(dayOffset: number, knownResult?: SavedResult | null, knownGuesses?: Guess[]): Promise<GameStatus> {
  const puzzle = await getDailyPuzzle(dayOffset)
  const userKey = getUserKey()
  const result = knownResult === undefined ? await readResult(puzzle.id, puzzle.dayKey, userKey) : knownResult
  const storedAttempt = result ? null : await getOrCreateAttempt(puzzle.id, puzzle.dayKey, userKey)
  const guesses = result?.guesses ?? knownGuesses ?? storedAttempt?.guesses ?? []

  const revealedEvidence = result ? EVIDENCE_ORDER : normalizeRevealedEvidence(storedAttempt?.revealedEvidence)
  return {
    puzzle: toPublicPuzzle(puzzle, Boolean(result), revealedEvidence.filter((key) => key.startsWith('letter')).length),
    guesses,
    rows: buildGuessRows(puzzle, guesses),
    result,
    leaderboard: await readLeaderboard(puzzle.id, puzzle.dayKey, result),
    revealedEvidence,
    cluesUsed: result?.cluesUsed ?? Math.max(0, revealedEvidence.length - 1),
  }
}

async function readResult(puzzleId: string, dayKey: string, userKey: string) {
  const raw = await redis.hGet(resultKey(puzzleId, dayKey), userKey)
  return raw ? JSON.parse(raw) as SavedResult : null
}

async function writeResult(puzzleId: string, dayKey: string, userKey: string, result: SavedResult) {
  const key = resultKey(puzzleId, dayKey)
  await redis.hSet(key, { [userKey]: JSON.stringify(result) })
  await redis.expire(key, PLAYER_DATA_TTL_SECONDS)
}

async function getOrCreateAttempt(puzzleId: string, dayKey: string, userKey: string): Promise<StoredAttempt> {
  const raw = await redis.hGet(attemptKey(puzzleId, dayKey), userKey)
  if (!raw) {
    const attempt = { guesses: [], startedAt: Date.now(), revealedEvidence: ['riddle'] as EvidenceKey[] }
    await writeAttempt(puzzleId, dayKey, userKey, attempt)
    return attempt
  }

  const parsed = JSON.parse(raw) as Guess[] | StoredAttempt
  if (Array.isArray(parsed)) {
    const migrated = { guesses: parsed, startedAt: Date.now(), revealedEvidence: ['riddle'] as EvidenceKey[] }
    await writeAttempt(puzzleId, dayKey, userKey, migrated)
    return migrated
  }
  const normalized: StoredAttempt = {
    guesses: Array.isArray(parsed.guesses) ? parsed.guesses : [],
    startedAt: Number.isFinite(parsed.startedAt) ? parsed.startedAt : Date.now(),
    revealedEvidence: normalizeRevealedEvidence(parsed.revealedEvidence),
  }
  if (JSON.stringify(normalized) !== raw) await writeAttempt(puzzleId, dayKey, userKey, normalized)
  return normalized
}

function normalizeRevealedEvidence(value: unknown): EvidenceKey[] {
  if (!Array.isArray(value)) return ['riddle']
  const revealed: EvidenceKey[] = []
  for (const key of EVIDENCE_ORDER) {
    if (value[revealed.length] !== key) break
    revealed.push(key)
  }
  return revealed.length ? revealed : ['riddle']
}

async function writeAttempt(puzzleId: string, dayKey: string, userKey: string, attempt: StoredAttempt) {
  const key = attemptKey(puzzleId, dayKey)
  await redis.hSet(key, { [userKey]: JSON.stringify(attempt) })
  await redis.expire(key, PLAYER_DATA_TTL_SECONDS)
}

async function clearAttempt(puzzleId: string, dayKey: string, userKey: string) {
  await redis.hDel(attemptKey(puzzleId, dayKey), [userKey])
}

async function writeLeaderboard(puzzleId: string, dayKey: string, result: SavedResult) {
  const row: LeaderboardEntry = {
    name: context.username ? `u/${context.username}` : 'u/player',
    score: result.score,
    attempts: result.guesses.length,
    seconds: result.seconds,
  }
  await redis.zAdd(leaderboardKey(puzzleId, dayKey), { member: JSON.stringify(row), score: result.score })
  await redis.expire(leaderboardKey(puzzleId, dayKey), PLAYER_DATA_TTL_SECONDS)
}

async function readLeaderboard(puzzleId: string, dayKey: string, result: SavedResult | null) {
  const rows = await redis.zRange(leaderboardKey(puzzleId, dayKey), 0, 4, { by: 'rank', reverse: true })
  const redditRows = rows.map((row) => JSON.parse(row.member) as LeaderboardEntry)
  const currentUserRow = result?.solved
    ? [{ name: context.username ? `u/${context.username}` : 'u/you', score: result.score, attempts: result.guesses.length, seconds: result.seconds }]
    : []
  return [...redditRows, ...currentUserRow]
    .sort((a, b) => b.score - a.score)
    .filter((entry, index, all) => all.findIndex((candidate) => candidate.name === entry.name) === index)
    .slice(0, 5)
}

async function updateStreak(userKey: string, solved: boolean, dayKey: string) {
  const raw = await redis.hGet(streakKey(), userKey)
  const current = raw ? JSON.parse(raw) as { count: number; lastSolved: string } : { count: 0, lastSolved: '' }

  if (!solved) {
    await redis.hSet(streakKey(), { [userKey]: JSON.stringify({ count: 0, lastSolved: '' }) })
    await redis.expire(streakKey(), PLAYER_DATA_TTL_SECONDS)
    return 0
  }

  const yesterday = getDailyKey(-1, Date.parse(`${dayKey}T00:00:00.000Z`))
  const count = current.lastSolved === yesterday ? current.count + 1 : current.lastSolved === dayKey ? current.count : 1
  await redis.hSet(streakKey(), { [userKey]: JSON.stringify({ count, lastSolved: dayKey }) })
  await redis.expire(streakKey(), PLAYER_DATA_TTL_SECONDS)
  return count
}

async function readJson<T>(request: { json: () => Promise<unknown> }) {
  try {
    return await request.json() as T
  } catch {
    return {} as T
  }
}

function readDayOffset(value: unknown) {
  // The Devvit server never exposes simulated days; local Vite preview owns that feature.
  void value
  return 0
}

function getUserKey() {
  return context.userId ?? context.loid ?? `guest:${context.postId ?? 'preview'}`
}

async function canModerate() {
  try {
    const user = await reddit.getCurrentUser()
    if (!user) return false
    if (user.isAdmin) return true

    const permissions = await user.getModPermissionsForSubreddit(await getCurrentSubredditName())
    return permissions.includes('all') || permissions.includes('config')
  } catch {
    return false
  }
}

async function getCurrentSubredditName() {
  if (context.subredditName) return context.subredditName
  if (!context.subredditId) throw new Error('Daily posts require a subreddit installation context.')

  const subreddit = await reddit.getSubredditById(context.subredditId as `t5_${string}`)
  return subreddit.name
}

async function getDailyPuzzle(dayOffset: number): Promise<Puzzle> {
  const dayKey = getDailyKey(dayOffset)
  const key = dailyPuzzleKey(dayKey)
  const saved = await redis.get(key)
  if (saved) return JSON.parse(saved) as Puzzle

  const candidate = await createLivePuzzle(getTodaysPuzzle(dayOffset))
  await redis.set(key, JSON.stringify(candidate), { nx: true })
  const locked = await redis.get(key)
  return locked ? JSON.parse(locked) as Puzzle : candidate
}

async function createLivePuzzle(candidate: Puzzle): Promise<Puzzle> {
  const fallback = {
    ...candidate,
    revealIndexes: pickRevealIndexes(candidate.answer, candidate.dayKey),
  }

  try {
    const subreddit = await reddit.getSubredditByName(normalizeGuess(candidate.answer))
    const posts = await subreddit.getTopPosts({ limit: 25, timeframe: 'week' }).all()
    const source = posts.find((post) => {
      const thumbnailUrl = post.thumbnail?.url
      return Boolean(thumbnailUrl)
        && !post.nsfw
        && !post.removed
        && !post.spoiler
        && !post.quarantined
        && /^https:\/\/(?:i|preview|external-preview)\.redd\.it\//.test(thumbnailUrl ?? '')
    })

    if (!source?.thumbnail?.url) return fallback

    return {
      ...fallback,
      id: `${candidate.id}:${source.id}`,
      title: 'Fresh evidence',
      image: source.thumbnail.url,
      imageAlt: 'A cropped image clue from a public Reddit post',
      captionHint: redactAnswer(source.title, candidate.answer),
    }
  } catch (error) {
    console.warn('Could not load a live Reddit image clue. Using the generated fallback.', error)
    return fallback
  }
}

function redactAnswer(value: string, answer: string) {
  const normalizedAnswer = normalizeGuess(answer)
  const words = value.split(/(\s+)/).map((word) => normalizeGuess(word) === normalizedAnswer ? '[redacted]' : word)
  return words.join('').slice(0, 140) || 'The source caption could not be shown.'
}

function dailyPuzzleKey(dayKey: string) {
  return `daily:${dayKey}:puzzle`
}

function dailyPostKey(dayKey: string) {
  return `daily:${dayKey}:post`
}

function dailyScoreThreadKey(dayKey: string) {
  return `daily:${dayKey}:score-thread`
}

type StoredAttempt = {
  guesses: Guess[]
  startedAt: number
  revealedEvidence: EvidenceKey[]
}

function streakKey() {
  return 'users:streaks'
}

function resultKey(puzzleId: string, dayKey: string) {
  return `results:${dayKey}:${puzzleId}`
}

function attemptKey(puzzleId: string, dayKey: string) {
  return `attempts:${dayKey}:${puzzleId}`
}

function leaderboardKey(puzzleId: string, dayKey: string) {
  return `leaderboard:${dayKey}:${puzzleId}`
}

function shareKey(puzzleId: string, dayKey: string) {
  return `shares:${dayKey}:${puzzleId}`
}

// Start the Devvit Web server. Devvit's createServer injects per-request context
// (userId, subredditName, etc.) and its patched listen() no-ops during bundling.
serve({
  fetch: app.fetch,
  port: getServerPort(),
  createServer,
})

export default app
