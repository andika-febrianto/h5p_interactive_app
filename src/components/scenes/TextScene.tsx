import type { TextFrame } from '../../types/storyboard';
import { useProgress } from '../../context/ProgressContext';

export function TextScene({ frame, onDone }: { frame: TextFrame; onDone: () => void }) {
  const { setResult } = useProgress();

  const handleContinue = () => {
    setResult({ frameId: frame.id, completed: true, correct: 1, total: 1 });
    onDone();
  };

  return (
    <div className="scene text-scene">
      <header className="scene-header">
        <span className="panel-tag">Panel {frame.panel} · Materi</span>
        <h2>{frame.title}</h2>
      </header>
      {frame.imageUrl ? (
        <img className="text-scene-image" src={frame.imageUrl} alt={frame.imageAlt ?? ''} />
      ) : (
        frame.imageQuery && (
          <div className="text-scene-media" role="img" aria-label={frame.imageAlt}>
            <div className="text-scene-media-glow" />
          </div>
        )
      )}
      <div className="text-scene-body" dangerouslySetInnerHTML={{ __html: frame.body }} />
      <button className="btn-primary" onClick={handleContinue}>
        Lanjutkan →
      </button>
    </div>
  );
}
