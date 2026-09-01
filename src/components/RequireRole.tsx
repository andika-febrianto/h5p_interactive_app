import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types/storyboard';

export function RequireRole({ role, children }: { role: UserRole; children: ReactNode }) {
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

  if (!user || user.role !== role) {
    return (
      <div className="home-page">
        <div className="home-inner">
          <p className="home-empty">
            Halaman ini hanya untuk akun {role === 'TEACHER' ? 'Operator' : role === 'PARENT' ? 'Orang Tua' : 'Murid'}.
          </p>
          <button type="button" className="btn-secondary" onClick={() => navigate('/masuk')}>
            Masuk
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
