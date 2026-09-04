import { useNavigate } from 'react-router-dom'

const Logo = () => {
  const navigate = useNavigate()
  return (
    <button
      type='button'
      onClick={() => navigate('/')}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(124,58,237,0.2)',
        }}
      >
        <svg
          width='20'
          height='20'
          fill='none'
          stroke='#fff'
          strokeWidth='2.5'
          strokeLinecap='round'
          strokeLinejoin='round'
          viewBox='0 0 24 24'
        >
          <path d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' />
        </svg>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
        }}
      >
        <span
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#0f172a',
            lineHeight: 1.2,
          }}
        >
          Perpustakaan{' '}
          <span style={{ color: '#7c3aed', fontWeight: 800 }}>Belajar</span>
        </span>
        <span
          style={{
            fontSize: 10,
            color: '#94a3b8',
            fontWeight: 500,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
          }}
        >
          Edukasi Interaktif
        </span>
      </div>
    </button>
  )
}

export default Logo
