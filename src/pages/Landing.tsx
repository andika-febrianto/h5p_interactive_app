import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const FEATURES = [
  {
    icon: '📐',
    title: 'Materi Terstruktur',
    desc: 'Kurikulum yang dirancang berdasarkan standar nasional dengan pendekatan bertahap dan tingkatkan anak agar pemahaman terbentuk kuat.',
    link: 'Sesuai Kurikulum Merdeka',
    color: '#e8e3ff',
  },
  {
    icon: '🎬',
    title: 'Aktivitas Beragam',
    desc: 'Kombinasi video animasi menarik, kuis seru, dan latihan interaktif yang membuat proses belajar terasa alami seperti bermain bersama teman.',
    link: 'Visual Ramah Anak',
    color: '#d5f5ec',
  },
  {
    icon: '🏆',
    title: 'Kuis Seru & Berhadiah',
    desc: 'Ujian pemahaman dengan pertanyaan harian yang menantang untuk mengasah kemampuan anak, memberikan hadiah dan penghargaan setelah semua anak berhasil menyelesaikannya.',
    link: 'Gamifikasi Edukatif',
    color: '#fff9e6',
  },
  {
    icon: '📊',
    title: 'Pantau Progres Belajar',
    desc: 'Orang tua dapat melihat grafik perkembangan belajar anak secara real-time melalui dashboard dengan tampilan yang sederhana dan mudah dipahami.',
    link: 'Laporan Mingguan & Wali',
    color: '#ffeaea',
  },
  {
    icon: '📱',
    title: 'Belajar Mandiri',
    desc: 'Dapat diakses kapanpun lewat saja dari mana saja menggunakan tablet, laptop, atau smartphone memberikan kebebasan belajar untuk masing-masing anak.',
    link: 'Multi Device Ready',
    color: '#e8e3ff',
  },
  {
    icon: '👥',
    title: 'Komunitas Peduli Belajar',
    desc: 'Bergabung dalam komunitas orang tua yang aktif untuk berbagi tips mendidik, konsultasi pendidikan, serta inspirasi pembelajaran yang menyenangkan.',
    link: 'Webinar & Tips Gratis',
    color: '#d5f5ec',
  },
]

const STEPS = [
  {
    n: '01',
    label: 'LANGKAH 01',
    title: 'Daftar Akun Secara Gratis',
    desc: 'Buat akun gratis dalam hitungan detik. Tidak memerlukan kartu kredit untuk menjelajahi ribuan materi pilihan anak Anda.',
  },
  {
    n: '02',
    label: 'LANGKAH 02',
    title: 'Pilih Kelas & Mata Pelajaran',
    desc: 'Sesuaikan materi dengan jenjang kelas anak Anda (Kelas 1 Hingga 6) dan topik-topik yang ingin dipelajari, mulai dari hitungan hingga sains terapan.',
  },
  {
    n: '03',
    label: 'LANGKAH 03',
    title: 'Mulai Belajar & Pantau Kemajuan',
    desc: 'Anak mulai belajar melalui materi interaktif dan pantau grafik capaian belajar anak Anda langsung dari dasbor orang tua.',
  },
]

const STATS = [
  { value: '1–6', label: 'TINGKAT KELAS SD' },
  { value: '4+', label: 'MATA PELAJARAN UTAMA' },
  { value: '100+', label: 'MODUL & GAME INTERAKTIF' },
  { value: '24/7', label: 'AKSES MANDIRI FLEKSIBEL' },
]

const NAV_LINKS = [
  { label: 'Beranda', href: '/' },
  { label: 'Fitur', href: '#fitur' },
  { label: 'Cara Kerja', href: '#cara-kerja' },
  { label: 'Harga', href: '/harga' },
  { label: 'Tentang', href: '#tentang' },
]

