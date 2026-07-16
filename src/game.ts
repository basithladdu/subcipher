export type Puzzle = {
  id: string
  dayKey: string
  date: string
  answer: string
  aliases: string[]
  title: string
  riddle: string
  imageAlt: string
  image: string
  captionHint?: string
  revealIndexes?: number[]
  hints: string[]
  clueFormat?: 'community-riddle' | 'cryptic'
  enumeration?: string
  wordplay?: string
}

export type LetterReveal = {
  position: number
  letter: string
}

export type Guess = {
  value: string
  correct: boolean
}

export type SavedResult = {
  puzzleId: string
  dayKey: string
  solved: boolean
  guesses: Guess[]
  score: number
  seconds: number
  streak: number
  cluesUsed?: number
}

export type EvidenceKey = 'riddle' | 'photo' | 'letter-1' | 'caption' | 'letter-2'

export const EVIDENCE_ORDER: EvidenceKey[] = ['riddle', 'photo', 'letter-1', 'caption', 'letter-2']

export type LeaderboardEntry = {
  name: string
  score: number
  attempts: number
  seconds: number
}

export type LetterState = 'correct' | 'present' | 'absent' | 'empty'

export type LetterTile = {
  letter: string
  state: LetterState
}

export type PublicPuzzle = Omit<Puzzle, 'answer' | 'aliases'> & {
  answer?: string
  answerLength: number
  revealedLetters: LetterReveal[]
}

export type GuessRow = {
  value: string
  correct: boolean
  tiles: LetterTile[]
}

export type GameStatus = {
  puzzle: PublicPuzzle
  guesses: Guess[]
  rows: GuessRow[]
  result: SavedResult | null
  leaderboard: LeaderboardEntry[]
  revealedEvidence: EvidenceKey[]
  cluesUsed: number
}

export const MAX_GUESSES = 6
export const RESULT_KEY_PREFIX = 'subreddit-sleuth-result'
export const STREAK_KEY = 'subreddit-sleuth-streak'
export const DAY_OFFSET_KEY = 'subreddit-sleuth-day-offset'

