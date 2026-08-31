import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEffect, useRef, useState } from 'react'
import Logo from './Logo'

export default function TopBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className='topbar'>
      {/* <div
        className='topbar-brand'
        onClick={() => {
          if (!user) navigate('/')
        }}
        role={user ? undefined : 'button'}
        tabIndex={user ? undefined : 0}
        style={{ cursor: user ? 'default' : 'pointer' }}
      >
        <span className='landing-nav-mark' aria-hidden />
        <span className='topbar-title'>Perpustakaan Belajar</span>
      </div> */}
      <Logo />
      {user && (
        <div className='topbar-operator'>
          <span className='topbar-operator-name'>
            {user.role !== 'TEACHER' && user.name}
          </span>
          <span className='topbar-operator-role'>
            {user.role === 'TEACHER' ? 'Operator' : 'Murid'}
          </span>
          <span className='topbar-operator-avatar'>
            {user.name.charAt(0).toUpperCase()}
          </span>
          <div ref={dropdownRef} className='topbar-dropdown-container'>
            <button
              type='button'
              onClick={() => {
                setShowDropdown((prev) => !prev)
              }}
              style={{ cursor: 'pointer', border: 'none', background: 'none' }}
            >
              ▼
            </button>
            {showDropdown && (
              <div className='topbar-dropdown'>
                <button
                  type='button'
                  onClick={() => {
                    navigate('/settings')
                    setShowDropdown(false)
                  }}
                >
                  Setting
                </button>

                <button
                  type='button'
                  onClick={async () => {
                    await logout()
                    navigate('/')
                    setShowDropdown(false)
                  }}
                >
                  Keluar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
