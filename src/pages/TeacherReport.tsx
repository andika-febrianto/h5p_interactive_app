import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchStudentOverview, fetchMySubscription, ApiError, type StudentOverviewRow } from '../lib/api';

export default function TeacherReport() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<StudentOverviewRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'TEACHER') return;
    fetchStudentOverview()
      .then(setRows)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Gagal memuat laporan.'));
    fetchMySubscription()
      .then((sub) => setIsPro(sub.planId === 'pro' && sub.status === 'ACTIVE'))
      .catch(() => setIsPro(false));
  }, [user, authLoading]);

  if (authLoading) {
    return (
      <div className="home-page">
        <div className="home-inner">
          <p className="home-empty">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'TEACHER') {
    return (
      <div className="home-page">
        <div className="home-inner">
          <p className="home-empty">Halaman ini hanya untuk akun Operator.</p>
          <button type="button" className="btn-secondary" onClick={() => navigate('/masuk')}>
            Masuk sebagai Operator
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="home-inner">
        <button type="button" className="home-back" onClick={() => navigate('/kelas')}>
          ← Kembali
        </button>

        <p className="home-eyebrow">Operator · {user.name}</p>
        <h1 className="home-title">Laporan Progres Murid</h1>
        <p className="home-lede">
          Rekap otomatis dari seluruh aktivitas murid yang login — panel selesai dan skor
          gabungan lintas semua modul.
        </p>

        {error && <p className="home-empty">{error}</p>}

        {rows === null ? (
          <p className="home-empty">Memuat laporan...</p>
        ) : rows.length === 0 ? (
          <p className="home-empty">Belum ada murid yang mendaftar.</p>
        ) : (
          <div className="report-table-wrap">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Email</th>
                  <th>Modul Disentuh</th>
                  <th>Panel Selesai</th>
                  <th>Skor</th>
                  <th>Akurasi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.name}</td>
                    <td>{r.email}</td>
                    <td>{r.modulesTouched}</td>
                    <td>{r.framesCompleted}</td>
                    <td>
                      {r.correct}/{r.total}
                    </td>
                    <td>{r.accuracyPct !== null ? `${r.accuracyPct}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <h2 className="frame-section-title">📈 Analytics</h2>
        {isPro ? (
          rows && rows.length > 0 ? (
            <div className="analytics-grid">
              <div className="analytics-card">
                <span className="analytics-card-value">{rows.length}</span>
                <span className="analytics-card-label">Murid Terdaftar</span>
              </div>
              <div className="analytics-card">
                <span className="analytics-card-value">
                  {rows.reduce((sum, r) => sum + r.framesCompleted, 0)}
                </span>
                <span className="analytics-card-label">Total Panel Selesai</span>
              </div>
              <div className="analytics-card">
                <span className="analytics-card-value">
                  {(() => {
                    const withScore = rows.filter((r) => r.accuracyPct !== null);
                    if (withScore.length === 0) return '—';
                    const avg = withScore.reduce((s, r) => s + (r.accuracyPct ?? 0), 0) / withScore.length;
                    return `${Math.round(avg)}%`;
                  })()}
                </span>
                <span className="analytics-card-label">Rata-rata Akurasi</span>
              </div>
              <div className="analytics-card">
                <span className="analytics-card-value">
                  {[...rows].sort((a, b) => (b.accuracyPct ?? 0) - (a.accuracyPct ?? 0))[0]?.name ?? '—'}
                </span>
                <span className="analytics-card-label">Murid Terbaik</span>
              </div>
            </div>
          ) : (
            <p className="home-empty">Belum ada data untuk dianalisis.</p>
          )
        ) : (
          <div className="analytics-upsell">
            <p>
              Fitur <strong>Analytics</strong> — rata-rata akurasi, murid terbaik, dan tren belajar —
              tersedia khusus paket <strong>Pro</strong>.
            </p>
            <button type="button" className="btn-primary" onClick={() => navigate('/harga')}>
              Upgrade ke Pro →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
