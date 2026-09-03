import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchPlans, createCheckout, type Plan, ApiError } from '../lib/api'

const CheckIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M5 13l4 4L19 7" />
  </svg>
)

const ChevronIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M19 9l-7 7-7-7" />
  </svg>
)

const BookIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
)

const NAV_ITEMS = [
  { label: 'Beranda', id: 'beranda' },
  { label: 'Fitur', id: 'fitur' },
  { label: 'Cara Kerja', id: 'cara-kerja' },
  { label: 'Harga', route: '/harga' },
  { label: 'Tentang', id: 'tentang' },
]

const FAQ_ITEMS = [
  {
    q: 'Apakah saya bisa membatalkan langganan kapan saja?',
    a: 'Tentu saja! Anda memiliki fleksibilitas penuh untuk membatalkan paket langganan kapan saja melalui dasbor akun orang tua tanpa dikenakan biaya denda atau penalti apapun.',
  },
  {
    q: 'Metode pembayaran apa saja yang didukung?',
    a: 'Kami mendukung pembayaran otomatis dan instan via QRIS (GoPay, OVO, Dana, ShopeePay), Transfer Virtual Account (BCA, Mandiri, BNI, BRI), serta Kartu Kredit/Debit berlogo Visa dan Mastercard yang ditenagai oleh Xendit.',
  },
  {
    q: 'Apakah ada jaminan uang kembali?',
    a: 'Kami memberikan garansi pengembalian dana 100% dalam 7 hari pertama berlangganan paket Basic maupun Pro jika materi pembelajaran kami dirasa belum sesuai dengan kebutuhan anak Anda.',
  },
  {
    q: 'Apakah satu akun bisa digunakan untuk lebih dari satu anak?',
    a: 'Paket Pro mendukung hingga 3 profil anak sekaligus dalam satu akun orang tua, lengkap dengan riwayat belajar dan pelaporan kemajuan mingguan individual via WhatsApp.',
  },
]

const STATIC_PLANS = [
  {
    id: 'free-trial',
    name: 'Gratis',
    nameEn: 'Free Trial',
    price: 'Gratis',
    period: '/ 14 hari',
    features: ['Semua fitur', 'Berlaku 14 hari', 'Tanpa kartu kredit'],
    button: 'Sudah termasuk saat daftar',
    style: 'default' as const,
    interval: 'trial',
  },
  {
    id: 'basic',
    name: 'Basic',
    nameEn: 'Basic',
    price: 'Rp 150.000',
    period: '/bulan',
    features: ['Fitur utama', 'Akses semua modul kelas 1–6', 'Progres & riwayat belajar'],
    button: 'Berlangganan Basic',
    style: 'default' as const,
    interval: 'month',
  },
  {
    id: 'pro',
    name: 'Pro',
    nameEn: 'Pro',
    price: 'Rp 500.000',
    period: '/bulan',
    features: ['Semua fitur Basic', 'Analytics & laporan lanjutan', 'Dukungan prioritas', 'Laporan mingguan via WhatsApp'],
    button: 'Berlangganan Pro',
    style: 'popular' as const,
    interval: 'month',
  },
]

