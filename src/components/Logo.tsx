import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Logo = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div
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
    </div>
  )
}

export default Logo