export const puzzles: Puzzle[] = [
  {
    id: 'daily-001',
    dayKey: '',
    date: 'Jul 14',
    answer: 'r/space',
    aliases: ['space', 'r/space'],
    title: 'Orbital signal',
    riddle: 'I hold storms without air, deserts without roads, and lights that left before your grandparents were born. What community am I?',
    imageAlt: 'Generated clue image with a dark sky, orbital arcs, and bright distant points',
    image: svgImage('#07111f', '#f7c948', '#7dd3fc', 'stars'),
    hints: [
      'Posts often point upward, outward, or into orbit.',
      'The community loves launch windows, telescope images, and strange lights.',
      'Wrong answers here often confuse aviation with astronomy.',
      'A three-letter agency shows up often, but this is broader than that.',
      'The name is one plain word.',
    ],
  },
  {
    id: 'daily-002',
    dayKey: '',
    date: 'Jul 15',
    answer: 'r/Breadit',
    aliases: ['breadit', 'r/breadit', 'bread'],
    title: 'Crumb trail',
    riddle: 'I rise when ignored, collapse when rushed, and get judged by the holes inside me. What community am I?',
    imageAlt: 'Generated clue image with warm baked loaf shapes and scoring marks',
    image: svgImage('#3d2415', '#f1c27d', '#f97316', 'loaves'),
    hints: [
      'The best posts smell like patience.',
      'Crust, crumb, hydration, and starter all matter.',
      'A common failure mode is a dense center.',
      'The subreddit name is a pun.',
      'Think baking, not sandwiches.',
    ],
  },
  {
    id: 'daily-003',
    dayKey: '',
    date: 'Jul 16',
    answer: 'r/MechanicalKeyboards',
    aliases: ['mechanicalkeyboards', 'r/mechanicalkeyboards', 'keyboards', 'mechkeys'],
    title: 'Switch language',
    riddle: 'I turn typing into weather: thock, clack, pop, and rain on plastic squares. What community am I?',
    imageAlt: 'Generated clue image with rows of keycaps and colored switch stems',
    image: svgImage('#101827', '#22c55e', '#f8fafc', 'keys'),
    hints: [
      'The comments care about sound as much as function.',
      'People compare tactility, weight, caps, and cases.',
      'One post can become a debate about foam.',
      'The object is on a desk, but the hobby is much deeper.',
      'The full subreddit name is two words joined together.',
    ],
  },
  {
    id: 'daily-004',
    dayKey: '',
    date: 'Jul 17',
    answer: 'r/houseplants',
    aliases: ['houseplants', 'r/houseplants', 'plants'],
    title: 'Window shelf',
    riddle: 'I live indoors, lean toward the sun, and make strangers diagnose leaves like detectives. What community am I?',
    imageAlt: 'Generated clue image with leaf silhouettes, soil bands, and morning window light',
    image: svgImage('#f7f3e8', '#16a34a', '#0f766e', 'leaves'),
    hints: [
      'Diagnosis threads often start with yellowing or drooping.',
      'Light direction and watering cadence are recurring arguments.',
      'The subject is alive, but it usually stays indoors.',
      'People post cuttings, pests, and progress photos.',
      'The subreddit name says exactly where these plants live.',
    ],
  },
  {
    id: 'daily-005', dayKey: '', date: '', answer: 'r/gardening', aliases: ['gardening', 'r/gardening', 'garden'], title: 'Plot notes',
    riddle: 'Tending a plot: GARDEN + continuing ending (9)', imageAlt: 'Original abstract illustration of leaves, soil, and a garden plot', image: svgImage('#f5f5f4', '#166534', '#57534e', 'leaves'),
    clueFormat: 'cryptic', enumeration: '9', wordplay: 'GARDEN + ING', hints: ['Definition: tending a plot.', 'Wordplay: start with GARDEN.', 'Add the continuing-action ending ING.', 'The answer has nine letters.', 'Final context: cultivation, soil, pests, and harvests.'],
  },
  {
    id: 'daily-006', dayKey: '', date: '', answer: 'r/cooking', aliases: ['cooking', 'r/cooking', 'cook'], title: 'Kitchen brief',
    riddle: 'Preparing food; falsifying the books (7)', imageAlt: 'Original abstract illustration of loaves and measured ingredients', image: svgImage('#f5f5f4', '#c2410c', '#44403c', 'loaves'),
    clueFormat: 'cryptic', enumeration: '7', wordplay: 'Double definition', hints: ['This is a double definition.', 'One definition belongs in a kitchen.', 'The other describes dishonest accounting.', 'The answer has seven letters.', 'Final context: heat, seasoning, technique, and timing.'],
  },
  {
    id: 'daily-007', dayKey: '', date: '', answer: 'r/running', aliases: ['running', 'r/running', 'run'], title: 'Training split',
    riddle: 'Operating, or moving quickly on foot (7)', imageAlt: 'Original abstract illustration of a track and pace markers', image: svgImage('#f5f5f4', '#b91c1c', '#44403c', 'keys'),
    clueFormat: 'cryptic', enumeration: '7', wordplay: 'Double definition', hints: ['This is a double definition.', 'A machine can be this.', 'A person on a track can also be this.', 'The answer has seven letters.', 'Final context: pace, distance, shoes, and recovery.'],
  },
  {
    id: 'daily-008', dayKey: '', date: '', answer: 'r/camping', aliases: ['camping', 'r/camping', 'camp'], title: 'Field report',
    riddle: 'Affected style plus continuing ending makes an outdoor stay (7)', imageAlt: 'Original abstract illustration of a tent under a night sky', image: svgImage('#f5f5f4', '#0369a1', '#44403c', 'stars'),
    clueFormat: 'cryptic', enumeration: '7', wordplay: 'CAMP + ING', hints: ['Definition: an outdoor stay.', 'Wordplay begins with CAMP, meaning affected or theatrical.', 'Add the continuing-action ending ING.', 'The answer has seven letters.', 'Final context: tents, weather, and sleep systems.'],
  },
  {
    id: 'daily-009', dayKey: '', date: '', answer: 'r/knitting', aliases: ['knitting', 'r/knitting', 'knit'], title: 'Pattern sheet',
    riddle: 'Joining loops; brows drawing together (8)', imageAlt: 'Original abstract illustration of yarn loops and needles', image: svgImage('#f5f5f4', '#7c3aed', '#44403c', 'keys'),
    clueFormat: 'cryptic', enumeration: '8', wordplay: 'Double definition', hints: ['This is a double definition.', 'One definition uses yarn and needles.', 'The other describes a worried forehead.', 'The answer has eight letters.', 'Final context: gauge, patterns, and yarn weight.'],
  },
  {
    id: 'daily-010', dayKey: '', date: '', answer: 'r/birding', aliases: ['birding', 'r/birding', 'birds'], title: 'Field sighting',
    riddle: 'Flyer plus continuing ending makes a watching hobby (7)', imageAlt: 'Original abstract illustration of a bird silhouette and field marks', image: svgImage('#f5f5f4', '#0f766e', '#44403c', 'leaves'),
    clueFormat: 'cryptic', enumeration: '7', wordplay: 'BIRD + ING', hints: ['Definition: a watching hobby.', 'Wordplay begins with BIRD.', 'Add the continuing-action ending ING.', 'The answer has seven letters.', 'Final context: calls, migration, optics, and sightings.'],
  },
  {
    id: 'daily-011', dayKey: '', date: '', answer: 'r/bicycling', aliases: ['bicycling', 'r/bicycling', 'cycling'], title: 'Ride sheet',
    riddle: 'Twice-started cycling makes two-wheel travel (9)', imageAlt: 'Original abstract illustration of wheels and a route line', image: svgImage('#f5f5f4', '#047857', '#44403c', 'keys'),
    clueFormat: 'cryptic', enumeration: '9', wordplay: 'BI + CYCLING', hints: ['Definition: two-wheel travel.', 'The prefix BI means two or twice.', 'Attach BI to CYCLING.', 'The answer has nine letters.', 'Final context: routes, fit, maintenance, and commuting.'],
  },
  {
    id: 'daily-012', dayKey: '', date: '', answer: 'r/woodworking', aliases: ['woodworking', 'r/woodworking'], title: 'Workshop file',
    riddle: 'Timber plus labour makes a craft (11)', imageAlt: 'Original abstract illustration of timber grain and a hand plane', image: svgImage('#f5f5f4', '#92400e', '#44403c', 'loaves'),
    clueFormat: 'cryptic', enumeration: '11', wordplay: 'WOOD + WORKING', hints: ['Definition: a craft.', 'Wordplay begins with WOOD.', 'Add WORKING, meaning labouring.', 'The answer has eleven letters.', 'Final context: joints, grain, finishes, and hand tools.'],
  },
  {
    id: 'daily-013', dayKey: '', date: '', answer: 'r/houseplants', aliases: ['houseplants', 'r/houseplants', 'plants'], title: 'Indoor specimen log',
    riddle: 'Home plus living greenery makes an indoor collection (11)', imageAlt: 'Original abstract illustration of leaves, soil, and window light', image: svgImage('#f5f5f4', '#166534', '#57534e', 'leaves'),
    clueFormat: 'cryptic', enumeration: '11', wordplay: 'HOUSE + PLANTS', hints: ['Definition: an indoor collection.', 'Wordplay begins with HOUSE.', 'Add PLANTS.', 'The answer has eleven letters.', 'Final context: watering, light, pests, and cuttings.'],
  },
  {
    id: 'daily-014', dayKey: '', date: '', answer: 'r/astronomy', aliases: ['astronomy', 'r/astronomy'], title: 'Night-sky record',
    riddle: 'Star science from ASTRO plus system (9)', imageAlt: 'Original abstract illustration of orbital paths and stars', image: svgImage('#f5f5f4', '#1d4ed8', '#44403c', 'stars'),
    clueFormat: 'cryptic', enumeration: '9', wordplay: 'ASTRO + NOMY', hints: ['Definition: star science.', 'ASTRO supplies the star element.', 'NOMY supplies a system or body of knowledge.', 'The answer has nine letters.', 'Final context: telescopes, planets, and deep-sky objects.'],
  },
]

