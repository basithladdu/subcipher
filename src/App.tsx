import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, FormEvent, KeyboardEvent } from 'react'
import './App.css'
import { enableDailyReminder, getShareText, loadGameStatus, loadReminderStatus, readStreak, revealEvidence, shareResultToReddit, submitGuessToGame } from './api'
import { MAX_GUESSES } from './game'
import type { EvidenceKey, GameStatus, LetterTile } from './game'

function App() {
  const [status, setStatus] = useState<GameStatus | null>(null)
  const [startedAt, setStartedAt] = useState(Date.now())
  const [draft, setDraft] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [activeView, setActiveView] = useState<'play' | 'leaderboard'>('play')
  const [draftError, setDraftError] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [reminderEnabled, setReminderEnabled] = useState(false)
  const [reminderLoading, setReminderLoading] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [revealing, setRevealing] = useState(false)

  useEffect(() => {
    let cancelled = false
    loadGameStatus().then((nextStatus) => {
      if (cancelled) return
      setStatus(nextStatus)
      setDraft(Array.from({ length: nextStatus.puzzle.answerLength }, () => ''))
      setMessage(nextStatus.result ? 'Official result already recorded for this daily puzzle.' : '')
      setStartedAt(Date.now())
    })
    loadReminderStatus().then((response) => {
      if (!cancelled) setReminderEnabled(response.enabled)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (!status) {
    return <main className="shell" />
  }

  const { puzzle, guesses, result, leaderboard } = status
  const solved = result?.solved ?? guesses.some((entry) => entry.correct)
  const finished = Boolean(result) || solved || guesses.length >= MAX_GUESSES
  const shareText = getShareText(status)

  async function submitGuess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await submitCurrentGuess()
  }

  async function submitCurrentGuess() {
    if (finished) return

    if (draft.some((letter) => !letter)) {
      setMessage(`Fill all ${puzzle.answerLength} letters before submitting.`)
      setDraftError(true)
      window.setTimeout(() => setDraftError(false), 450)
      return
    }

    const nextStatus = await submitGuessToGame(draft.join(''), startedAt)
    setStatus(nextStatus)
    setMessage(nextStatus.message)
    setDraft(Array.from({ length: puzzle.answerLength }, () => ''))
  }

  function handleKeyboardInput(key: string) {
    if (finished) return
    if (key === 'ENTER') {
      void submitCurrentGuess()
      return
    }
    if (key === 'BACKSPACE') {
      const lastFilled = draft.map((letter, index) => letter ? index : -1).findLast((index) => index >= 0)
      if (lastFilled === undefined) return
      const next = [...draft]
      next[lastFilled] = ''
      setDraft(next)
      return
    }
    const firstEmpty = draft.findIndex((letter) => !letter)
    if (firstEmpty < 0) return
    const next = [...draft]
    next[firstEmpty] = key
    setDraft(next)
  }

  async function shareResult() {
    if (!result || sharing) return
    setSharing(true)
    const response = await shareResultToReddit()
    setMessage(response.message)
    setSharing(false)
  }

  async function enableReminder() {
    if (reminderEnabled || reminderLoading) return
    setReminderLoading(true)
    const response = await enableDailyReminder()
    setReminderEnabled(response.enabled)
    setMessage(response.message ?? (response.enabled ? 'Daily reminders are on.' : 'Daily reminders could not be enabled yet.'))
    setReminderLoading(false)
  }

  async function revealNextEvidence() {
    if (revealing || finished) return
    const currentStatus = status
    if (!currentStatus) return
    const next = (['photo', 'letter-1', 'caption', 'letter-2'] as EvidenceKey[]).find((key) => !currentStatus.revealedEvidence.includes(key))
    if (!next) return
    setRevealing(true)
    const nextStatus = await revealEvidence(next)
    setStatus(nextStatus)
    setMessage(nextStatus.message)
    setRevealing(false)
  }

  return (
    <main className="shell">
      <section className="topbar" aria-label="Game status">
        <div>
          <p className="eyebrow">Daily community deduction</p>
          <h1>SubCipher</h1>
        </div>
        <nav className="view-tabs" aria-label="Game views">
          <button type="button" className={activeView === 'play' ? 'active' : ''} aria-pressed={activeView === 'play'} onClick={() => setActiveView('play')}>Play</button>
          <button type="button" className={activeView === 'leaderboard' ? 'active' : ''} aria-pressed={activeView === 'leaderboard'} onClick={() => setActiveView('leaderboard')}>Leaderboard</button>
         </nav>
         <button className="help-button" type="button" aria-expanded={helpOpen} onClick={() => setHelpOpen((open) => !open)}>Help</button>
        <div className="status-grid">
          <Metric label="Daily key" value={puzzle.dayKey.slice(5)} />
          <Metric label="Lives" value={`${Math.max(0, MAX_GUESSES - guesses.length)} left`} />
          <Metric label="Streak" value={`${result?.streak ?? readStreak().count}`} />
        </div>
      </section>

      {activeView === 'play' ? <>
        {helpOpen ? <section className="help-guide" aria-label="How to play"><strong>How to play</strong><span>Read the riddle, reveal clues only when needed, then type the subreddit name without r/.</span><span>Green is the right spot, yellow is the wrong spot, and gray is not in the answer. Each reveal lowers the final clue score.</span></section> : null}
        <section className="game-layout">
          <section className="play-panel" aria-labelledby="puzzle-title">
             {status.revealedEvidence.includes('photo') ? <div className="visual-wrap"><img className="clue-image" src={puzzle.image} alt={puzzle.imageAlt} /><div className="visual-badge">{puzzle.title}</div></div> : <div className="visual-wrap hidden-evidence"><span>Photo evidence is locked</span><button type="button" onClick={revealNextEvidence} disabled={revealing}>{revealing ? 'Revealing...' : 'Reveal photo'}</button></div>}
            <div className="guess-area">
              <div>
                <p className="eyebrow">Mystery community</p>
                <h2 id="puzzle-title">Trace the source from the evidence</h2>
              </div>
               <div className="riddle-card"><span>Riddle</span><p>{puzzle.riddle}</p></div>
               <EvidenceLadder puzzle={puzzle} status={status} onReveal={revealNextEvidence} revealing={revealing} />
              {message ? <p className="message">{message}</p> : null}
            </div>
          </section>

          <aside className="side-panel" aria-label="Hints and attempts">
            <section>
              <div className="section-title"><h2>Evidence</h2><span>{Math.min(4, guesses.length)}/4 unlocked</span></div>
               <p className="clue-score">Clue score: <strong>{Math.max(0, 5 - status.cluesUsed)}/5</strong></p>
            </section>
            <section>
              <div className="section-title"><h2>Daily grid</h2><span>{puzzle.answerLength} letters</span></div>
              <form className="wordle-form" onSubmit={submitGuess}>
                <div className="wordle-board">
                  {Array.from({ length: MAX_GUESSES }).map((_, index) => {
                    if (!finished && index === guesses.length) {
                      return <EditableGuessRow answerLength={puzzle.answerLength} draft={draft} hasError={draftError} onChange={setDraft} onSubmit={submitCurrentGuess} key={index} />
                    }
                    return <GuessRow answerLength={puzzle.answerLength} row={status.rows[index]} key={index} />
                  })}
                </div>
                <button className="submit-guess" type="submit" disabled={finished}>Enter guess</button>
              </form>
              <div className="tile-legend" aria-label="Letter board legend">
                <span><i className="legend-tile correct" />Right spot</span><span><i className="legend-tile present" />Wrong spot</span><span><i className="legend-tile absent" />Not in answer</span>
              </div>
              <GameKeyboard rows={status.rows} onKeyPress={handleKeyboardInput} />
            </section>
          </aside>
        </section>

        {result ? <section className={`outcome-panel ${result.solved ? 'solved' : 'missed'}`} aria-live="polite">
          <div>
            <p className="eyebrow">{result.solved ? 'Daily solved' : 'Daily complete'}</p>
            <h2>{result.solved ? 'Nice deduction.' : 'Tomorrow is a new case.'}</h2>
            <p>{result.solved ? 'Your official score and streak are locked in.' : `The mystery community was ${puzzle.answer ?? 'revealed in the daily post'}.`}</p>
          </div>
          <div className="outcome-stats" aria-label="Daily result">
             <Metric label="Score" value={`${result.score}`} />
             <Metric label="Clue score" value={`${Math.max(0, 5 - (result.cluesUsed ?? status.cluesUsed))}/5`} />
            <Metric label="Streak" value={`${result.streak}`} />
            <Metric label="Solved" value={`${result.guesses.length}/${MAX_GUESSES}`} />
          </div>
        </section> : null}

        <section className="results-panel share-panel">
          <div className="section-title"><h2>Share result</h2><span>{result ? 'Ready' : 'Locked'}</span></div>
          <textarea readOnly value={shareText || 'Finish today\'s puzzle to unlock spoiler-safe comment text.'} />
          <button className="share-button" type="button" disabled={!result || sharing} onClick={shareResult}>
            {sharing ? 'Posting result...' : 'Post result to Reddit'}
          </button>
          {result ? <button className="reminder-button" type="button" disabled={reminderEnabled || reminderLoading} onClick={enableReminder}>
            {reminderEnabled ? 'Daily reminder enabled' : reminderLoading ? 'Enabling reminder...' : 'Remind me tomorrow'}
          </button> : null}
        </section>
      </> : null}

      {activeView === 'leaderboard' ? <section className="standings-view">
        <div className="view-heading"><div><p className="eyebrow">Today&apos;s competition</p><h2>Daily leaderboard</h2></div><span>{result?.solved ? 'Official result locked' : 'Live standings'}</span></div>
        <section className="results-panel leaderboard-panel">
          {leaderboard.length ? <ol className="leaderboard">{leaderboard.map((entry) => <li key={entry.name}><span>{entry.name}</span><strong>{entry.score}</strong><small>{entry.attempts} guesses | {entry.seconds}s</small></li>)}</ol> : <p className="empty-state">No verified solves yet. Finish today’s case to set the first score.</p>}
        </section>
      </section> : null}
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong></div>
}

function EvidenceLadder({ puzzle, status, onReveal, revealing }: { puzzle: GameStatus['puzzle']; status: GameStatus; onReveal: () => void; revealing: boolean }) {
  const visibleLetters = Array.from({ length: puzzle.answerLength }, (_, index) => puzzle.revealedLetters.find((item) => item.position === index)?.letter.toUpperCase() ?? '·').join(' ')
  const entries = [
    { key: 'photo' as EvidenceKey, label: 'Photo', value: 'Visual clue revealed above.', unlocked: status.revealedEvidence.includes('photo') },
    { key: 'letter-1' as EvidenceKey, label: 'Letter 1', value: visibleLetters, unlocked: status.revealedEvidence.includes('letter-1') },
    { key: 'caption' as EvidenceKey, label: 'Caption', value: puzzle.captionHint ?? puzzle.hints[0], unlocked: status.revealedEvidence.includes('caption') },
    { key: 'letter-2' as EvidenceKey, label: 'Letter 2', value: visibleLetters, unlocked: status.revealedEvidence.includes('letter-2') },
  ]

  return <ol className="hint-list evidence-list">
    {entries.map((entry, index) => <li className={entry.unlocked ? 'revealed' : ''} key={entry.label}>
      <strong>{entry.label}</strong>{entry.unlocked ? <span>{entry.value}</span> : index === status.revealedEvidence.length - 1 ? <button type="button" className="reveal-button" onClick={onReveal} disabled={revealing}>{revealing ? 'Revealing...' : `Reveal ${entry.label.toLowerCase()}`}</button> : <span className="locked-copy">Locked</span>}
    </li>)}
  </ol>
}

function GuessRow({ answerLength, row }: { answerLength: number; row?: { tiles: LetterTile[] } }) {
  const tiles = row?.tiles ?? Array.from({ length: answerLength }, () => ({ letter: '', state: 'empty' as const }))
  return <div className={`wordle-row ${row ? 'submitted-row' : ''}`} style={getBoardStyle(answerLength)}>{tiles.map((tile, index) => <span className={`letter-tile ${tile.state}`} key={`${index}-${tile.letter}`}>{tile.letter}</span>)}</div>
}

function EditableGuessRow({ answerLength, draft, hasError, onChange, onSubmit }: { answerLength: number; draft: string[]; hasError: boolean; onChange: (draft: string[]) => void; onSubmit: () => void }) {
  const inputs = useRef<Array<HTMLInputElement | null>>([])

  function writeLetters(index: number, rawValue: string) {
    const letters = rawValue.toUpperCase().replace(/[^A-Z0-9]/g, '').split('')
    if (!letters.length) {
      const next = [...draft]
      next[index] = ''
      onChange(next)
      return
    }

    const next = [...draft]
    letters.forEach((letter, offset) => {
      if (index + offset < answerLength) next[index + offset] = letter
    })
    onChange(next)
    inputs.current[Math.min(answerLength - 1, index + letters.length)]?.focus()
  }

  function handleKeyDown(index: number, key: string, event: KeyboardEvent<HTMLInputElement>) {
    if (key === 'Enter') {
      event.preventDefault()
      onSubmit()
      return
    }
    if (key === 'Backspace' && !draft[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  return <div className={`wordle-row active-row ${hasError ? 'shake-row' : ''}`} style={getBoardStyle(answerLength)}>
    {draft.map((letter, index) => <input
      aria-label={`Letter ${index + 1} of ${answerLength}`}
      className="letter-tile letter-input"
      inputMode="text"
      key={index}
      maxLength={answerLength}
      onChange={(event) => writeLetters(index, event.target.value)}
      onKeyDown={(event) => handleKeyDown(index, event.key, event)}
      ref={(element) => { inputs.current[index] = element }}
      value={letter}
    />)}
  </div>
}

function getBoardStyle(answerLength: number): CSSProperties {
  const gap = answerLength >= 16 ? 1 : answerLength >= 10 ? 2 : answerLength >= 7 ? 4 : 6
  const tileSize = Math.max(14, Math.min(52, Math.floor((284 - gap * (answerLength - 1)) / answerLength)))
  const fontSize = Math.max(10, Math.min(19, Math.floor(tileSize * 0.48)))
  const naturalWidth = answerLength * 52 + gap * (answerLength - 1)

  return {
    '--tile-gap': `${gap}px`,
    '--tile-font-size': `${fontSize}px`,
    gridTemplateColumns: `repeat(${answerLength}, minmax(0, 1fr))`,
    width: `min(100%, ${naturalWidth}px)`,
  } as CSSProperties
}

function GameKeyboard({ rows, onKeyPress }: { rows: Array<{ tiles: LetterTile[] }>; onKeyPress: (key: string) => void }) {
  const stateByLetter = new Map<string, LetterTile['state']>()
  const priority = { empty: 0, absent: 1, present: 2, correct: 3 }
  rows.forEach((row) => row.tiles.forEach((tile) => {
    if (tile.letter && (priority[tile.state] ?? 0) >= (priority[stateByLetter.get(tile.letter) ?? 'empty'] ?? 0)) stateByLetter.set(tile.letter.toUpperCase(), tile.state)
  }))
  const rowsOfKeys = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM']
  return <div className="game-keyboard" aria-label="On-screen keyboard">
    {rowsOfKeys.map((letters, index) => <div className="keyboard-row" key={letters}>
      {index === 2 ? <button type="button" className="keyboard-key wide-key" onClick={() => onKeyPress('ENTER')}>Enter</button> : null}
      {letters.split('').map((letter) => <button type="button" className={`keyboard-key ${stateByLetter.get(letter) ?? ''}`} key={letter} onClick={() => onKeyPress(letter)}>{letter}</button>)}
      {index === 2 ? <button type="button" className="keyboard-key wide-key" aria-label="Backspace" onClick={() => onKeyPress('BACKSPACE')}>Back</button> : null}
    </div>)}
  </div>
}

export default App
