import { useState } from 'react';
import type { PdfFrame } from '../../types/storyboard';
import { useProgress } from '../../context/ProgressContext';

export function PdfScene({ frame, onDone }: { frame: PdfFrame; onDone: () => void }) {
  const { setResult } = useProgress();
  const [loadFailed, setLoadFailed] = useState(false);

  const handleContinue = () => {
    setResult({ frameId: frame.id, completed: true, correct: 1, total: 1 });
    onDone();
  };

  return (
    <div className="scene pdf-scene">
      <header className="scene-header">
        <span className="panel-tag">Panel {frame.panel} · Dokumen</span>
        <h2>{frame.title}</h2>
        <p className="scene-instructions">{frame.description}</p>
      </header>

      <div className="pdf-frame-wrap">
        {!loadFailed ? (
          <iframe
            src={frame.src}
            title={frame.title}
            className="pdf-frame"
            onError={() => setLoadFailed(true)}
          />
        ) : (
          <div className="pdf-frame-fallback">
            <p>Pratinjau tidak dapat dimuat di perangkat ini.</p>
          </div>
        )}
      </div>

      <div className="pdf-actions">
        <a href={frame.src} target="_blank" rel="noopener noreferrer" className="btn-secondary">
          Buka di tab baru ↗
        </a>
        <a href={frame.src} download className="btn-secondary">
          Unduh PDF ⬇
        </a>
      </div>

      <button className="btn-primary" onClick={handleContinue}>
        Sudah membaca, lanjutkan →
      </button>
    </div>
  );
}
