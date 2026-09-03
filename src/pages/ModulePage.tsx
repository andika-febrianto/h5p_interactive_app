import { useEffect, useState } from 'react'
import { useParams, useNavigate, Navigate, useSearchParams } from 'react-router-dom'
import { ProgressProvider, useProgress } from '../context/ProgressContext'
import { fetchModule, fetchChildAssignments, ApiError } from '../lib/api'
import { Sidebar } from '../components/Sidebar'
import { ScenePlayer } from '../components/ScenePlayer'
import { SummaryScreen } from '../components/SummaryScreen'
import { useAuth } from '../context/AuthContext'
import { getSubjectById } from '../data/subjects'
import type { Module } from '../types/storyboard'

function ModuleRunner({ mod, filteredFrames, assignmentId }: { mod: Module; filteredFrames?: string[]; assignmentId?: string | null }) {
  const { currentIndex, setCurrentIndex, resetProgress, loading, error } =
    useProgress()
  const navigate = useNavigate()
  const { user } = useAuth()
  const allFrames = mod.frames
  // If filteredFrames (selected frame IDs from parent assignment) is provided,
  // show only those frames. Otherwise show all.
  const frames = filteredFrames && filteredFrames.length > 0
    ? allFrames.filter((f) => filteredFrames.includes(f.id))
    : allFrames
  const isSummary = currentIndex >= frames.length
  const subject = getSubjectById(mod.subjectId)

  const handleDone = () =>
    setCurrentIndex(Math.min(currentIndex + 1, frames.length))
  const handleJump = (i: number) => setCurrentIndex(i)
  const handleRestart = () => resetProgress()
  const handleExit = () => {
    // If this is a child completing a parent assignment, go back to child dashboard
    if (user?.role === 'STUDENT' && assignmentId) {
      navigate('/anak')
    } else {
      navigate(
        `/kelas/${mod.grade}/semester/${mod.semester}/mapel/${mod.subjectId}`,
      )
    }
  }

  if (loading) {
    return (
      <div className='app-shell'>
        <main className='app-main'>
          <div className='app-main-inner'>
            <p className='home-empty'>Memuat progres...</p>
          </div>
        </main>
      </div>
    )
  }

  const currentFrame = !isSummary ? frames[currentIndex] : null
  const kindLabel: Record<string, string> = { text: 'MATERI', quiz: 'KUIS', dragdrop: 'DRAG & DROP', video: 'VIDEO INTERAKTIF', pdf: 'DOKUMEN', shortanswer: 'ISIAN SINGKAT' }

  return (
    <div className='app-shell'>
      <Sidebar
        frames={frames}
        moduleTitle={mod.title}
        subjectName={subject?.shortName}
        grade={mod.grade}
        semester={mod.semester}
        userName={user?.name}
        onJump={handleJump}
        onExit={handleExit}
      />
      <main className='app-main' style={{ padding: 0 }}>
        {/* Top header bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 32px', borderBottom: '1px solid var(--border)', background: 'var(--white)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {currentFrame && (
              <span style={{ fontSize: 10, fontWeight: 700, color: '#6c5ce7', background: '#f0eeff', padding: '4px 10px', borderRadius: 6, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                Panel {currentFrame.panel} · {kindLabel[currentFrame.kind] ?? currentFrame.kind}
              </span>
            )}
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
              {isSummary ? 'Ringkasan' : frames[currentIndex]?.title}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: '#999' }}>{currentIndex + 1} / {frames.length}</span>
            <button
              type='button'
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--white)', color: '#666', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              onClick={handleExit}
            >
              ⚙️ Pengaturan
            </button>
          </div>
        </div>
        <div className='app-main-inner' style={{ padding: '24px 32px 64px' }}>
          {error && (
            <p className='home-empty'>
              {error} (progres berjalan secara lokal untuk sesi ini)
            </p>
          )}
          {!isSummary ? (
            <ScenePlayer
              key={frames[currentIndex].id}
              frame={frames[currentIndex]}
              onDone={handleDone}
            />
          ) : (
            <SummaryScreen module={mod} onRestart={handleRestart} />
          )}
        </div>
      </main>
    </div>
  )
}

export default function ModulePage() {
  const { moduleId } = useParams<{ moduleId: string }>()
  const navigate = useNavigate()
  const [mod, setMod] = useState<Module | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [locked, setLocked] = useState(false)

  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const assignmentId = searchParams.get('assignment')
  const [selectedFrameIds, setSelectedFrameIds] = useState<string[] | null>(null)

  useEffect(() => {
    if (!moduleId) return
    setMod(null)
    setNotFound(false)
    setLocked(false)
    setSelectedFrameIds(null)
    fetchModule(moduleId)
      .then(setMod)
      .catch((err) => {
        if (err instanceof ApiError && err.code === 'SUBSCRIPTION_REQUIRED') {
          setLocked(true)
        } else {
          setNotFound(true)
        }
      })
  }, [moduleId])

  // If there's an assignment ID, fetch child's assignments to get selectedFrames
  useEffect(() => {
    if (!assignmentId || !user?.id) return
    fetchChildAssignments(user.id)
      .then((assignments) => {
        const a = assignments.find((x) => x.id === assignmentId)
        if (a?.selectedFrames && a.selectedFrames.length > 0) {
          setSelectedFrameIds(a.selectedFrames)
        }
      })
      .catch(() => {})
  }, [assignmentId, user?.id])

  if (notFound) {
    return <Navigate to={user?.role === 'STUDENT' ? '/anak' : '/kelas'} replace />
  }

  if (locked) {
    return (
      <div className='home-page'>
        <div className='home-inner auth-form-page'>
          <p className='home-eyebrow'>
            <span className='landing-nav-mark' aria-hidden />
            Perpustakaan Belajar
          </p>
          <h1 className='home-title'>Masa aktif Anda sudah berakhir</h1>
          <p className='home-lede'>
            Masa percobaan atau langganan Anda telah habis. Berlangganan untuk
            melanjutkan mengakses modul belajar interaktif.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type='button'
              className='btn-primary'
              onClick={() => navigate('/harga')}
            >
              Lihat Paket Langganan
            </button>
            <button
              type='button'
              className='btn-secondary'
              onClick={() => navigate('/kelas')}
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!mod) {
    return (
      <div className='home-page'>
        <div className='home-inner'>
          <p className='home-empty'>Memuat modul...</p>
        </div>
      </div>
    )
  }

  // Compute filtered frames count for ProgressProvider
  const visibleFrames = selectedFrameIds && selectedFrameIds.length > 0
    ? mod.frames.filter((f) => selectedFrameIds.includes(f.id))
    : mod.frames

  return (
    <ProgressProvider totalFrames={visibleFrames.length} moduleId={mod.id}>
      <ModuleRunner mod={mod} filteredFrames={selectedFrameIds ?? undefined} assignmentId={assignmentId} />
    </ProgressProvider>
  )
}
