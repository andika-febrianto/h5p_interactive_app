import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AuthBar } from '../components/AuthBar'
import HeroIllustration from '../components/HeroIllustration'

const FEATURES = [
  {
    icon: '📚',
    title: 'Materi Belajar Terstruktur',
    desc: 'Temukan materi belajar yang disusun berdasarkan kelas, semester, dan mata pelajaran agar anak belajar dengan lebih terarah.',
    accent: '#FF6F59',
  },
  {
    icon: '🧩',
    title: 'Belajar dengan Beragam Aktivitas',
    desc: 'Belajar melalui materi interaktif, kuis, drag & drop, video, dan berbagai aktivitas yang membuat belajar lebih menyenangkan.',
    accent: '#5B5FEF',
  },
  {
    icon: '🎯',
    title: 'Latihan & Kuis',
    desc: 'Latih pemahaman anak melalui berbagai soal dan kuis untuk membantu mengingat materi dan mempersiapkan diri menghadapi ujian.',
    accent: '#0E7C61',
  },
  {
    icon: '⭐',
    title: 'Belajar Lebih Menyenangkan',
    desc: 'Selesaikan aktivitas, kumpulkan pencapaian, dan ikuti perjalanan belajar yang membuat anak lebih termotivasi untuk terus belajar.',
    accent: '#F59E0B',
  },
  {
    icon: '📊',
    title: 'Pantau Perkembangan Anak',
    desc: 'Orang tua dapat melihat aktivitas belajar, hasil kuis, dan perkembangan anak untuk mengetahui bagian yang sudah dikuasai dan yang masih perlu dilatih.',
    accent: '#C1443C',
  },
  {
    icon: '🚀',
    title: 'Belajar Mandiri di Rumah',
    desc: 'Berikan anak ruang untuk belajar dan berlatih secara mandiri dengan aktivitas yang sesuai dengan tingkat kelasnya.',
    accent: '#8B5CF6',
  },
]

const STEPS = [
  {
    n: 1,
    title: 'Daftar sebagai orang tua',
    desc: 'Buat akun dan tambahkan profil anak untuk memulai perjalanan belajar..',
  },
  {
    n: 2,
    title: 'Pilih kelas & mata pelajaran',
    desc: 'Temukan materi belajar sesuai kelas, semester, dan mata pelajaran anak.',
  },
  {
    n: 3,
    title: 'Belajar, berlatih & pantau perkembangan',
    desc: 'Anak belajar melalui materi interaktif dan kuis, sementara orang tua dapat memantau perkembangannya.',
  },
]

const STATS = [
  { value: '1–6', label: 'Kelas SD' },
  { value: '6', label: 'Tipe Aktivitas' },
  { value: '4+', label: 'Mata Pelajaran' },
]

