import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../../components/TopBar'
import { useAuth } from '../../context/AuthContext'
import {
  fetchChildAssignments,
  fetchModule,
  fetchChildModuleProgress,
  fetchAssignmentQuestions,
  askQuestion,
  markAssignmentStarted,
  checkStudentNotifications,
  type ParentAssignment,
  type Module,
  type FrameProgress,
  type Question,
} from '../../lib/api'
import { getSubjectById } from '../../data/subjects'

type SideTab = 'home' | 'missions' | 'trophies' | 'profile'

export default function ChildDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [sideTab, setSideTab] = useState<SideTab>('home')

  const [assignments, setAssignments] = useState<ParentAssignment[]>([])
  const [assignmentsLoading, setAssignmentsLoading] = useState(true)
  const [moduleCache, setModuleCache] = useState<Record<string, Module>>({})

  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'deadline' | 'status'>('newest')
  const [progressCache, setProgressCache] = useState<Record<string, Record<string, FrameProgress>>>({})

  const [expandedAssignment, setExpandedAssignment] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Record<string, Question[]>>({})
  const [newQuestion, setNewQuestion] = useState('')
  const [sendingQuestion, setSendingQuestion] = useState(false)

  // ── Data Loading ──

  useEffect(() => {
    if (!user?.id) return
    fetchChildAssignments(user.id)
      .then((data) => {
        setAssignments(data)
        data.forEach((a) => {
          if (a.materialId && !moduleCache[a.materialId]) {
            fetchModule(a.materialId)
              .then((mod) => setModuleCache((prev) => ({ ...prev, [a.materialId!]: mod })))
              .catch(() => {})
            fetchChildModuleProgress(user.id!, a.materialId)
              .then((frames) => {
                const map: Record<string, FrameProgress> = {}
                frames.forEach((f) => { map[f.frameSlug] = f })
                setProgressCache((prev) => ({ ...prev, [a.materialId!]: map }))
              })
              .catch(() => {})
          }
        })
      })
      .catch(() => setAssignments([]))
      .finally(() => setAssignmentsLoading(false))
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { checkStudentNotifications().catch(() => {}) }, [user?.id])

  const loadQuestions = useCallback(async (assignmentId: string) => {
    try {
      const data = await fetchAssignmentQuestions(assignmentId)
      setQuestions((prev) => ({ ...prev, [assignmentId]: data }))
    } catch {
      setQuestions((prev) => ({ ...prev, [assignmentId]: [] }))
    }
  }, [])

  useEffect(() => { if (expandedAssignment) loadQuestions(expandedAssignment) }, [expandedAssignment, loadQuestions])

  const handleSendQuestion = async (assignmentId: string) => {
    if (!newQuestion.trim()) return
    setSendingQuestion(true)
    try {
      await askQuestion(assignmentId, newQuestion.trim())
      setNewQuestion('')
      await loadQuestions(assignmentId)
    } catch { /* silently fail */ } finally {
      setSendingQuestion(false)
    }
  }

  const handleStartAssignment = async (assignment: ParentAssignment) => {
    if (assignment.materialId) {
      await markAssignmentStarted(assignment.id).catch(() => {})
      navigate(`/modul/${assignment.materialId}?assignment=${assignment.id}`)
    }
  }

  const getFilteredFrames = (assignment: ParentAssignment) => {
    const mod = assignment.materialId ? moduleCache[assignment.materialId] : null
    if (!mod) return []
    const frames = Array.isArray(assignment.selectedFrames) ? assignment.selectedFrames : []
    if (frames.length === 0) return mod.frames
    return mod.frames.filter((f) => frames.includes(f.id))
  }

  const getFrameProgress = (materialId: string | null, frameSlug: string): FrameProgress | null => {
    if (!materialId) return null
    return progressCache[materialId]?.[frameSlug] ?? null
  }

  const getAssignmentProgress = (assignment: ParentAssignment) => {
    const frames = getFilteredFrames(assignment)
    if (frames.length === 0) return { completed: 0, total: 0, pct: 0 }
    let completed = 0
    frames.forEach((f) => { const p = getFrameProgress(assignment.materialId, f.id); if (p?.completed) completed++ })
    return { completed, total: frames.length, pct: Math.round((completed / frames.length) * 100) }
  }

  const getSubjectName = (subjectId?: string | null) => {
    if (!subjectId) return ''
    const sub = getSubjectById(subjectId)
    return sub?.shortName || sub?.name || subjectId
  }

  // ── Derived Data ──

  const filteredAssignments = useMemo(() => {
    let result = assignments
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((a) => {
        const mod = a.materialId ? moduleCache[a.materialId] : null
        const topicName = (mod?.title || a.title || '').toLowerCase()
        const subjectName = getSubjectName(mod?.subjectId).toLowerCase()
        return topicName.includes(q) || subjectName.includes(q)
      })
    }
    result = [...result].sort((a, b) => {
      if (sortOrder === 'newest') return (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
      if (sortOrder === 'oldest') return (a.createdAt ?? '').localeCompare(b.createdAt ?? '')
      if (sortOrder === 'deadline') return (a.dueDate ?? 'z').localeCompare(b.dueDate ?? 'z')
      const statusOrder: Record<string, number> = { overdue: 0, in_progress: 1, pending: 2, completed: 3 }
      return (statusOrder[a.status] ?? 4) - (statusOrder[b.status] ?? 4)
    })
    return result
  }, [assignments, searchQuery, sortOrder, moduleCache])

  const activeAssignment = assignments.find((a) => a.status === 'in_progress') || assignments.find((a) => a.status === 'pending') || assignments.find((a) => a.status === 'overdue')
  const completedCount = assignments.filter((a) => {
    const p = getAssignmentProgress(a)
    return p.total > 0 && p.completed === p.total
  }).length
  const inProgressCount = assignments.filter((a) => a.status === 'in_progress').length
  const totalPoints = completedCount * 100 + inProgressCount * 20

  // Get subject breakdown for weekly progress
  const subjectBreakdown = useMemo(() => {
    const map: Record<string, { name: string; pct: number; color: string }> = {}
    const colors = ['#6c5ce7', '#ff7675', '#fdcb6e', '#00b894']
    let ci = 0
    assignments.forEach((a) => {
      const mod = a.materialId ? moduleCache[a.materialId] : null
      const subName = getSubjectName(mod?.subjectId) || 'Lainnya'
      if (!map[a.materialId ?? '']) {
        map[a.materialId ?? ''] = { name: subName, pct: getAssignmentProgress(a).pct, color: colors[ci++ % colors.length] }
      }
    })
    return Object.values(map).slice(0, 4)
  }, [assignments, moduleCache])

  // Calculate streak from completed assignments
  const streak = useMemo(() => {
    const completedDates = assignments
      .filter((a) => a.status === 'completed')
      .map((a) => new Date(a.createdAt ?? Date.now()).toDateString())
    const uniqueDates = [...new Set(completedDates)]
    return Math.min(uniqueDates.length, 30)
  }, [assignments])

  // ── Styles ──

  const S = {
    page: { minHeight: '100vh', background: '#f4f5fa' } as React.CSSProperties,
    wrapper: { display: 'flex', minHeight: '100vh' } as React.CSSProperties,
    sidebar: {
      width: 220,
      background: '#fff',
      borderRight: '1px solid #eee',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 0',
      flexShrink: 0,
    } as React.CSSProperties,
    sidebarLogo: { display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px', marginBottom: 28 } as React.CSSProperties,
    sidebarLogoIcon: { width: 32, height: 32, borderRadius: 10, background: '#6c5ce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16 } as React.CSSProperties,
    sidebarTitle: { fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: '#1a1a2e', lineHeight: 1.2 } as React.CSSProperties,
    sidebarSubtitle: { fontSize: 10, color: '#999' } as React.CSSProperties,
    sideItem: (active: boolean) => ({
      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', margin: '2px 10px',
      borderRadius: 12, border: 'none', background: active ? '#6c5ce7' : 'transparent',
      color: active ? '#fff' : '#666', fontWeight: 600, fontSize: 13, cursor: 'pointer',
      transition: 'all 0.2s', width: 'calc(100% - 20px)', textAlign: 'left' as const,
    }) as React.CSSProperties,
    parentModeBtn: {
      marginTop: 'auto', margin: '0 20px', padding: '12px 16px', border: '2px dashed #e0e0f0',
      borderRadius: 12, background: '#f8f7ff', cursor: 'pointer', textAlign: 'center' as const,
    } as React.CSSProperties,
    main: { flex: 1, padding: '24px 32px 64px', overflowY: 'auto', maxWidth: 900 } as React.CSSProperties,
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 } as React.CSSProperties,
    headerRight: { display: 'flex', alignItems: 'center', gap: 16 } as React.CSSProperties,
    streakBadge: { display: 'flex', alignItems: 'center', gap: 6, background: '#fff3e0', padding: '6px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600 } as React.CSSProperties,
    pointsBadge: { display: 'flex', alignItems: 'center', gap: 6, background: '#f0eeff', padding: '6px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#6c5ce7' } as React.CSSProperties,
    avatar: { width: 40, height: 40, borderRadius: '50%', background: '#6c5ce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16 } as React.CSSProperties,
    statRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 } as React.CSSProperties,
    statCard: (_icon: string, _color: string) => ({
      background: '#fff', borderRadius: 14, padding: '14px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }) as React.CSSProperties,
    statIcon: (bg: string) => ({
      width: 40, height: 40, borderRadius: 10, background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
    }) as React.CSSProperties,
    missionCard: {
      background: '#fff', borderRadius: 18, padding: 24,
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: 20, position: 'relative' as const,
      overflow: 'hidden',
    } as React.CSSProperties,
    progressBadge: { position: 'absolute' as const, top: 16, right: 20, fontSize: 13, fontWeight: 600, color: '#999' } as React.CSSProperties,
    progressBar: { height: 8, borderRadius: 999, background: '#f0f0f5', overflow: 'hidden', margin: '14px 0 4px' } as React.CSSProperties,
    missionActions: { display: 'flex', gap: 10, marginTop: 14 } as React.CSSProperties,
    missionBtn: (primary: boolean) => ({
      padding: '10px 20px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer',
      background: primary ? '#6c5ce7' : '#f0f0f5', color: primary ? '#fff' : '#333',
      display: 'flex', alignItems: 'center', gap: 6,
    }) as React.CSSProperties,
    stepsCard: {
      background: '#fff', borderRadius: 18, padding: 24,
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: 20,
    } as React.CSSProperties,
    sectionTitle: { fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: '#1a1a2e' } as React.CSSProperties,
    sectionSub: { fontSize: 11, color: '#999', marginBottom: 12 } as React.CSSProperties,
    stepItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f3f3f7' } as React.CSSProperties,
    stepIcon: (done: boolean) => ({
      width: 28, height: 28, borderRadius: '50%',
      background: done ? '#d5f5ec' : '#f0f0f5',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 700, color: done ? '#00b894' : '#999',
    }) as React.CSSProperties,
    stepBadge: (_text: string, bg: string, color: string) => ({
      fontSize: 11, fontWeight: 600, color, background: bg,
      padding: '4px 12px', borderRadius: 8,
    }) as React.CSSProperties,
    questTable: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 } as React.CSSProperties,
    rewardCard: {
      background: 'linear-gradient(135deg, #ff9a3c, #ff6b35)',
      borderRadius: 18, padding: 24, color: '#fff',
      position: 'relative' as const, overflow: 'hidden', marginBottom: 20,
    } as React.CSSProperties,
    rewardBtn: {
      background: '#fff', color: '#ff6b35', border: 'none', borderRadius: 10,
      padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer', marginTop: 12,
    } as React.CSSProperties,
    rightPanel: { display: 'flex', flexDirection: 'column' as const, gap: 20 } as React.CSSProperties,
    rankItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #f3f3f7' } as React.CSSProperties,
    rankNum: (top: boolean) => ({
      width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 700, background: top ? '#6c5ce7' : '#f0f0f5', color: top ? '#fff' : '#999',
    }) as React.CSSProperties,
    barChart: { display: 'flex', alignItems: 'flex-end', gap: 12, height: 120, padding: '0 8px' } as React.CSSProperties,
    barItem: (_h: number, _color: string) => ({
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    }) as React.CSSProperties,
    input: {
      width: '100%', padding: '10px 14px', border: '1.5px solid #e0e0e0',
      borderRadius: 10, fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none',
      background: '#fff', boxSizing: 'border-box' as const,
    } as React.CSSProperties,
    select: {
      padding: '10px 14px', border: '1.5px solid #e0e0e0',
      borderRadius: 10, fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none',
      background: '#fff', cursor: 'pointer',
    } as React.CSSProperties,
  }

  const sideItems: { key: SideTab; label: string; icon: string }[] = [
    { key: 'home', label: 'Home', icon: '🏠' },
    { key: 'missions', label: 'Missions', icon: '🚀' },
    { key: 'trophies', label: 'Trophies', icon: '🏆' },
    { key: 'profile', label: 'Profile', icon: '👤' },
  ]

  // ── Render ──

  return (
    <div style={S.page}>
      <TopBar />
      <div style={S.wrapper}>
        {/* Sidebar */}
        <nav style={S.sidebar}>
          <div style={S.sidebarLogo}>
            <div style={S.sidebarLogoIcon}>📖</div>
            <div>
              <p style={S.sidebarTitle}>Perpustakaan<br />Belajar</p>
              <p style={S.sidebarSubtitle}>Petualangan belajarmu 🚀</p>
            </div>
          </div>
          {sideItems.map((item) => (
            <button
              key={item.key}
              type='button'
              style={S.sideItem(sideTab === item.key)}
              onClick={() => setSideTab(item.key)}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
          <button
            type='button'
            style={S.parentModeBtn}
            onClick={() => navigate('/orangtua')}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: '#6c5ce7' }}>Mode Orang Tua</span><br />
            <span style={{ fontSize: 11, color: '#999' }}>Aktifkan 🔒</span>
          </button>
        </nav>

        {/* Main Content */}
        <main style={S.main}>
          {sideTab === 'home' && (
            <>
              {/* Header */}
              <div style={S.header}>
                <div>
                  <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, fontFamily: 'var(--font-display)' }}>
                    Halo, {user?.name?.split(' ')[0] ?? 'Teman'}! 👋
                  </h1>
                  <p style={{ fontSize: 13, color: '#999', margin: '2px 0 0' }}>
                    {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })} · Kelas {user?.grade ?? '?'} SD
                  </p>
                </div>
                <div style={S.headerRight}>
                  <div style={S.streakBadge}>🔥 {streak} Hari Streak</div>
                  <div style={S.pointsBadge}>⭐ {totalPoints} Poin</div>
                  <div style={S.avatar}>{user?.name?.charAt(0).toUpperCase() ?? '?'}</div>
                </div>
              </div>

              {/* Stat Cards */}
              <div style={S.statRow}>
                <div style={S.statCard('🔥', '#fff3e0')}>
                  <div style={S.statIcon('#fff3e0')}>🔥</div>
                  <div>
                    <p style={{ fontSize: 11, color: '#999', margin: 0 }}>Streak</p>
                    <p style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{streak} Hari 🔥</p>
                  </div>
                </div>
                <div style={S.statCard('✅', '#e8f8f5')}>
                  <div style={S.statIcon('#e8f8f5')}>✅</div>
                  <div>
                    <p style={{ fontSize: 11, color: '#999', margin: 0 }}>Selesai Hari Ini</p>
                    <p style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{completedCount} / {assignments.length || 0}</p>
                  </div>
                </div>
                <div style={S.statCard('⚡', '#f0eeff')}>
                  <div style={S.statIcon('#f0eeff')}>⚡</div>
                  <div>
                    <p style={{ fontSize: 11, color: '#999', margin: 0 }}>XP Hari Ini</p>
                    <p style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#6c5ce7' }}>+{completedCount * 60}</p>
                  </div>
                </div>
              </div>

              {/* Active Mission */}
              {activeAssignment && (
                <div style={S.missionCard}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#ff6b35', background: '#fff3e0', padding: '3px 10px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      🔴 Sedang Berjalan
                    </span>
                    <span style={S.progressBadge}>
                      {(() => { const p = getAssignmentProgress(activeAssignment); return `${p.completed} of ${p.total} Done!` })()}
                    </span>
                  </div>
                  <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px', fontFamily: 'var(--font-display)' }}>
                    {activeAssignment.title}
                  </h2>
                  <p style={{ fontSize: 13, color: '#999', margin: '0 0 4px' }}>
                    {getSubjectName(activeAssignment.materialId ? moduleCache[activeAssignment.materialId]?.subjectId : null)} · Bab {Math.ceil((assignments.indexOf(activeAssignment) + 1) / 2)} dari {assignments.length}
                  </p>
                  {(() => {
                    const p = getAssignmentProgress(activeAssignment)
                    return (
                      <>
                        <div style={S.progressBar}>
                          <div style={{ height: '100%', width: `${p.pct}%`, background: 'linear-gradient(90deg, #ff7675, #fd79a8)', borderRadius: 999, transition: 'width 0.4s' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#999' }}>
                          <span>Mulai</span>
                          <span>{p.pct}% Selesai</span>
                          <span>Selesai</span>
                        </div>
                      </>
                    )
                  })()}
                  <div style={S.missionActions}>
                    <button type='button' style={S.missionBtn(true)} onClick={() => handleStartAssignment(activeAssignment)}>
                      ▶ Lanjutkan Misi
                    </button>
                    <button type='button' style={S.missionBtn(false)} onClick={() => activeAssignment.materialId && navigate(`/modul/${activeAssignment.materialId}`)}>
                      📚 Lihat Materi
                    </button>
                    <button type='button' style={{ ...S.missionBtn(false), padding: '10px 14px' }}>•••</button>
                  </div>
                </div>
              )}

              {/* Mission Steps */}
              {activeAssignment && (() => {
                const frames = getFilteredFrames(activeAssignment)
                if (frames.length === 0) return null
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                    <div style={S.stepsCard}>
                      <h3 style={S.sectionTitle}>Langkah Misi</h3>
                      {frames.map((frame, idx) => {
                        const fp = getFrameProgress(activeAssignment.materialId, frame.id)
                        const isDone = fp?.completed ?? false
                        return (
                          <div key={frame.id} style={S.stepItem}>
                            <div style={S.stepIcon(isDone)}>{isDone ? '✓' : idx + 1}</div>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{frame.title}</p>
                              <p style={{ fontSize: 12, color: '#999', margin: '2px 0 0' }}>
                                {isDone ? 'Selesai' : idx === frames.findIndex((f) => !(getFrameProgress(activeAssignment.materialId, f.id)?.completed)) ? 'Terkunci · selesaikan dulu' : 'Terkunci'}
                              </p>
                            </div>
                            {isDone ? (
                              <span style={{ fontSize: 12, fontWeight: 600, color: '#00b894' }}>
                                +{frame.kind === 'quiz' ? 50 : 40} XP
                              </span>
                            ) : (
                              <button
                                type='button'
                                style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, border: 'none', background: '#6c5ce7', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                                onClick={() => handleStartAssignment(activeAssignment)}
                              >
                                Mulai
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Quest History */}
                    <div style={S.stepsCard}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h3 style={{ ...S.sectionTitle, margin: 0 }}>Riwayat Quest</h3>
                        <span style={{ fontSize: 12, color: '#6c5ce7', fontWeight: 600, cursor: 'pointer' }}>Lihat Semua</span>
                      </div>
                      <table style={S.questTable}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #f0f0f5' }}>
                            <th style={{ textAlign: 'left', padding: '8px 4px', fontSize: 11, color: '#999', fontWeight: 600 }}>QUEST NAME</th>
                            <th style={{ textAlign: 'left', padding: '8px 4px', fontSize: 11, color: '#999', fontWeight: 600 }}>SUBJECT</th>
                            <th style={{ textAlign: 'left', padding: '8px 4px', fontSize: 11, color: '#999', fontWeight: 600 }}>EXP EARNED</th>
                            <th style={{ textAlign: 'left', padding: '8px 4px', fontSize: 11, color: '#999', fontWeight: 600 }}>STATUS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {frames.map((frame) => {
                            const fp = getFrameProgress(activeAssignment.materialId, frame.id)
                            const isDone = fp?.completed ?? false
                            const subName = getSubjectName(activeAssignment.materialId ? moduleCache[activeAssignment.materialId]?.subjectId : null) || 'Math'
                            return (
                              <tr key={frame.id} style={{ borderBottom: '1px solid #f3f3f7' }}>
                                <td style={{ padding: '8px 4px', fontWeight: 500 }}>{frame.title}</td>
                                <td style={{ padding: '8px 4px', color: '#999' }}>{subName}</td>
                                <td style={{ padding: '8px 4px', color: '#999' }}>{isDone ? `${frame.kind === 'quiz' ? 50 : 40} XP` : '—'}</td>
                                <td style={{ padding: '8px 4px' }}>
                                  <span style={{
                                    fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6,
                                    background: isDone ? '#d5f5ec' : '#f0eeff', color: isDone ? '#00b894' : '#6c5ce7',
                                  }}>
                                    {isDone ? 'Selesai' : 'Mulai'}
                                  </span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })()}

              {/* Empty state */}
              {!activeAssignment && !assignmentsLoading && (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <p style={{ fontSize: 48, marginBottom: 12 }}>📝</p>
                  <p style={{ color: '#999', fontSize: 14, marginBottom: 16 }}>Semua tugas sudah selesai! 🎉</p>
                </div>
              )}

              {assignmentsLoading && (
                <p style={{ color: '#999', fontSize: 13, textAlign: 'center', padding: 20 }}>Memuat tugas...</p>
              )}
            </>
          )}

          {sideTab === 'missions' && (
            <>
              <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px', fontFamily: 'var(--font-display)' }}>🚀 Missions</h1>
              <p style={{ fontSize: 13, color: '#999', marginBottom: 20 }}>Semua tugas yang diberikan orang tua</p>
              {/* Search & Sort */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input
                  type='text'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder='🔍 Cari tugas...'
                  style={{ ...S.input, flex: 1, maxWidth: 280 }}
                />
                <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)} style={S.select}>
                  <option value='newest'>Terbaru</option>
                  <option value='oldest'>Terlama</option>
                  <option value='deadline'>Deadline</option>
                  <option value='status'>Status</option>
                </select>
              </div>
              {filteredAssignments.length === 0 ? (
                <p style={{ color: '#bbb', fontSize: 13, textAlign: 'center', padding: 20 }}>Tidak ada tugas ditemukan.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {filteredAssignments.map((a) => {
                    const mod = a.materialId ? moduleCache[a.materialId] : null
                    const progress = getAssignmentProgress(a)
                    const isCompleted = progress.total > 0 && progress.completed === progress.total
                    let cardBg = '#fff'
                    let cardBorder = '1px solid #eee'
                    if (!isCompleted && a.dueDate) {
                      const hoursLeft = (new Date(a.dueDate).getTime() - Date.now()) / (1000 * 60 * 60)
                      if (hoursLeft < 0) { cardBg = 'rgba(239,68,68,0.04)'; cardBorder = '1.5px solid #ef4444' }
                      else if (hoursLeft <= 24) { cardBg = 'rgba(245,158,11,0.04)'; cardBorder = '1.5px solid #f59e0b' }
                    }
                    return (
                      <div key={a.id} style={{ background: cardBg, border: cardBorder, borderRadius: 14, padding: 18 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <div>
                            <p style={{ fontSize: 11, fontWeight: 600, color: '#6c5ce7', margin: '0 0 2px' }}>
                              {getSubjectName(mod?.subjectId) || 'Tugas'}
                            </p>
                            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{a.title}</h3>
                            <p style={{ fontSize: 12, color: '#999', margin: '4px 0 0' }}>
                              {a.dueDate ? `📅 ${new Date(a.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}` : 'Tanpa deadline'}
                            </p>
                          </div>
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6,
                            background: isCompleted ? '#d5f5ec' : progress.pct > 0 ? '#f0eeff' : '#f5f5f5',
                            color: isCompleted ? '#00b894' : progress.pct > 0 ? '#6c5ce7' : '#999',
                          }}>
                            {isCompleted ? '✅ Selesai' : progress.pct > 0 ? `${progress.pct}%` : 'Menunggu'}
                          </span>
                        </div>
                        <div style={{ height: 5, borderRadius: 999, background: '#f0f0f5', overflow: 'hidden', marginBottom: 8 }}>
                          <div style={{ height: '100%', width: `${progress.pct}%`, background: isCompleted ? '#00b894' : '#6c5ce7', borderRadius: 999 }} />
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {a.materialId && progress.pct < 100 && (
                            <button type='button' style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, border: 'none', background: '#6c5ce7', color: '#fff', fontWeight: 600, cursor: 'pointer' }} onClick={() => handleStartAssignment(a)}>
                              {progress.pct > 0 ? 'Lanjutkan →' : 'Kerjakan →'}
                            </button>
                          )}
                          <button type='button' style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', fontWeight: 600, cursor: 'pointer' }} onClick={() => setExpandedAssignment(expandedAssignment === a.id ? null : a.id)}>
                            💬 Tanya ({(questions[a.id] ?? []).length})
                          </button>
                        </div>
                        {/* Questions inline */}
                        {expandedAssignment === a.id && (
                          <div style={{ marginTop: 12, padding: 12, background: '#f8f7ff', borderRadius: 10, border: '1px solid #eee' }}>
                            {(questions[a.id] ?? []).map((q) => (
                              <div key={q.id} style={{ marginBottom: 8 }}>
                                <p style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>❓ {q.question}</p>
                                {q.reply ? (
                                  <p style={{ fontSize: 12, color: '#00b894', margin: '4px 0 0', paddingLeft: 12, borderLeft: '2px solid #00b894' }}>💬 {q.reply}</p>
                                ) : (
                                  <p style={{ fontSize: 11, color: '#999', margin: '4px 0 0', fontStyle: 'italic' }}>Menunggu balasan...</p>
                                )}
                              </div>
                            ))}
                            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                              <input
                                type='text'
                                value={newQuestion}
                                onChange={(e) => setNewQuestion(e.target.value)}
                                placeholder='Ketik pertanyaan...'
                                style={{ ...S.input, flex: 1 }}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !sendingQuestion) handleSendQuestion(a.id) }}
                              />
                              <button type='button' style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, border: 'none', background: '#6c5ce7', color: '#fff', fontWeight: 600, cursor: 'pointer' }} onClick={() => handleSendQuestion(a.id)} disabled={sendingQuestion || !newQuestion.trim()}>
                                {sendingQuestion ? '...' : 'Kirim'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {sideTab === 'trophies' && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <p style={{ fontSize: 64, marginBottom: 12 }}>🏆</p>
              <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>Trophies</h2>
              <p style={{ color: '#999', fontSize: 14 }}>Selesaikan misi untuk mengumpulkan piala!</p>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
                {completedCount >= 1 && <div style={{ width: 80, textAlign: 'center' }}><div style={{ fontSize: 40 }}>🥉</div><p style={{ fontSize: 11, fontWeight: 600 }}>Pertama</p></div>}
                {completedCount >= 3 && <div style={{ width: 80, textAlign: 'center' }}><div style={{ fontSize: 40 }}>🥈</div><p style={{ fontSize: 11, fontWeight: 600 }}>Rajin</p></div>}
                {completedCount >= 5 && <div style={{ width: 80, textAlign: 'center' }}><div style={{ fontSize: 40 }}>🥇</div><p style={{ fontSize: 11, fontWeight: 600 }}>Ahli</p></div>}
                {completedCount < 1 && <p style={{ color: '#ccc', fontSize: 13 }}>Selesaikan misi pertama untuk mendapatkan piala!</p>}
              </div>
            </div>
          )}

          {sideTab === 'profile' && (
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 20px', fontFamily: 'var(--font-display)' }}>👤 Profil</h1>
              <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 400 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#6c5ce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 28 }}>
                    {user?.name?.charAt(0).toUpperCase() ?? '?'}
                  </div>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{user?.name}</h2>
                    <p style={{ fontSize: 13, color: '#999', margin: '2px 0 0' }}>{user?.email}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f3f7' }}>
                    <span style={{ color: '#999', fontSize: 13 }}>Kelas</span>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{user?.grade ?? '?'} SD</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f3f7' }}>
                    <span style={{ color: '#999', fontSize: 13 }}>Semester</span>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{user?.semester ?? '?'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f3f7' }}>
                    <span style={{ color: '#999', fontSize: 13 }}>Misi Selesai</span>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{completedCount}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                    <span style={{ color: '#999', fontSize: 13 }}>Total Poin</span>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#6c5ce7' }}>⭐ {totalPoints}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Right Panel (Home only) */}
        {sideTab === 'home' && (
          <aside style={{ width: 300, flexShrink: 0, padding: '24px 20px 64px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Daily Reward */}
            <div style={S.rewardCard}>
              <div style={{ position: 'absolute', top: 16, right: 16, width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
              <div style={{ position: 'absolute', bottom: 20, right: 30, width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }} />
              <p style={{ fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.3)', display: 'inline-block', padding: '3px 10px', borderRadius: 6, marginBottom: 10 }}>🎁 Reward</p>
              <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>Klaim Hadiah Harianmu! 🎁</h3>
              <p style={{ fontSize: 13, opacity: 0.9, margin: '0 0 12px' }}>Kumpulkan bintang setiap hari untuk membuka skin spesial.</p>
              <button type='button' style={S.rewardBtn}>🎁 Klaim Sekarang</button>
            </div>

            {/* Weekly Progress */}
            <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Progress Mingguan</h3>
                <span style={{ fontSize: 11, color: '#999' }}>Minggu ini</span>
              </div>
              <p style={{ fontSize: 11, color: '#bbb', margin: '0 0 12px' }}>Penyelesaian per mata pelajaran</p>
              <div style={S.barChart}>
                {(subjectBreakdown.length > 0 ? subjectBreakdown : [
                  { name: 'Math', pct: 78, color: '#6c5ce7' },
                  { name: 'Science', pct: 65, color: '#fd79a8' },
                  { name: 'Indo', pct: 88, color: '#fdcb6e' },
                ]).map((s, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#666' }}>{s.pct}%</div>
                    <div style={{ width: '100%', height: s.pct, background: s.color, borderRadius: 8, minHeight: 8, transition: 'height 0.4s' }} />
                    <span style={{ fontSize: 10, color: '#999' }}>{s.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Points */}
            <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 4px' }}>⭐ Poin Kamu</h3>
              <p style={{ fontSize: 11, color: '#999', margin: '0 0 12px' }}>Total poin yang sudah kamu kumpulkan</p>
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: 36, fontWeight: 700, color: '#6c5ce7' }}>{totalPoints}</div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>XP</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: '1px solid #f3f3f7', paddingTop: 12, marginTop: 8 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#00b894' }}>{completedCount}</div>
                  <div style={{ fontSize: 10, color: '#999' }}>Selesai</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#ff7675' }}>{assignments.filter(a => a.status === 'overdue').length}</div>
                  <div style={{ fontSize: 10, color: '#999' }}>Terlambat</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#6c5ce7' }}>{inProgressCount}</div>
                  <div style={{ fontSize: 10, color: '#999' }}>Berjalan</div>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
