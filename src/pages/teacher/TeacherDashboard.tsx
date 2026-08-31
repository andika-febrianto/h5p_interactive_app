import { useNavigate } from 'react-router-dom'
import TopBar from '../../components/TopBar'
import { useAuth } from '../../context/AuthContext'

export default function TeacherDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const items = [
    {
      title: 'Kelola Modul',
      desc: 'Buat modul baru, sunting panel (materi, kuis, drag & drop, video, PDF, isian singkat), atur urutan.',
      icon: '🧩',
      to: '/guru/modul',
    },
    {
      title: 'Kelola Mata Pelajaran',
      desc: 'Tambah mata pelajaran baru sebelum membuat modul di bawahnya.',
      icon: '📚',
      to: '/guru/mapel',
    },
    {
      title: 'Laporan Progres Murid',
      desc: 'Rekap panel selesai dan skor tiap murid yang sudah login.',
      icon: '📊',
      to: '/guru/laporan',
    },
  ]

  return (
    <div className='home-page'>
      <div className='home-inner'>
        <TopBar />
        <button
          type='button'
          className='home-back'
          onClick={() => navigate('/kelas')}
        >
          ← Ke perpustakaan belajar
        </button>

        <p className='home-eyebrow'>Operator · {user?.name}</p>
        <h1 className='home-title'>Kelola Konten</h1>
        <p className='home-lede'>
          Buat dan sunting modul belajar tanpa perlu menulis kode.
        </p>

        <div className='home-grid'>
          {items.map((item) => (
            <button
              key={item.to}
              type='button'
              className='subject-card'
              onClick={() => navigate(item.to)}
            >
              <span
                className='module-card-bar'
                // style={{ background: '#5B5FEF' }}
              />
              <span
                className='subject-card-icon'
                style={{ background: '#5B5FEF22', color: '#5B5FEF' }}
              >
                {item.icon}
              </span>
              <h2 className='module-card-title'>{item.title}</h2>
              <p className='module-card-summary'>{item.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
