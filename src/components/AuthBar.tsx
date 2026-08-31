import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchMySubscription } from '../lib/api'

const TEACHER_NAV = [
  { label: 'Kelola Konten', icon: '🧩', to: '/guru' },
  { label: 'Laporan Murid', icon: '📊', to: '/guru/laporan' },
] as const

const COMMON_NAV = [
  { label: 'Langganan', icon: '⭐', to: '/akun/langganan' },
  { label: 'Kelola Sesi', icon: '🔑', to: '/akun/sesi' },
] as const

export function AuthBar() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    if (!user || user.role !== 'STUDENT') {
      setExpired(false)
      return
    }
    fetchMySubscription()
      .then((sub) => setExpired(sub.isExpired))
      .catch(() => setExpired(false))
  }, [user])

  if (!user) {
    return (
      <div className='auth-bar auth-bar--logged-out'>
        <button
          type='button'
          className='auth-btn auth-btn--login'
          onClick={() => navigate('/masuk')}
        >
          👤 Masuk
        </button>
        <button
          type='button'
          className='auth-btn auth-btn--register'
          onClick={() => navigate('/daftar')}
        >
          ✏️ Daftar
        </button>
      </div>
    )
  }

  const navItems =
    user.role === 'TEACHER' ? [...TEACHER_NAV, ...COMMON_NAV] : [...COMMON_NAV]

  return (
    <>
      {expired && (
        <div className='auth-bar-warning' style={{ color: 'red' }}>
          Masa aktif langganan Anda sudah berakhir.{' '}
          <button
            type='button'
            className='auth-bar-warning-link'
            onClick={() => navigate('/harga')}
            style={{ color: 'blue' }}
          >
            Lihat paket langganan →
          </button>
        </div>
      )}
      <div
        className='auth-bar auth-bar--logged-in'
        style={{ marginTop: '15px' }}
      >
        {/* <div className="auth-bar-user-badge">
          <span className="auth-bar-user-avatar">{user.name.charAt(0).toUpperCase()}</span>
          <div className="auth-bar-user-info">
            <span className="auth-bar-user-name">{user.name}</span>
            <span className="auth-bar-role">{user.role === 'TEACHER' ? '👩‍🏫 Operator' : '🎓 Murid'}</span>
          </div>
        </div> */}
        <div className='auth-bar-nav'>
          {navItems.map((item) => (
            <button
              key={item.to}
              type='button'
              className='auth-btn'
              onClick={() => navigate(item.to)}
            >
              <span className='auth-btn-icon'>{item.icon}</span>
              <span className='auth-btn-label'>{item.label}</span>
            </button>
          ))}
          {/* <button
            type='button'
            className='auth-btn auth-btn--logout'
            onClick={async () => {
              await logout()
              navigate('/')
            }}
          >
            <span className='auth-btn-icon'>🚪</span>
            <span className='auth-btn-label'>Keluar</span>
          </button> */}
        </div>
      </div>
    </>
  )
}
