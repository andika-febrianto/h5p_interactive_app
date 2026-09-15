import { useEffect, useState } from 'react'
import {
  useParams,
  useNavigate,
  Navigate,
  useSearchParams,
} from 'react-router-dom'
import { ProgressProvider, useProgress } from '../context/ProgressContext'
import {
  fetchModule,
  fetchChildAssignments,
  fetchAssignments,
  ApiError,
  logStudySession,
} from '../lib/api'
import { Sidebar } from '../components/Sidebar'
import { ScenePlayer } from '../components/ScenePlayer'
import { SummaryScreen } from '../components/SummaryScreen'
import { useAuth } from '../context/AuthContext'
import { getSubjectById } from '../data/subjects'
import type { Module } from '../types/storyboard'
import Loading from '../components/Loading'

function ModuleRunner({
  mod,
  filteredFrames,
}: {
  mod: Module
  filteredFrames?: string[]
  assignmentId?: string | null
}) {
  const { currentIndex, setCurrentIndex, resetProgress, loading, error } =
    useProgress()
  const navigate = useNavigate()
  const { user } = useAuth()
  const allFrames = mod.frames
  // If filteredFrames (selected frame IDs from parent assignment) is provided,
  // show only those frames. Otherwise show all.
  const frames =
    filteredFrames && filteredFrames.length > 0
      ? allFrames.filter((f) => filteredFrames.includes(f.id))
      : allFrames
  const isSummary = currentIndex >= frames.length
  const subject = getSubjectById(mod.subjectId)
  const currentFrame = !isSummary ? frames[currentIndex] : null
  const kindLabel: Record<string, string> = {
    text: 'MATERI',
    quiz: 'KUIS',
    dragdrop: 'DRAG & DROP',
    video: 'VIDEO INTERAKTIF',
    pdf: 'DOKUMEN',
    shortanswer: 'ISIAN SINGKAT',
  }

  const dashboardRoutes = {
    STUDENT: '/anak',
    PARENT: '/orangtua',
    TEACHER: '/kelas',
  } as const

  const dashboardLabels = {
    STUDENT: 'Dashboard Anak',
    PARENT: 'Dashboard Orang Tua',
    TEACHER: 'Dashboard Guru',
  } as const

  const dashboardRoute =
    dashboardRoutes[user?.role as keyof typeof dashboardRoutes] ?? '/kelas'
  const dashboardLabel =
    dashboardLabels[user?.role as keyof typeof dashboardLabels] ??
    'Dashboard Guru'

  const [frameStartAt, setFrameStartAt] = useState(() => Date.now())
  const [showDashboardTooltip, setShowDashboardTooltip] = useState(false)

  const S = {
    topbar: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 32px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--white)',
    },
    leftGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: 16,
    },
    panelBadge: {
      fontSize: 10,
      fontWeight: 700,
      color: '#6c5ce7',
      background: '#f0eeff',
      padding: '4px 10px',
      borderRadius: 6,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    frameTitle: {
      fontSize: 15,
      fontWeight: 600,
      color: 'var(--text-primary)',
    },
    rightGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    },
    backButton: {
      position: 'relative' as const,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 10px',
      borderRadius: 999,
      border: '1px solid #cbd5e1',
      background: '#f8fafc',
      color: '#334155',
      fontSize: 12,
      fontWeight: 700,
      cursor: 'pointer',
      transition:
        'background 180ms ease, color 180ms ease, border-color 180ms ease',
    },
    dashboardTooltip: {
      position: 'absolute' as const,
      left: '50%',
      top: 'calc(100% + 8px)',
      transform: 'translateX(-50%)',
      whiteSpace: 'nowrap' as const,
      fontSize: 10,
      fontWeight: 700,
      padding: '4px 8px',
      borderRadius: 6,
      background: '#fff',
      color: '#000',
      boxShadow: '0 8px 18px rgba(15, 23, 42, 0.2)',
      zIndex: 100,
      pointerEvents: 'none' as const,
    },
    chip: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 10px',
      borderRadius: 999,
      border: '1px solid #cbd5e1',
      background: '#f8fafc',
      color: '#334155',
      fontSize: 12,
      fontWeight: 600,
    },
    mapelDot: {
      color: '#4f46e5',
      fontWeight: 800,
    },
    mapelText: {
      color: '#4f46e5',
    },
    classChipSvg: {
      color: '#666',
    },
    counterText: {
      fontSize: 12,
      color: '#999',
    },
    profileButton: {
      display: 'flex',
      flexDirection: 'row' as const,
      alignItems: 'center',
      gap: 8,
      padding: '6px 14px',
      borderRadius: 8,
      border: '1px solid var(--border)',
      background: 'var(--white)',
      color: '#666',
      fontSize: 12,
      fontWeight: 600,
      cursor: 'pointer',
    },
    avatar: {
      width: 24,
      height: 24,
      borderRadius: '50%',
      background: 'linear-gradient(to right, #4f46e5, #8b5cf6)',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 800,
      fontSize: 12,
      lineHeight: 1,
    },
    profileTextWrap: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'flex-start',
      gap: 0,
    },
    studentRole: {
      fontSize: 10,
      color: '#8b5cf6',
    },
    innerMain: {
      padding: '24px 32px 64px',
    },
    appMain: {
      padding: 0,
    },
  }

  useEffect(() => {
    setFrameStartAt(Date.now())
  }, [currentIndex])

  const handleDone = () => {
    if (user?.role === 'STUDENT' && currentFrame) {
      const durationSeconds = Math.round((Date.now() - frameStartAt) / 1000)

      logStudySession({
        moduleId: mod.id,
        frameSlug: currentFrame.id,
        durationSeconds,
        activityType: currentFrame.kind,
      }).catch(() => {})
    }
    setCurrentIndex(Math.min(currentIndex + 1, frames.length))
  }

  const handleJump = (i: number) => setCurrentIndex(i)
  const handleRestart = () => resetProgress()
  const handleDashboardBack = () => navigate(dashboardRoute)

  // if (loading) {
  //   return (
  //     <div className='app-shell'>
  //       <main className='app-main'>
  //         <div className='app-main-inner'>
  //           <p className='home-empty'>Memuat progres...</p>
  //         </div>
  //       </main>
  //     </div>
  //   )
  // }
  if (loading) {
    return <Loading />
  }

  return (
    <div className='app-shell module-page-shell'>
      <div className='module-page-topbar'>
        <div style={S.leftGroup}>
          <button
            type='button'
            style={S.backButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e0e7ff'
              e.currentTarget.style.borderColor = '#6366f1'
              e.currentTarget.style.color = '#312e81'
              setShowDashboardTooltip(true)
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f8fafc'
              e.currentTarget.style.borderColor = '#cbd5e1'
              e.currentTarget.style.color = '#334155'
              setShowDashboardTooltip(false)
            }}
            onClick={handleDashboardBack}
          >
            {showDashboardTooltip && (
              <span style={S.dashboardTooltip}>Kembali ke Dashboard Anak</span>
            )}
            ← {dashboardLabel}
          </button>
          {currentFrame && (
            <span style={S.panelBadge}>
              Panel {currentFrame.panel} ·{' '}
              {kindLabel[currentFrame.kind] ?? currentFrame.kind}
            </span>
          )}
          <span style={S.frameTitle}>
            {isSummary ? 'Ringkasan' : frames[currentIndex]?.title}
          </span>
        </div>
        <div style={S.rightGroup}>
          <span style={S.chip}>
            <span style={S.mapelDot}>•</span>
            <span>
              Mapel <span style={S.mapelText}>{subject?.shortName}</span>
            </span>
          </span>
          <span style={S.chip}>
            <svg
              aria-hidden='true'
              width='14'
              height='14'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              style={S.classChipSvg}
            >
              <path d='M3 21h18' />
              <path d='M5 21V7l7-4 7 4v14' />
              <path d='M9 21v-5h6v5' />
              <path d='M9 9h6' />
            </svg>
            <span>Kelas {user?.grade}</span>
            <span style={{ color: '#94a3b8' }}>•</span>
            <span>Semester {user?.semester}</span>
          </span>
          <span style={S.counterText}>
            {currentIndex + 1} / {frames.length}
          </span>
          <button type='button' style={S.profileButton}>
            <span style={S.avatar} aria-label={user?.name}>
              {String(user?.name ?? 'D')
                .slice(0, 1)
                .toUpperCase()}
            </span>
            <span style={S.profileTextWrap}>
              <span>{user?.name}</span>
              <span style={S.studentRole}>Murid</span>
            </span>
          </button>
        </div>
      </div>

      <Sidebar
        frames={frames}
        moduleTitle={mod.title}
        onJump={handleJump}
        userRole={user?.role || 'TEACHER'}
      />
      <main className='app-main' style={S.appMain}>
        <div className='app-main-inner' style={S.innerMain}>
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
  const [selectedFrameIds, setSelectedFrameIds] = useState<string[] | null>(
    null,
  )

  // NEW: which child this assignment belongs to, when a PARENT is viewing it
  const [assignmentChildId, setAssignmentChildId] = useState<string | null>(
    null,
  )

  useEffect(() => {
    if (!moduleId) return

    setMod(null)
    setNotFound(false)
    setLocked(false)
    setSelectedFrameIds(null)
    setAssignmentChildId(null)

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

  // If there's an assignment ID, fetch assignments to get selectedFrames
  // (and, for a PARENT, which child the assignment belongs to)
  useEffect(() => {
    if (!assignmentId || !user?.id) return
    const fetcher =
      user.role === 'PARENT'
        ? fetchAssignments()
        : fetchChildAssignments(user.id)
    fetcher
      .then((assignments) => {
        const a = assignments.find((x) => x.id === assignmentId)
        if (a?.selectedFrames && a.selectedFrames.length > 0) {
          setSelectedFrameIds(a.selectedFrames)
        }
        // NEW: capture childId so the parent's ProgressProvider can
        // fetch the CHILD's real progress, not the parent's own.
        if (user.role === 'PARENT' && a?.childId) {
          setAssignmentChildId(a.childId)
        }
      })
      .catch(() => {})
  }, [assignmentId, user?.id, user?.role])

  if (notFound) {
    const userRole =
      user?.role === 'STUDENT'
        ? '/anak'
        : user?.role === 'PARENT'
          ? '/orangtua'
          : '/kelas'
    return <Navigate to={userRole} replace />
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
  const visibleFrames =
    selectedFrameIds && selectedFrameIds.length > 0
      ? mod.frames.filter((f) => selectedFrameIds.includes(f.id))
      : mod.frames

  return (
    <ProgressProvider
      totalFrames={visibleFrames.length}
      moduleId={mod.id}
      assignmentId={assignmentId}
      userRole={user?.role}
      childId={user?.role === 'PARENT' ? assignmentChildId : undefined} // NEW
    >
      <ModuleRunner
        mod={mod}
        filteredFrames={selectedFrameIds ?? undefined}
        assignmentId={assignmentId}
      />
    </ProgressProvider>
  )
}
