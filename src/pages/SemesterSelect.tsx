import { useEffect, useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { grades, semesters } from '../data/grades';
import { fetchModules, type ModuleSummary, ApiError } from '../lib/api';
import { AuthBar } from '../components/AuthBar';

export default function SemesterSelect() {
  const { grade: gradeParam } = useParams<{ grade: string }>();
  const navigate = useNavigate();
  const grade = grades.find((g) => String(g.level) === gradeParam);

  const [modules, setModules] = useState<ModuleSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!grade) return;
    setModules(null);
    fetchModules({ grade: grade.level })
      .then(setModules)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Gagal memuat data.'));
  }, [grade]);

  if (!grade) {
    return <Navigate to="/kelas" replace />;
  }

  const countBySemester = (value: number) => modules?.filter((m) => m.semester === value).length ?? 0;

  return (
    <div className="home-page">
      <div className="home-inner">
        <AuthBar />
        <button type="button" className="home-back" onClick={() => navigate('/kelas')}>
          ← Semua kelas
        </button>

        <p className="home-eyebrow">{grade.label}</p>
        <h1 className="home-title">Pilih semester</h1>
        <p className="home-lede">Pilih semester untuk melihat mata pelajaran yang tersedia.</p>

        {error && <p className="home-empty">{error}</p>}

        <div className="semester-grid">
          {semesters.map((sem) => {
            const count = countBySemester(sem.value);
            return (
              <button
                key={sem.value}
                type="button"
                className="semester-card"
                onClick={() => navigate(`/kelas/${grade.level}/semester/${sem.value}`)}
              >
                <span className="semester-card-num">{sem.value}</span>
                <div className="semester-card-text">
                  <span className="semester-card-label">{sem.label}</span>
                  <span className="semester-card-hint">{sem.hint}</span>
                </div>
                <span className="semester-card-count">
                  {modules === null ? '...' : count > 0 ? `${count} modul` : 'Segera hadir'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
