import { useState } from 'react'
import './RequireAuth.css'

type AccountRole = 'student' | 'operator'

interface AuthPageProps {
  onLogin?: (role: AccountRole) => void
  onRegister?: (role: AccountRole) => void
  onGoogleLogin?: (role: AccountRole) => void
  onBackHome?: () => void
}

const roles = [
  {
    value: 'student' as const,
    icon: '🎒',
    title: 'Murid / Siswa SD',
    description: 'Akses materi interaktif, game edukasi, & kuis berhadiah.',
    color: 'purple',
  },
  {
    value: 'operator' as const,
    icon: '👩‍🏫',
    title: 'Operator / Guru / Wali',
    description: 'Kelola kelas, monitor capaian belajar, & kurikulum.',
    color: 'green',
  },
]

export default function RequireAuth({
  onLogin,
  onRegister,
  onGoogleLogin,
  onBackHome,
}: AuthPageProps) {
  const [selectedRole, setSelectedRole] = useState<AccountRole>('student')

  const handleLogin = () => {
    onLogin?.(selectedRole)
  }

  const handleRegister = () => {
    onRegister?.(selectedRole)
  }

  const handleGoogleLogin = () => {
    onGoogleLogin?.(selectedRole)
  }

  return (
    <div className='auth-page'>
      {/* Navigation */}
      <header className='auth-navbar'>
        <div className='auth-navbar__inner'>
          {/* Logo */}
          <button type='button' className='auth-brand' onClick={onBackHome}>
            <div className='auth-brand__icon'>
              <svg viewBox='0 0 24 24' className='auth-brand__svg'>
                <path d='M19 2H6c-1.2 0-2 .8-2 2v16c0 1.2.8 2 2 2h13c.6 0 1-.4 1-1s-.4-1-1-1H6c-.6 0-1-.4-1-1s.4-1 1-1h13c1.1 0 2-.9 2-2V4c0-1.2-.8-2-2-2zm-1 14H6V4h12v12z' />
              </svg>
            </div>

            <div className='auth-brand__text'>
              <span className='auth-brand__title'>
                Perpustakaan <span>Belajar</span>
              </span>
              <span className='auth-brand__subtitle'>
                EDUKASI INTERAKTIF SD
              </span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className='auth-nav'>
            <button type='button'>Beranda</button>
            <button type='button'>Fitur Unggulan</button>
            <button type='button'>Cara Kerja</button>
            <button type='button'>Harga Paket</button>
            <button type='button'>Bantuan</button>
          </nav>

          {/* Back Home */}
          <button
            type='button'
            className='back-home-button'
            onClick={onBackHome}
          >
            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor'>
              <path
                d='M10 19l-7-7m0 0l7-7m-7 7h18'
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2.2'
              />
            </svg>

            <span>Kembali ke Beranda</span>
          </button>
        </div>
      </header>

      {/* Main */}
      <main className='auth-main'>
        <div className='auth-container'>
          {/* Auth Card */}
          <section className='auth-card'>
            <div className='auth-card__glow auth-card__glow--top' />
            <div className='auth-card__glow auth-card__glow--bottom' />

            <div className='auth-card__content'>
              {/* Badge */}
              <div className='auth-badge'>
                <span className='auth-badge__emoji'>📚</span>

                <span className='auth-badge__label'>PERPUSTAKAAN BELAJAR</span>
              </div>

              {/* Heading */}
              <div className='auth-heading'>
                <h1>Masuk dulu, yuk</h1>

                <p>
                  Masuk atau daftar sebagai operator atau murid untuk mulai
                  memilih kelas dan modul belajar.
                </p>
              </div>

              {/* Role Selection */}
              <div className='role-section'>
                <label className='section-label'>Pilih Peran Akun Anda</label>

                <div className='role-grid'>
                  {roles.map((role) => {
                    const isSelected = selectedRole === role.value

                    return (
                      <label
                        key={role.value}
                        className={`role-option ${
                          isSelected ? 'role-option--selected' : ''
                        }`}
                      >
                        <input
                          type='radio'
                          name='account_role'
                          value={role.value}
                          checked={isSelected}
                          onChange={() => setSelectedRole(role.value)}
                        />

                        <div className='role-card'>
                          <div className='role-card__top'>
                            <div
                              className={`role-icon role-icon--${role.color}`}
                            >
                              {role.icon}
                            </div>

                            <div
                              className={`role-check ${
                                isSelected ? 'role-check--visible' : ''
                              }`}
                            >
                              ✓
                            </div>
                          </div>

                          <div className='role-card__content'>
                            <div className='role-card__title'>{role.title}</div>

                            <p>{role.description}</p>
                          </div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className='auth-actions'>
                <button
                  type='button'
                  className='auth-button auth-button--primary'
                  onClick={handleLogin}
                >
                  Masuk
                </button>

                <button
                  type='button'
                  className='auth-button auth-button--secondary'
                  onClick={handleRegister}
                >
                  Daftar
                </button>
              </div>

              {/* Divider */}
              <div className='auth-divider'>
                <span />
                <p>Atau Masuk Lebih Cepat</p>
                <span />
              </div>

              {/* Google */}
              <button
                type='button'
                className='google-button'
                onClick={handleGoogleLogin}
              >
                <svg viewBox='0 0 24 24' className='google-icon'>
                  <path
                    d='M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z'
                    fill='#EA4335'
                  />
                  <path
                    d='M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5.1 3.7-8.8z'
                    fill='#4285F4'
                  />
                  <path
                    d='M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z'
                    fill='#FBBC05'
                  />
                  <path
                    d='M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 17C3.7 20.7 7.5 24 12 24z'
                    fill='#34A853'
                  />
                </svg>

                <span>Lanjutkan dengan Google</span>
              </button>

              {/* Back Home */}
              <div className='auth-back'>
                <button type='button' onClick={onBackHome}>
                  <svg viewBox='0 0 24 24' fill='none' stroke='currentColor'>
                    <path
                      d='M7 16l-4-4m0 0l4-4m-4 4h18'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                    />
                  </svg>

                  <span>
                    Belum ingin masuk sekarang?{' '}
                    <strong>Kembali ke Beranda</strong>
                  </span>
                </button>
              </div>
            </div>
          </section>

          {/* Benefits */}
          <div className='benefits'>
            <div className='benefit-item'>
              <span>🛡️</span>
              <span>Aman & Terverifikasi</span>
            </div>

            <div className='benefit-item'>
              <span>🎮</span>
              <span>Gamifikasi Seru Anak SD</span>
            </div>

            <div className='benefit-item'>
              <span>✨</span>
              <span>Uji Coba 14 Hari Gratis</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className='auth-footer'>
        <div className='auth-footer__inner'>
          <p>
            © 2026 Perpustakaan Belajar. Platform Edukasi Interaktif Ramah Anak.
          </p>

          <div className='auth-footer__links'>
            <button type='button'>Pusat Bantuan</button>
            <button type='button'>Kebijakan Privasi</button>
            <button type='button'>Syarat & Ketentuan</button>
          </div>
        </div>
      </footer>
    </div>
  )
}
