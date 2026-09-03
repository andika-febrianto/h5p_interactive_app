import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../lib/api'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const loggedInUser = await login(email, password)
      if (loggedInUser.role === 'PARENT') {
        navigate('/orangtua')
      } else if (loggedInUser.role === 'STUDENT') {
        navigate('/anak')
      } else {
        navigate('/kelas')
      }
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Gagal masuk. Coba lagi.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const fillDemo = (email: string, pass: string) => {
    setEmail(email)
    setPassword(pass)
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
              Mulai Petualangan
              <br />
              Belajarmu Hari Ini!
            </h1>

            {/* Description */}
            <p style={S.heroDesc}>
              Platform belajar interaktif terbaik untuk anak-anak, didesain
              untuk kenyamanan orang tua dan guru.
            </p>

            {/* Feature Cards */}
            <div style={S.featureCards}>
              <div style={S.featureCard}>
                <span style={S.featureIcon}>✅</span>
                <span style={S.featureText}>Modul Berstandar Nasional</span>
              </div>
              <div style={S.featureCard}>
                <span style={S.featureIcon}>⭐</span>
                <span style={S.featureText}>Sistem Reward & XP Seru</span>
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
            <h2 style={S.formTitle}>Selamat Datang</h2>
            <p style={S.formSubtitle}>
              Silakan masuk ke akun Anda untuk melanjutkan.
            </p>

            <form onSubmit={handleSubmit} style={S.form}>
              {/* Email Field */}
              <div style={S.fieldGroup}>
                <label style={S.label}>Alamat Email</label>
                <div style={S.inputWrapper}>
                  <span style={S.inputIcon}>✉️</span>
                  <input
                    type='email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder='operator@sekolah.id'
                    autoComplete='email'
                    style={S.input}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div style={S.fieldGroup}>
                <div style={S.labelRow}>
                  <label style={S.label}>Kata Sandi</label>
                  <button type='button' style={S.forgotLink} onClick={() => {}}>
                    Lupa Sandi?
                  </button>
                </div>
                <div style={S.inputWrapper}>
                  <span style={S.inputIcon}>🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder='••••••••'
                    autoComplete='current-password'
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

              {/* Remember Me */}
              <label style={S.checkboxLabel}>
                <input
                  type='checkbox'
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={S.checkbox}
                />
                <span style={S.checkboxText}>Ingat saya</span>
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
                {submitting ? 'Memproses...' : 'Masuk Sekarang'}
              </button>
            </form>

            {/* Register Link */}
            <p style={S.switchText}>
              Belum punya akun?{' '}
              <Link to='/daftar' style={S.switchLink}>
                Daftar di sini
              </Link>
            </p>

            {/* Demo Accounts */}
            <div style={S.demoBox}>
              <div style={S.demoHeader}>
                <span style={S.demoIcon}>ℹ️</span>
                <span style={S.demoTitle}>AKUN DEMO</span>
              </div>
              <div style={S.demoGrid}>
                <div>
                  <p style={S.demoRole}>Operator/Guru</p>
                  <p style={S.demoEmail}>operator@sekolah.id</p>
                </div>
                <div>
                  <p style={S.demoRole}>Murid/Anak</p>
                  <p style={S.demoEmail}>murid@sekolah.id</p>
                </div>
              </div>
              <p style={S.demoPass}>
                Sandi untuk semua: <strong>operator12345 / murid12345</strong>
              </p>
              <button
                type='button'
                onClick={() => fillDemo('operator@sekolah.id', 'operator12345')}
                style={S.demoFillBtn}
              >
                🔑 Isi otomatis
              </button>
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
    minHeight: 560,
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
    alignItems: 'center',
    gap: 14,
    background: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    padding: '14px 18px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.15)',
  },
  featureIcon: {
    fontSize: 20,
    width: 36,
    height: 36,
    borderRadius: 10,
    background: 'rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureText: {
    fontSize: 14,
    fontWeight: 600,
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
    margin: '0 0 28px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
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
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  forgotLink: {
    border: 'none',
    background: 'none',
    color: '#7c3aed',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
  },
  checkbox: {
    width: 16,
    height: 16,
    accentColor: '#7c3aed',
    cursor: 'pointer',
  },
  checkboxText: {
    fontSize: 13,
    color: '#6b7280',
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
  demoBox: {
    marginTop: 20,
    background: '#f9fafb',
    borderRadius: 14,
    padding: '16px 18px',
    border: '1px solid #e5e7eb',
  },
  demoHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  demoIcon: {
    fontSize: 14,
    background: '#e0e7ff',
    borderRadius: 8,
    padding: '2px 6px',
  },
  demoTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: '#6b7280',
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
  },
  demoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    marginBottom: 10,
  },
  demoRole: {
    fontSize: 12,
    fontWeight: 700,
    color: '#374151',
    margin: '0 0 2px',
  },
  demoEmail: {
    fontSize: 11,
    color: '#6b7280',
    margin: 0,
  },
  demoPass: {
    fontSize: 11,
    color: '#6b7280',
    margin: '0 0 8px',
  },
  demoFillBtn: {
    width: '100%',
    padding: '8px 12px',
    background: '#ede9fe',
    color: '#7c3aed',
    border: '1px solid #ddd6fe',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
  },
}
