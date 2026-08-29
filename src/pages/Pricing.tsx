import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchPlans, createCheckout, type Plan, ApiError } from '../lib/api';

function formatIdr(amount: number): string {
  if (amount === 0) return 'Gratis';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    amount
  );
}

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans()
      .then(setPlans)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Gagal memuat paket.'));
  }, []);

  const handleChoose = async (plan: Plan) => {
    if (!user) {
      navigate('/daftar');
      return;
    }
    if (plan.interval === 'trial') return; // free trial is granted automatically at registration

    setError(null);
    setCheckingOut(plan.id);
    try {
      const { invoiceUrl } = await createCheckout(plan.id as 'basic' | 'pro');
      window.location.href = invoiceUrl;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memulai pembayaran.');
      setCheckingOut(null);
    }
  };

  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <button type="button" className="landing-nav-brand" onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <span className="landing-nav-mark" aria-hidden />
          <span>Perpustakaan Belajar</span>
        </button>
        <div className="landing-nav-actions">
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

      <section className="landing-hero" style={{ paddingBottom: 40 }}>
        <div className="landing-hero-blob landing-hero-blob-1" aria-hidden />
        <div className="landing-hero-grid" aria-hidden />
        <div className="landing-hero-content">
          <span className="landing-badge">✦ Harga</span>
          <h1 className="landing-title" style={{ fontSize: 42 }}>
            Paket yang sesuai untuk semua
          </h1>
          <p className="landing-subtitle">
            Mulai gratis 14 hari dengan akses semua fitur. Lanjutkan ke Basic atau Pro kapan pun
            Anda siap — pembayaran aman lewat Xendit.
          </p>
        </div>
      </section>

      <section className="landing-section" style={{ marginBottom: 100 }}>
        {error && <p className="auth-error" style={{ maxWidth: 480, margin: '0 auto 24px' }}>{error}</p>}

        {plans === null ? (
          <p className="home-empty" style={{ textAlign: 'center' }}>Memuat paket...</p>
        ) : (
          <div className="pricing-grid">
            {plans.map((plan) => {
              const isPro = plan.id === 'pro';
              return (
                <div key={plan.id} className={`pricing-card ${isPro ? 'is-featured' : ''}`}>
                  {isPro && <span className="pricing-card-badge">Paling Populer</span>}
                  <h3 className="pricing-card-name">{plan.name}</h3>
                  <div className="pricing-card-price">
                    <span className="pricing-card-amount">{formatIdr(plan.priceIdr)}</span>
                    {plan.interval === 'month' && <span className="pricing-card-period">/bulan</span>}
                    {plan.interval === 'trial' && (
                      <span className="pricing-card-period">/ {plan.trialDays} hari</span>
                    )}
                  </div>
                  <ul className="pricing-card-features">
                    {plan.features.map((f) => (
                      <li key={f}>
                        <span className="pricing-check">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className={isPro ? 'btn-primary' : 'btn-secondary landing-btn-secondary'}
                    style={isPro ? undefined : { color: 'var(--ink)', borderColor: 'var(--sand-dim)' }}
                    onClick={() => handleChoose(plan)}
                    disabled={checkingOut === plan.id}
                  >
                    {checkingOut === plan.id
                      ? 'Memproses...'
                      : plan.interval === 'trial'
                        ? user
                          ? 'Sudah termasuk saat daftar'
                          : 'Daftar Gratis'
                        : `Berlangganan ${plan.name}`}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <footer className="landing-footer">
        <div className="landing-footer-brand">
          <span className="landing-nav-mark" aria-hidden />
          <span>Perpustakaan Belajar</span>
        </div>
        <p className="landing-footer-tagline">Modul belajar interaktif untuk kelas 1–6.</p>
        <p className="landing-footer-copy">
          Pembayaran diproses aman oleh Xendit. © {new Date().getFullYear()} Perpustakaan Belajar.
        </p>
      </footer>
    </div>
  );
}
