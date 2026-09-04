import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'

const FEATURES = [
  {
    title: 'Materi Terstruktur',
    desc: 'Kurikulum yang disusun berdasarkan standar pendidikan nasional, disesuaikan dengan usia dan tingkatan kelas anak agar pemahaman terbentuk kokoh.',
    link: 'Sesuai Kurikulum Merdeka',
    bgColor: '#ede9fe',
    fgColor: '#7c3aed',
    icon: (
      <svg
        width='24'
        height='24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
        viewBox='0 0 24 24'
      >
        <path d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' />
      </svg>
    ),
  },
  {
    title: 'Aktivitas Beragam',
    desc: 'Kombinasi video animasi menarik, kuis seru, dan permainan edukatif yang membuat proses belajar terasa alami seperti saat bermain bersama teman.',
    link: 'Visual Ramah Anak',
    bgColor: '#e0e7ff',
    fgColor: '#4f46e5',
    icon: (
      <svg
        width='24'
        height='24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
        viewBox='0 0 24 24'
      >
        <path d='M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z' />
        <path d='M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
      </svg>
    ),
  },
  {
    title: 'Kuis Seru & Berhadiah',
    desc: 'Uji pemahaman dengan tantangan harian menyenangkan yang memberikan lencana bintang virtual dan apresiasi setiap kali anak berhasil menyelesaikan tes.',
    link: 'Gamifikasi Edukasi',
    bgColor: '#fef3c7',
    fgColor: '#d97706',
    icon: (
      <svg
        width='24'
        height='24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
        viewBox='0 0 24 24'
      >
        <path d='M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' />
      </svg>
    ),
  },
  {
    title: 'Pantau Progres Belajar',
    desc: 'Orang tua dapat melihat grafik perkembangan belajar anak secara real-time melalui dashboard analitik orang tua yang sederhana dan mudah dipahami.',
    link: 'Laporan Mingguan via WA',
    bgColor: '#d1fae5',
    fgColor: '#059669',
    icon: (
      <svg
        width='24'
        height='24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
        viewBox='0 0 24 24'
      >
        <path d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' />
      </svg>
    ),
  },
  {
    title: 'Belajar Mandiri',
    desc: 'Dapat diakses fleksibel kapan saja dan di mana saja menggunakan tablet, laptop, atau smartphone, mendukung ritme belajar unik masing-masing anak.',
    link: 'Multi-Device Ready',
    bgColor: '#e0f2fe',
    fgColor: '#0284c7',
    icon: (
      <svg
        width='24'
        height='24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
        viewBox='0 0 24 24'
      >
        <path d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
      </svg>
    ),
  },
  {
    title: 'Komunitas Peduli Belajar',
    desc: 'Bergabung dalam lingkaran komunitas orang tua dan guru pendidik untuk berbagi tips mendidik, konsultasi psikologi anak, serta inspirasi harian.',
    link: 'Webinar Rutin Gratis',
    bgColor: '#fce7f3',
    fgColor: '#db2777',
    icon: (
      <svg
        width='24'
        height='24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
        viewBox='0 0 24 24'
      >
        <path d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' />
      </svg>
    ),
  },
]

const STEPS = [
  {
    n: '01',
    label: 'Langkah 01',
    title: 'Daftar Akun Secara Gratis',
    desc: 'Buat akun gratis dalam hitungan detik. Tidak memerlukan kartu kredit untuk memulai eksplorasi materi pertama anak Anda.',
  },
  {
    n: '02',
    label: 'Langkah 02',
    title: 'Pilih Kelas & Mata Pelajaran',
    desc: 'Sesuaikan materi dengan jenjang kelas anak (Kelas 1 hingga 6) serta topik yang ingin diperdalam, mulai dari hitungan dasar hingga sains terapan.',
  },
  {
    n: '03',
    label: 'Langkah 03',
    title: 'Mulai Belajar & Pantau Kemajuan',
    desc: 'Nikmati pengalaman belajar interaktif yang seru dan pantau grafik capaian belajar anak Anda langsung dari dasbor orang tua.',
  },
]

