import { useState } from 'react';
import TopBar from '../components/TopBar';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(name, email, password, 'PARENT');
      navigate('/orangtua');
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Gagal mendaftar. Coba lagi.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className='home-page'>
      <div className='home-inner auth-form-page'>
        <TopBar />
        <h1 className='home-title'>Daftar Akun Orang Tua</h1>

        <form className='auth-form' onSubmit={handleSubmit}>
          <label className='auth-field'>
            <span>Nama Lengkap *</span>
            <input
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder='Nama lengkap orang tua'
              autoComplete='name'
            />
          </label>

          <label className='auth-field'>
            <span>Email</span>
            <input
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder='nama@sekolah.id'
              autoComplete='email'
            />
          </label>
          <label className='auth-field'>
            <span>Kata Sandi*</span>
            <input
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder='Minimal 6 karakter'
              autoComplete='new-password'
            />
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button className='btn-primary' type='submit' disabled={submitting}>
            {submitting ? 'Memproses...' : 'Daftar'}
          </button>
        </form>

        <p className='auth-switch'>
          Sudah punya akun? <Link to='/masuk'>Masuk di sini</Link>
        </p>
      </div>
    </div>
  );
}