// Preview mode starts empty. Never present fictional accounts as Reddit players.
export const baseLeaderboard: LeaderboardEntry[] = []

export function getTodaysPuzzle(dayOffset: number, now = Date.now(), selectedId?: string) {
  const dayKey = getDailyKey(dayOffset, now)
  const dateLabel = formatDayLabel(dayKey)
  const pool = puzzles.map((puzzle) => ({ ...puzzle, dayKey, date: dateLabel }))
  const dayNumber = Math.floor(Date.parse(`${dayKey}T00:00:00.000Z`) / 86_400_000)
  return pool.find((puzzle) => puzzle.id === selectedId) ?? pool[dayNumber % pool.length]
}

export function normalizeGuess(value: string) {
  return value.toLowerCase().replace(/^r\//, '').replace(/[^a-z0-9]/g, '')
}

export function isCorrectGuess(puzzle: Puzzle, value: string) {
  const normalized = normalizeGuess(value)
  return puzzle.aliases.some((alias) => normalizeGuess(alias) === normalized)
}

export function scoreResult(attempts: number, seconds: number, cluesUsed = 0) {
  const attemptScore = Math.max(120, 1000 - (attempts - 1) * 140)
  const timeBonus = Math.max(0, 90 - seconds)
  return Math.max(0, attemptScore + timeBonus - cluesUsed * 120)
}

export function getNextEvidence(revealedEvidence: EvidenceKey[]) {
  return EVIDENCE_ORDER.find((key) => !revealedEvidence.includes(key)) ?? null
}

export function normalizeEvidence(value: unknown): EvidenceKey[] {
  if (!Array.isArray(value)) return ['riddle']

  const revealed = EVIDENCE_ORDER.filter((key, index) => value[index] === key)
  return revealed.length > 0 && revealed[0] === 'riddle' ? revealed : ['riddle']
}

export function countRevealedLetters(revealedEvidence: EvidenceKey[]) {
  return revealedEvidence.filter((key) => key === 'letter-1' || key === 'letter-2').length
}

export function getResultKey(puzzleId: string, dayKey: string) {
  return `${RESULT_KEY_PREFIX}:${dayKey}:${puzzleId}`
}

export function getDailyKey(dayOffset: number, now = Date.now()) {
  return new Date(now + dayOffset * 86_400_000).toISOString().slice(0, 10)
}

export function formatDayLabel(dayKey: string) {
  const date = new Date(`${dayKey}T00:00:00.000Z`)
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

export function getLetterFeedback(answer: string[], rawGuess: string) {
  const guess = normalizeGuess(rawGuess).split('')
  const answerCounts = new Map<string, number>()
  const states: LetterState[] = Array.from({ length: answer.length }, () => 'absent')

  answer.forEach((letter, index) => {
    if (guess[index] === letter) {
      states[index] = 'correct'
      return
    }
    answerCounts.set(letter, (answerCounts.get(letter) ?? 0) + 1)
  })

  return answer.map((_, index) => {
    const letter = guess[index] ?? ''
    if (!letter) return { letter: '', state: 'empty' as LetterState }
    if (states[index] === 'correct') return { letter, state: 'correct' as LetterState }

    const available = answerCounts.get(letter) ?? 0
    if (available > 0) {
      answerCounts.set(letter, available - 1)
      return { letter, state: 'present' as LetterState }
    }

    return { letter, state: 'absent' as LetterState }
  })
}

export function buildGuessRows(puzzle: Puzzle, guesses: Guess[]): GuessRow[] {
  const answerLetters = normalizeGuess(puzzle.answer).split('')
  return guesses.map((guess) => ({
    ...guess,
    tiles: getLetterFeedback(answerLetters, guess.value),
  }))
}

export function toPublicPuzzle(puzzle: Puzzle, revealAnswer = false, revealedLetterCount = 0): PublicPuzzle {
  const answerLetters = normalizeGuess(puzzle.answer).split('')
  const indexes = puzzle.revealIndexes ?? defaultRevealIndexes(answerLetters.length)
  return {
    id: puzzle.id,
    dayKey: puzzle.dayKey,
    date: puzzle.date,
    title: puzzle.title,
    riddle: puzzle.riddle,
    imageAlt: puzzle.imageAlt,
    image: puzzle.image,
    hints: puzzle.hints,
    clueFormat: puzzle.clueFormat,
    enumeration: puzzle.enumeration,
    wordplay: puzzle.wordplay,
    answerLength: normalizeGuess(puzzle.answer).length,
    revealedLetters: indexes.slice(0, Math.min(revealedLetterCount, indexes.length)).map((position) => ({
      position,
      letter: answerLetters[position] ?? '',
    })),
    ...(revealAnswer ? { answer: puzzle.answer } : {}),
  }
}

export function pickRevealIndexes(answer: string, dayKey: string) {
  const length = normalizeGuess(answer).length
  if (length < 2) return [0]

  let hash = 0
  for (const character of `${dayKey}:${answer}`) hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  const first = 1 + (hash % Math.max(1, length - 2))
  const offset = 1 + ((hash >>> 8) % Math.max(1, length - 1))
  const second = (first + offset) % length
  return first === second ? [first] : [first, second]
}

function defaultRevealIndexes(length: number) {
  if (length < 2) return [0]
  return [Math.min(1, length - 1), Math.max(0, length - 2)]
}

export function buildLeaderboard(result: SavedResult | null) {
  const rows = [...baseLeaderboard]
  if (result?.solved) {
    rows.push({
      name: 'u/you',
      score: result.score,
      attempts: result.guesses.length,
      seconds: result.seconds,
    })
  }
  return rows.sort((a, b) => b.score - a.score).slice(0, 5)
}

export function buildShareText(puzzle: Pick<Puzzle, 'date'>, result: SavedResult) {
  const marks = result.guesses.map((entry) => (entry.correct ? 'G' : 'X')).join(' ')
  return [
    `SubCipher ${puzzle.date}`,
    result.solved ? `Solved in ${result.guesses.length}/${MAX_GUESSES}` : `Missed ${MAX_GUESSES}/${MAX_GUESSES}`,
    `Score ${result.score} | Streak ${result.streak} | Clues ${result.cluesUsed ?? 0}`,
    marks,
    'No spoilers. Drop your clue theory below.',
  ].join('\n')
}

export function svgImage(background: string, primary: string, secondary: string, mode: 'stars' | 'loaves' | 'keys' | 'leaves') {
  const motifs = {
    stars: '<circle cx="112" cy="70" r="24" fill="{primary}"/><path d="M30 170 C120 76 244 52 360 82" fill="none" stroke="{secondary}" stroke-width="8"/><path d="M70 230 C164 132 276 118 406 152" fill="none" stroke="{secondary}" stroke-width="4" opacity=".7"/><g fill="#fff"><circle cx="56" cy="54" r="3"/><circle cx="304" cy="42" r="4"/><circle cx="410" cy="98" r="3"/><circle cx="224" cy="206" r="2"/></g>',
    loaves: '<ellipse cx="145" cy="170" rx="96" ry="54" fill="{primary}"/><ellipse cx="296" cy="170" rx="96" ry="54" fill="{primary}" opacity=".82"/><path d="M92 156 C116 126 154 120 186 148" stroke="{secondary}" stroke-width="9" fill="none"/><path d="M250 156 C274 126 312 120 344 148" stroke="{secondary}" stroke-width="9" fill="none"/><rect x="0" y="222" width="480" height="98" fill="{secondary}" opacity=".22"/>',
    keys: '<g fill="{primary}"><rect x="48" y="74" width="74" height="58" rx="10"/><rect x="136" y="74" width="74" height="58" rx="10"/><rect x="224" y="74" width="74" height="58" rx="10"/><rect x="312" y="74" width="74" height="58" rx="10"/><rect x="78" y="150" width="92" height="58" rx="10"/><rect x="184" y="150" width="92" height="58" rx="10"/><rect x="290" y="150" width="92" height="58" rx="10"/></g><g fill="{secondary}" opacity=".9"><circle cx="84" cy="102" r="7"/><circle cx="172" cy="102" r="7"/><circle cx="260" cy="102" r="7"/><circle cx="348" cy="102" r="7"/></g>',
    leaves: '<path d="M82 226 C108 98 190 70 228 174 C164 158 128 186 82 226Z" fill="{primary}"/><path d="M242 232 C268 86 360 58 404 178 C330 160 290 190 242 232Z" fill="{secondary}"/><path d="M214 262 C212 174 236 104 286 60" stroke="#6b4f2a" stroke-width="9" fill="none"/><rect x="40" y="238" width="400" height="44" rx="12" fill="#8b5e34" opacity=".45"/>',
  }[mode]
    .replaceAll('{primary}', primary)
    .replaceAll('{secondary}', secondary)

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320" viewBox="0 0 480 320"><rect width="480" height="320" fill="${background}"/><circle cx="424" cy="272" r="120" fill="${secondary}" opacity=".16"/>${motifs}</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}
