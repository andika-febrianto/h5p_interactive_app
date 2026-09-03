import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'
import TopBar from '../../components/TopBar'
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

type SideTab = 'home' | 'missions' | 'trophies' | 'profile' | 'modules' | 'reports'

export default function ChildDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [sideTab, setSideTab] = useState<SideTab>('home')

  const [assignments, setAssignments] = useState<ParentAssignment[]>([])
  const [assignmentsLoading, setAssignmentsLoading] = useState(true)
  const [moduleCache, setModuleCache] = useState<Record<string, Module>>({})

  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<
    'newest' | 'oldest' | 'deadline' | 'status'
  >('newest')
  const [progressCache, setProgressCache] = useState<
    Record<string, Record<string, FrameProgress>>
  >({})

  const [expandedAssignment, setExpandedAssignment] = useState<string | null>(
    null,
  )
  const [questions, setQuestions] = useState<Record<string, Question[]>>({})
  const [newQuestion, setNewQuestion] = useState('')
  const [sendingQuestion, setSendingQuestion] = useState(false)

  // Notification state (bell handled by TopBar for child)

  // Subject filter for tasks
  const [subjectFilter, setSubjectFilter] = useState('all')



  // ── Data Loading ──

  useEffect(() => {
    if (!user?.id) return
    fetchChildAssignments(user.id)
      .then((data) => {
        setAssignments(data)
        data.forEach((a) => {
          if (a.materialId && !moduleCache[a.materialId]) {
            fetchModule(a.materialId)
              .then((mod) =>
                setModuleCache((prev) => ({ ...prev, [a.materialId!]: mod })),
              )
              .catch(() => {})
            fetchChildModuleProgress(user.id!, a.materialId)
              .then((frames) => {
                const map: Record<string, FrameProgress> = {}
                frames.forEach((f) => {
                  map[f.frameSlug] = f
                })
                setProgressCache((prev) => ({ ...prev, [a.materialId!]: map }))
              })
              .catch(() => {})
          }
        })
      })
      .catch(() => setAssignments([]))
      .finally(() => setAssignmentsLoading(false))
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    checkStudentNotifications().catch(() => {})
  }, [user?.id])

  const loadQuestions = useCallback(async (assignmentId: string) => {
    try {
      const data = await fetchAssignmentQuestions(assignmentId)
      setQuestions((prev) => ({ ...prev, [assignmentId]: data }))
    } catch {
      setQuestions((prev) => ({ ...prev, [assignmentId]: [] }))
    }
  }, [])

  useEffect(() => {
    if (expandedAssignment) loadQuestions(expandedAssignment)
  }, [expandedAssignment, loadQuestions])

  const handleSendQuestion = async (assignmentId: string) => {
    if (!newQuestion.trim()) return
    setSendingQuestion(true)
    try {
      await askQuestion(assignmentId, newQuestion.trim())
      setNewQuestion('')
      await loadQuestions(assignmentId)
    } catch {
      /* silently fail */
    } finally {
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
    const mod = assignment.materialId
      ? moduleCache[assignment.materialId]
      : null
    if (!mod) return []
    const frames = Array.isArray(assignment.selectedFrames)
      ? assignment.selectedFrames
      : []
    if (frames.length === 0) return mod.frames
    return mod.frames.filter((f) => frames.includes(f.id))
  }

  const getFrameProgress = (
    materialId: string | null,
    frameSlug: string,
  ): FrameProgress | null => {
    if (!materialId) return null
    return progressCache[materialId]?.[frameSlug] ?? null
  }

  const getAssignmentProgress = (assignment: ParentAssignment) => {
    const frames = getFilteredFrames(assignment)
    if (frames.length === 0) return { completed: 0, total: 0, pct: 0 }
    let completed = 0
    frames.forEach((f) => {
      const p = getFrameProgress(assignment.materialId, f.id)
      if (p?.completed) completed++
    })
    return {
      completed,
      total: frames.length,
      pct: Math.round((completed / frames.length) * 100),
    }
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
      if (sortOrder === 'newest')
        return (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
      if (sortOrder === 'oldest')
        return (a.createdAt ?? '').localeCompare(b.createdAt ?? '')
      if (sortOrder === 'deadline')
        return (a.dueDate ?? 'z').localeCompare(b.dueDate ?? 'z')
      const statusOrder: Record<string, number> = {
        overdue: 0,
        in_progress: 1,
        pending: 2,
        completed: 3,
      }
      return (statusOrder[a.status] ?? 4) - (statusOrder[b.status] ?? 4)
    })
    return result
  }, [assignments, searchQuery, sortOrder, moduleCache])

  // activeAssignment is handled within task cards list
  const completedCount = assignments.filter((a) => {
    const p = getAssignmentProgress(a)
    return p.total > 0 && p.completed === p.total
  }).length
  const inProgressCount = assignments.filter(
    (a) => a.status === 'in_progress',
  ).length
  const overdueCount = assignments.filter((a) => a.status === 'overdue').length
  const totalPoints = completedCount * 100 + inProgressCount * 20

  // Subject breakdown for weekly progress
  const subjectBreakdown = useMemo(() => {
    const map: Record<string, { name: string; pct: number; color: string }> = {}
    const colors = ['#6366f1', '#f43f5e', '#f59e0b', '#10b981']
    let ci = 0
    assignments.forEach((a) => {
      const mod = a.materialId ? moduleCache[a.materialId] : null
      const subName = getSubjectName(mod?.subjectId) || 'Lainnya'
      if (!map[subName]) {
        map[subName] = {
          name: subName,
          pct: getAssignmentProgress(a).pct,
          color: colors[ci++ % colors.length],
        }
      }
    })
    return Object.values(map).slice(0, 4)
  }, [assignments, moduleCache])

  // Streak calculation
  const streak = useMemo(() => {
    const completedDates = assignments
      .filter((a) => a.status === 'completed')
      .map((a) => new Date(a.createdAt ?? Date.now()).toDateString())
    const uniqueDates = [...new Set(completedDates)]
    return Math.min(uniqueDates.length, 30)
  }, [assignments])

  // Subject groups for filter tabs
  const subjectGroups = useMemo(() => {
    const groups: Record<string, number> = {}
    assignments.forEach((a) => {
      const mod = a.materialId ? moduleCache[a.materialId] : null
      const subName = getSubjectName(mod?.subjectId) || 'Tugas'
      groups[subName] = (groups[subName] || 0) + 1
    })
    return groups
  }, [assignments, moduleCache])

  // ── Sidebar Items ──
  const sideItems: { key: SideTab; label: string; icon: string; badge?: number }[] = [
    { key: 'home', label: 'Beranda', icon: '🏠' },
    { key: 'missions', label: 'Misi Belajar', icon: '🚀', badge: assignments.filter(a => a.status !== 'completed').length || undefined },
    { key: 'modules', label: 'Modul Pelajaran', icon: '📚' },
    { key: 'trophies', label: 'Trofi & Prestasi', icon: '🏆' },
    { key: 'reports', label: 'Rapor Belajar', icon: '📊' },
    { key: 'profile', label: 'Profil Saya', icon: '👤' },
  ]

  // ── Helpers ──
  const getTaskStatusColor = (a: ParentAssignment) => {
    const progress = getAssignmentProgress(a)
    const isCompleted = progress.total > 0 && progress.completed === progress.total
    if (isCompleted) return { bg: 'bg-slate-50/70', border: 'border-slate-100', text: 'text-emerald-600', badge: 'bg-emerald-100', icon: '📖', iconBg: 'bg-rose-100 text-rose-600' }
    if (a.status === 'overdue') return { bg: 'bg-red-50/30', border: 'border-red-200', text: 'text-red-600', badge: 'bg-red-100', icon: '⚠️', iconBg: 'bg-amber-100 text-amber-600' }
    if (progress.pct > 0) return { bg: 'bg-indigo-50/30', border: 'border-indigo-200', text: 'text-indigo-700', badge: 'bg-indigo-100', icon: '📐', iconBg: 'bg-indigo-600 text-white' }
    return { bg: 'bg-white', border: 'border-slate-200', text: 'text-emerald-600', badge: 'bg-emerald-100', icon: '🌿', iconBg: 'bg-emerald-100 text-emerald-700' }
  }

  const getTaskStatusLabel = (a: ParentAssignment) => {
    const progress = getAssignmentProgress(a)
    const isCompleted = progress.total > 0 && progress.completed === progress.total
    if (isCompleted) return { label: 'Selesai 100%', color: 'text-emerald-600 font-bold' }
    if (a.status === 'overdue') return { label: 'Terlambat', color: 'text-red-600 font-bold' }
    if (progress.pct > 0) return { label: `${progress.pct}%`, color: 'text-indigo-600 font-bold' }
    return { label: 'Siap Mulai', color: 'text-emerald-600 font-bold' }
  }

  // ── Render ──

  return (
    <div style={{ minHeight: '100vh', background: '#F6F8FD', fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', color: '#1e293b', display: 'flex', flexDirection: 'column' }} className='antialiased'>
      <TopBar />

      {/* Main Dashboard Container */}
      <div style={{ flex: 1, maxWidth: 1600, width: '100%', margin: '0 auto', padding: '24px 16px', display: 'flex', gap: 24 }}>
        {/* ── Left Sidebar ── */}
        <aside style={{ width: 256, flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }} className='hidden md:flex'>
          <div>
            {/* Primary Nav */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {sideItems.map((item) => {
                const isActive = sideTab === item.key
                return (
                  <button
                    key={item.key}
                    type='button'
                    onClick={() => setSideTab(item.key)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 16,
                      border: isActive ? 'none' : '1px solid transparent',
                      background: isActive ? '#5850EC' : 'transparent',
                      color: isActive ? '#fff' : '#64748b',
                      fontWeight: isActive ? 700 : 600,
                      fontSize: 13, cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left' as const,
                    }}
                    className={isActive ? 'shadow-lg' : 'hover:bg-white hover:text-[#5850EC] hover:border-slate-100'}
                  >
                    <span style={{ fontSize: 18, transition: 'transform 0.2s' }}>{item.icon}</span>
                    <span>{item.label}</span>
                    {item.badge && !isActive && (
                      <span style={{ marginLeft: 'auto', fontSize: 11, background: '#E0E7FF', color: '#4F46E5', fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                        {item.badge} Aktif
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>

            {/* Subscription Card */}
            <div style={{ marginTop: 24, background: 'linear-gradient(135deg, #EEF2FF, #F5F3FF)', borderRadius: 16, padding: 16, border: '1px solid rgba(224,231,255,0.7)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4F46E5', fontWeight: 700, fontSize: 12, marginBottom: 4 }}>
                <span style={{ fontSize: 14 }}>✨</span>
                <span>Paket Belajar Aktif</span>
              </div>
              <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px' }}>Paket Pro 14 Hari berakhir dalam 9 hari lagi.</p>
              <button type='button' style={{ display: 'block', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#5850EC', background: '#fff', padding: '8px 12px', borderRadius: 12, border: '1px solid rgba(224,231,255,0.6)', cursor: 'pointer', width: '100%', transition: 'all 0.2s' }} className='hover:shadow'>
                Kelola Langganan →
              </button>
            </div>
          </div>

          {/* Parent Mode Card */}
          <div style={{ marginTop: 24, background: '#fff', border: '2px dashed #C7D2FE', borderRadius: 16, padding: 16, textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s' }} className='hover:border-[#6366F1]'>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#EEF2FF', color: '#5850EC', margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🔒</div>
            <h2 style={{ fontSize: 12, fontWeight: 800, color: '#1e293b', margin: 0 }}>Mode Orang Tua</h2>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 8px' }}>Pantau waktu layar & limit nilai</p>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '4px 12px', fontSize: 11, fontWeight: 700, color: '#4F46E5', background: '#EEF2FF', borderRadius: 8 }}>
              Aktifkan PIN 🔑
            </span>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main style={{ flex: 1, minWidth: 0 }}>
          {/* ═══ HOME TAB ═══ */}
          {sideTab === 'home' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Welcome Banner */}
              <section style={{ background: '#fff', borderRadius: 24, padding: '24px 28px', border: '1px solid #f1f5f9', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', margin: 0 }}>Halo, {user?.name?.split(' ')[0] ?? 'Teman'}!</h1>
                      <span style={{ fontSize: 28 }}>👋</span>
                    </div>
                    <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
                      {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })} · <span style={{ color: '#5850EC', fontWeight: 600 }}>Kelas {user?.grade ?? '?'} SD</span> · Siap menaklukkan misi belajarmu hari ini?
                    </p>
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(90deg, rgba(245,158,11,0.1), rgba(99,102,241,0.1))', border: '1px solid rgba(199,210,254,0.5)', padding: '8px 16px', borderRadius: 16, flexShrink: 0 }}>
                    <span style={{ fontSize: 18 }}>🎯</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Target Hari Ini: <strong>{assignments.filter(a => a.status !== 'completed').length} Misi Lagi</strong></span>
                  </div>
                </div>
                {/* Decorative blob */}
                <div style={{ position: 'absolute', right: -32, bottom: -32, width: 176, height: 176, borderRadius: '50%', background: 'rgba(238,242,255,0.8)', filter: 'blur(40px)', pointerEvents: 'none' }} />
              </section>

              {/* KPI Metric Cards */}
              <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                {[
                  { icon: '🔥', label: 'Streak Belajar', value: `${streak} Hari`, sub: '/ 7 target', badge: '+1 Hari', badgeBg: '#FEF3C7', badgeColor: '#92400e', hoverBorder: '#FCD34D' },
                  { icon: '✅', label: 'Selesai Hari Ini', value: `${completedCount}`, sub: `/ ${assignments.length || 0} Misi`, badge: `${assignments.length > 0 ? Math.round((completedCount / assignments.length) * 100) : 0}%`, badgeBg: '#ECFDF5', badgeColor: '#065F46', hoverBorder: '#6EE7B7' },
                  { icon: '⚡', label: 'XP Hari Ini', value: `+${totalPoints}`, sub: 'XP', badge: totalPoints > 0 ? 'Naik Level!' : 'Mulai!', badgeBg: '#EEF2FF', badgeColor: '#4338CA', hoverBorder: '#A5B4FC', valueColor: '#5850EC' },
                  { icon: '⏱️', label: 'Waktu Belajar', value: `${inProgressCount * 15 + completedCount * 10}`, sub: 'Menit', badge: 'Fokus', badgeBg: '#F5F3FF', badgeColor: '#6D28D9', hoverBorder: '#C4B5FD' },
                ].map((kpi, i) => (
                  <div key={i} style={{ background: '#fff', borderRadius: 16, padding: '20px 16px', border: '1px solid #f1f5f9', transition: 'border-color 0.2s' }} className='hover:shadow-sm' /* @ts-ignore */ onMouseEnter={(e: any) => e.currentTarget.style.borderColor = kpi.hoverBorder} onMouseLeave={(e: any) => e.currentTarget.style.borderColor = '#f1f5f9'}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 16, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{kpi.icon}</div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: kpi.badgeColor, background: kpi.badgeBg, padding: '2px 8px', borderRadius: 12 }}>{kpi.badge}</span>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>{kpi.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: kpi.valueColor || '#0f172a', marginTop: 2, display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      {kpi.value}
                      <span style={{ fontSize: 12, fontWeight: 500, color: '#94a3b8' }}>{kpi.sub}</span>
                    </div>
                  </div>
                ))}
              </section>

              {/* Active Tasks Section */}
              <section style={{ background: '#fff', borderRadius: 24, padding: '24px 28px', border: '1px solid #f1f5f9' }}>
                {/* Header & Filter */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>Misi Belajar Hari Ini</span>
                      <span style={{ fontSize: 16 }}>🎯</span>
                    </h2>
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>Selesaikan tugas interaktif untuk raih koin bintang & trofi</p>
                  </div>
                  {/* Subject filter */}
                  <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: 4, borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                    <button type='button' onClick={() => setSubjectFilter('all')}
                      style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: subjectFilter === 'all' ? '#fff' : 'transparent', color: subjectFilter === 'all' ? '#0f172a' : '#64748b', fontWeight: subjectFilter === 'all' ? 700 : 600, cursor: 'pointer', fontSize: 12, boxShadow: subjectFilter === 'all' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.2s' }}>
                      Semua ({assignments.length})
                    </button>
                    {Object.entries(subjectGroups).slice(0, 3).map(([name, count]) => (
                      <button key={name} type='button' onClick={() => setSubjectFilter(name)}
                        style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: subjectFilter === name ? '#fff' : 'transparent', color: subjectFilter === name ? '#0f172a' : '#64748b', fontWeight: subjectFilter === name ? 700 : 600, cursor: 'pointer', fontSize: 12, boxShadow: subjectFilter === name ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.2s' }}>
                        {name} ({count})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Task Cards */}
                {assignmentsLoading ? (
                  <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: 40 }}>Memuat tugas...</p>
                ) : filteredAssignments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 20px' }}>
                    <p style={{ fontSize: 48, marginBottom: 12 }}>📝</p>
                    <p style={{ color: '#94a3b8', fontSize: 14 }}>Semua tugas sudah selesai! 🎉</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {filteredAssignments
                      .filter(a => subjectFilter === 'all' || getSubjectName(a.materialId ? moduleCache[a.materialId]?.subjectId : null) === subjectFilter)
                      .map((a) => {
                        const mod = a.materialId ? moduleCache[a.materialId] : null
                        const progress = getAssignmentProgress(a)
                        const isCompleted = progress.total > 0 && progress.completed === progress.total
                        const statusInfo = getTaskStatusColor(a)
                        const statusLabel = getTaskStatusLabel(a)

                        return (
                          <div key={a.id}
                            style={{
                              border: isCompleted ? '1px solid #f1f5f9' : `1px solid ${a.status === 'overdue' ? '#FCA5A5' : progress.pct > 0 ? '#C7D2FE' : '#e2e8f0'}`,
                              background: isCompleted ? 'rgba(248,250,252,0.7)' : a.status === 'overdue' ? 'rgba(254,242,242,0.3)' : progress.pct > 0 ? 'rgba(238,242,255,0.3)' : '#fff',
                              borderRadius: 16, padding: '20px', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, transition: 'all 0.2s',
                            }}
                            className='group'
                          >
                            {/* Left: Icon + Info */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                              <div style={{ width: 48, height: 48, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, ...(
                                isCompleted ? { background: '#FEE2E2', color: '#E11D48' } :
                                a.status === 'overdue' ? { background: '#FEF3C7', color: '#D97706' } :
                                progress.pct > 0 ? { background: '#5850EC', color: '#fff', boxShadow: '0 4px 12px rgba(88,80,236,0.2)' } :
                                { background: '#ECFDF5', color: '#059669' }
                              ) }}>
                                {statusInfo.icon}
                              </div>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ fontSize: 11, fontWeight: 800, color: isCompleted ? '#BE185D' : a.status === 'overdue' ? '#B91C1C' : progress.pct > 0 ? '#4338CA' : '#065F46', background: isCompleted ? '#FCE7F3' : a.status === 'overdue' ? '#FEE2E2' : progress.pct > 0 ? '#E0E7FF' : '#ECFDF5', padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    {getSubjectName(mod?.subjectId) || 'Tugas'}
                                  </span>
                                  <span style={{ fontSize: 12, color: statusLabel.color }}>{statusLabel.label}</span>
                                </div>
                                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '4px 0', textDecoration: isCompleted ? 'line-through' : 'none', textDecorationColor: '#94a3b8' }}>{a.title}</h3>
                                {progress.total > 0 && !isCompleted && (
                                  <div style={{ width: 256, paddingTop: 4 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>
                                      <span>{progress.completed} dari {progress.total} Soal</span>
                                      <span style={{ color: '#5850EC', fontWeight: 700 }}>{progress.pct}%</span>
                                    </div>
                                    <div style={{ width: '100%', height: 8, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
                                      <div style={{ height: '100%', width: `${progress.pct}%`, background: '#5850EC', borderRadius: 999, transition: 'width 0.4s' }} />
                                    </div>
                                  </div>
                                )}
                                {isCompleted && (
                                  <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>Nilai: {Math.round(progress.pct * 1.05)}/100 · {progress.pct >= 80 ? 'Fantastis!' : 'Bagus!'}</p>
                                )}
                              </div>
                            </div>

                            {/* Right: Points + Action */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: isCompleted ? '#065F46' : '#92400e', background: isCompleted ? '#ECFDF5' : '#FEF3C7', padding: '4px 10px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                                {isCompleted ? '✅' : '⭐'} {isCompleted ? `+${progress.total * 10} Poin Didapat` : `+${Math.round(progress.total * 10 * (1 - progress.pct/100))} Poin`}
                              </span>
                              {isCompleted ? (
                                <button type='button' style={{ padding: '8px 16px', background: '#fff', color: '#64748b', fontSize: 12, fontWeight: 600, borderRadius: 12, border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s' }}
                                  className='hover:bg-slate-50'>
                                  Ulas Jawaban
                                </button>
                              ) : a.materialId ? (
                                <button type='button' style={{ padding: '10px 20px', background: progress.pct > 0 ? '#5850EC' : '#059669', color: '#fff', fontSize: 12, fontWeight: 700, borderRadius: 12, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s', boxShadow: progress.pct > 0 ? '0 4px 12px rgba(88,80,236,0.2)' : '0 4px 12px rgba(5,150,105,0.2)' }}
                                  onClick={() => handleStartAssignment(a)}>
                                  <span>{progress.pct > 0 ? 'Lanjutkan' : 'Mulai Belajar'}</span>
                                  <svg style={{ width: 14, height: 14 }} fill='none' stroke='currentColor' strokeWidth={2.5} viewBox='0 0 24 24'><path d='M9 5l7 7-7 7' strokeLinecap='round' strokeLinejoin='round' /></svg>
                                </button>
                              ) : null}
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )}
              </section>

              {/* Weekly Challenge Banner */}
              <section style={{ borderRadius: 24, background: 'linear-gradient(135deg, #5850EC 0%, #7C3AED 100%)', padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, boxShadow: '0 16px 40px -8px rgba(88,80,236,0.3)' }}>
                <div>
                  <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: '#fff' }}>
                    ⚔️ Tantangan Mingguan
                  </span>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: '8px 0 4px', letterSpacing: '-0.025em' }}>Cerdas Cermat Sains Antar Kelas</h2>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', maxWidth: 600 }}>Ajak temanmu bersaing secara live setiap hari Jumat pukul 16.00 WIB. Dapatkan lencana langka & medali kehormatan!</p>
                </div>
                <button type='button' style={{ background: '#fff', color: '#4F46E5', fontWeight: 700, fontSize: 12, padding: '12px 20px', borderRadius: 16, border: 'none', cursor: 'pointer', boxShadow: '0 8px 20px rgba(0,0,0,0.1)', flexShrink: 0, transition: 'all 0.2s' }} className='hover:shadow-lg'>
                  Daftar Tantangan 🔔
                </button>
              </section>
            </div>
          )}

          {/* ═══ MISSIONS TAB ═══ */}
          {sideTab === 'missions' && (
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>🚀 Misi Belajar</h1>
              <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>Semua tugas yang diberikan orang tua</p>

              {/* Search & Sort */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input type='text' value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder='🔍 Cari tugas...' style={{ flex: 1, maxWidth: 280, padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, outline: 'none', background: '#fff' }} />
                <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)} style={{ padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, outline: 'none', background: '#fff', cursor: 'pointer' }}>
                  <option value='newest'>Terbaru</option>
                  <option value='oldest'>Terlama</option>
                  <option value='deadline'>Deadline</option>
                  <option value='status'>Status</option>
                </select>
              </div>

              {filteredAssignments.length === 0 ? (
                <p style={{ color: '#cbd5e1', fontSize: 13, textAlign: 'center', padding: 40 }}>Tidak ada tugas ditemukan.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {filteredAssignments.map((a) => {
                    const mod = a.materialId ? moduleCache[a.materialId] : null
                    const progress = getAssignmentProgress(a)
                    const isCompleted = progress.total > 0 && progress.completed === progress.total

                    return (
                      <div key={a.id} style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: 16, padding: 18 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: '#5850EC', margin: '0 0 2px' }}>{getSubjectName(mod?.subjectId) || 'Tugas'}</p>
                            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0f172a' }}>{a.title}</h3>
                            <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>
                              {a.dueDate ? `📅 ${new Date(a.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}` : 'Tanpa deadline'}
                            </p>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6, background: isCompleted ? '#ECFDF5' : progress.pct > 0 ? '#EEF2FF' : '#f8fafc', color: isCompleted ? '#059669' : progress.pct > 0 ? '#5850EC' : '#94a3b8' }}>
                            {isCompleted ? '✅ Selesai' : progress.pct > 0 ? `${progress.pct}%` : 'Menunggu'}
                          </span>
                        </div>
                        <div style={{ height: 4, borderRadius: 999, background: '#f1f5f9', overflow: 'hidden', marginBottom: 8 }}>
                          <div style={{ height: '100%', width: `${progress.pct}%`, background: isCompleted ? '#059669' : '#5850EC', borderRadius: 999 }} />
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {a.materialId && progress.pct < 100 && (
                            <button type='button' style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, border: 'none', background: '#5850EC', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                              onClick={() => handleStartAssignment(a)}>
                              {progress.pct > 0 ? 'Lanjutkan →' : 'Kerjakan →'}
                            </button>
                          )}
                          <button type='button' style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontWeight: 600, cursor: 'pointer', color: '#334155' }}
                            onClick={() => setExpandedAssignment(expandedAssignment === a.id ? null : a.id)}>
                            💬 Tanya ({(questions[a.id] ?? []).length})
                          </button>
                        </div>
                        {expandedAssignment === a.id && (
                          <div style={{ marginTop: 12, padding: 12, background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9' }}>
                            {(questions[a.id] ?? []).map((q) => (
                              <div key={q.id} style={{ marginBottom: 8 }}>
                                <p style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>❓ {q.question}</p>
                                {q.reply ? (
                                  <p style={{ fontSize: 12, color: '#059669', margin: '4px 0 0', paddingLeft: 12, borderLeft: '2px solid #059669' }}>💬 {q.reply}</p>
                                ) : (
                                  <p style={{ fontSize: 11, color: '#94a3b8', margin: '4px 0 0', fontStyle: 'italic' }}>Menunggu balasan...</p>
                                )}
                              </div>
                            ))}
                            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                              <input type='text' value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} placeholder='Ketik pertanyaan...' style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, outline: 'none' }}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !sendingQuestion) handleSendQuestion(a.id) }} />
                              <button type='button' style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, border: 'none', background: '#5850EC', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                                onClick={() => handleSendQuestion(a.id)} disabled={sendingQuestion || !newQuestion.trim()}>
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
            </div>
          )}

          {/* ═══ TROPHIES TAB ═══ */}
          {sideTab === 'trophies' && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <p style={{ fontSize: 64, marginBottom: 12 }}>🏆</p>
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>Trofi & Prestasi</h2>
              <p style={{ color: '#94a3b8', fontSize: 14 }}>Selesaikan misi untuk mengumpulkan piala!</p>
              <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
                {completedCount >= 1 && <div style={{ width: 80, textAlign: 'center' }}><div style={{ fontSize: 40 }}>🥉</div><p style={{ fontSize: 11, fontWeight: 600 }}>Pertama</p></div>}
                {completedCount >= 3 && <div style={{ width: 80, textAlign: 'center' }}><div style={{ fontSize: 40 }}>🥈</div><p style={{ fontSize: 11, fontWeight: 600 }}>Rajin</p></div>}
                {completedCount >= 5 && <div style={{ width: 80, textAlign: 'center' }}><div style={{ fontSize: 40 }}>🥇</div><p style={{ fontSize: 11, fontWeight: 600 }}>Ahli</p></div>}
                {completedCount < 1 && <p style={{ color: '#cbd5e1', fontSize: 13 }}>Selesaikan misi pertama untuk mendapatkan piala!</p>}
              </div>
            </div>
          )}

          {/* ═══ MODULES TAB ═══ */}
          {sideTab === 'modules' && (
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>📚 Modul Pelajaran</h1>
              <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>Modul yang sudah ditugaskan oleh orang tua</p>
              {assignments.filter(a => a.materialId).length === 0 ? (
                <p style={{ color: '#cbd5e1', fontSize: 13, textAlign: 'center', padding: 40 }}>Belum ada modul pelajaran.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                  {assignments.filter(a => a.materialId).map((a) => {
                    const mod = moduleCache[a.materialId!]
                    if (!mod) return null
                    return (
                      <div key={a.id} style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #f1f5f9', cursor: 'pointer', transition: 'all 0.2s' }}
                        className='hover:shadow-md' onClick={() => navigate(`/modul/${a.materialId}`)}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px', color: '#0f172a' }}>{mod.title}</h3>
                        <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 8px' }}>{getSubjectName(mod.subjectId)}</p>
                        <div style={{ height: 4, borderRadius: 999, background: '#f1f5f9', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${getAssignmentProgress(a).pct}%`, background: '#5850EC', borderRadius: 999 }} />
                        </div>
                        <p style={{ fontSize: 11, color: '#94a3b8', margin: '6px 0 0' }}>{mod.frames.length} frame</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══ REPORTS TAB ═══ */}
          {sideTab === 'reports' && (
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>📊 Rapor Belajar</h1>
              <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>Ringkasan perkembangan belajar</p>
              <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                  <div style={{ textAlign: 'center', padding: 20, background: '#f8fafc', borderRadius: 12 }}>
                    <div style={{ fontSize: 32, fontWeight: 800, color: '#5850EC' }}>{completedCount}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>Misi Selesai</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: 20, background: '#f8fafc', borderRadius: 12 }}>
                    <div style={{ fontSize: 32, fontWeight: 800, color: '#f59e0b' }}>{totalPoints}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>Total Poin</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: 20, background: '#f8fafc', borderRadius: 12 }}>
                    <div style={{ fontSize: 32, fontWeight: 800, color: '#059669' }}>{streak}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>Hari Streak</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ PROFILE TAB ═══ */}
          {sideTab === 'profile' && (
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 20px' }}>👤 Profil Saya</h1>
              <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 400, border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#5850EC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 28, boxShadow: '0 4px 12px rgba(88,80,236,0.2)' }}>
                    {user?.name?.charAt(0).toUpperCase() ?? '?'}
                  </div>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{user?.name}</h2>
                    <p style={{ fontSize: 13, color: '#94a3b8', margin: '2px 0 0' }}>{user?.email}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Kelas', value: `${user?.grade ?? '?'} SD` },
                    { label: 'Semester', value: `${user?.semester ?? '?'}` },
                    { label: 'Misi Selesai', value: `${completedCount}` },
                    { label: 'Total Poin', value: `⭐ ${totalPoints}`, color: '#5850EC', fontWeight: 700 },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ color: '#94a3b8', fontSize: 13 }}>{item.label}</span>
                      <span style={{ fontWeight: (item as any).fontWeight || 600, fontSize: 13, color: (item as any).color || '#0f172a' }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>

        {/* ── Right Panel (Home only) ── */}
        {sideTab === 'home' && (
          <aside style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 24 }} className='hidden xl:flex'>
            {/* Daily Reward Card */}
            <div style={{ borderRadius: 24, background: 'linear-gradient(135deg, #FF6B4A 0%, #FFA14A 100%)', padding: 24, color: '#fff', position: 'relative', overflow: 'hidden', boxShadow: '0 12px 32px -8px rgba(255,107,74,0.3)' }}>
              {/* Decorative circles */}
              <div style={{ position: 'absolute', top: -24, right: -24, width: 96, height: 96, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: -24, right: -16, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', pointerEvents: 'none' }} />
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800, marginBottom: 12 }}>
                <span>🎁</span>
                <span>Reward Harian</span>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px', lineHeight: 1.3 }}>Klaim Hadiah Harianmu! 🎁</h2>
              <p style={{ fontSize: 12, opacity: 0.9, margin: '0 0 16px', lineHeight: 1.5 }}>Kumpulkan bintang setiap hari untuk membuka skin avatar spesial dan bonus koin belajar.</p>
              <button type='button' style={{ width: '100%', padding: '12px', background: '#fff', color: '#FF6B4A', fontWeight: 800, fontSize: 12, borderRadius: 16, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', transition: 'all 0.2s', transform: 'scale(1)' }} className='active:scale-95 hover:bg-orange-50'>
                <span>🎁</span>
                <span>Klaim Sekarang</span>
              </button>
              <div style={{ marginTop: 12, textAlign: 'center', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
                Reset dalam <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#fff' }}>04:32:10</span>
              </div>
            </div>

            {/* Weekly Progress Card */}
            <div style={{ background: '#fff', borderRadius: 24, padding: 24, border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <h2 style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', margin: 0 }}>Progress Mingguan</h2>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#5850EC', background: '#EEF2FF', padding: '2px 8px', borderRadius: 20 }}>Minggu ini</span>
              </div>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 16px' }}>Penyelesaian per mata pelajaran</p>

              {/* Bar chart */}
              <div style={{ paddingTop: 16, paddingBottom: 8, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: 176, borderBottom: '1px solid #f1f5f9' }}>
                {(subjectBreakdown.length > 0
                  ? subjectBreakdown
                  : [{ name: 'Math', pct: 78, color: '#6366f1' }, { name: 'Science', pct: 65, color: '#f43f5e' }, { name: 'Indo', pct: 88, color: '#f59e0b' }]
                ).map((s, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: s.color }}>{s.pct}%</span>
                    <div style={{ width: 48, height: 110, background: `${s.color}15`, borderRadius: 12, overflow: 'hidden', display: 'flex', alignItems: 'flex-end' }}>
                      <div style={{ width: '100%', height: `${s.pct}%`, background: s.color, borderRadius: 12, transition: 'height 0.5s' }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>{s.name}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#94a3b8', paddingTop: 8 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#059669', fontWeight: 700 }}>
                  <svg style={{ width: 14, height: 14 }} fill='none' stroke='currentColor' strokeWidth={2} viewBox='0 0 24 24'><path d='M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' strokeLinecap='round' strokeLinejoin='round' /></svg>
                  +12% lebih giat
                </span>
                <button type='button' style={{ background: 'none', border: 'none', color: '#5850EC', fontWeight: 600, fontSize: 11, cursor: 'pointer', padding: 0 }}>Lihat Analitik →</button>
              </div>
            </div>

            {/* Points & Ranking Card */}
            <div style={{ background: '#fff', borderRadius: 24, padding: 24, border: '1px solid #f1f5f9' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: '#0f172a' }}>
                  <span style={{ color: '#f59e0b' }}>⭐</span>
                  <h2 style={{ margin: 0 }}>Poin & Peringkat Kamu</h2>
                </div>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>Total poin yang sudah kamu kumpulkan</p>
              </div>

              {/* Big score */}
              <div style={{ background: '#f8fafc', borderRadius: 16, padding: 20, textAlign: 'center', border: '1px solid #f1f5f9', marginTop: 16 }}>
                <div style={{ fontSize: 40, fontWeight: 800, color: '#5850EC', letterSpacing: '-0.025em' }}>{totalPoints.toLocaleString()}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Total Experience (XP)</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, padding: '4px 12px', background: '#FEF3C7', color: '#92400e', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                  <span>🏆</span>
                  <span>Peringkat 4 di Kelas {user?.grade ?? '?'}-B</span>
                </div>
              </div>

              {/* 3 Mini counters */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 16, textAlign: 'center' }}>
                <div style={{ padding: 10, background: '#f8fafc', borderRadius: 12 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#059669' }}>{completedCount}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8' }}>Selesai</div>
                </div>
                <div style={{ padding: 10, background: '#f8fafc', borderRadius: 12 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#f43f5e' }}>{overdueCount}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8' }}>Terlambat</div>
                </div>
                <div style={{ padding: 10, background: '#f8fafc', borderRadius: 12 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#5850EC' }}>{inProgressCount}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8' }}>Berjalan</div>
                </div>
              </div>

              <button type='button' style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: 12, background: '#fff', color: '#334155', fontWeight: 700, fontSize: 12, cursor: 'pointer', marginTop: 16, transition: 'all 0.2s' }} className='hover:bg-slate-50'>
                Buka Papan Peringkat Lengkap 🏅
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* ── Footer ── */}
      <footer style={{ marginTop: 'auto', borderTop: '1px solid rgba(226,232,240,0.8)', background: '#fff', padding: '16px 24px' }}>
        <div style={{ maxWidth: 1600, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, fontSize: 12, color: '#94a3b8' }}>
          <p style={{ margin: 0 }}>© 2026 Perpustakaan Belajar. Platform Edukasi Interaktif Ramah Anak SD.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontWeight: 500 }}>
            <button type='button' style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 12, fontWeight: 500, cursor: 'pointer' }} className='hover:text-[#5850EC]'>Pusat Bantuan</button>
            <button type='button' style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 12, fontWeight: 500, cursor: 'pointer' }} className='hover:text-[#5850EC]'>Panduan Orang Tua</button>
            <button type='button' style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 12, fontWeight: 500, cursor: 'pointer' }} className='hover:text-[#5850EC]'>Kebijakan Privasi Anak</button>
          </div>
        </div>
      </footer>
    </div>
  )
}
