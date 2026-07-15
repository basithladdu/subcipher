import { StrictMode, useState } from 'react'
import type { MouseEvent } from 'react'
import { createRoot } from 'react-dom/client'
import { requestExpandedMode } from '@devvit/web/client'
import './index.css'
import './Splash.css'

export function Splash() {
  const [message, setMessage] = useState('')

  function openGame(event: MouseEvent<HTMLButtonElement>) {
    try {
      requestExpandedMode(event.nativeEvent, 'game')
    } catch {
      setMessage('Open this card in a Devvit post to play today’s case.')
    }
  }

  return <main className="splash-shell">
    <section className="splash-card" aria-labelledby="splash-title">
      <div className="splash-clue" aria-hidden="true"><span>r/</span><b>?</b></div>
      <p className="splash-kicker">Daily community deduction</p>
      <h1 id="splash-title">SubCipher</h1>
      <p className="splash-copy">Read one post image. Decode the hidden community before your six lives run out.</p>
      <button type="button" onClick={openGame}>Play today&apos;s case</button>
      <p className="splash-meta">Fresh case daily | Clues unlock with each miss | Scoreboard after play</p>
      {message ? <p className="splash-message" role="status">{message}</p> : null}
    </section>
  </main>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Splash />
  </StrictMode>,
)
