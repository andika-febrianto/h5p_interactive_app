import type { Module } from '../types/storyboard'
import { useProgress } from '../context/ProgressContext'

export function SummaryScreen({
  module: mod,
  onRestart,
}: {
  module: Module
  onRestart: () => void
}) {
  const { results } = useProgress()

  const totalCorrect = Object.values(results).reduce((s, r) => s + r.correct, 0)
  const totalPossible = Object.values(results).reduce((s, r) => s + r.total, 0)
  const pct = totalPossible
    ? Math.round((totalCorrect / totalPossible) * 100)
    : 0

  return (
    <div className='scene summary-scene'>
      <span className='panel-tag'>Selesai</span>
      <h2>Modul "{mod.title}" Selesai!</h2>
      <div
        className='summary-score-ring'
        style={{ ['--pct' as string]: `${pct}%` }}
      >
        <span>{pct}%</span>
      </div>
      <p className='summary-caption'>
        {totalCorrect} dari {totalPossible} poin interaktif terjawab benar.
      </p>

      <div className='summary-breakdown'>
        {mod.frames.map((f) => {
          const r = results[f.id]
          return (
            <div className='summary-row' key={f.id}>
              <span>{f.title}</span>
              <span>{r ? `${r.correct}/${r.total}` : '—'}</span>
            </div>
          )
        })}
      </div>

      <button className='btn-primary' onClick={onRestart}>
        Ulangi Modul
      </button>
    </div>
  )
}
