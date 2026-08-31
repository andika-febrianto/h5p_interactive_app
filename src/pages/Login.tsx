import { useState } from 'react';
import TopBar from '../components/TopBar';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const loggedInUser = await login(email, password);
      // Students go directly to their class/semester after login
      if (loggedInUser.role === 'STUDENT' && loggedInUser.grade && loggedInUser.semester) {
        navigate(`/kelas/${loggedInUser.grade}/semester/${loggedInUser.semester}`);
      } else {
        navigate('/kelas');
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal masuk. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="home-page">
      <div className="home-inner auth-form-page">
        <TopBar />
        <h1 className="home-title">Masuk</h1>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="operator@sekolah.id"
              autoComplete="email"
            />
          </label>
          <label className="auth-field">
            <span>Kata Sandi</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button className="btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <p className="auth-switch">
          Belum punya akun? <Link to="/daftar">Daftar di sini</Link>
        </p>

        <div className="auth-demo-hint">
          <p className="auth-demo-hint-title">🔑 Akun demo (setelah backend di-seed):</p>
          <p><strong>👩‍🏫 Operator:</strong> operator@sekolah.id / operator12345</p>
          <p><strong>🧑‍🎓 Murid:</strong> murid@sekolah.id / murid12345</p>
        </div>
      </div>
    </div>
  );
}
