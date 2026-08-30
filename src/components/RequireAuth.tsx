import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="home-page">
        <div className="home-inner">
          <p className="home-empty">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="home-page">
        <div className="home-inner auth-form-page">
          <p className="home-eyebrow"><span>📚</span> Perpustakaan Belajar</p>
          <h1 className="home-title">Masuk dulu, yuk</h1>
          <p className="home-lede">
            Masuk atau daftar sebagai guru atau murid untuk mulai memilih kelas dan modul belajar.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="button" className="btn-primary" onClick={() => navigate('/masuk')}>
              Masuk
            </button>
            <button type="button" className="btn-secondary" onClick={() => navigate('/daftar')}>
              Daftar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
