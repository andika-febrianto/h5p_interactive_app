import { useState } from 'react';
import type { ShortAnswerFrame } from '../../types/storyboard';
import { useProgress } from '../../context/ProgressContext';

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function isCorrect(userInput: string, accepted: string[], inputType: 'text' | 'number'): boolean {
  const cleanedInput = userInput.trim();
  if (cleanedInput === '') return false;

  if (inputType === 'number') {
    const userNum = Number(cleanedInput.replace(',', '.'));
    if (Number.isNaN(userNum)) return false;
    return accepted.some((a) => Number(a.replace(',', '.')) === userNum);
  }

  const normalizedInput = normalize(cleanedInput);
  return accepted.some((a) => normalize(a) === normalizedInput);
}

export function ShortAnswerScene({
  frame,
  onDone,
}: {
  frame: ShortAnswerFrame;
  onDone: () => void;
}) {
  const { setResult } = useProgress();
  const [answers, setAnswers] = useState<Record<string, string>>(
    Object.fromEntries(frame.items.map((it) => [it.id, '']))
  );
  const [submitted, setSubmitted] = useState(false);

  const allFilled = frame.items.every((it) => answers[it.id].trim() !== '');
  const correctCount = frame.items.filter((it) =>
    isCorrect(answers[it.id], it.acceptedAnswers, it.inputType ?? 'text')
  ).length;

  const handleChange = (itemId: string, value: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [itemId]: value }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
    setResult({
      frameId: frame.id,
      completed: true,
      correct: correctCount,
      total: frame.items.length,
    });
  };

  return (
    <div className="scene shortanswer-scene">
      <header className="scene-header">
        <span className="panel-tag">Panel {frame.panel} · Isian Singkat</span>
        <h2>{frame.title}</h2>
        <p className="scene-instructions">{frame.instructions}</p>
      </header>

      <div className="shortanswer-list">
        {frame.items.map((item, i) => {
          const value = answers[item.id];
          const correct = submitted && isCorrect(value, item.acceptedAnswers, item.inputType ?? 'text');
          const wrong = submitted && !correct;
          return (
            <div className="shortanswer-card" key={item.id}>
              <p className="quiz-prompt">
                <span className="quiz-index">{i + 1}</span> {item.prompt}
              </p>
              <div className="shortanswer-input-row">
                <input
                  type={item.inputType === 'number' ? 'text' : 'text'}
                  inputMode={item.inputType === 'number' ? 'numeric' : 'text'}
                  className={`shortanswer-input ${correct ? 'is-correct' : ''} ${wrong ? 'is-wrong' : ''}`}
                  value={value}
                  onChange={(e) => handleChange(item.id, e.target.value)}
                  disabled={submitted}
                  placeholder={item.inputType === 'number' ? 'Ketik angka...' : 'Ketik jawaban...'}
                  aria-label={item.prompt}
                />
                {submitted && (
                  <span
                    className={`shortanswer-symbol ${correct ? 'is-correct' : 'is-wrong'}`}
                    aria-hidden
                  >
                    {correct ? '✓' : '✕'}
                  </span>
                )}
              </div>
              {submitted && (
                <p className={`quiz-explanation ${correct ? 'ok' : 'warn'}`}>
                  {correct
                    ? '✓ Benar. '
                    : `✕ Jawaban yang tepat: ${item.acceptedAnswers[0]}. `}
                  {item.explanation}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {!submitted ? (
        <button className="btn-primary" disabled={!allFilled} onClick={handleSubmit}>
          Periksa Jawaban
        </button>
      ) : (
        <div className="quiz-result-bar">
          <p>
            Skor: <strong>{correctCount}</strong> / {frame.items.length}
          </p>
          <button className="btn-primary" onClick={onDone}>
            Lanjutkan →
          </button>
        </div>
      )}
    </div>
  );
}
