import { useRef, useState } from 'react';
import type { VideoFrame } from '../../types/storyboard';
import { useProgress } from '../../context/ProgressContext';

export function VideoScene({ frame, onDone }: { frame: VideoFrame; onDone: () => void }) {
  const { setResult } = useProgress();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [answeredMarkers, setAnsweredMarkers] = useState<Set<string>>(new Set());
  const [activeMarker, setActiveMarker] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const firedMarkers = useRef<Set<string>>(new Set());
  const [finished, setFinished] = useState(false);

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    setCurrentTime(v.currentTime);
    const marker = frame.markers.find(
      (m) => !firedMarkers.current.has(m.id) && v.currentTime >= m.timeSec
    );
    if (marker) {
      firedMarkers.current.add(marker.id);
      v.pause();
      setActiveMarker(marker.id);
      setSelectedOption(null);
    }
  };

  const handleEnded = () => {
    setFinished(true);
    const correct = answeredMarkers.size; // each answered marker counted correct-enough for demo
    setResult({
      frameId: frame.id,
      completed: true,
      correct,
      total: frame.markers.length,
    });
  };

  const currentMarker = frame.markers.find((m) => m.id === activeMarker);

  const handleAnswer = (optIndex: number) => {
    setSelectedOption(optIndex);
  };

  const handleContinueVideo = () => {
    if (currentMarker) {
      setAnsweredMarkers((prev) => new Set(prev).add(currentMarker.id));
    }
    setActiveMarker(null);
    videoRef.current?.play();
  };

  const progressPct = duration ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className="scene video-scene">
      <header className="scene-header">
        <span className="panel-tag">Panel {frame.panel} · Interactive Video</span>
        <h2>{frame.title}</h2>
      </header>

      <div className="video-wrap">
        <video
          ref={videoRef}
          src={frame.src}
          poster={frame.poster}
          controls={!currentMarker}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onEnded={handleEnded}
        />
        <div className="video-scrubber">
          <div className="video-scrubber-fill" style={{ width: `${progressPct}%` }} />
          {frame.markers.map((m) => (
            <span
              key={m.id}
              className={`video-marker-dot ${answeredMarkers.has(m.id) ? 'is-done' : ''}`}
              style={{ left: `${duration ? (m.timeSec / duration) * 100 : 0}%` }}
              title={`Pertanyaan pada ${m.timeSec}s`}
            />
          ))}
        </div>

        {currentMarker && (
          <div className="video-overlay">
            <div className="video-overlay-card">
              <p className="video-overlay-tag">⏸ Video dijeda — jawab untuk melanjutkan</p>
              <p className="quiz-prompt">{currentMarker.question.prompt}</p>
              <div className="quiz-options">
                {currentMarker.question.options.map((opt, oi) => {
                  const isSelected = selectedOption === oi;
                  const isCorrect = oi === currentMarker.question.correctIndex;
                  let stateClass = '';
                  if (selectedOption !== null) {
                    if (isSelected) stateClass = isCorrect ? 'is-correct' : 'is-wrong';
                    else if (isCorrect) stateClass = 'is-correct-reveal';
                  }
                  return (
                    <button
                      key={oi}
                      type="button"
                      className={`quiz-option ${isSelected ? 'is-selected' : ''} ${stateClass}`}
                      onClick={() => handleAnswer(oi)}
                      disabled={selectedOption !== null}
                    >
                      <span className="quiz-option-letter">{String.fromCharCode(65 + oi)}</span>
                      <span className="quiz-option-text">{opt}</span>
                      {selectedOption !== null && isSelected && (
                        <span className="quiz-option-symbol" aria-hidden>
                          {isCorrect ? '✓' : '✕'}
                        </span>
                      )}
                      {selectedOption !== null && !isSelected && isCorrect && (
                        <span className="quiz-option-symbol" aria-hidden>
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {selectedOption !== null && (
                <>
                  <p className="quiz-explanation ok">{currentMarker.question.explanation}</p>
                  <button className="btn-primary" onClick={handleContinueVideo}>
                    Lanjutkan Video ▶
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {finished && (
        <div className="quiz-result-bar">
          <p>
            Pertanyaan terjawab: <strong>{answeredMarkers.size}</strong> / {frame.markers.length}
          </p>
          <button className="btn-primary" onClick={onDone}>
            Lanjutkan →
          </button>
        </div>
      )}
    </div>
  );
}