export default function Landing() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div className='landing-page'>
      <nav className='landing-nav'>
        <div className='landing-nav-brand'>
          <span className='landing-nav-mark' aria-hidden />
          <span>Perpustakaan Belajar</span>
        </div>
        <div className='landing-nav-actions'>
          <button
            type='button'
            className='landing-nav-link'
            onClick={() => navigate('/harga')}
          >
            Harga
          </button>
          {user ? (
            <AuthBar />
          ) : (
            <>
              <button
                type='button'
                className='landing-nav-link'
                onClick={() => navigate('/masuk')}
              >
                Masuk
              </button>
              <button
                type='button'
                className='btn-primary btn-small'
                onClick={() => navigate('/daftar')}
              >
                Daftar
              </button>
            </>
          )}
        </div>
      </nav>

      <section className='landing-hero'>
        <div className='landing-hero-blob landing-hero-blob-1' aria-hidden />
        <div className='landing-hero-blob landing-hero-blob-2' aria-hidden />
        <div className='landing-hero-grid' aria-hidden />

        <div className='landing-hero-split'>
          <div className='landing-hero-content'>
            <span className='landing-badge'>
              ✦ Platform belajar interaktif untuk anak SD
            </span>

            <h1 className='landing-title'>
              Belajar jadi lebih
              <br />
              menyenangkan,<br />
              berkembang setiap hari.
            </h1>

            <p className='landing-subtitle'>
              Bantu anak belajar lebih terarah melalui materi interaktif, kuis,
              latihan, video, dan berbagai aktivitas belajar yang sesuai dengan
              tingkat kelasnya — sambil memantau perkembangan belajar anak dengan
              mudah.
            </p>

            <div className='landing-cta-row'>
              {user ? (
                <button
                  type='button'
                  className='btn-primary landing-btn-lg'
                  onClick={() => navigate('/kelas')}
                >
                  Mulai Belajar →
                </button>
              ) : (
                <>
                  <button
                    type='button'
                    className='btn-primary landing-btn-lg'
                    onClick={() => navigate('/daftar')}
                  >
                    Mulai Belajar Gratis →
                  </button>

                  <button
                    type='button'
                    className='btn-secondary landing-btn-secondary landing-btn-lg'
                    onClick={() => navigate('/masuk')}
                  >
                    Saya sudah punya akun
                  </button>
                </>
              )}
            </div>

            <dl className='landing-stats'>
              {STATS.map((s) => (
                <div className='landing-stat' key={s.label}>
                  <dt className='landing-stat-value'>{s.value}</dt>
                  <dd className='landing-stat-label'>{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className='landing-hero-visual'>
            <HeroIllustration className='landing-hero-illustration' />
          </div>
        </div>
      </section>

      <section className='landing-section'>
        <p className='landing-section-eyebrow'>Fitur</p>
        <h2 className='landing-section-title'>Apa yang bisa Anda lakukan</h2>
        <div className='landing-feature-grid'>
          {FEATURES.map((f) => (
            <div className='landing-feature-card' key={f.title}>
              <span
                className='module-card-bar'
                style={{ background: f.accent }}
              />
              <span
                className='subject-card-icon'
                style={{ background: `${f.accent}1a`, color: f.accent }}
              >
                {f.icon}
              </span>
              <h3 className='landing-feature-title'>{f.title}</h3>
              <p className='landing-feature-desc'>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className='landing-section'>
        <p className='landing-section-eyebrow'>Alur</p>
        <h2 className='landing-section-title'>Cara kerjanya</h2>
        <div className='landing-steps'>
          {STEPS.map((s, i) => (
            <div className='landing-step' key={s.n}>
              <div className='landing-step-num-wrap'>
                <span className='landing-step-num'>{s.n}</span>
                {i < STEPS.length - 1 && (
                  <span className='landing-step-line' aria-hidden />
                )}
              </div>
              <div className='landing-step-text'>
                <span className='landing-step-title'>{s.title}</span>
                <span className='landing-step-desc'>{s.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className='landing-closing'>
        <h2 className='landing-closing-title'>Siap mencoba?</h2>
        <p className='landing-closing-desc'>
          Gratis untuk operator dan murid. Daftar dalam hitungan detik, langsung
          mulai jelajahi modul.
        </p>
        {user ? (
          <button
            type='button'
            className='btn-primary landing-btn-lg'
            onClick={() => navigate('/kelas')}
          >
            Lanjut ke Pilihan Kelas →
          </button>
        ) : (
          <button
            type='button'
            className='btn-primary landing-btn-lg'
            onClick={() => navigate('/daftar')}
          >
            Daftar Gratis →
          </button>
        )}
        <p style={{ marginTop: 16 }}>
          <button
            type='button'
            className='landing-footer-link'
            onClick={() => navigate('/harga')}
          >
            Lihat detail harga & paket →
          </button>
        </p>
      </section>

      <footer className='landing-footer'>
        <div className='landing-footer-brand'>
          <span className='landing-nav-mark' aria-hidden />
          <span>Perpustakaan Belajar</span>
        </div>
        <p className='landing-footer-tagline'>
          Modul belajar interaktif untuk kelas 1–6.
        </p>
        <p className='landing-footer-copy'>
          © {new Date().getFullYear()} Perpustakaan Belajar. Dibuat untuk
          mendukung pembelajaran yang lebih hidup.
        </p>
      </footer>
    </div>
  )
}
