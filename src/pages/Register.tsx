import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../lib/api'
import type { UserRole } from '../types/storyboard'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('STUDENT')
  const [kelas, setKelas] = useState<number>(1)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [semester, setSemester] = useState<number>(1)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await register(name, email, password, role, kelas, semester)
      // navigate('/kelas')
      navigate(`/kelas/${kelas}/semester/${semester}`)
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Gagal mendaftar. Coba lagi.',
      )
    } finally {
      setSubmitting(false)
    }
  }

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
          {role === 'STUDENT'}
          {
            <>
              <label className='auth-field'>
                <span>Kelas*</span>
                <select
                  className='auth-field'
                  onChange={(e) => setKelas(e.target.value)}
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option value={n}>{n}</option>
                  ))}
                </select>
              </label>
              <label className='auth-field'>
                <span>Semester*</span>

                <div className='flex gap-4'>
                  {[1, 2].map((n) => (
                    <label key={n} className='flex items-center gap-4'>
                      <input
                        type='radio'
                        name='semester'
                        value={n}
                        checked={semester === n}
                        onChange={() => setSemester(n)}
                      />

                      <span>Semester {n}</span>
                    </label>
                  ))}
                </div>
              </label>
            </>
          }
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

          {/* <fieldset className='auth-role-field'>
            <legend>Daftar sebagai</legend>
            <label className='auth-role-option'>
              <input
                type='radio'
                name='role'
                checked={role === 'STUDENT'}
                onChange={() => setRole('STUDENT')}
              />
              Murid
            </label>
            <label className='auth-role-option'>
              <input
                type='radio'
                name='role'
                checked={role === 'TEACHER'}
                onChange={() => setRole('TEACHER')}
              />
              Guru
            </label>
          </fieldset> */}

          {error && <p className='auth-error'>{error}</p>}

          <button className='btn-primary' type='submit' disabled={submitting}>
            {submitting ? 'Memproses...' : 'Daftar'}
          </button>
        </form>

        <p className='auth-switch'>
          Sudah punya akun? <Link to='/masuk'>Masuk di sini</Link>
        </p>
      </div>
    </div>
  )
}
