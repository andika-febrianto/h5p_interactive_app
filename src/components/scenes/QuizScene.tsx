import { useState } from 'react';
import type { QuizFrame } from '../../types/storyboard';
import { useProgress } from '../../context/ProgressContext';

export function QuizScene({ frame, onDone }: { frame: QuizFrame; onDone: () => void }) {
  const { setResult } = useProgress();
  const [answers, setAnswers] = useState<Record<string, number | null>>(
    Object.fromEntries(frame.questions.map((q) => [q.id, null]))
  );
  const [submitted, setSubmitted] = useState(false);

  const allAnswered = frame.questions.every((q) => answers[q.id] !== null);
  const correctCount = frame.questions.filter((q) => answers[q.id] === q.correctIndex).length;

  const handleSelect = (qId: string, optIndex: number) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qId]: optIndex }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
    setResult({
      frameId: frame.id,
      completed: true,
      correct: correctCount,
      total: frame.questions.length,
    });
  };

  return (
    <div className="scene quiz-scene">
      <header className="scene-header">
        <span className="panel-tag">Panel {frame.panel} · Kuis</span>
        <h2>{frame.title}</h2>
      </header>

      <div className="quiz-list">
        {frame.questions.map((q, qi) => {
          const selected = answers[q.id];
          const isCorrect = selected === q.correctIndex;
          return (
            <div className="quiz-card" key={q.id}>
              <p className="quiz-prompt">
                <span className="quiz-index">{qi + 1}</span> {q.prompt}
              </p>
              <div className="quiz-options">
                {q.options.map((opt, oi) => {
                  const isSelected = selected === oi;
                  let stateClass = '';
                  if (submitted && isSelected) {
                    stateClass = isCorrect ? 'is-correct' : 'is-wrong';
                  } else if (submitted && oi === q.correctIndex) {
                    stateClass = 'is-correct-reveal';
                  }
                  return (
                    <button
                      key={oi}
                      type="button"
                      className={`quiz-option ${isSelected ? 'is-selected' : ''} ${stateClass}`}
                      onClick={() => handleSelect(q.id, oi)}
                      disabled={submitted}
                    >
                      <span className="quiz-option-letter">{String.fromCharCode(65 + oi)}</span>
                      <span className="quiz-option-text">{opt}</span>
                      {submitted && isSelected && (
                        <span className="quiz-option-symbol" aria-hidden>
                          {isCorrect ? '✓' : '✕'}
                        </span>
                      )}
                      {submitted && !isSelected && oi === q.correctIndex && (
                        <span className="quiz-option-symbol" aria-hidden>
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {submitted && (
                <p className={`quiz-explanation ${isCorrect ? 'ok' : 'warn'}`}>
                  {isCorrect ? '✓ Benar. ' : '✕ Belum tepat. '}
                  {q.explanation}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {!submitted ? (
        <button className="btn-primary" disabled={!allAnswered} onClick={handleSubmit}>
          Periksa Jawaban
        </button>
      ) : (
        <div className="quiz-result-bar">
          <p>
            Skor: <strong>{correctCount}</strong> / {frame.questions.length}
          </p>
          <button className="btn-primary" onClick={onDone}>
            Lanjutkan →
          </button>
        </div>
      )}
    </div>
  );
}