export default function Pricing() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [plans, setPlans] = useState<Plan[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [checkingOut, setCheckingOut] = useState<string | null>(null)
  const [email, setEmail] = useState('')

  useEffect(() => {
    fetchPlans()
      .then(setPlans)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Gagal memuat paket.'))
  }, [])

  const getDisplayPrice = (staticId: string): { price: string; period: string; features: string[] } => {
    if (!plans) {
      const s = STATIC_PLANS.find(p => p.id === staticId)!
      return { price: s.price, period: s.period, features: s.features }
    }
    const apiPlan = plans.find(p => staticId === 'free-trial' && p.interval === 'trial' || p.id === staticId)
    if (!apiPlan) {
      const s = STATIC_PLANS.find(p => p.id === staticId)!
      return { price: s.price, period: s.period, features: s.features }
    }
    const price = apiPlan.priceIdr === 0 ? 'Gratis' : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(apiPlan.priceIdr)
    const period = apiPlan.interval === 'trial' ? `/ ${apiPlan.trialDays} hari` : '/bulan'
    return { price, period, features: apiPlan.features }
  }

  const handleChoose = async (planId: string) => {
    if (!user) {
      navigate('/daftar')
      return
    }
    const apiPlan = plans?.find(p => p.id === planId)
    if (!apiPlan || apiPlan.interval === 'trial') return

    setError(null)
    setCheckingOut(planId)
    try {
      const { invoiceUrl } = await createCheckout(planId as 'basic' | 'pro')
      window.location.href = invoiceUrl
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memulai pembayaran.')
      setCheckingOut(null)
    }
  }

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#1e293b', background: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ═══════ HEADER ═══════ */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #f1f5f9',
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto', padding: '0 24px',
          height: 80, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <button
            type="button"
            onClick={() => navigate('/')}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: '#6355d8', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: '#fff',
              boxShadow: '0 4px 14px rgba(99,85,216,0.2)',
            }}>
              <BookIcon />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                Perpustakaan <span style={{ color: '#6355d8' }}>Belajar</span>
              </span>
              <span style={{ fontSize: 9.5, color: '#94a3b8', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>
                Edukasi Interaktif
              </span>
            </div>
          </button>

          <nav style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            {NAV_ITEMS.map((item) => {
              const isActive = item.route === '/harga'
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => item.route ? navigate(item.route) : navigate('/')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 14, fontWeight: isActive ? 700 : 600,
                    color: isActive ? '#6355d8' : '#64748b',
                    padding: 0,
                  }}
                >
                  {item.label}
                  {isActive && (
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: '#6355d8',
                    }} />
                  )}
                </button>
              )
            })}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {user ? (
              <button
                type="button"
                onClick={() => navigate(user.role === 'PARENT' ? '/parent' : '/anak')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 14, fontWeight: 600, color: '#64748b',
                }}
              >
                Dashboard
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/masuk')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 14, fontWeight: 600, color: '#475569',
                }}
              >
                Masuk
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate('/daftar')}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                padding: '10px 22px', fontSize: 14, fontWeight: 700, color: '#fff',
                background: '#6355d8', borderRadius: 9999, border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(99,85,216,0.25)',
              }}
            >
              Daftar Gratis
            </button>
          </div>
        </div>
      </header>

      <main style={{ flex: 1, background: '#fbfdff' }}>
        {/* ═══════ PRICING HERO ═══════ */}
        <section style={{ padding: '64px 24px 32px', textAlign: 'center' }}>
          <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 16px', borderRadius: 9999,
              background: '#f4f3ff', border: '1px solid #d9d4fe',
              color: '#6355d8', fontSize: 12, fontWeight: 700,
              letterSpacing: 0.5, marginBottom: 24,
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              ✦ Paket & Harga Transparan
            </div>
            <h1 style={{
              fontSize: 44, fontWeight: 800, color: '#0f172a',
              lineHeight: 1.15, letterSpacing: -0.5, maxWidth: 600,
            }}>
              Paket yang sesuai untuk semua
            </h1>
            <p style={{
              fontSize: 17, color: '#64748b', lineHeight: 1.7,
              maxWidth: 600, marginTop: 20,
            }}>
              Mulai gratis 14 hari dengan akses semua fitur. Lanjutkan ke Basic atau Pro kapan pun Anda siap — pembayaran aman lewat Xendit.
            </p>

            {/* Toggle */}
            <div style={{
              marginTop: 32, display: 'inline-flex', alignItems: 'center',
              background: '#fff', padding: 4, borderRadius: 9999,
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              <button
                type="button"
                style={{
                  padding: '8px 20px', borderRadius: 9999, fontSize: 14,
                  fontWeight: 700, color: '#fff', background: '#6355d8',
                  border: 'none', cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(99,85,216,0.3)',
                }}
              >
                Bulanan
              </button>
              <button
                type="button"
                style={{
                  padding: '8px 20px', borderRadius: 9999, fontSize: 14,
                  fontWeight: 600, color: '#64748b', background: 'transparent',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                Tahunan
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 8px',
                  borderRadius: 9999, background: '#d1fae5', color: '#047857',
                }}>
                  Hemat 20%
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* ═══════ PRICING CARDS ═══════ */}
        <section style={{ padding: '16px 24px 96px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            {error && (
              <p style={{
                maxWidth: 480, margin: '0 auto 24px', padding: '12px 20px',
                borderRadius: 12, background: '#fef2f2', color: '#dc2626',
                fontSize: 14, fontWeight: 500, textAlign: 'center',
              }}>
                {error}
              </p>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, paddingTop: 16 }}>
              {STATIC_PLANS.map((plan) => {
                const { price, period, features } = getDisplayPrice(plan.id)
                const isPro = plan.style === 'popular'
                return (
                  <article
                    key={plan.id}
                    style={{
                      background: '#fff', borderRadius: 24, padding: 32,
                      border: isPro ? '2px solid rgba(255,90,95,0.7)' : '1px solid #f1f5f9',
                      boxShadow: isPro
                        ? '0 15px 40px rgba(255,90,95,0.12)'
                        : '0 10px 35px rgba(0,0,0,0.05)',
                      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                      position: 'relative',
                    }}
                  >
                    {/* Popular badge */}
                    {isPro && (
                      <div style={{
                        position: 'absolute', top: -14, left: '50%',
                        transform: 'translateX(-50%)', zIndex: 10,
                      }}>
                        <span style={{
                          background: '#FF5A5F', color: '#fff',
                          fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
                          padding: '6px 16px', borderRadius: 9999,
                          letterSpacing: 1, boxShadow: '0 2px 6px rgba(255,90,95,0.3)',
                        }}>
                          Paling Populer
                        </span>
                      </div>
                    )}

                    <div>
                      <h3 style={{
                        fontSize: 20, fontWeight: 800, fontStyle: 'italic',
                        color: '#1e293b', margin: isPro ? '8px 0 0' : 0,
                      }}>
                        {plan.nameEn}
                      </h3>
                      <div style={{ marginTop: 20, display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        <span style={{ fontSize: 30, fontWeight: 900, color: '#0f172a' }}>{price}</span>
                        <span style={{ fontSize: 14, fontWeight: 500, color: '#64748b' }}>{period}</span>
                      </div>
                      <div style={{ height: 1, background: '#f1f5f9', margin: '24px 0' }} />
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {features.map((f) => (
                          <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, fontWeight: 500, color: '#475569' }}>
                            <span style={{
                              width: 20, height: 20, borderRadius: '50%',
                              background: '#d1fae5', color: '#059669',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0,
                            }}>
                              <CheckIcon />
                            </span>
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div style={{ marginTop: 32, paddingTop: 16 }}>
                      <button
                        type="button"
                        onClick={() => handleChoose(plan.id)}
                        disabled={checkingOut === plan.id}
                        style={{
                          display: 'block', width: '100%', textAlign: 'center',
                          padding: '14px 16px', borderRadius: 9999, fontSize: 14,
                          fontWeight: 700, border: 'none', cursor: 'pointer',
                          ...(isPro ? {
                            background: '#6355d8', color: '#fff',
                            boxShadow: '0 8px 24px rgba(99,85,216,0.3)',
                          } : {
                            background: '#fff', color: '#1e293b',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                          }),
                          opacity: checkingOut === plan.id ? 0.6 : 1,
                        }}
                      >
                        {checkingOut === plan.id ? 'Memproses...' : plan.button}
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>

            {/* Payment Security Bar */}
            <div style={{
              marginTop: 56, paddingTop: 32,
              borderTop: '1px solid rgba(226,232,240,0.6)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexWrap: 'wrap', gap: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, color: '#64748b' }}>
                <svg width="16" height="16" fill="#059669" viewBox="0 0 20 20">
                  <path clipRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" fillRule="evenodd" />
                </svg>
                Semua transaksi dienkripsi 256-bit SSL dan diproses instan melalui Payment Gateway resmi Xendit
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {['QRIS', 'BCA', 'MANDIRI', 'VISA / MASTER'].map(m => (
                  <span key={m} style={{
                    padding: '4px 10px', background: '#fff', borderRadius: 4,
                    border: '1px solid #e2e8f0', fontSize: 11, fontWeight: 700,
                    color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5,
                  }}>
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════ FAQ ═══════ */}
        <section style={{ padding: '64px 0', background: '#fff', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <span style={{
                display: 'inline-block', fontSize: 12, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: 2, color: '#6355d8',
                background: '#f4f3ff', padding: '4px 14px', borderRadius: 9999,
              }}>
                Bantuan Pelanggan
              </span>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginTop: 12 }}>
                Pertanyaan yang Sering Diajukan
              </h2>
              <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 8 }}>
                Semua hal yang perlu Anda ketahui tentang paket langganan Perpustakaan Belajar.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {FAQ_ITEMS.map((item, i) => (
                <details
                  key={i}
                  style={{
                    background: 'rgba(248,250,252,0.8)', borderRadius: 16,
                    padding: 20, border: '1px solid #f1f5f9',
                  }}
                >
                  <summary style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    cursor: 'pointer', fontWeight: 700, color: '#1e293b', fontSize: 16,
                    listStyle: 'none',
                  }}>
                    <span>{item.q}</span>
                    <span style={{
                      marginLeft: 16, flexShrink: 0, width: 24, height: 24,
                      borderRadius: '50%', background: '#fff',
                      border: '1px solid #e2e8f0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#94a3b8',
                    }}>
                      <ChevronIcon />
                    </span>
                  </summary>
                  <p style={{ marginTop: 12, color: '#64748b', fontSize: 14, lineHeight: 1.7 }}>
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════ CTA BANNER ═══════ */}
        <section style={{ padding: '64px 24px 80px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{
              borderRadius: 24,
              background: 'linear-gradient(135deg, #6355d8, #6366f1)',
              padding: '64px 48px', textAlign: 'center', color: '#fff',
              position: 'relative', overflow: 'hidden',
              boxShadow: '0 20px 50px -10px rgba(99,85,216,0.3)',
            }}>
              <div style={{
                position: 'absolute', top: -96, right: -96,
                width: 256, height: 256, borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)', filter: 'blur(48px)',
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute', bottom: -96, left: -96,
                width: 256, height: 256, borderRadius: '50%',
                background: 'rgba(88,28,135,0.2)', filter: 'blur(48px)',
                pointerEvents: 'none',
              }} />
              <div style={{ position: 'relative', zIndex: 1, maxWidth: 640, margin: '0 auto' }}>
                <h2 style={{ fontSize: 36, fontWeight: 800, lineHeight: 1.2 }}>
                  Siap Buat Belajar Lebih Menyenangkan?
                </h2>
                <p style={{ fontSize: 16, color: '#ddd6fe', marginTop: 16, lineHeight: 1.7 }}>
                  Daftarkan putra-putri Anda sekarang dan dapatkan uji coba gratis selama 14 hari tanpa komitmen apa pun.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', marginTop: 32 }}>
                  <button
                    type="button"
                    onClick={() => navigate('/daftar')}
                    style={{
                      padding: '14px 28px', borderRadius: 9999, fontSize: 14,
                      fontWeight: 700, color: '#6355d8', background: '#fff',
                      border: 'none', cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                    }}
                  >
                    Coba Gratis Sekarang
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/masuk')}
                    style={{
                      padding: '14px 28px', borderRadius: 9999, fontSize: 14,
                      fontWeight: 700, color: '#fff',
                      background: 'rgba(67,55,163,0.6)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      cursor: 'pointer',
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
      <footer style={{
        background: '#fff', borderTop: '1px solid rgba(226,232,240,0.8)',
        padding: '64px 0 48px', color: '#64748b',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '5fr 2fr 2fr 3fr',
            gap: 40, paddingBottom: 48, borderBottom: '1px solid #f1f5f9',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: '#6355d8', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', color: '#fff',
                }}>
                  <BookIcon />
                </div>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                  Perpustakaan <span style={{ color: '#6355d8' }}>Belajar</span>
                </span>
              </div>
              <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.7, maxWidth: 300, margin: 0 }}>
                Platform edukasi interaktif ramah anak untuk siswa SD kelas 1 hingga 6. Membina rasa ingin tahu dan kegemaran belajar seumur hidup.
              </p>
            </div>

            <div>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
                Navigasi
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Beranda', route: '/' },
                  { label: 'Fitur Unggulan', route: '/' },
                  { label: 'Cara Kerja', route: '/' },
                  { label: 'Harga Paket', route: '/harga', active: true },
                  { label: 'Tentang Kami', route: '/' },
                ].map(l => (
                  <li key={l.label}>
                    <button
                      type="button"
                      onClick={() => navigate(l.route)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 14, fontWeight: l.active ? 600 : 500,
                        color: l.active ? '#6355d8' : '#64748b', padding: 0,
                      }}
                    >
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
                Lainnya
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['Kebijakan Privasi', 'Syarat & Ketentuan', 'Hubungi Kami', 'Bantuan & FAQ'].map(l => (
                  <li key={l}>
                    <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#64748b', padding: 0 }}>
                      {l}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
                Newsletter
              </h4>
              <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12, lineHeight: 1.6 }}>
                Dapatkan tips belajar mingguan dan promo khusus langsung di inbox Anda.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="email"
                  placeholder="Email kamu"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: 8,
                    border: '1px solid #e2e8f0', fontSize: 12,
                    color: '#1e293b', outline: 'none',
                  }}
                />
                <button
                  type="button"
                  style={{
                    padding: '8px 16px', borderRadius: 8,
                    background: '#0f172a', color: '#fff', border: 'none',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          <div style={{
            paddingTop: 32, display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', fontSize: 12, color: '#94a3b8',
          }}>
            <p style={{ margin: 0 }}>© 2026 Perpustakaan Belajar. All rights reserved.</p>
            <div style={{ display: 'flex', gap: 16 }}>
              <a href="#" style={{ color: '#94a3b8' }}>
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
              </a>
              <a href="#" style={{ color: '#94a3b8' }}>
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.936 9.936 0 0024 4.59z" /></svg>
              </a>
              <a href="#" style={{ color: '#94a3b8' }}>
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
