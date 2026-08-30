import { useEffect, useState } from 'react';
import TopBar from '../components/TopBar';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  fetchMySubscription,
  fetchPaymentHistory,
  fetchPlans,
  createCheckout,
  cancelSubscription,
  ApiError,
  type MySubscription,
  type PaymentHistoryRow,
  type Plan,
} from '../lib/api';

function formatIdr(amount: number): string {
  if (amount === 0) return 'Gratis';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    amount
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

const STATUS_LABEL: Record<string, string> = {
  TRIALING: 'Masa Percobaan',
  ACTIVE: 'Aktif',
  PAST_DUE: 'Menunggu Pembayaran',
  CANCELED: 'Dibatalkan',
  EXPIRED: 'Berakhir',
};

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Menunggu Pembayaran',
  PAID: 'Lunas',
  EXPIRED: 'Kedaluwarsa',
  FAILED: 'Gagal',
};

export default function Subscription() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sub, setSub] = useState<MySubscription | null>(null);
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [history, setHistory] = useState<PaymentHistoryRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [canceling, setCanceling] = useState(false);

  const checkoutStatus = searchParams.get('status'); // 'success' | 'failed' from Xendit redirect

  const load = () => {
    fetchMySubscription()
      .then(setSub)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Gagal memuat langganan.'));
    fetchPlans().then(setPlans).catch(() => {});
    fetchPaymentHistory().then(setHistory).catch(() => {});
  };

  useEffect(() => {
    if (authLoading || !user) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  const handleUpgrade = async (planId: 'basic' | 'pro') => {
    setError(null);
    setCheckingOut(planId);
    try {
      const { invoiceUrl } = await createCheckout(planId);
      window.location.href = invoiceUrl;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memulai pembayaran.');
      setCheckingOut(null);
    }
  };

  const handleCancel = async () => {
    if (
      !confirm(
        'Batalkan langganan? Anda tetap bisa memakai fitur sampai tanggal berakhir, tapi tidak akan diperpanjang otomatis.'
      )
    )
      return;
    setError(null);
    setCanceling(true);
    try {
      await cancelSubscription();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal membatalkan langganan.');
    } finally {
      setCanceling(false);
    }
  };

  if (authLoading) {
    return (
      <div className="home-page">
        <div className="home-inner">
        <TopBar />
          <p className="home-empty">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="home-page">
        <div className="home-inner">
          <p className="home-empty">Masuk dulu untuk melihat langganan Anda.</p>
          <button type="button" className="btn-secondary" onClick={() => navigate('/masuk')}>
            Masuk
          </button>
        </div>
      </div>
    );
  }

  const upgradablePlans = (plans ?? []).filter(
    (p) => p.interval === 'month' && (p.id !== sub?.planId || sub?.cancelAtPeriodEnd)
  );

  return (
    <div className="home-page">
      <div className="home-inner">
        <button type="button" className="home-back" onClick={() => navigate('/kelas')}>
          ← Kembali
        </button>

        <p className="home-eyebrow">{user.name}</p>
        <h1 className="home-title">Langganan Saya</h1>

        {checkoutStatus === 'success' && (
          <p className="subscription-notice is-success">
            Pembayaran diterima Xendit — langganan akan aktif dalam beberapa saat setelah dikonfirmasi.
          </p>
        )}
        {checkoutStatus === 'failed' && (
          <p className="subscription-notice is-failed">Pembayaran belum berhasil. Silakan coba lagi.</p>
        )}
        {error && <p className="auth-error" style={{ maxWidth: 560 }}>{error}</p>}

        {sub && (
          <div className="subscription-status-card">
            <div>
              <p className="subscription-status-plan">{sub.planName}</p>
              <span className={`subscription-status-badge status-${sub.status.toLowerCase()}`}>
                {STATUS_LABEL[sub.status] ?? sub.status}
              </span>
            </div>
            <p className="subscription-status-detail">
              {sub.status === 'TRIALING'
                ? sub.isExpired
                  ? 'Masa percobaan Anda sudah berakhir.'
                  : `Sisa ${sub.daysLeft} hari masa percobaan — berlaku sampai ${formatDate(sub.currentPeriodEnd)}.`
                : sub.cancelAtPeriodEnd
                  ? `Dibatalkan — tetap aktif sampai ${formatDate(sub.currentPeriodEnd)}, tidak diperpanjang otomatis.`
                  : sub.isExpired
                    ? 'Langganan Anda sudah berakhir.'
                    : `Berlaku sampai ${formatDate(sub.currentPeriodEnd)}.`}
            </p>
            {sub.planId !== 'free_trial' && !sub.cancelAtPeriodEnd && !sub.isExpired && (
              <button
                type="button"
                className="btn-secondary btn-small"
                style={{ marginTop: 14 }}
                onClick={handleCancel}
                disabled={canceling}
              >
                {canceling ? 'Membatalkan...' : 'Batalkan Langganan'}
              </button>
            )}
          </div>
        )}

        {upgradablePlans.length > 0 && (
          <>
            <h2 className="frame-section-title">
              {sub?.planId === 'free_trial' ? 'Lanjutkan dengan paket berbayar' : 'Ubah paket'}
            </h2>
            <div className="pricing-grid" style={{ marginBottom: 40 }}>
              {upgradablePlans.map((plan) => (
                <div key={plan.id} className={`pricing-card ${plan.id === 'pro' ? 'is-featured' : ''}`}>
                  {plan.id === 'pro' && <span className="pricing-card-badge">Paling Populer</span>}
                  <h3 className="pricing-card-name">{plan.name}</h3>
                  <div className="pricing-card-price">
                    <span className="pricing-card-amount">{formatIdr(plan.priceIdr)}</span>
                    <span className="pricing-card-period">/bulan</span>
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
                    className={plan.id === 'pro' ? 'btn-primary' : 'btn-secondary'}
                    onClick={() => handleUpgrade(plan.id as 'basic' | 'pro')}
                    disabled={checkingOut === plan.id}
                  >
                    {checkingOut === plan.id ? 'Memproses...' : `Berlangganan ${plan.name}`}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {history && history.length > 0 && (
          <>
            <h2 className="frame-section-title">Riwayat Pembayaran</h2>
            <div className="report-table-wrap">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Paket</th>
                    <th>Jumlah</th>
                    <th>Status</th>
                    <th>Tanggal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.id}>
                      <td>{h.planName}</td>
                      <td>{formatIdr(h.amount)}</td>
                      <td>{PAYMENT_STATUS_LABEL[h.status] ?? h.status}</td>
                      <td>{formatDate(h.createdAt)}</td>
                      <td>
                        {h.invoiceUrl && (
                          <a className="btn-secondary btn-small" href={h.invoiceUrl} target="_blank" rel="noopener noreferrer">
                            Lanjutkan Bayar
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
