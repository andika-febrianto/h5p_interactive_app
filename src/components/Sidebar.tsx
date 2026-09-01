import type { Frame } from '../types/storyboard';
import { useProgress } from '../context/ProgressContext';

const KIND_ICON: Record<Frame['kind'], string> = {
  text: '📄',
  quiz: '❓',
  dragdrop: '🧩',
  video: '🎬',
  pdf: '📕',
  shortanswer: '✏️',
};

const KIND_LABEL: Record<Frame['kind'], string> = {
  text: 'Materi',
  quiz: 'Kuis',
  dragdrop: 'Drag & Drop',
  video: 'Video Interaktif',
  pdf: 'Dokumen PDF',
  shortanswer: 'Isian Singkat',
};

export function Sidebar({
  frames,
  moduleTitle,
  subjectName,
  grade,
  semester,
  userName,
  onJump,
  onExit,
}: {
  frames: Frame[];
  moduleTitle: string;
  subjectName?: string;
  grade?: number;
  semester?: number;
  userName?: string;
  onJump: (i: number) => void;
  onExit: () => void;
}) {
  const { results, currentIndex, furthestIndex } = useProgress();
  const doneCount = Object.values(results).filter((r) => r.completed).length;

  return (
    <aside className="sidebar">
      <button type="button" className="sidebar-exit" onClick={onExit}>
        ← Semua modul
      </button>

      <div className="sidebar-brand">
        <span className="sidebar-brand-mark" aria-hidden />
        <div>
          <p className="sidebar-eyebrow">Modul Interaktif</p>
          <h1 className="sidebar-title">{moduleTitle}</h1>
        </div>
      </div>

      <div className="sidebar-info">
        {subjectName && (
          <div className="sidebar-info-row">
            <span className="sidebar-info-label">Mapel</span>
            <span className="sidebar-info-value">{subjectName}</span>
          </div>
        )}
        {grade && (
          <div className="sidebar-info-row">
            <span className="sidebar-info-label">Kelas</span>
            <span className="sidebar-info-value">Kelas {grade}</span>
          </div>
        )}
        {semester && (
          <div className="sidebar-info-row">
            <span className="sidebar-info-label">Semester</span>
            <span className="sidebar-info-value">Semester {semester}</span>
          </div>
        )}
        {userName && (
          <div className="sidebar-info-row">
            <span className="sidebar-info-label">Murid</span>
            <span className="sidebar-info-value">{userName}</span>
          </div>
        )}
      </div>

      <div className="sidebar-progress">
        <div className="sidebar-progress-track">
          <div
            className="sidebar-progress-fill"
            style={{ width: `${(doneCount / frames.length) * 100}%` }}
          />
        </div>
        <p className="sidebar-progress-label">
          {doneCount} / {frames.length} panel selesai
        </p>
      </div>

      <nav className="sidebar-nav">
        {frames.map((frame, i) => {
          const result = results[frame.id];
          const isActive = i === currentIndex;
          // A panel is reachable once the learner has reached it before (i <= furthestIndex),
          // or it's the very next panel to unlock (i === furthestIndex).
          const isLocked = i > furthestIndex;
          return (
            <button
              key={frame.id}
              type="button"
              className={`sidebar-item ${isActive ? 'is-active' : ''} ${result?.completed ? 'is-done' : ''}`}
              onClick={() => onJump(i)}
              disabled={isLocked}
              aria-current={isActive ? 'step' : undefined}
            >
              <span className="sidebar-item-panel">{frame.panel}</span>
              <span className="sidebar-item-icon">{KIND_ICON[frame.kind]}</span>
              <span className="sidebar-item-text">
                <span className="sidebar-item-title">{frame.title}</span>
                <span className="sidebar-item-kind">{KIND_LABEL[frame.kind]}</span>
              </span>
              {result?.completed && <span className="sidebar-item-check">✓</span>}
              {isLocked && <span className="sidebar-item-lock" aria-hidden>🔒</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