const NAV_ITEMS = [
  { label: 'Beranda', id: 'beranda' },
  { label: 'Fitur', id: 'fitur' },
  { label: 'Cara Kerja', id: 'cara-kerja' },
  { label: 'Harga', route: '/harga' },
  { label: 'Tentang', id: 'tentang' },
]

const AVATARS = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDAfcFtk-2G8w-cQifWYFcOT-3j6S6pfx2WkIkvFmloa_yz8uJLodL7mJiq1SNL1tXAEmcSNFeeEhkdj35rKNVkuWemVWW6CAZ-5SDdJ1lYhwGKj_BxykFE-IlyASb4eb59mdlCpvqW7VV7oYnhRRSRP9Bsrqrgbt_Hm4AEow1FUutalkGQSDYVUhclgEUEpZobYGl5whZRfmGdcCqDixkWc3faw2VbQ8zZvt7R8mz39MEvF9EL6isN4Q',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBbeU3sOV6KKQB_lUJ2GZGQ577OPfsMGAs_SGNd1KfmZENYiPPA3OyWCPaM8wA4708OYzdRiQR2lgpx10WR2hjc_YjwiNDfYFA36db46do2Jl5KW-N9L-Dyvywx6mtl7pUVNnD3lvDZN1t8Mm_1rsrFCBFm9h3nWtc6qsjUC0t3VSvgfUhd6zpE_17k9ybfUv5hRdu7CEFyEVy0j9yXyIeEIHYelJFB0JGbCQzaSFaAHgSe_BNdBcnB_Q',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCiczWESn-SeovQms4Vy46Prqo2mzNimOyh5L2GDjodhjklCbvpDHxR-Bm88wYE4dw18pDafdrOKYX2E8VeLG088hU8fyzbx_umKZycyVosU-WYfS3bLfA9o7M8kPITUk15fAgsPGOccLSGi0zUF1jkcDlbomAe47AIuY11mThr8E57JwkdAw85QPM3v783B2bclj8TzfLpL8JTIKby6d16y68nsIE_Dad7EFh-wPhohPL1Jqe-KS2myA',
]

