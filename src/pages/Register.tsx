import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../lib/api'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Kata sandi tidak cocok.')
      return
    }

    if (!agreed) {
      setError('Anda harus menyetujui Syarat & Ketentuan.')
      return
    }

    setSubmitting(true)
    try {
      await register(name, email, password, 'PARENT')
      navigate('/orangtua')
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Gagal mendaftar. Coba lagi.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={S.page}>
      <div style={S.card}>
        {/* Left Panel - Purple Gradient */}
        <div style={S.leftPanel}>
          <div style={S.leftContent}>
            {/* Logo */}
            <div style={S.logo}>
              <span style={S.logoIcon}>📘</span>
              <span style={S.logoText}>PerpustakaanBelajar</span>
            </div>

            {/* Title */}
            <h1 style={S.heroTitle}>
              Daftar Akun
              <br />
              Orang Tua
            </h1>

            {/* Description */}
            <p style={S.heroDesc}>
              Langkah pertama untuk memantau kemajuan belajar anak Anda.
              Buat akun dan mulai perjalanan belajar bersama.
            </p>

            {/* Feature Cards */}
            <div style={S.featureCards}>
              <div style={S.featureCard}>
                <span style={S.featureIcon}>👨‍👩‍👧</span>
                <div>
                  <p style={S.featureTitle}>Pantau Perkembangan Anak</p>
                  <p style={S.featureDesc}>Lihat aktivitas belajar dan hasil kuis anak secara real-time</p>
                </div>
              </div>
              <div style={S.featureCard}>
                <span style={S.featureIcon}>📋</span>
                <div>
                  <p style={S.featureTitle}>Tugaskan Modul Belajar</p>
                  <p style={S.featureDesc}>Pilih materi sesuai kebutuhan anak Anda</p>
                </div>
              </div>
            </div>

            {/* Social Proof */}
            <div style={S.socialProof}>
              <div style={S.avatarGroup}>
                <div style={{ ...S.avatar, background: '#6c5ce7', zIndex: 3 }}>A</div>
                <div style={{ ...S.avatar, background: '#fd79a8', zIndex: 2, marginLeft: -8 }}>B</div>
                <div style={{ ...S.avatar, background: '#00b894', zIndex: 1, marginLeft: -8 }}>C</div>
              </div>
              <span style={S.socialText}>
                Bergabunglah dengan <strong>5,000+</strong> pelajar hebat lainnya!
              </span>
            </div>
          </div>

          {/* Decorative Blobs */}
          <div style={S.blob1} />
          <div style={S.blob2} />
        </div>

        {/* Right Panel - Form */}
        <div style={S.rightPanel}>
          <div style={S.formWrapper}>
            <h2 style={S.formTitle}>Daftar Sekarang</h2>
            <p style={S.formSubtitle}>
              Buat akun untuk memulai memantau belajar anak Anda.
            </p>

            <form onSubmit={handleSubmit} style={S.form}>
              {/* Name Field */}
              <div style={S.fieldGroup}>
                <label style={S.label}>Nama Lengkap *</label>
                <div style={S.inputWrapper}>
                  <span style={S.inputIcon}>👤</span>
                  <input
                    type='text'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder='Masukkan nama lengkap Anda'
                    autoComplete='name'
                    style={S.input}
                  />
                </div>
              </div>

              {/* Email Field */}
              <div style={S.fieldGroup}>
                <label style={S.label}>Alamat Email *</label>
                <div style={S.inputWrapper}>
                  <span style={S.inputIcon}>✉️</span>
                  <input
                    type='email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder='nama@email.com'
                    autoComplete='email'
                    style={S.input}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div style={S.fieldGroup}>
                <label style={S.label}>Kata Sandi *</label>
                <div style={S.inputWrapper}>
                  <span style={S.inputIcon}>🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder='Minimal 6 karakter'
                    autoComplete='new-password'
                    style={S.input}
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    style={S.eyeBtn}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div style={S.fieldGroup}>
                <label style={S.label}>Konfirmasi Kata Sandi *</label>
                <div style={S.inputWrapper}>
                  <span style={S.inputIcon}>🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder='Ulangi kata sandi'
                    autoComplete='new-password'
                    style={S.input}
                  />
                </div>
              </div>

              {/* Terms Agreement */}
              <label style={S.checkboxLabel}>
                <input
                  type='checkbox'
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  style={S.checkbox}
                />
                <span style={S.checkboxText}>
                  Saya setuju dengan{' '}
                  <span style={S.linkText}>Syarat & Ketentuan</span>
                  {' '}serta{' '}
                  <span style={S.linkText}>Kebijakan Privasi</span>
                </span>
              </label>

              {/* Error */}
              {error && (
                <p style={S.errorMsg}>{error}</p>
              )}

              {/* Submit Button */}
              <button
                type='submit'
                disabled={submitting}
                style={{
                  ...S.submitBtn,
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? 'Memproses...' : 'Daftar Sekarang'}
              </button>
            </form>

            {/* Login Link */}
            <p style={S.switchText}>
              Sudah punya akun?{' '}
              <Link to='/masuk' style={S.switchLink}>
                Masuk di sini
              </Link>
            </p>

            {/* Security Badge */}
            <div style={S.securityBadge}>
              <span>🛡️ DATA TERENKRIPSI</span>
              <span style={{ margin: '0 12px', color: '#d1d5db' }}>|</span>
              <span>✓ TERVERIFIKASI</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #e8e3ff 0%, #f5f3ff 50%, #ede6ff 100%)',
    padding: '24px',
    fontFamily: 'var(--font-body)',
  },
  card: {
    display: 'flex',
    width: '100%',
    maxWidth: 960,
    minHeight: 600,
    borderRadius: 24,
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(108, 92, 231, 0.15), 0 4px 16px rgba(0,0,0,0.06)',
  },
  leftPanel: {
    flex: '0 0 42%',
    background: 'linear-gradient(160deg, #7c3aed 0%, #6c5ce7 30%, #8b5cf6 60%, #a78bfa 100%)',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '40px 36px',
    position: 'relative',
    overflow: 'hidden',
  },
  leftContent: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 32,
  },
  logoIcon: {
    fontSize: 24,
    background: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    padding: '6px 8px',
  },
  logoText: {
    fontFamily: 'var(--font-display)',
    fontSize: 18,
    fontWeight: 700,
  },
  heroTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 32,
    fontWeight: 800,
    lineHeight: 1.2,
    margin: '0 0 16px',
  },
  heroDesc: {
    fontSize: 14,
    lineHeight: 1.6,
    opacity: 0.9,
    margin: '0 0 28px',
    maxWidth: 320,
  },
  featureCards: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 32,
  },
  featureCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
    background: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    padding: '16px 18px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.15)',
  },
  featureIcon: {
    fontSize: 20,
    width: 40,
    height: 40,
    borderRadius: 10,
    background: 'rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: 700,
    margin: '0 0 4px',
  },
  featureDesc: {
    fontSize: 12,
    opacity: 0.8,
    margin: 0,
    lineHeight: 1.4,
  },
  socialProof: {
    marginTop: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  avatarGroup: {
    display: 'flex',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: 12,
    fontWeight: 700,
    border: '2px solid rgba(255,255,255,0.3)',
  },
  socialText: {
    fontSize: 12,
    opacity: 0.85,
    lineHeight: 1.4,
  },
  blob1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.08)',
    zIndex: 1,
  },
  blob2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.06)',
    zIndex: 1,
  },
  rightPanel: {
    flex: 1,
    background: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 36px',
  },
  formWrapper: {
    width: '100%',
    maxWidth: 380,
  },
  formTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 28,
    fontWeight: 800,
    color: '#1a1a2e',
    margin: '0 0 4px',
  },
  formSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    margin: '0 0 24px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
  },
  inputWrapper: {
    display: 'flex',
    alignItems: 'center',
    border: '1.5px solid #e5e7eb',
    borderRadius: 12,
    padding: '0 14px',
    background: '#f9fafb',
    transition: 'border-color 0.2s',
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 10,
    flexShrink: 0,
  },
  input: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    padding: '12px 0',
    fontSize: 14,
    fontFamily: 'var(--font-body)',
    outline: 'none',
    color: '#1f2937',
  },
  eyeBtn: {
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: 16,
    padding: '4px',
    flexShrink: 0,
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    cursor: 'pointer',
  },
  checkbox: {
    width: 16,
    height: 16,
    accentColor: '#7c3aed',
    cursor: 'pointer',
    marginTop: 2,
  },
  checkboxText: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 1.4,
  },
  linkText: {
    color: '#7c3aed',
    fontWeight: 600,
    cursor: 'pointer',
  },
  errorMsg: {
    background: '#fef2f2',
    color: '#dc2626',
    fontSize: 13,
    padding: '10px 14px',
    borderRadius: 10,
    margin: 0,
  },
  submitBtn: {
    width: '100%',
    padding: '14px 24px',
    background: 'linear-gradient(135deg, #7c3aed 0%, #6c5ce7 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    boxShadow: '0 4px 14px rgba(108, 92, 231, 0.35)',
    transition: 'transform 0.15s, box-shadow 0.15s',
  },
  switchText: {
    textAlign: 'center',
    fontSize: 13,
    color: '#6b7280',
    marginTop: 20,
  },
  switchLink: {
    color: '#7c3aed',
    fontWeight: 700,
    textDecoration: 'none',
  },
  securityBadge: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: 600,
    letterSpacing: '0.03em',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
}
