import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';
import { grades, semesters } from '../data/grades';
import type { UserRole } from '../types/storyboard';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const role: UserRole = 'STUDENT';
  const [grade, setGrade] = useState<number>(1);
  const [semester, setSemester] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(name, email, password, role, role === 'STUDENT' ? grade : undefined, role === 'STUDENT' ? semester : undefined);
      navigate('/kelas');
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
        <p className='home-eyebrow'>Perpustakaan Belajar</p>
        <h1 className='home-title'>Daftar Akun</h1>

        <form className='auth-form' onSubmit={handleSubmit}>
          <label className='auth-field'>
            <span>Nama Lengkap Anak *</span>
            <input
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder='Nama lengkap'
              autoComplete='name'
            />
          </label>

          <label className='auth-field'>
            <span>Email (orang tua)</span>
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

          {role === 'STUDENT' && (
            <div className="auth-grade-semester">
              <label className="auth-field">
                <span>Kelas</span>
                <select
                  value={grade}
                  onChange={(e) => setGrade(Number(e.target.value))}
                  required
                >
                  {grades.map((g) => (
                    <option key={g.level} value={g.level}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="auth-field">
                <span>Semester</span>
                <select
                  value={semester}
                  onChange={(e) => setSemester(Number(e.target.value))}
                  required
                >
                  {semesters.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

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
