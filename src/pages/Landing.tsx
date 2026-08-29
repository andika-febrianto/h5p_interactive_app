import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  {
    icon: '🧩',
    title: 'Beragam Aktivitas',
    desc: 'Materi, kuis, drag & drop, video interaktif, dokumen PDF, dan isian singkat — dalam satu alur storyboard yang runtut.',
    accent: '#FF6F59',
  },
  {
    icon: '🎓',
    title: 'Terstruktur per Kelas',
    desc: 'Modul dikelompokkan rapi menurut kelas, semester, dan mata pelajaran — mudah ditemukan sesuai kebutuhan belajar.',
    accent: '#5B5FEF',
  },
  {
    icon: '👩\u200d🏫',
    title: 'Guru Kelola Sendiri',
    desc: 'Buat dan sunting modul lewat form dengan pratinjau langsung — tanpa perlu menulis satu baris kode pun.',
    accent: '#0E7C61',
  },
  {
    icon: '📊',
    title: 'Rekap Nilai Otomatis',
    desc: 'Progres dan skor tiap murid tercatat otomatis, siap dilihat guru dalam satu halaman laporan yang ringkas.',
    accent: '#C1443C',
  },
];

const STEPS = [
  { n: 1, title: 'Masuk atau daftar', desc: 'Sebagai guru untuk mengelola konten, atau murid untuk mulai belajar.' },
  { n: 2, title: 'Pilih kelas & mata pelajaran', desc: 'Telusuri modul sesuai kelas, semester, dan mata pelajaran.' },
  { n: 3, title: 'Belajar lewat storyboard interaktif', desc: 'Ikuti tiap panel — materi, kuis, drag & drop, video, dan lainnya.' },
];

const STATS = [
  { value: '1–6', label: 'Kelas SD' },
  { value: '6', label: 'Tipe Aktivitas' },
  { value: '4+', label: 'Mata Pelajaran' },
];

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <div className="landing-nav-brand">
          <span className="landing-nav-mark" aria-hidden />
          <span>Perpustakaan Belajar</span>
        </div>
        <div className="landing-nav-actions">
          <button type="button" className="landing-nav-link" onClick={() => navigate('/harga')}>
            Harga
          </button>
          {user ? (
            <button type="button" className="btn-primary btn-small" onClick={() => navigate('/kelas')}>
              Buka Aplikasi
            </button>
          ) : (
            <>
              <button type="button" className="landing-nav-link" onClick={() => navigate('/masuk')}>
                Masuk
              </button>
              <button type="button" className="btn-primary btn-small" onClick={() => navigate('/daftar')}>
                Daftar
              </button>
            </>
          )}
        </div>
      </nav>

      <section className="landing-hero">
        <div className="landing-hero-blob landing-hero-blob-1" aria-hidden />
        <div className="landing-hero-blob landing-hero-blob-2" aria-hidden />
        <div className="landing-hero-grid" aria-hidden />

        <div className="landing-hero-content">
          <span className="landing-badge">✦ Storyboard interaktif untuk kelas 1–6</span>
          <h1 className="landing-title">
            Belajar jadi lebih hidup,
            <br />
            satu panel sekaligus.
          </h1>
          <p className="landing-subtitle">
            Modul belajar interaktif yang memadukan materi, kuis, drag &amp; drop, video, dokumen,
            dan isian singkat — disusun dan dikelola langsung oleh guru, tanpa perlu menulis kode.
          </p>

          <div className="landing-cta-row">
            {user ? (
              <button type="button" className="btn-primary landing-btn-lg" onClick={() => navigate('/kelas')}>
                Lanjut ke Pilihan Kelas →
              </button>
            ) : (
              <>
                <button type="button" className="btn-primary landing-btn-lg" onClick={() => navigate('/daftar')}>
                  Mulai Sekarang →
                </button>
                <button type="button" className="btn-secondary landing-btn-secondary landing-btn-lg" onClick={() => navigate('/masuk')}>
                  Saya sudah punya akun
                </button>
              </>
            )}
          </div>

          <dl className="landing-stats">
            {STATS.map((s) => (
              <div className="landing-stat" key={s.label}>
                <dt className="landing-stat-value">{s.value}</dt>
                <dd className="landing-stat-label">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="landing-section">
        <p className="landing-section-eyebrow">Fitur</p>
        <h2 className="landing-section-title">Apa yang bisa Anda lakukan</h2>
        <div className="landing-feature-grid">
          {FEATURES.map((f) => (
            <div className="landing-feature-card" key={f.title}>
              <span className="module-card-bar" style={{ background: f.accent }} />
              <span
                className="subject-card-icon"
                style={{ background: `${f.accent}1a`, color: f.accent }}
              >
                {f.icon}
              </span>
              <h3 className="landing-feature-title">{f.title}</h3>
              <p className="landing-feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section">
        <p className="landing-section-eyebrow">Alur</p>
        <h2 className="landing-section-title">Cara kerjanya</h2>
        <div className="landing-steps">
          {STEPS.map((s, i) => (
            <div className="landing-step" key={s.n}>
              <div className="landing-step-num-wrap">
                <span className="landing-step-num">{s.n}</span>
                {i < STEPS.length - 1 && <span className="landing-step-line" aria-hidden />}
              </div>
              <div className="landing-step-text">
                <span className="landing-step-title">{s.title}</span>
                <span className="landing-step-desc">{s.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-closing">
        <h2 className="landing-closing-title">Siap mencoba?</h2>
        <p className="landing-closing-desc">
          Gratis untuk guru dan murid. Daftar dalam hitungan detik, langsung mulai jelajahi modul.
        </p>
        {user ? (
          <button type="button" className="btn-primary landing-btn-lg" onClick={() => navigate('/kelas')}>
            Lanjut ke Pilihan Kelas →
          </button>
        ) : (
          <button type="button" className="btn-primary landing-btn-lg" onClick={() => navigate('/daftar')}>
            Daftar Gratis →
          </button>
        )}
        <p style={{ marginTop: 16 }}>
          <button type="button" className="landing-footer-link" onClick={() => navigate('/harga')}>
            Lihat detail harga & paket →
          </button>
        </p>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer-brand">
          <span className="landing-nav-mark" aria-hidden />
          <span>Perpustakaan Belajar</span>
        </div>
        <p className="landing-footer-tagline">Modul belajar interaktif untuk kelas 1–6.</p>
        <p className="landing-footer-copy">© {new Date().getFullYear()} Perpustakaan Belajar. Dibuat untuk mendukung pembelajaran yang lebih hidup.</p>
      </footer>
    </div>
  );
}
