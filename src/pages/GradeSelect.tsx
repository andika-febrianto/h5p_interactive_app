import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { grades } from '../data/grades';
import { fetchModules, type ModuleSummary, ApiError } from '../lib/api';
import { AuthBar } from '../components/AuthBar';

export default function GradeSelect() {
  const navigate = useNavigate();
  const [modules, setModules] = useState<ModuleSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchModules({})
      .then(setModules)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Gagal memuat data.'));
  }, []);

  const countByGrade = (level: number) => modules?.filter((m) => m.grade === level).length ?? 0;

  return (
    <div className="home-page">
      <div className="home-inner">
        <AuthBar />
        <p className="home-eyebrow"><span>📚</span> Perpustakaan Belajar</p>
        <h1 className="home-title">Pilih kelas</h1>
        <p className="home-lede">
          Mulai dengan memilih kelas, lalu semester dan mata pelajaran, untuk
          menemukan modul belajar interaktif yang sesuai.
        </p>

        {error && <p className="home-empty">{error}</p>}

        <div className="grade-grid">
          {grades.map((grade) => {
            const count = countByGrade(grade.level);
            return (
              <button
                key={grade.level}
                type="button"
                className="grade-card"
                onClick={() => navigate(`/kelas/${grade.level}`)}
              >
                <span className="grade-card-badge">{grade.level}</span>
                <span className="grade-card-label">{grade.label}</span>
                <span className="grade-card-count">
                  {modules === null
                    ? '...'
                    : count > 0
                      ? `${count} modul tersedia`
                      : 'Segera hadir'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
