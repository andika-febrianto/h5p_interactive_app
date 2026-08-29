import { useEffect, useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { grades, semesters } from '../data/grades';
import { fetchSubjects, fetchModules, type ModuleSummary, ApiError } from '../lib/api';
import type { Subject } from '../types/storyboard';
import { AuthBar } from '../components/AuthBar';

export default function SubjectSelect() {
  const { grade: gradeParam, semester: semesterParam } = useParams<{
    grade: string;
    semester: string;
  }>();
  const navigate = useNavigate();

  const grade = grades.find((g) => String(g.level) === gradeParam);
  const semester = semesters.find((s) => String(s.value) === semesterParam);

  const [subjects, setSubjects] = useState<Subject[] | null>(null);
  const [modules, setModules] = useState<ModuleSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubjects()
      .then(setSubjects)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Gagal memuat data.'));
  }, []);

  useEffect(() => {
    if (!grade || !semester) return;
    setModules(null);
    fetchModules({ grade: grade.level, semester: semester.value })
      .then(setModules)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Gagal memuat data.'));
  }, [grade, semester]);

  if (!grade || !semester) {
    return <Navigate to="/kelas" replace />;
  }

  const countForSubject = (subjectId: string) =>
    modules?.filter((m) => m.subjectId === subjectId).length ?? 0;

  return (
    <div className="home-page">
      <div className="home-inner">
        <AuthBar />
        <button
          type="button"
          className="home-back"
          onClick={() => navigate(`/kelas/${grade.level}`)}
        >
          ← Ganti semester
        </button>

        <p className="home-eyebrow">
          {grade.label} · {semester.label}
        </p>
        <h1 className="home-title">Pilih mata pelajaran</h1>
        <p className="home-lede">
          Pilih mata pelajaran untuk melihat modul belajar interaktif pada {grade.label.toLowerCase()},{' '}
          {semester.label.toLowerCase()}.
        </p>

        {error && <p className="home-empty">{error}</p>}

        <div className="home-grid">
          {(subjects ?? []).map((subject) => {
            const count = countForSubject(subject.id);
            const disabled = modules !== null && count === 0;
            return (
              <button
                key={subject.id}
                type="button"
                className={`subject-card ${disabled ? 'is-disabled' : ''}`}
                disabled={disabled}
                onClick={() =>
                  navigate(`/kelas/${grade.level}/semester/${semester.value}/mapel/${subject.id}`)
                }
              >
                <span className="module-card-bar" style={{ background: subject.accent }} />
                <span
                  className="subject-card-icon"
                  style={{ background: `${subject.accent}22`, color: subject.accent }}
                >
                  {subject.icon}
                </span>
                <h2 className="module-card-title">{subject.shortName}</h2>
                <p className="module-card-summary">{subject.description}</p>
                <div className="module-card-footer">
                  <span className="module-card-progress">
                    {modules === null ? '...' : count > 0 ? `${count} modul tersedia` : 'Segera hadir'}
                  </span>
                  {!disabled && (
                    <span className="module-card-cta" style={{ color: subject.accent }}>
                      Lihat modul →
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