export default function Landing() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  const handleNav = (item: (typeof NAV_ITEMS)[number]) => {
    if (item.route) navigate(item.route)
    else if (item.id) scrollTo(item.id)
  }

  return (
    <div
      style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        color: '#1E293B',
        background: '#FAFAFC',
      }}
    >
      {/* ═══════ HEADER ═══════ */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '0 24px',
            height: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Logo */}
          {/* <button
            type="button"
            onClick={() => navigate('/')}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(124,58,237,0.2)',
            }}>
              <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                Perpustakaan <span style={{ color: '#7c3aed', fontWeight: 800 }}>Belajar</span>
              </span>
              <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                Edukasi Interaktif
              </span>
            </div>
          </button> */}
          <Logo />
          {/* Desktop Nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            {NAV_ITEMS.map((item) => (
              <button
                key={item.label}
                type='button'
                onClick={() => handleNav(item)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  color: item.id === 'beranda' ? '#7c3aed' : '#64748b',
                  padding: 0,
                  transition: 'color 0.2s',
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Auth Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {user ? (
              <button
                type='button'
                onClick={() =>
                  navigate(user.role === 'PARENT' ? '/parent' : '/anak')
                }
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#64748b',
                }}
              >
                Dashboard
              </button>
            ) : (
              <button
                type='button'
                onClick={() => navigate('/masuk')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#64748b',
                }}
              >
                Masuk
              </button>
            )}
            <button
              type='button'
              onClick={() => navigate('/daftar')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px 22px',
                fontSize: 14,
                fontWeight: 600,
                color: '#fff',
                background: '#7c3aed',
                borderRadius: 9999,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(124,58,237,0.2)',
                transition: 'all 0.2s',
              }}
            >
              Daftar Gratis
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* ═══════ HERO ═══════ */}
        <section
          id='beranda'
          style={{
            position: 'relative',
            paddingTop: 32,
            paddingBottom: 64,
            overflow: 'hidden',
          }}
        >
          {/* Background glow */}
          <div
            style={{
              position: 'absolute',
              top: '25%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 700,
              height: 350,
              borderRadius: '50%',
              background: 'rgba(221,214,254,0.4)',
              filter: 'blur(130px)',
              zIndex: -1,
              pointerEvents: 'none',
            }}
          />
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '7fr 5fr',
                gap: 48,
                alignItems: 'center',
              }}
            >
              {/* Left */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 24,
                  alignItems: 'flex-start',
                }}
              >
                {/* Badge */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 14px',
                    borderRadius: 9999,
                    background: '#f5f3ff',
                    border: '1px solid rgba(221,214,254,0.7)',
                    color: '#6d28d9',
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#7c3aed',
                    }}
                  />
                  Pendaftaran Semester Ganjil Dibuka
                </div>

                {/* Headline */}
                <h1
                  style={{
                    fontSize: 52,
                    fontWeight: 800,
                    color: '#0f172a',
                    lineHeight: 1.12,
                    letterSpacing: -0.5,
                    margin: 0,
                  }}
                >
                  Belajar Jadi Lebih <br />
                  <span
                    style={{
                      background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontStyle: 'italic',
                    }}
                  >
                    Menyenangkan
                  </span>
                  , <br />
                  Berkembang Setiap Hari.
                </h1>

                {/* Subtitle */}
                <p
                  style={{
                    fontSize: 17,
                    color: '#64748b',
                    lineHeight: 1.7,
                    maxWidth: 520,
                    margin: 0,
                  }}
                >
                  Platform belajar interaktif yang membantu anak SD menguasai
                  Matematika, Sains, dan Bahasa dengan visual yang seru,
                  adaptif, dan tidak membosankan.
                </p>

                {/* CTA Buttons */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 16,
                    paddingTop: 8,
                  }}
                >
                  <button
                    type='button'
                    onClick={() => navigate('/daftar')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '14px 28px',
                      borderRadius: 12,
                      fontSize: 16,
                      fontWeight: 700,
                      color: '#fff',
                      background: '#7c3aed',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 10px 30px -8px rgba(124,58,237,0.4)',
                      transition: 'all 0.2s',
                    }}
                  >
                    <span>Mulai Belajar Gratis</span>
                    <svg
                      width='16'
                      height='16'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2.5'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      viewBox='0 0 24 24'
                    >
                      <path d='M14 5l7 7m0 0l-7 7m7-7H3' />
                    </svg>
                  </button>
                  <button
                    type='button'
                    onClick={() => navigate('/masuk')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '14px 24px',
                      borderRadius: 12,
                      fontSize: 16,
                      fontWeight: 700,
                      color: '#334155',
                      background: '#fff',
                      border: '1px solid #e2e8f0',
                      cursor: 'pointer',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      transition: 'all 0.2s',
                    }}
                  >
                    <svg
                      width='16'
                      height='16'
                      fill='#7c3aed'
                      viewBox='0 0 24 24'
                    >
                      <path d='M8 5v14l11-7z' />
                    </svg>
                    <span>Lihat Video Demo</span>
                  </button>
                </div>

                {/* Social Proof */}
                <div
                  style={{
                    paddingTop: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    borderTop: '1px solid rgba(226,232,240,0.6)',
                    width: '100%',
                    maxWidth: 420,
                  }}
                >
                  <div style={{ display: 'flex' }}>
                    {AVATARS.map((src, i) => (
                      <img
                        key={i}
                        alt='Pengguna'
                        src={src}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '2px solid #fff',
                          marginLeft: i > 0 ? -10 : 0,
                        }}
                      />
                    ))}
                  </div>
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        color: '#fbbf24',
                        fontSize: 12,
                      }}
                    >
                      {'★★★★★'}
                      <span
                        style={{
                          color: '#1e293b',
                          fontWeight: 700,
                          fontSize: 14,
                          marginLeft: 4,
                        }}
                      >
                        4.9/5
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: 12,
                        color: '#64748b',
                        fontWeight: 500,
                        margin: 0,
                      }}
                    >
                      5,000+ Siswa Aktif & Didukung Orang Tua
                    </p>
                  </div>
                </div>
              </div>

              {/* Right – Hero Visual */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    maxWidth: 420,
                    borderRadius: 24,
                    padding: 12,
                    background:
                      'linear-gradient(180deg, rgba(237,233,254,0.6), rgba(255,255,255,0.8))',
                    border: '1px solid #ede9fe',
                    boxShadow: '0 25px 60px -12px rgba(0,0,0,0.08)',
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      borderRadius: 16,
                      overflow: 'hidden',
                      background: '#fff',
                      aspectRatio: '4/4.5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <img
                      alt='Anak-anak belajar bersama'
                      src='https://lh3.googleusercontent.com/aida-public/AB6AXuDFo8uu_g53Xcb5qkDzkjPVnxwj_E0E0Uvp5Vf4GamrY70GA7E6FqN94vYIeAtuR_yKFxUCuiERXI6e6Ut6z2e9ItuilMyXHcT4OTtwvITwH9QrywqZAZUNQEkV8YicGTvUrAkBRyWghZvNVo3G3BC0axATpfHi64wUL4BPQQ9qb9kRliHblhfJHWe4BbfG8lUMoZVqZ5xlHdF6HM1Bq2y1gIaqeAhG9qPa_Gn03djpMnUK0Eg1_hBuJA'
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />

                    {/* Floating badge top-left */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 16,
                        left: 16,
                        background: 'rgba(255,255,255,0.9)',
                        backdropFilter: 'blur(8px)',
                        borderRadius: 12,
                        padding: '6px 12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        border: '1px solid #f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 13,
                        fontWeight: 800,
                        color: '#7c3aed',
                      }}
                    >
                      ★ Modul Interaktif
                    </div>

                    {/* Floating achievement badge bottom */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 16,
                        left: 16,
                        right: 16,
                        background: 'rgba(255,255,255,0.95)',
                        backdropFilter: 'blur(12px)',
                        borderRadius: 16,
                        padding: '14px 16px',
                        border: '1px solid rgba(241,245,249,0.9)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                      }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          background: '#d1fae5',
                          color: '#059669',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <svg
                          width='24'
                          height='24'
                          fill='none'
                          stroke='currentColor'
                          strokeWidth='2'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          viewBox='0 0 24 24'
                        >
                          <path d='M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' />
                        </svg>
                      </div>
                      <div>
                        <p
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: '#94a3b8',
                            textTransform: 'uppercase',
                            letterSpacing: 1,
                            margin: 0,
                          }}
                        >
                          Pencapaian Siswa
                        </p>
                        <p
                          style={{
                            fontSize: 16,
                            fontWeight: 800,
                            color: '#1e293b',
                            margin: '2px 0 0',
                          }}
                        >
                          1.2jt+ Kuis Diselesaikan
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════ STATS ═══════ */}
        <section style={{ padding: '16px 0' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
            <div
              style={{
                background: '#fff',
                borderRadius: 24,
                border: '1px solid #f1f5f9',
                boxShadow: '0 10px 40px -10px rgba(124,58,237,0.08)',
                padding: '28px 32px',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 24,
                  textAlign: 'center',
                }}
              >
                {[
                  { value: '1–6', label: 'Tingkat Kelas SD' },
                  { value: '4+', label: 'Mata Pelajaran Utama' },
                  { value: '100+', label: 'Modul & Game Interaktif' },
                  { value: '24/7', label: 'Akses Mandiri Fleksibel' },
                ].map((s, i) => (
                  <div
                    key={s.label}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 8,
                      borderRight: i < 3 ? '1px solid #f1f5f9' : 'none',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 36,
                        fontWeight: 800,
                        color: '#7c3aed',
                      }}
                    >
                      {s.value}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                        marginTop: 6,
                      }}
                    >
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════ FEATURES ═══════ */}
        <section id='fitur' style={{ padding: '80px 0' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
            {/* Header */}
            <div
              style={{
                textAlign: 'center',
                maxWidth: 720,
                margin: '0 auto 64px',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#7c3aed',
                  textTransform: 'uppercase',
                  letterSpacing: 2,
                  background: '#f5f3ff',
                  padding: '4px 14px',
                  borderRadius: 9999,
                  border: '1px solid #ede9fe',
                }}
              >
                Keunggulan Belajar
              </span>
              <h2
                style={{
                  fontSize: 36,
                  fontWeight: 800,
                  color: '#0f172a',
                  lineHeight: 1.2,
                  marginTop: 12,
                }}
              >
                Fitur Unggulan untuk Masa Depan Cerah
              </h2>
              <p
                style={{
                  fontSize: 16,
                  color: '#64748b',
                  lineHeight: 1.7,
                  marginTop: 12,
                }}
              >
                Dirancang khusus dengan pendekatan saintifik dan pedagogi ramah
                anak agar kegiatan belajar mandiri terasa seperti petualangan
                seru.
              </p>
            </div>

            {/* Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 24,
              }}
            >
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  style={{
                    background: '#fff',
                    borderRadius: 16,
                    padding: 28,
                    border: '1px solid #f1f5f9',
                    boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.3s',
                  }}
                >
                  <div>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: f.bgColor,
                        color: f.fgColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 20,
                      }}
                    >
                      {f.icon}
                    </div>
                    <h3
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: '#0f172a',
                        marginBottom: 8,
                      }}
                    >
                      {f.title}
                    </h3>
                    <p
                      style={{
                        fontSize: 14,
                        color: '#64748b',
                        lineHeight: 1.7,
                        margin: 0,
                      }}
                    >
                      {f.desc}
                    </p>
                  </div>
                  <div
                    style={{
                      marginTop: 24,
                      paddingTop: 16,
                      borderTop: '1px solid #f1f5f9',
                      fontSize: 13,
                      fontWeight: 600,
                      color: f.fgColor,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    {f.link} <span>→</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════ HOW IT WORKS ═══════ */}
        <section
          id='cara-kerja'
          style={{
            padding: '80px 0',
            background: '#fff',
            borderTop: '1px solid #f1f5f9',
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 64,
                alignItems: 'center',
              }}
            >
              {/* Steps */}
              <div>
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: 12,
                    fontWeight: 800,
                    color: '#7c3aed',
                    textTransform: 'uppercase',
                    letterSpacing: 2,
                    background: '#f5f3ff',
                    padding: '4px 14px',
                    borderRadius: 9999,
                    border: '1px solid #ede9fe',
                    marginBottom: 12,
                  }}
                >
                  Alur Sederhana
                </span>
                <h2
                  style={{
                    fontSize: 36,
                    fontWeight: 800,
                    color: '#0f172a',
                    lineHeight: 1.2,
                    marginBottom: 32,
                  }}
                >
                  Cara Kerja Cepat & Praktis
                </h2>
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
                >
                  {STEPS.map((s) => (
                    <div
                      key={s.n}
                      style={{
                        display: 'flex',
                        gap: 16,
                        padding: 20,
                        borderRadius: 16,
                        background: 'rgba(248,250,252,0.8)',
                        border: '1px solid #f1f5f9',
                        transition: 'background 0.2s',
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          flexShrink: 0,
                          background: '#7c3aed',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 14,
                          fontWeight: 800,
                          boxShadow: '0 4px 12px rgba(124,58,237,0.2)',
                        }}
                      >
                        {s.n}
                      </div>
                      <div>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: '#7c3aed',
                            textTransform: 'uppercase',
                            letterSpacing: 1,
                          }}
                        >
                          {s.label}
                        </span>
                        <h3
                          style={{
                            fontSize: 17,
                            fontWeight: 700,
                            color: '#0f172a',
                            margin: '2px 0 4px',
                          }}
                        >
                          {s.title}
                        </h3>
                        <p
                          style={{
                            fontSize: 14,
                            color: '#64748b',
                            lineHeight: 1.7,
                            margin: 0,
                          }}
                        >
                          {s.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visual */}
              <div
                style={{
                  position: 'relative',
                  borderRadius: 24,
                  overflow: 'hidden',
                  border: '1px solid #f1f5f9',
                  boxShadow: '0 25px 60px -12px rgba(0,0,0,0.08)',
                  aspectRatio: '4/3.8',
                }}
              >
                <img
                  alt='Anak belajar'
                  src='https://lh3.googleusercontent.com/aida-public/AB6AXuAHPO1-8PPGsGJOjs-xBOGyx3jBleM11Dp8o04mdaw72Ccza9ccOG8lJZOAOin52eCdup0Oflz0giQZOgLsR4yim0ZIy41lewZmov8hqMmrFFCMtEule7KkwoC-gjMx7MnOwrnYJWsH64QGi4-Lc5CCB_xY4X9HB6OiMYrpN8LajykuLxpMvskrh7R0Mfc7TknBEhdxelNm57TFPMJk0kSonpiLcssmdugW6f5HSpsOBjHC8WuQk9l7XA'
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(180deg, rgba(15,23,42,0.05) 0%, rgba(15,23,42,0.7) 100%)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: 24,
                    left: 24,
                    right: 24,
                    color: '#fff',
                  }}
                >
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '4px 12px',
                      borderRadius: 9999,
                      background: 'rgba(255,255,255,0.2)',
                      backdropFilter: 'blur(8px)',
                      fontSize: 12,
                      fontWeight: 600,
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: '#34d399',
                      }}
                    />
                    Metode Belajar Terbukti Efektif
                  </div>
                  <h4
                    style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}
                  >
                    Membangun Rasa Percaya Diri Sejak Dini
                  </h4>
                  <p
                    style={{
                      fontSize: 14,
                      color: '#cbd5e1',
                      margin: 0,
                      lineHeight: 1.6,
                    }}
                  >
                    94% orang tua merasakan peningkatan fokus dan nilai raport
                    anak setelah 30 hari.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════ CTA BANNER ═══════ */}
        <section style={{ padding: '64px 0 80px', position: 'relative' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
            <div
              style={{
                borderRadius: 24,
                background:
                  'linear-gradient(135deg, #6d28d9 0%, #7c3aed 40%, #6366f1 100%)',
                padding: '64px 48px',
                textAlign: 'center',
                color: '#fff',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 20px 50px -10px rgba(124,58,237,0.3)',
              }}
            >
              {/* Decorative blobs */}
              <div
                style={{
                  position: 'absolute',
                  top: -64,
                  right: -64,
                  width: 256,
                  height: 256,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                  filter: 'blur(40px)',
                  pointerEvents: 'none',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: -64,
                  left: -64,
                  width: 256,
                  height: 256,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                  filter: 'blur(40px)',
                  pointerEvents: 'none',
                }}
              />

              <div
                style={{
                  position: 'relative',
                  zIndex: 1,
                  maxWidth: 640,
                  margin: '0 auto',
                }}
              >
                <h2
                  style={{
                    fontSize: 40,
                    fontWeight: 800,
                    lineHeight: 1.2,
                    margin: '0 0 16px',
                  }}
                >
                  Siap Buat Belajar Lebih Menyenangkan?
                </h2>
                <p
                  style={{
                    fontSize: 17,
                    color: '#ddd6fe',
                    margin: '0 0 32px',
                    lineHeight: 1.7,
                  }}
                >
                  Daftarkan putra-putri Anda sekarang dan dapatkan uji coba
                  gratis selama 14 hari tanpa komitmen apa pun.
                </p>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 16,
                    justifyContent: 'center',
                  }}
                >
                  <button
                    type='button'
                    onClick={() => navigate('/daftar')}
                    style={{
                      padding: '16px 32px',
                      borderRadius: 12,
                      fontSize: 16,
                      fontWeight: 700,
                      color: '#7c3aed',
                      background: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    }}
                  >
                    Coba Gratis Sekarang
                  </button>
                  <button
                    type='button'
                    onClick={() => navigate('/masuk')}
                    style={{
                      padding: '16px 32px',
                      borderRadius: 12,
                      fontSize: 16,
                      fontWeight: 600,
                      color: '#fff',
                      background: 'rgba(76,29,149,0.6)',
                      border: '1px solid rgba(167,139,250,0.4)',
                      cursor: 'pointer',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    Konsultasi dengan Tim
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ═══════ FOOTER ═══════ */}
      <footer
        style={{
          background: '#fff',
          borderTop: '1px solid #e2e8f0',
          padding: '64px 0 48px',
          color: '#64748b',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '4fr 2fr 2fr 4fr',
              gap: 40,
              paddingBottom: 48,
              borderBottom: '1px solid #f1f5f9',
            }}
          >
            {/* Brand */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: '#7c3aed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                  }}
                >
                  <svg
                    width='18'
                    height='18'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2.5'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    viewBox='0 0 24 24'
                  >
                    <path d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' />
                  </svg>
                </div>
                <span
                  style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}
                >
                  Perpustakaan <span style={{ color: '#7c3aed' }}>Belajar</span>
                </span>
              </div>
              <p
                style={{
                  fontSize: 14,
                  color: '#64748b',
                  lineHeight: 1.7,
                  maxWidth: 300,
                  margin: 0,
                }}
              >
                Platform edukasi interaktif ramah anak untuk siswa SD kelas 1
                hingga 6. Membina rasa ingin tahu dan kegemaran belajar seumur
                hidup.
              </p>
            </div>

            {/* Navigasi */}
            <div>
              <h4
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#0f172a',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  margin: '0 0 14px',
                }}
              >
                Navigasi
              </h4>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                {[
                  { label: 'Beranda', id: 'beranda' },
                  { label: 'Fitur Unggulan', id: 'fitur' },
                  { label: 'Cara Kerja', id: 'cara-kerja' },
                  { label: 'Harga', route: '/harga' },
                  { label: 'Tentang Kami', id: 'tentang' },
                ].map((l) => (
                  <li key={l.label}>
                    <button
                      type='button'
                      onClick={() =>
                        l.route ? navigate(l.route) : scrollTo(l.id!)
                      }
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 14,
                        color: '#64748b',
                        padding: 0,
                      }}
                    >
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Lainnya */}
            <div>
              <h4
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#0f172a',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  margin: '0 0 14px',
                }}
              >
                Lainnya
              </h4>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                {[
                  'Kebijakan Privasi',
                  'Syarat & Ketentuan',
                  'Hubungi Kami',
                  'Bantuan & FAQ',
                ].map((l) => (
                  <li key={l}>
                    <button
                      type='button'
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 14,
                        color: '#64748b',
                        padding: 0,
                      }}
                    >
                      {l}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#0f172a',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  margin: '0 0 14px',
                }}
              >
                Newsletter
              </h4>
              <p
                style={{
                  fontSize: 12,
                  color: '#94a3b8',
                  margin: '0 0 12px',
                  lineHeight: 1.6,
                }}
              >
                Dapatkan tips belajar mingguan dan promo khusus langsung di
                inbox Anda.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type='email'
                  placeholder='Email kamu'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    background: '#fff',
                    color: '#0f172a',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
                <button
                  type='button'
                  style={{
                    padding: '10px 20px',
                    borderRadius: 12,
                    background: '#0f172a',
                    color: '#fff',
                    border: 'none',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div
            style={{
              paddingTop: 32,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 13,
              color: '#94a3b8',
            }}
          >
            <p style={{ margin: 0 }}>
              © 2026 Perpustakaan Belajar. All rights reserved.
            </p>
            <div style={{ display: 'flex', gap: 20 }}>
              {/* Instagram */}
              <a
                href='#'
                style={{ color: '#94a3b8', transition: 'color 0.2s' }}
              >
                <svg
                  width='16'
                  height='16'
                  fill='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path d='M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' />
                </svg>
              </a>
              {/* Twitter */}
              <a
                href='#'
                style={{ color: '#94a3b8', transition: 'color 0.2s' }}
              >
                <svg
                  width='16'
                  height='16'
                  fill='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path d='M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.936 9.936 0 0024 4.59z' />
                </svg>
              </a>
              {/* Facebook */}
              <a
                href='#'
                style={{ color: '#94a3b8', transition: 'color 0.2s' }}
              >
                <svg
                  width='16'
                  height='16'
                  fill='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path d='M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.556 5 15.658 5H18V0h-3.808C10.595 0 9 1.583 9 4.615V8z' />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
