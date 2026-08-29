import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchMySubscription } from '../lib/api';

export function AuthBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    // Teachers aren't gated by trial/subscription status (see backend
    // README) — only show the warning for students, who actually lose
    // access to module content once their trial/plan lapses.
    if (!user || user.role !== 'STUDENT') {
      setExpired(false);
      return;
    }
    fetchMySubscription()
      .then((sub) => setExpired(sub.isExpired))
      .catch(() => setExpired(false));
  }, [user]);

  if (!user) {
    return (
      <div className="auth-bar">
        <button type="button" className="auth-bar-link" onClick={() => navigate('/masuk')}>
          Masuk
        </button>
        <span className="auth-bar-sep">·</span>
        <button type="button" className="auth-bar-link" onClick={() => navigate('/daftar')}>
          Daftar
        </button>
      </div>
    );
  }

  return (
    <>
      {expired && (
        <div className="auth-bar-warning">
          Masa aktif langganan Anda sudah berakhir.{' '}
          <button type="button" className="auth-bar-warning-link" onClick={() => navigate('/harga')}>
            Lihat paket langganan →
          </button>
        </div>
      )}
      <div className="auth-bar">
        <span className="auth-bar-user">
          {user.name} <span className="auth-bar-role">({user.role === 'TEACHER' ? 'Guru' : 'Murid'})</span>
        </span>
        {user.role === 'TEACHER' && (
          <>
            <span className="auth-bar-sep">·</span>
            <button type="button" className="auth-bar-link" onClick={() => navigate('/guru')}>
              Kelola Konten
            </button>
            <span className="auth-bar-sep">·</span>
            <button type="button" className="auth-bar-link" onClick={() => navigate('/guru/laporan')}>
              Laporan Murid
            </button>
          </>
        )}
        <span className="auth-bar-sep">·</span>
        <button type="button" className="auth-bar-link" onClick={() => navigate('/akun/langganan')}>
          Langganan
        </button>
        <span className="auth-bar-sep">·</span>
        <button type="button" className="auth-bar-link" onClick={() => navigate('/akun/sesi')}>
          Kelola Sesi
        </button>
        <span className="auth-bar-sep">·</span>
        <button
          type="button"
          className="auth-bar-link"
          onClick={async () => {
            await logout();
            navigate('/');
          }}
        >
          Keluar
        </button>
      </div>
    </>
  );
}
