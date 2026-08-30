import { useEffect, useState } from 'react';
import TopBar from '../components/TopBar';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { ProgressProvider, useProgress } from '../context/ProgressContext';
import { fetchModule, ApiError } from '../lib/api';
import { Sidebar } from '../components/Sidebar';
import { ScenePlayer } from '../components/ScenePlayer';
import { SummaryScreen } from '../components/SummaryScreen';
import type { Module } from '../types/storyboard';

function ModuleRunner({ mod }: { mod: Module }) {
  const { currentIndex, setCurrentIndex, resetProgress, loading, error } = useProgress();
  const navigate = useNavigate();
  const frames = mod.frames;
  const isSummary = currentIndex >= frames.length;

  const handleDone = () => setCurrentIndex(Math.min(currentIndex + 1, frames.length));
  const handleJump = (i: number) => setCurrentIndex(i);
  const handleRestart = () => resetProgress();
  const handleExit = () => navigate(`/kelas/${mod.grade}/semester/${mod.semester}/mapel/${mod.subjectId}`);

  if (loading) {
    return (
      <div className="app-shell">
        <main className="app-main">
          <div className="app-main-inner">
            <p className="home-empty">Memuat progres...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar frames={frames} moduleTitle={mod.title} onJump={handleJump} onExit={handleExit} />
      <main className="app-main">
        <div className="app-main-inner">
          {error && <p className="home-empty">{error} (progres berjalan secara lokal untuk sesi ini)</p>}
          {!isSummary ? (
            <ScenePlayer key={frames[currentIndex].id} frame={frames[currentIndex]} onDone={handleDone} />
          ) : (
            <SummaryScreen module={mod} onRestart={handleRestart} />
          )}
        </div>
      </main>
    </div>
  );
}

export default function ModulePage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const [mod, setMod] = useState<Module | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (!moduleId) return;
    setMod(null);
    setNotFound(false);
    setLocked(false);
    fetchModule(moduleId)
      .then(setMod)
      .catch((err) => {
        if (err instanceof ApiError && err.code === 'SUBSCRIPTION_REQUIRED') {
          setLocked(true);
        } else {
          setNotFound(true);
        }
      });
  }, [moduleId]);

  if (notFound) {
    return <Navigate to="/kelas" replace />;
  }

  if (locked) {
    return (
      <div className="home-page">
        <div className="home-inner auth-form-page">
          <p className="home-eyebrow"><span>📚</span> Perpustakaan Belajar</p>
          <h1 className="home-title">Masa aktif Anda sudah berakhir</h1>
          <p className="home-lede">
            Masa percobaan atau langganan Anda telah habis. Berlangganan untuk melanjutkan
            mengakses modul belajar interaktif.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="button" className="btn-primary" onClick={() => navigate('/harga')}>
              Lihat Paket Langganan
            </button>
            <button type="button" className="btn-secondary" onClick={() => navigate('/kelas')}>
              Kembali
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!mod) {
    return (
      <div className="home-page">
        <div className="home-inner">
        <TopBar />
          <p className="home-empty">Memuat modul...</p>
        </div>
      </div>
    );
  }

  return (
    <ProgressProvider totalFrames={mod.frames.length} moduleId={mod.id}>
      <ModuleRunner mod={mod} />
    </ProgressProvider>
  );
}
