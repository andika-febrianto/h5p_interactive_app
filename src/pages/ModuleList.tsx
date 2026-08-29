import { useEffect, useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { grades, semesters } from '../data/grades';
import { fetchSubject, fetchModules, fetchProgressSummary, type ModuleSummary, ApiError } from '../lib/api';
import type { Subject } from '../types/storyboard';
import { getClientId } from '../lib/clientId';
import { AuthBar } from '../components/AuthBar';

const KIND_ICON: Record<string, string> = {
  text: '📄',
  quiz: '❓',
  dragdrop: '🧩',
  video: '🎬',
  pdf: '📕',
  shortanswer: '✏️',
};

export default function ModuleList() {
  const { grade: gradeParam, semester: semesterParam, subjectId } = useParams<{
    grade: string;
    semester: string;
    subjectId: string;
  }>();
  const navigate = useNavigate();

  const grade = grades.find((g) => String(g.level) === gradeParam);
  const semester = semesters.find((s) => String(s.value) === semesterParam);

  const [subject, setSubject] = useState<Subject | null>(null);
  const [modules, setModules] = useState<ModuleSummary[] | null>(null);
  const [progressSummary, setProgressSummary] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!grade || !semester || !subjectId) return;
    setModules(null);
    setError(null);

    fetchSubject(subjectId)
      .then(setSubject)
      .catch(() => setNotFound(true));

    fetchModules({ grade: grade.level, semester: semester.value, subjectId })
      .then(setModules)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Gagal memuat data.'));

    const clientId = getClientId();
    fetchProgressSummary(clientId)
      .then(setProgressSummary)
      .catch(() => {
        // Non-fatal — module cards just won't show a completed count yet.
      });
  }, [grade, semester, subjectId]);

  if (!grade || !semester || notFound) {
    return <Navigate to="/kelas" replace />;
  }

  return (
    <div className="home-page">
      <div className="home-inner">
        <AuthBar />
        <button
          type="button"
          className="home-back"
          onClick={() => navigate(`/kelas/${grade.level}/semester/${semester.value}`)}
        >
          ← Ganti mata pelajaran
        </button>

        <p className="home-eyebrow">
          {grade.label} · {semester.label} {subject ? `· ${subject.icon} ${subject.shortName}` : ''}
        </p>
        <h1 className="home-title">Pilih modul belajar</h1>
        {subject && <p className="home-lede">{subject.description}</p>}

        {error && <p className="home-empty">{error}</p>}

        {modules === null ? (
          <p className="home-empty">Memuat modul...</p>
        ) : modules.length === 0 ? (
          <p className="home-empty">
            Belum ada modul {subject?.shortName ?? ''} untuk {grade.label.toLowerCase()},{' '}
            {semester.label.toLowerCase()}.
          </p>
        ) : (
          <div className="home-grid">
            {modules.map((mod) => {
              const done = progressSummary[mod.id] ?? 0;
              const total = mod.frameCount;
              return (
                <button
                  key={mod.id}
                  type="button"
                  className="module-card"
                  onClick={() => navigate(`/modul/${mod.id}`)}
                >
                  <span className="module-card-bar" style={{ background: mod.accent }} />
                  <div className="module-card-top">
                    <span
                      className="module-card-icon"
                      style={{ background: `${mod.accent}22`, color: mod.accent }}
                    >
                      {KIND_ICON[mod.firstFrameKind]}
                    </span>
                    <span className="module-card-time">{mod.estimatedMinutes}</span>
                  </div>
                  <h2 className="module-card-title">{mod.title}</h2>
                  <p className="module-card-summary" dangerouslySetInnerHTML={{ __html: mod.summary }} />
                  <div className="module-card-footer">
                    <span className="module-card-progress">
                      {done > 0 ? `${done}/${total} panel selesai` : `${total} panel`}
                    </span>
                    <span className="module-card-cta" style={{ color: mod.accent }}>
                      {done > 0 ? (done === total ? 'Ulangi →' : 'Lanjutkan →') : 'Mulai →'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