export default function Landing() {
  useAuth()
  const navigate = useNavigate()

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: '#fff' }}>
      {/* ── Topbar ── */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 48px',
        background: '#fff',
        borderBottom: '1px solid #f0eef5',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 16,
          }}>
            📖
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, color: '#1a1a2e' }}>
            Perpustakaan<span style={{ color: '#6c5ce7' }}>Belajar</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          {NAV_LINKS.map(l => (
            <button
              key={l.label}
              type="button"
              onClick={() => {
                if (l.href.startsWith('#')) {
                  const el = document.getElementById(l.href.slice(1))
                  el?.scrollIntoView({ behavior: 'smooth' })
                } else {
                  navigate(l.href)
                }
              }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 15, fontWeight: 500, color: '#4a4a6a',
              }}
            >
              {l.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            type="button"
            onClick={() => navigate('/masuk')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 15, fontWeight: 600, color: '#4a4a6a',
            }}
          >
            Masuk
          </button>
          <button
            type="button"
            onClick={() => navigate('/daftar')}
            style={{
              background: '#6c5ce7', color: '#fff', border: 'none',
              borderRadius: 10, padding: '10px 22px', fontSize: 15,
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            Daftar Gratis
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '60px 48px 40px', maxWidth: 1200, margin: '0 auto',
        gap: 48,
      }}>
        <div style={{ flex: 1, maxWidth: 560 }}>
          <div style={{
            display: 'inline-block', background: '#f5f3ff', color: '#6c5ce7',
            borderRadius: 20, padding: '6px 16px', fontSize: 12, fontWeight: 600,
            marginBottom: 20, letterSpacing: 0.5,
          }}>
            📣 PENGAJARAN SEMESTER GANJIL OLEH GURU
          </div>
          <h1 style={{
            fontSize: 44, fontWeight: 800, lineHeight: 1.15, color: '#1a1a2e',
            margin: '0 0 16px', fontFamily: 'var(--font-display)',
          }}>
            Belajar Jadi Lebih{' '}
            <span style={{ color: '#6c5ce7', fontStyle: 'italic' }}>Menyenangkan,</span>
            <br />
            <span style={{ color: '#6c5ce7', fontStyle: 'italic' }}>Berkembang</span> Setiap Hari.
          </h1>
          <p style={{
            fontSize: 16, color: '#6b7280', lineHeight: 1.7, margin: '0 0 28px',
          }}>
            Platform belajar interaktif yang membantu anak SD menguasai
            Matematika, Sains, dan Bahasa dengan visual yang seru, adaptif, dan
            tidak membosankan.
          </p>
          <div style={{ display: 'flex', gap: 14, marginBottom: 28 }}>
            <button
              type="button"
              onClick={() => navigate('/daftar')}
              style={{
                background: '#6c5ce7', color: '#fff', border: 'none',
                borderRadius: 12, padding: '14px 28px', fontSize: 16,
                fontWeight: 700, cursor: 'pointer',
              }}
            >
              Mulai Belajar Gratis →
            </button>
            <button
              type="button"
              onClick={() => navigate('/masuk')}
              style={{
                background: '#fff', color: '#6c5ce7', border: '2px solid #6c5ce7',
                borderRadius: 12, padding: '14px 28px', fontSize: 16,
                fontWeight: 700, cursor: 'pointer',
              }}
            >
              ▶ Lihat Video Demo
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex' }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: ['#6c5ce7', '#a29bfe', '#00b894', '#fdcb6e'][i],
                  border: '2px solid #fff', marginLeft: i > 0 ? -8 : 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, color: '#fff',
                }}>
                  {['👩', '👨', '👧', '👦'][i]}
                </div>
              ))}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: '#fdcb6e', fontSize: 14 }}>⭐</span>
                <span style={{ fontWeight: 700, fontSize: 15, color: '#1a1a2e' }}>4.9/5</span>
              </div>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>
                5,000+ Siswa Aktif & Didukung Orang Tua
              </div>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, maxWidth: 480, position: 'relative' }}>
          {/* Main hero image card */}
          <div style={{
            borderRadius: 20, overflow: 'hidden', background: '#f5f0ff',
            padding: 20, position: 'relative',
          }}>
            <div style={{
              borderRadius: 16, overflow: 'hidden', background: '#e8e3ff',
              height: 280, display: 'flex', alignItems: 'center',
              justifyContent: 'center', position: 'relative',
            }}>
              <div style={{
                fontSize: 64, display: 'flex', gap: 8,
              }}>
                👩‍🏫📚
              </div>
              {/* Modul Interaktif badge */}
              <div style={{
                position: 'absolute', top: 16, left: 16,
                background: '#fff', borderRadius: 10, padding: '8px 14px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 13, fontWeight: 600, color: '#1a1a2e',
              }}>
                <span style={{
                  width: 24, height: 24, borderRadius: 6, background: '#6c5ce7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 12,
                }}>📖</span>
                Modul Interaktif
              </div>
            </div>
          </div>
          {/* Floating kuis badge */}
          <div style={{
            position: 'absolute', bottom: -10, right: 20,
            background: '#fff', borderRadius: 14, padding: '14px 20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, background: '#d5f5ec',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
            }}>✅</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#1a1a2e' }}>
                1.2jt+ Kuis Diselesaikan
              </div>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>
                Oleh ribuan pelajar aktif
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Row ── */}
      <section style={{
        display: 'flex', justifyContent: 'center', gap: 0,
        maxWidth: 900, margin: '40px auto 60px', padding: '0 48px',
      }}>
        {STATS.map((s, i) => (
          <div key={s.label} style={{
            flex: 1, textAlign: 'center',
            borderRight: i < STATS.length - 1 ? '1px solid #e8e6f0' : 'none',
            padding: '0 20px',
          }}>
            <div style={{
              fontSize: 32, fontWeight: 800, color: '#1a1a2e',
              fontFamily: 'var(--font-display)',
            }}>
              {s.value}
            </div>
            <div style={{
              fontSize: 11, fontWeight: 600, color: '#9ca3af',
              letterSpacing: 1, marginTop: 4, textTransform: 'uppercase',
            }}>
              {s.label}
            </div>
          </div>
        ))}
      </section>

      {/* ── Features (Dark Background) ── */}
      <section id="fitur" style={{
        background: '#1a1a2e', padding: '72px 48px', color: '#fff',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{
              fontSize: 12, fontWeight: 600, color: '#a29bfe',
              letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12,
            }}>
              KEUNGGULAN BELAJAR
            </div>
            <h2 style={{
              fontSize: 32, fontWeight: 800, margin: '0 0 12px',
              fontFamily: 'var(--font-display)',
            }}>
              Fitur Unggulan untuk Masa Depan Cerah
            </h2>
            <p style={{ fontSize: 15, color: '#9ca3af', maxWidth: 600, margin: '0 auto' }}>
              Dirancang khusus dengan pendekatan saintifik dan pedagogi ramah anak agar kegiatan belajar mandiri terasa seperti petualangan seru.
            </p>
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 24,
          }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{
                background: '#fff', borderRadius: 16, padding: 28,
                display: 'flex', flexDirection: 'column', gap: 12,
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: f.color, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 22,
                }}>
                  {f.icon}
                </div>
                <h3 style={{
                  fontSize: 17, fontWeight: 700, color: '#1a1a2e',
                  margin: 0,
                }}>
                  {f.title}
                </h3>
                <p style={{
                  fontSize: 14, color: '#6b7280', lineHeight: 1.6, margin: 0,
                  flex: 1,
                }}>
                  {f.desc}
                </p>
                <span style={{
                  fontSize: 13, fontWeight: 600, color: '#6c5ce7',
                  cursor: 'pointer',
                }}>
                  {f.link} →
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="cara-kerja" style={{
        padding: '72px 48px', maxWidth: 1100, margin: '0 auto',
      }}>
        <div style={{
          display: 'flex', gap: 48, alignItems: 'flex-start',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 12, fontWeight: 600, color: '#6c5ce7',
              letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12,
            }}>
              ALUR SEDERHANA
            </div>
            <h2 style={{
              fontSize: 32, fontWeight: 800, color: '#1a1a2e', margin: '0 0 36px',
              fontFamily: 'var(--font-display)',
            }}>
              Cara Kerja Cepat & Praktis
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              {STEPS.map((s) => (
                <div key={s.n} style={{ display: 'flex', gap: 16 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: '#f5f3ff', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 800, color: '#6c5ce7',
                  }}>
                    {s.n}
                  </div>
                  <div>
                    <div style={{
                      fontSize: 11, fontWeight: 600, color: '#9ca3af',
                      letterSpacing: 1, textTransform: 'uppercase',
                      marginBottom: 4,
                    }}>
                      {s.label}
                    </div>
                    <h3 style={{
                      fontSize: 17, fontWeight: 700, color: '#1a1a2e',
                      margin: '0 0 6px',
                    }}>
                      {s.title}
                    </h3>
                    <p style={{
                      fontSize: 14, color: '#6b7280', lineHeight: 1.6,
                      margin: 0,
                    }}>
                      {s.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            <div style={{
              borderRadius: 20, overflow: 'hidden', background: '#f5f0ff',
              height: 400, display: 'flex', alignItems: 'center',
              justifyContent: 'center', position: 'relative',
            }}>
              <div style={{ fontSize: 80 }}>👨‍🏫👩‍🎓</div>
              {/* Badge overlay */}
              <div style={{
                position: 'absolute', bottom: 20, left: 20, right: 20,
                background: 'rgba(26, 26, 46, 0.9)', borderRadius: 14,
                padding: '16px 20px', color: '#fff',
              }}>
                <div style={{
                  fontSize: 11, fontWeight: 600, color: '#a29bfe',
                  marginBottom: 4, textTransform: 'uppercase',
                }}>
                  Metode Belajar yang Efektif
                </div>
                <h4 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>
                  Membangun Rasa Percaya Diri Sejak Dini
                </h4>
                <p style={{ fontSize: 12, color: '#d1d5db', margin: 0, lineHeight: 1.5 }}>
                  94% orang tua melaporkan peningkatan fokus dan motivasi belajar anak setelah 14 hari.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section style={{
        margin: '0 48px 60px', borderRadius: 24,
        background: 'linear-gradient(135deg, #6c5ce7 0%, #4834d4 50%, #2d1b8e 100%)',
        padding: '56px 48px', textAlign: 'center', color: '#fff',
      }}>
        <h2 style={{
          fontSize: 30, fontWeight: 800, margin: '0 0 12px',
          fontFamily: 'var(--font-display)',
        }}>
          Siap Buat Belajar Lebih Menyenangkan?
        </h2>
        <p style={{ fontSize: 15, color: '#d1c4e9', margin: '0 0 28px', maxWidth: 500, marginInline: 'auto' }}>
          Daftarkan putra-putri Anda sekarang dan dapatkan uji coba gratis selama 14 hari! Tidak komitmen apapun.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
          <button
            type="button"
            onClick={() => navigate('/daftar')}
            style={{
              background: '#fff', color: '#6c5ce7', border: 'none',
              borderRadius: 12, padding: '14px 28px', fontSize: 16,
              fontWeight: 700, cursor: 'pointer',
            }}
          >
            Coba Gratis Sekarang
          </button>
          <button
            type="button"
            onClick={() => navigate('/masuk')}
            style={{
              background: 'transparent', color: '#fff',
              border: '2px solid rgba(255,255,255,0.4)',
              borderRadius: 12, padding: '14px 28px', fontSize: 16,
              fontWeight: 700, cursor: 'pointer',
            }}
          >
            Konsultasi dengan Tim
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        background: '#1a1a2e', color: '#d1d5db', padding: '48px 48px 24px',
      }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr',
          gap: 40, maxWidth: 1100, margin: '0 auto 40px',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 14,
              }}>
                📖
              </div>
              <span style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>
                Perpustakaan<span style={{ color: '#a29bfe' }}>Belajar</span>
              </span>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: '#9ca3af', margin: 0, maxWidth: 280 }}>
              Platform edukasi interaktif ramah anak untuk siswa SD dalam membangun kecintaan belajar, dan kegemaran membaca sejak dini.
            </p>
          </div>
          <div>
            <h4 style={{
              fontSize: 13, fontWeight: 700, color: '#fff',
              textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 14px',
            }}>
              NAVIGASI
            </h4>
            {['Beranda', 'Fitur Unggulan', 'Cara Kerja', 'Harga', 'Tentang Kami'].map(l => (
              <div key={l} style={{ marginBottom: 8 }}>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 14, color: '#9ca3af', padding: 0,
                  }}
                >
                  {l}
                </button>
              </div>
            ))}
          </div>
          <div>
            <h4 style={{
              fontSize: 13, fontWeight: 700, color: '#fff',
              textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 14px',
            }}>
              LAINNYA
            </h4>
            {['Kebijakan Privasi', 'Syarat & Ketentuan', 'Hubungi Kami', 'Berita & FAQ'].map(l => (
              <div key={l} style={{ marginBottom: 8 }}>
                <button
                  type="button"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 14, color: '#9ca3af', padding: 0,
                  }}
                >
                  {l}
                </button>
              </div>
            ))}
          </div>
          <div>
            <h4 style={{
              fontSize: 13, fontWeight: 700, color: '#fff',
              textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 14px',
            }}>
              NEWSLETTER
            </h4>
            <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 12px', lineHeight: 1.6 }}>
              Dapatkan update dan promosi menarik! Masukkan alamat email Anda.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="email"
                placeholder="Email kamu..."
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: 10,
                  border: '1px solid #2d2d4e', background: '#252540',
                  color: '#fff', fontSize: 14, outline: 'none',
                }}
              />
              <button
                type="button"
                style={{
                  background: '#6c5ce7', color: '#fff', border: 'none',
                  borderRadius: 10, padding: '10px 20px', fontSize: 14,
                  fontWeight: 600, cursor: 'pointer',
                }}
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>
        <div style={{
          borderTop: '1px solid #2d2d4e', paddingTop: 20,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          maxWidth: 1100, margin: '0 auto',
        }}>
          <span style={{ fontSize: 13, color: '#6b7280' }}>
            © 2025 Perpustakaan Belajar. All rights reserved.
          </span>
          <div style={{ display: 'flex', gap: 12 }}>
            {['🐦', '📸', '📘'].map((icon, i) => (
              <span key={i} style={{
                width: 32, height: 32, borderRadius: 8,
                background: '#252540', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 14, cursor: 'pointer',
              }}>
                {icon}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
