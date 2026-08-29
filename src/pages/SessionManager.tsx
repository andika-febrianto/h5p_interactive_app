import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchSessions, revokeSession, ApiError, type SessionInfo } from '../lib/api';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function describeDevice(userAgent: string | null): string {
  if (!userAgent) return 'Perangkat tidak diketahui';
  if (/iphone|ipad/i.test(userAgent)) return 'iPhone/iPad';
  if (/android/i.test(userAgent)) return 'Android';
  if (/mac os/i.test(userAgent)) return 'Mac';
  if (/windows/i.test(userAgent)) return 'Windows';
  return userAgent.length > 60 ? userAgent.slice(0, 60) + '…' : userAgent;
}

export default function SessionManager() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionInfo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const load = () => {
    fetchSessions()
      .then(setSessions)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Gagal memuat sesi.'));
  };

  useEffect(() => {
    if (authLoading || !user) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  const handleRevoke = async (id: string, isCurrent: boolean) => {
    if (
      !confirm(
        isCurrent
          ? 'Ini sesi yang sedang Anda pakai. Mencabutnya akan membuat Anda perlu masuk lagi nanti. Lanjutkan?'
          : 'Cabut sesi ini? Perangkat itu akan diminta masuk ulang.'
      )
    )
      return;
    setRevokingId(id);
    setError(null);
    try {
      await revokeSession(id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal mencabut sesi.');
    } finally {
      setRevokingId(null);
    }
  };

  if (authLoading) {
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
        <div className="home-inner">
          <p className="home-empty">Masuk dulu untuk mengelola sesi Anda.</p>
          <button type="button" className="btn-secondary" onClick={() => navigate('/masuk')}>
            Masuk
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

        <p className="home-eyebrow">{user.name}</p>
        <h1 className="home-title">Kelola Sesi Login</h1>
        <p className="home-lede">
          Daftar perangkat/browser yang sedang masuk ke akun Anda. Cabut sesi yang tidak Anda
          kenali atau perangkat yang hilang — sesi itu akan diminta masuk ulang.
        </p>

        {error && <p className="auth-error" style={{ maxWidth: 560 }}>{error}</p>}

        {sessions === null ? (
          <p className="home-empty">Memuat...</p>
        ) : (
          <div className="report-table-wrap">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Perangkat</th>
                  <th>Masuk sejak</th>
                  <th>Berlaku sampai</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id}>
                    <td>
                      {describeDevice(s.userAgent)}
                      {s.current && <span className="session-current-badge">Sesi ini</span>}
                    </td>
                    <td>{formatDate(s.createdAt)}</td>
                    <td>{formatDate(s.expiresAt)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn-secondary btn-small"
                        onClick={() => handleRevoke(s.id, s.current)}
                        disabled={revokingId === s.id}
                      >
                        {revokingId === s.id ? 'Mencabut...' : 'Cabut'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
