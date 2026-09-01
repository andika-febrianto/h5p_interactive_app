import { useEffect, useState } from 'react'
import TopBar from '../components/TopBar'
import { useParams, useNavigate, Navigate, useSearchParams } from 'react-router-dom'
import { ProgressProvider, useProgress } from '../context/ProgressContext'
import { fetchModule, ApiError } from '../lib/api'
import { Sidebar } from '../components/Sidebar'
import { ScenePlayer } from '../components/ScenePlayer'
import { SummaryScreen } from '../components/SummaryScreen'
import { useAuth } from '../context/AuthContext'
import { getSubjectById } from '../data/subjects'
import type { Module } from '../types/storyboard'

function ModuleRunner({ mod, filteredFrames }: { mod: Module; filteredFrames?: string[] }) {
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
  const handleExit = () =>
    navigate(
      `/kelas/${mod.grade}/semester/${mod.semester}/mapel/${mod.subjectId}`,
    )

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
      <main className='app-main'>
        <div className='app-main-inner'>
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

  // If there's an assignment ID, fetch it to get selectedFrames
  useEffect(() => {
    if (!assignmentId) return
    import('../lib/api').then(({ fetchAssignments }) =>
      fetchAssignments()
        .then((assignments) => {
          const a = assignments.find((x) => x.id === assignmentId)
          if (a?.selectedFrames && a.selectedFrames.length > 0) {
            setSelectedFrameIds(a.selectedFrames)
          }
        })
        .catch(() => {})
    )
  }, [assignmentId])

  if (notFound) {
    return <Navigate to='/kelas' replace />
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
          <TopBar />
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
      <ModuleRunner mod={mod} filteredFrames={selectedFrameIds ?? undefined} />
    </ProgressProvider>
  )
}
