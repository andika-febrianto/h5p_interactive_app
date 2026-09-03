import { useEffect, useState, useCallback } from 'react'
import TopBar from '../../components/TopBar'
import { useAuth } from '../../context/AuthContext'
import {
  fetchChildren,
  addChild,
  fetchAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  fetchModules,
  fetchModule,
  fetchSubjects,
  fetchChildModuleProgress,
  fetchAssignmentQuestions,
  replyToQuestion,
  checkDeadlines,
  generateWeeklyReport,
  generateMonthlyReport,
  type ChildInfo,
  type ParentAssignment,
  type ModuleSummary,
  type Module,
  type Subject,
  type FrameProgress,
  type Question,
} from '../../lib/api'
import { ApiError } from '../../lib/api'
import { grades, semesters } from '../../data/grades'

const KIND_ICON: Record<string, string> = {
  text: '📄',
  quiz: '❓',
  dragdrop: '🧩',
  video: '🎬',
  pdf: '📕',
  shortanswer: '✏️',
}

const KIND_LABEL: Record<string, string> = {
  text: 'Materi',
  quiz: 'Kuis',
  dragdrop: 'Drag & Drop',
  video: 'Video Interaktif',
  pdf: 'Dokumen PDF',
  shortanswer: 'Isian Singkat',
}

type ViewMode = 'overview' | 'modules' | 'reports'

export default function ParentDashboard() {
  const { user } = useAuth()
  const [viewMode, setViewMode] = useState<ViewMode>('overview')

  // Questions
  const [questions, setQuestions] = useState<Record<string, Question[]>>({})
  const [replyText, setReplyText] = useState<Record<string, string>>({})
  const [sendingReply, setSendingReply] = useState<string | null>(null)

  // Children state
  const [children, setChildren] = useState<ChildInfo[]>([])
  const [childrenLoading, setChildrenLoading] = useState(true)
  const [showCreateChild, setShowCreateChild] = useState(false)
  const [childForm, setChildForm] = useState({
    name: '',
    email: '',
    password: '',
    grade: 1,
    semester: 1,
  })
  const [childError, setChildError] = useState<string | null>(null)
  const [childSubmitting, setChildSubmitting] = useState(false)

  // Progress state
  const [selectedChild, setSelectedChild] = useState<ChildInfo | null>(null)
  const [progressLoading, setProgressLoading] = useState(false)

  // Per-assignment progress
  const [assignmentProgress, setAssignmentProgress] = useState<
    Record<string, Record<string, FrameProgress>>
  >({})
  const [moduleCache, setModuleCache] = useState<Record<string, Module>>({})

  // Assignment state
  const [assignments, setAssignments] = useState<ParentAssignment[]>([])
  const [assignmentsLoading, setAssignmentsLoading] = useState(true)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedChildId, setSelectedChildId] = useState('')
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [selectedModuleId, setSelectedModuleId] = useState('')

  // Search & Sort for assignments
  const [taskSearchQuery, setTaskSearchQuery] = useState('')
  const [taskSortOrder, setTaskSortOrder] = useState<'newest' | 'oldest' | 'deadline' | 'status' | 'child'>('newest')
  const [availableModules, setAvailableModules] = useState<ModuleSummary[]>([])
  const [selectedModule, setSelectedModule] = useState<Module | null>(null)
  const [selectedFrames, setSelectedFrames] = useState<string[]>([])
  const [dueDate, setDueDate] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null)

  // Modals
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<ParentAssignment | null>(null)
  const [editDueDate, setEditDueDate] = useState('')
  const [editSelectedFrames, setEditSelectedFrames] = useState<string[]>([])
  const [editModule, setEditModule] = useState<Module | null>(null)
  const [editSaving, setEditSaving] = useState(false)

  // ── Data Loading ──

  useEffect(() => {
    fetchChildren()
      .then(setChildren)
      .catch(() => setChildren([]))
      .finally(() => setChildrenLoading(false))
  }, [])

  useEffect(() => {
    checkDeadlines().catch(() => {})
    generateWeeklyReport().catch(() => {})
    generateMonthlyReport().catch(() => {})
  }, [])

  useEffect(() => {
    fetchAssignments()
      .then(setAssignments)
      .catch(() => setAssignments([]))
      .finally(() => setAssignmentsLoading(false))
  }, [])

  useEffect(() => {
    fetchSubjects()
      .then(setSubjects)
      .catch(() => setSubjects([]))
  }, [])

  // Load progress when child is selected
  useEffect(() => {
    if (!selectedChild) {
      setAssignmentProgress({})
      return
    }
    setProgressLoading(true)
    const childAssignments = assignments.filter((a) => a.childId === selectedChild.id)
    if (childAssignments.length === 0) {
      setProgressLoading(false)
      return
    }
    const fetches: Promise<unknown>[] = []
    childAssignments.forEach((a) => {
      if (a.materialId) {
        if (!moduleCache[a.materialId]) {
          fetches.push(
            fetchModule(a.materialId)
              .then((mod) => setModuleCache((prev) => ({ ...prev, [a.materialId!]: mod })))
              .catch(() => {}),
          )
        }
        fetches.push(
          fetchChildModuleProgress(selectedChild.id, a.materialId)
            .then((frames) => {
              const map: Record<string, FrameProgress> = {}
              frames.forEach((f) => { map[f.frameSlug] = f })
              setAssignmentProgress((prev) => ({ ...prev, [a.materialId!]: map }))
            })
            .catch(() => {}),
        )
      }
    })
    Promise.all(fetches).finally(() => setProgressLoading(false))
  }, [selectedChild, assignments])

  // Load available modules
  useEffect(() => {
    if (!selectedChildId || !selectedSubjectId) {
      setAvailableModules([])
      return
    }
    const child = children.find((c) => c.id === selectedChildId)
    if (child?.grade && child?.semester) {
      fetchModules({ grade: child.grade, semester: child.semester, subjectId: selectedSubjectId })
        .then(setAvailableModules)
        .catch(() => setAvailableModules([]))
    }
  }, [selectedChildId, selectedSubjectId, children])

  useEffect(() => {
    if (!selectedModuleId) {
      setSelectedModule(null)
      setSelectedFrames([])
      return
    }
    fetchModule(selectedModuleId)
      .then((mod) => {
        setSelectedModule(mod)
        setSelectedFrames(mod.frames.map((f) => f.id))
      })
      .catch(() => {
        setSelectedModule(null)
        setSelectedFrames([])
      })
  }, [selectedModuleId])

  useEffect(() => {
    setSelectedModuleId('')
    setSelectedModule(null)
    setSelectedFrames([])
    setDueDate('')
    setAssignError(null)
    setAssignSuccess(null)
  }, [selectedChildId, selectedSubjectId])

  // ── Handlers ──

  const handleCreateChild = async (e: React.FormEvent) => {
    e.preventDefault()
    setChildError(null)
    setChildSubmitting(true)
    try {
      const newChild = await addChild({
        name: childForm.name,
        email: childForm.email,
        password: childForm.password,
        grade: childForm.grade,
        semester: childForm.semester,
      })
      setChildren((prev) => [...prev, newChild])
      setChildForm({ name: '', email: '', password: '', grade: 1, semester: 1 })
      setShowCreateChild(false)
    } catch (err) {
      setChildError(err instanceof ApiError ? err.message : 'Gagal membuat akun anak.')
    } finally {
      setChildSubmitting(false)
    }
  }



  const toggleFrame = (id: string) => {
    setSelectedFrames((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id])
  }

  const toggleAllFrames = () => {
    if (!selectedModule) return
    if (selectedFrames.length === selectedModule.frames.length) {
      setSelectedFrames([])
    } else {
      setSelectedFrames(selectedModule.frames.map((f) => f.id))
    }
  }

  const handleAssign = async () => {
    if (!selectedChildId || !selectedModule || selectedFrames.length === 0) return
    setAssignError(null)
    setAssignSuccess(null)
    setAssigning(true)
    try {
      const selectedChildInfo = children.find((c) => c.id === selectedChildId)
      await createAssignment({
        childId: selectedChildId,
        title: selectedModule.title,
        materialId: selectedModule.id,
        selectedFrames,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      })
      setAssignSuccess(`✓ "${selectedModule.title}" (${selectedFrames.length} panel) berhasil ditugaskan ke ${selectedChildInfo?.name ?? 'anak'}!`)
      const updated = await fetchAssignments()
      setAssignments(updated)
      setSelectedModuleId('')
      setSelectedModule(null)
      setSelectedFrames([])
      setDueDate('')
      setSelectedChildId('')
      setSelectedSubjectId('')
      setTimeout(() => { setShowAssignModal(false); setAssignSuccess(null) }, 1500)
    } catch (err) {
      setAssignError(err instanceof ApiError ? err.message : 'Gagal menugaskan modul.')
    } finally {
      setAssigning(false)
    }
  }

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm('Yakin ingin menghapus tugas ini?')) return
    try {
      await deleteAssignment(id)
      setAssignments((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Gagal menghapus tugas.')
    }
  }

  const getChildName = (childId: string) =>
    children.find((c) => c.id === childId)?.name ?? childId

  const loadChildQuestions = useCallback(
    async (childId: string) => {
      const childAssignments = assignments.filter((a) => a.childId === childId)
      const allQuestions: Record<string, Question[]> = {}
      await Promise.all(
        childAssignments.map(async (a) => {
          try {
            const qs = await fetchAssignmentQuestions(a.id)
            allQuestions[a.id] = qs
          } catch { allQuestions[a.id] = [] }
        }),
      )
      setQuestions(allQuestions)
    },
    [assignments],
  )

  useEffect(() => {
    if (selectedChild) loadChildQuestions(selectedChild.id)
  }, [selectedChild, loadChildQuestions])

  const handleSaveEdit = async () => {
    if (!editingAssignment) return
    setEditSaving(true)
    try {
      await updateAssignment(editingAssignment.id, {
        dueDate: editDueDate || undefined,
        status: editingAssignment.status,
      })
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === editingAssignment.id
            ? { ...a, dueDate: editDueDate ? new Date(editDueDate).toISOString() : a.dueDate }
            : a,
        ),
      )
      setEditingAssignment(null)
    } catch { /* silently fail */ } finally {
      setEditSaving(false)
    }
  }

  const handleReply = async (questionId: string) => {
    const text = replyText[questionId]
    if (!text?.trim()) return
    setSendingReply(questionId)
    try {
      await replyToQuestion(questionId, text.trim())
      setReplyText((prev) => ({ ...prev, [questionId]: '' }))
      if (selectedChild) await loadChildQuestions(selectedChild.id)
    } catch { /* silently fail */ } finally {
      setSendingReply(null)
    }
  }

  const getFrameProgressForAssignment = (materialId: string | null, frameSlug: string): FrameProgress | null => {
    if (!materialId) return null
    return assignmentProgress[materialId]?.[frameSlug] ?? null
  }

  const getAssignmentCompletion = (assignment: ParentAssignment): { completed: number; total: number; pct: number } => {
    if (!assignment.selectedFrames || !assignment.materialId) return { completed: 0, total: 0, pct: 0 }
    const total = assignment.selectedFrames.length
    let completed = 0
    assignment.selectedFrames.forEach((frameId) => {
      const fp = getFrameProgressForAssignment(assignment.materialId, frameId)
      if (fp?.completed) completed++
    })
    return { completed, total, pct: total > 0 ? Math.round((completed / total) * 100) : 0 }
  }

  // ── Derived Data ──

  const totalModulesCompleted = assignments.filter((a) => a.status === 'completed').length
  const totalPoints = totalModulesCompleted * 10 + children.length * 20

  const overallAvgScore = (() => {
    const allPcts = assignments.map((a) => getAssignmentCompletion(a).pct).filter((p) => p > 0)
    if (allPcts.length === 0) return 0
    return Math.round(allPcts.reduce((s, p) => s + p, 0) / allPcts.length)
  })()

  const childCardProgress = (child: ChildInfo) => {
    const childAssignments = assignments.filter((a) => a.childId === child.id)
    if (childAssignments.length === 0) return { latest: null as ParentAssignment | null, pct: 0 }
    const latest = childAssignments.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))[0]
    const completion = getAssignmentCompletion(latest)
    return { latest, pct: completion.pct }
  }

  const deadlineStatus = (a: ParentAssignment) => {
    if (a.status === 'completed') return { label: 'Selesai', color: '#00b894', bg: '#d5f5ec' }
    if (!a.dueDate) return { label: a.status === 'in_progress' ? 'Dikerjakan' : 'Menunggu', color: '#636e72', bg: '#f5f5f5' }
    const now = new Date()
    const due = new Date(a.dueDate)
    const hoursLeft = (due.getTime() - now.getTime()) / (1000 * 60 * 60)
    if (hoursLeft < 0) return { label: 'Terlambat', color: '#ff7675', bg: '#ffeaea' }
    if (hoursLeft <= 24) return { label: 'Sebentar lagi', color: '#fdcb6e', bg: '#fff9e6' }
    return { label: 'Tersisa ' + Math.ceil(hoursLeft / 24) + ' hari', color: '#636e72', bg: '#f5f5f5' }
  }

  // ── Styles ──

  const S = {
    page: { minHeight: '100vh', background: '#f4f5fa' } as React.CSSProperties,
    container: { maxWidth: 1200, margin: '0 auto', padding: '24px 32px 64px' } as React.CSSProperties,
    banner: {
      background: 'linear-gradient(135deg, #e8e3ff 0%, #f5f3ff 50%, #ede6ff 100%)',
      borderRadius: 20,
      padding: '32px 40px',
      marginBottom: 28,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
    } as React.CSSProperties,
    bannerText: { flex: 1 } as React.CSSProperties,
    bannerTitle: {
      fontFamily: 'var(--font-display)',
      fontSize: 28,
      fontWeight: 700,
      color: '#1a1a2e',
      margin: 0,
    } as React.CSSProperties,
    bannerSub: {
      fontSize: 14,
      color: '#636e72',
      marginTop: 4,
      maxWidth: 480,
      lineHeight: 1.5,
    } as React.CSSProperties,
    bannerRight: { display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 } as React.CSSProperties,
    avatarGroup: { display: 'flex' } as React.CSSProperties,
    avatarCircle: (bg: string) => ({
      width: 40,
      height: 40,
      borderRadius: '50%',
      background: bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontWeight: 700,
      fontSize: 16,
      border: '3px solid #fff',
      marginLeft: -8,
    }) as React.CSSProperties,
    pointsBadge: {
      background: '#fff',
      borderRadius: 12,
      padding: '8px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      fontSize: 14,
      fontWeight: 700,
      color: '#1a1a2e',
    } as React.CSSProperties,
    grid: { display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 } as React.CSSProperties,
    leftCol: { display: 'flex', flexDirection: 'column', gap: 24 } as React.CSSProperties,
    rightCol: { display: 'flex', flexDirection: 'column', gap: 24 } as React.CSSProperties,
    sectionLabel: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase' as const,
      color: '#a0a0b0',
      marginBottom: 12,
    } as React.CSSProperties,
    card: {
      background: '#fff',
      borderRadius: 16,
      padding: 20,
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    } as React.CSSProperties,
    childCard: {
      background: '#fff',
      borderRadius: 16,
      padding: 20,
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      border: '1px solid #eee',
    } as React.CSSProperties,
    viewBtn: {
      width: '100%',
      padding: '10px 0',
      border: '1.5px solid #e0e0e0',
      borderRadius: 10,
      background: '#fff',
      color: '#6c5ce7',
      fontWeight: 600,
      fontSize: 13,
      cursor: 'pointer',
      transition: 'all 0.2s',
      marginTop: 12,
    } as React.CSSProperties,
    circularProgress: (pct: number) => ({
      width: 100,
      height: 100,
      borderRadius: '50%',
      background: `conic-gradient(#6c5ce7 ${pct * 3.6}deg, #f0f0f0 ${pct * 3.6}deg)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative' as const,
      flexShrink: 0,
    }) as React.CSSProperties,
    circularInner: {
      width: 76,
      height: 76,
      borderRadius: '50%',
      background: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column' as const,
    } as React.CSSProperties,
    actItem: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '10px 0',
      borderBottom: '1px solid #f3f3f7',
    } as React.CSSProperties,
    actIcon: (bg: string) => ({
      width: 32,
      height: 32,
      borderRadius: 8,
      background: bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 14,
      flexShrink: 0,
    }) as React.CSSProperties,
    schedItem: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '12px 0',
      borderBottom: '1px solid #f3f3f7',
    } as React.CSSProperties,
    schedDate: {
      width: 44,
      height: 44,
      borderRadius: 10,
      background: '#f8f7ff',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    } as React.CSSProperties,
    statusBadge: (color: string, bg: string) => ({
      fontSize: 11,
      fontWeight: 600,
      color,
      background: bg,
      padding: '3px 10px',
      borderRadius: 6,
      flexShrink: 0,
    }) as React.CSSProperties,
    quickActBtn: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: '20px 16px',
      background: '#fff',
      border: '1.5px solid #eee',
      borderRadius: 14,
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontSize: 13,
      fontWeight: 600,
      color: '#333',
    } as React.CSSProperties,
    fab: {
      position: 'fixed' as const,
      bottom: 32,
      right: 32,
      background: '#6c5ce7',
      color: '#fff',
      border: 'none',
      borderRadius: 14,
      padding: '14px 24px',
      fontSize: 15,
      fontWeight: 700,
      cursor: 'pointer',
      boxShadow: '0 6px 20px rgba(108,92,231,0.35)',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      zIndex: 100,
      transition: 'transform 0.2s, box-shadow 0.2s',
    } as React.CSSProperties,
    modalOverlay: {
      position: 'fixed' as const,
      inset: 0,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
    } as React.CSSProperties,
    modalBox: {
      background: '#fff',
      borderRadius: 20,
      padding: 28,
      width: '90%',
      maxWidth: 560,
      maxHeight: '85vh',
      overflowY: 'auto',
      boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    } as React.CSSProperties,
    navTab: (active: boolean) => ({
      padding: '8px 18px',
      borderRadius: 8,
      border: 'none',
      background: active ? '#6c5ce7' : 'transparent',
      color: active ? '#fff' : '#636e72',
      fontWeight: 600,
      fontSize: 13,
      cursor: 'pointer',
      transition: 'all 0.2s',
    }) as React.CSSProperties,
    input: {
      width: '100%',
      padding: '10px 14px',
      border: '1.5px solid #e0e0e0',
      borderRadius: 10,
      fontSize: 13,
      fontFamily: 'var(--font-body)',
      outline: 'none',
      background: '#fff',
      boxSizing: 'border-box' as const,
    } as React.CSSProperties,
    select: {
      width: '100%',
      padding: '10px 14px',
      border: '1.5px solid #e0e0e0',
      borderRadius: 10,
      fontSize: 13,
      fontFamily: 'var(--font-body)',
      outline: 'none',
      background: '#fff',
      cursor: 'pointer',
      boxSizing: 'border-box' as const,
    } as React.CSSProperties,
  }

  // ── Nav Tabs ──
  const navItems: { key: ViewMode; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'modules', label: 'Modules' },
    { key: 'reports', label: 'Reports' },
  ]

  // ── Render ──
  return (
    <div style={S.page}>
      <TopBar />
      <div style={S.container}>
        {/* Nav Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
          {navItems.map((item) => (
            <button
              key={item.key}
              type='button'
              style={S.navTab(viewMode === item.key)}
              onClick={() => setViewMode(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Welcome Banner */}
        <div style={S.banner}>
          <div style={S.bannerText}>
            <h1 style={S.bannerTitle}>Welcome back, {user?.name?.split(' ')[0] ?? 'Orang Tua'}</h1>
            <p style={S.bannerSub}>
              {children.length > 0
                ? `Anak-anak Anda telah menyelesaikan ${totalModulesCompleted} modul. Pantau progres mereka di sini.`
                : 'Mulai buat akun anak dan tugaskan materi belajar untuk memulai.'}
            </p>
          </div>
          <div style={S.bannerRight}>
            <div style={S.avatarGroup}>
              {children.slice(0, 3).map((c, i) => (
                <div key={c.id} style={S.avatarCircle(['#6c5ce7', '#00b894', '#fdcb6e'][i % 3])}>
                  {c.name.charAt(0).toUpperCase()}
                </div>
              ))}
              {children.length === 0 && (
                <div style={S.avatarCircle('#ccc')}>?</div>
              )}
            </div>
            <div style={S.pointsBadge}>
              <span>⭐</span> {totalPoints} pts
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div style={S.grid}>
          {/* ─── Left Column ─── */}
          <div style={S.leftCol}>

            {/* Student Tracking */}
            <div>
              <p style={S.sectionLabel}>Student Tracking</p>
              {childrenLoading ? (
                <p style={{ color: '#999', fontSize: 13 }}>Memuat data anak...</p>
              ) : children.length === 0 ? (
                <div style={S.card}>
                  <p style={{ color: '#999', fontSize: 13, textAlign: 'center', margin: '12px 0' }}>
                    Belum ada akun anak. Klik "+ Assign New Module" atau buat akun anak baru.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {children.map((child, i) => {
                    const { latest, pct } = childCardProgress(child)
                    return (
                      <div key={child.id} style={S.childCard}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                          <div style={{
                            width: 44, height: 44, borderRadius: '50%',
                            background: ['#6c5ce7', '#00b894', '#fdcb6e', '#ff7675'][i % 4],
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontWeight: 700, fontSize: 18,
                          }}>
                            {child.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>{child.name}</p>
                            <p style={{ fontSize: 12, color: '#999', margin: 0 }}>
                              Kelas {child.grade ?? '?'} · Semester {child.semester ?? '?'}
                            </p>
                          </div>
                        </div>
                        {latest ? (
                          <>
                            <p style={{ fontSize: 13, fontWeight: 600, color: '#6c5ce7', margin: '0 0 4px' }}>
                              {latest.title}
                            </p>
                            <div style={{ height: 6, borderRadius: 999, background: '#f0f0f5', overflow: 'hidden' }}>
                              <div style={{
                                height: '100%', width: `${pct}%`,
                                background: pct === 100 ? '#00b894' : '#6c5ce7',
                                borderRadius: 999, transition: 'width 0.4s',
                              }} />
                            </div>
                            <p style={{ fontSize: 11, color: '#999', margin: '4px 0 0' }}>{pct}% selesai</p>
                          </>
                        ) : (
                          <p style={{ fontSize: 12, color: '#bbb', margin: 0 }}>Belum ada tugas</p>
                        )}
                        <button
                          type='button'
                          style={S.viewBtn}
                          onClick={() => { setSelectedChild(child); setViewMode('modules') }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6c5ce7'; e.currentTarget.style.background = '#f8f7ff' }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e0e0e0'; e.currentTarget.style.background = '#fff' }}
                        >
                          View Details
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Weekly Progress (bar chart placeholder) */}
            <div>
              <p style={S.sectionLabel}>Weekly Progress</p>
              <div style={S.card}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 120, padding: '0 8px' }}>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                    const heights = [30, 55, 40, 70, 45, 20, 10]
                    return (
                      <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{
                          width: '100%', height: heights[i], background: i < 5 ? '#6c5ce7' : '#e0e0f0',
                          borderRadius: 6, minHeight: 4,
                        }} />
                        <span style={{ fontSize: 11, color: '#999' }}>{day}</span>
                      </div>
                    )
                  })}
                </div>
                <p style={{ fontSize: 11, color: '#bbb', textAlign: 'right', margin: '8px 0 0' }}>Menit dipelajari</p>
              </div>
            </div>

            {/* Upcoming Schedule (from assignments) */}
            <div>
              <p style={S.sectionLabel}>Upcoming Schedule</p>
              <div style={S.card}>
                {assignments.filter((a) => a.dueDate && a.status !== 'completed').slice(0, 3).map((a) => {
                  const due = new Date(a.dueDate!)
                  const ds = deadlineStatus(a)
                  return (
                    <div key={a.id} style={S.schedItem}>
                      <div style={S.schedDate}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: '#6c5ce7' }}>{due.getDate()}</span>
                        <span style={{ fontSize: 10, color: '#999', textTransform: 'uppercase' }}>
                          {due.toLocaleDateString('id-ID', { month: 'short' })}
                        </span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>{a.title}</p>
                        <p style={{ fontSize: 12, color: '#999', margin: '2px 0 0' }}>
                          {getChildName(a.childId)} · {due.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}
                        </p>
                      </div>
                      <span style={S.statusBadge(ds.color, ds.bg)}>{ds.label}</span>
                    </div>
                  )
                })}
                {assignments.filter((a) => a.dueDate && a.status !== 'completed').length === 0 && (
                  <p style={{ color: '#bbb', fontSize: 13, textAlign: 'center', margin: 12 }}>Tidak ada jadwal mendatang</p>
                )}
              </div>
            </div>
          </div>

          {/* ─── Right Column ─── */}
          <div style={S.rightCol}>

            {/* Performance Summary */}
            <div>
              <p style={S.sectionLabel}>Performance Summary</p>
              <div style={{ ...S.card, background: 'linear-gradient(135deg, #2d1b69, #4a2d8c)', color: '#fff', display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={S.circularProgress(overallAvgScore)}>
                  <div style={S.circularInner}>
                    <span style={{ fontSize: 22, fontWeight: 800, color: '#6c5ce7' }}>{overallAvgScore}%</span>
                    <span style={{ fontSize: 9, color: '#999' }}>Avg Score</span>
                  </div>
                </div>
                <div>
                  <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600 }}>📊 {totalModulesCompleted} Total Modules</p>
                  <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600 }}>⏱ {children.length * 3} Hours This Week</p>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>🏆 Top {children.length > 0 ? Math.max(5, 20 - totalModulesCompleted) : 99}% This Month</p>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <p style={S.sectionLabel}>Recent Activity</p>
              <div style={S.card}>
                {assignments.length === 0 ? (
                  <p style={{ color: '#bbb', fontSize: 13, textAlign: 'center', margin: 12 }}>Belum ada aktivitas</p>
                ) : (
                  assignments.slice(0, 4).map((a) => {
                    const isCompleted = a.status === 'completed'
                    const isInProgress = a.status === 'in_progress'
                    return (
                      <div key={a.id} style={S.actItem}>
                        <div style={S.actIcon(isCompleted ? '#d5f5ec' : isInProgress ? '#fff3e0' : '#f0f0ff')}>
                          {isCompleted ? '✅' : isInProgress ? '⭐' : '📌'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 600, fontSize: 13, margin: 0 }}>
                            {getChildName(a.childId)} {isCompleted ? 'menyelesaikan' : isInProgress ? 'mengerjakan' : 'ditugaskan'} {a.title}
                          </p>
                          <p style={{ fontSize: 12, color: '#999', margin: '2px 0 0' }}>
                            {a.createdAt ? new Date(a.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : ''}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <p style={S.sectionLabel}>Quick Actions</p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type='button'
                  style={S.quickActBtn}
                  onClick={() => setViewMode('modules')}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6c5ce7'; e.currentTarget.style.background = '#f8f7ff' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#eee'; e.currentTarget.style.background = '#fff' }}
                >
                  <span style={{ fontSize: 24 }}>📅</span>
                  Schedule
                </button>
                <button
                  type='button'
                  style={S.quickActBtn}
                  onClick={() => setViewMode('reports')}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6c5ce7'; e.currentTarget.style.background = '#f8f7ff' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#eee'; e.currentTarget.style.background = '#fff' }}
                >
                  <span style={{ fontSize: 24 }}>📈</span>
                  Report
                </button>
              </div>
            </div>

            {/* Progress Detail (when child is selected) */}
            {selectedChild && viewMode === 'modules' && (
              <div>
                <p style={S.sectionLabel}>Progres: {selectedChild.name}</p>
                <div style={S.card}>
                  {progressLoading ? (
                    <p style={{ color: '#999', fontSize: 13, textAlign: 'center', margin: 12 }}>Memuat progres...</p>
                  ) : (() => {
                    const childAssignments = assignments.filter((a) => a.childId === selectedChild.id)
                    if (childAssignments.length === 0) {
                      return <p style={{ color: '#bbb', fontSize: 13, textAlign: 'center', margin: 12 }}>Belum ada tugas</p>
                    }
                    return childAssignments.map((a) => {
                      const completion = getAssignmentCompletion(a)
                      return (
                        <div key={a.id} style={{ padding: '10px 0', borderBottom: '1px solid #f3f3f7' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>📖 {a.title}</span>
                            <span style={{ fontSize: 12, color: '#999' }}>{completion.completed}/{completion.total}</span>
                          </div>
                          <div style={{ height: 5, borderRadius: 999, background: '#f0f0f5', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%', width: `${completion.pct}%`,
                              background: completion.pct === 100 ? '#00b894' : '#6c5ce7',
                              borderRadius: 999,
                            }} />
                          </div>
                        </div>
                      )
                    })
                  })()}
                  <button
                    type='button'
                    style={{ ...S.viewBtn, marginTop: 8 }}
                    onClick={() => setSelectedChild(null)}
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Assignment List (below grid) ─── */}
        {viewMode === 'modules' && (
          <div style={{ marginTop: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <p style={S.sectionLabel}>Daftar Tugas</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type='text'
                  value={taskSearchQuery}
                  onChange={(e) => setTaskSearchQuery(e.target.value)}
                  placeholder='🔍 Cari tugas...'
                  style={{ ...S.input, width: 200 }}
                />
                <select
                  value={taskSortOrder}
                  onChange={(e) => setTaskSortOrder(e.target.value as typeof taskSortOrder)}
                  style={{ ...S.select, width: 130 }}
                >
                  <option value='newest'>Terbaru</option>
                  <option value='oldest'>Terlama</option>
                  <option value='deadline'>Deadline</option>
                  <option value='status'>Status</option>
                  <option value='child'>Anak</option>
                </select>
              </div>
            </div>
            {assignmentsLoading ? (
              <p style={{ color: '#999', fontSize: 13 }}>Memuat tugas...</p>
            ) : assignments.length === 0 ? (
              <div style={S.card}><p style={{ color: '#bbb', fontSize: 13, textAlign: 'center', margin: 12 }}>Belum ada tugas. Klik tombol "+ Assign New Module" untuk membuat tugas baru.</p></div>
            ) : (
              (() => {
                let filtered = assignments
                if (taskSearchQuery.trim()) {
                  const q = taskSearchQuery.toLowerCase()
                  filtered = filtered.filter((a) => {
                    const childName = getChildName(a.childId).toLowerCase()
                    const title = (a.title || '').toLowerCase()
                    return title.includes(q) || childName.includes(q)
                  })
                }
                filtered = [...filtered].sort((a, b) => {
                  if (taskSortOrder === 'newest') return (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
                  if (taskSortOrder === 'oldest') return (a.createdAt ?? '').localeCompare(b.createdAt ?? '')
                  if (taskSortOrder === 'deadline') return (a.dueDate ?? 'z').localeCompare(b.dueDate ?? 'z')
                  if (taskSortOrder === 'child') return getChildName(a.childId).localeCompare(getChildName(b.childId))
                  const statusOrder: Record<string, number> = { overdue: 0, in_progress: 1, pending: 2, completed: 3 }
                  return (statusOrder[a.status] ?? 4) - (statusOrder[b.status] ?? 4)
                })
                if (filtered.length === 0 && taskSearchQuery.trim()) {
                  return <p style={{ color: '#999', fontSize: 13, textAlign: 'center', padding: 20 }}>Tidak ada tugas yang cocok dengan pencarian.</p>
                }
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {filtered.map((a) => {
                      const completion = getAssignmentCompletion(a)
                      const ds = deadlineStatus(a)
                      const now = new Date()
                      const isCompleted = a.status === 'completed'
                      let cardBg = '#fff'
                      let cardBorder = '1px solid #eee'
                      if (!isCompleted && a.status === 'overdue') {
                        cardBg = 'rgba(239,68,68,0.04)'
                        cardBorder = '1.5px solid #ef4444'
                      } else if (!isCompleted && a.dueDate) {
                        const hoursLeft = (new Date(a.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60)
                        if (hoursLeft < 0) { cardBg = 'rgba(239,68,68,0.04)'; cardBorder = '1.5px solid #ef4444' }
                        else if (hoursLeft <= 24) { cardBg = 'rgba(245,158,11,0.04)'; cardBorder = '1.5px solid #f59e0b' }
                      }
                      return (
                        <div key={a.id} style={{ ...S.childCard, background: cardBg, border: cardBorder }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 15, fontWeight: 700, margin: '0 0 4px' }}>📖 {a.title}</p>
                              <p style={{ fontSize: 13, color: '#666', margin: '0 0 2px' }}>
                                Untuk: {getChildName(a.childId)}
                                {a.selectedFrames && ` · ${(a.selectedFrames as string[]).length} panel`}
                              </p>
                              <p style={{ fontSize: 12, color: '#999', margin: '0 0 8px' }}>
                                {a.dueDate ? `📅 ${new Date(a.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}` : 'Tanpa deadline'}
                              </p>
                            </div>
                          </div>
                          <div style={{ height: 5, borderRadius: 999, background: '#f0f0f5', overflow: 'hidden', marginBottom: 6 }}>
                            <div style={{
                              height: '100%', width: `${completion.pct}%`,
                              background: completion.pct === 100 ? '#00b894' : '#6c5ce7',
                              borderRadius: 999,
                            }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: ds.color, background: ds.bg, padding: '2px 8px', borderRadius: 6 }}>
                              {ds.label}
                            </span>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                type='button'
                                style={{ fontSize: 12, padding: '5px 12px', border: '1px solid #ddd', borderRadius: 8, background: '#fff', cursor: 'pointer', fontWeight: 600 }}
                                onClick={() => {
                                  setEditingAssignment(a)
                                  setEditDueDate(a.dueDate ? new Date(a.dueDate).toISOString().split('T')[0] : '')
                                  setEditSelectedFrames((a.selectedFrames as string[]) ?? [])
                                  if (a.materialId) {
                                    const cached = moduleCache[a.materialId]
                                    if (cached) setEditModule(cached)
                                    else fetchModule(a.materialId).then((mod) => setEditModule(mod)).catch(() => setEditModule(null))
                                  }
                                }}
                              >
                                Edit
                              </button>
                              <button
                                type='button'
                                style={{ fontSize: 12, padding: '5px 12px', border: '1px solid #fdd', borderRadius: 8, background: '#fff', color: '#ff7675', cursor: 'pointer', fontWeight: 600 }}
                                onClick={() => handleDeleteAssignment(a.id)}
                              >
                                Hapus
                              </button>
                            </div>
                          </div>
                          {/* Questions */}
                          {questions[a.id] && questions[a.id].length > 0 && (
                            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #f3f3f7' }}>
                              <p style={{ fontSize: 12, fontWeight: 600, margin: '0 0 6px', color: '#6c5ce7' }}>
                                💬 {questions[a.id].length} pertanyaan
                              </p>
                              {questions[a.id].slice(0, 2).map((q) => (
                                <div key={q.id} style={{ padding: 8, background: '#f8f7ff', borderRadius: 8, marginBottom: 6 }}>
                                  <p style={{ fontSize: 12, fontWeight: 500, margin: 0 }}>❓ {q.question}</p>
                                  {q.reply ? (
                                    <p style={{ fontSize: 12, color: '#00b894', margin: '4px 0 0' }}>💬 {q.reply}</p>
                                  ) : (
                                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                                      <input
                                        type='text'
                                        value={replyText[q.id] ?? ''}
                                        onChange={(e) => setReplyText((prev) => ({ ...prev, [q.id]: e.target.value }))}
                                        placeholder='Balas...'
                                        style={{ flex: 1, padding: '5px 8px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 12 }}
                                        onKeyDown={(e) => { if (e.key === 'Enter' && sendingReply !== q.id) handleReply(q.id) }}
                                      />
                                      <button
                                        type='button'
                                        style={{ fontSize: 11, padding: '4px 10px', border: 'none', borderRadius: 6, background: '#6c5ce7', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
                                        onClick={() => handleReply(q.id)}
                                        disabled={sendingReply === q.id || !replyText[q.id]?.trim()}
                                      >
                                        {sendingReply === q.id ? '...' : 'Balas'}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })()
            )}
          </div>
        )}
      </div>

      {/* ─── FAB: Assign New Module ─── */}
      <button
        type='button'
        style={S.fab}
        onClick={() => setShowAssignModal(true)}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(108,92,231,0.45)' }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(108,92,231,0.35)' }}
      >
        + Assign New Module
      </button>

      {/* ─── Create Child Modal ─── */}
      {showCreateChild && (
        <div style={S.modalOverlay} onClick={() => setShowCreateChild(false)}>
          <div style={S.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 18 }}>👶 Buat Akun Anak</h3>
              <button type='button' onClick={() => setShowCreateChild(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleCreateChild}>
              <label style={{ display: 'block', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Nama Lengkap Anak</span>
                <input type='text' value={childForm.name} onChange={(e) => setChildForm((p) => ({ ...p, name: e.target.value }))} required placeholder='Nama lengkap' style={S.input} />
              </label>
              <label style={{ display: 'block', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Email</span>
                <input type='email' value={childForm.email} onChange={(e) => setChildForm((p) => ({ ...p, email: e.target.value }))} required placeholder='anak@email.id' style={S.input} />
              </label>
              <label style={{ display: 'block', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Kata Sandi</span>
                <input type='password' value={childForm.password} onChange={(e) => setChildForm((p) => ({ ...p, password: e.target.value }))} required minLength={6} placeholder='Minimal 6 karakter' style={S.input} />
              </label>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <label style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Kelas</span>
                  <select value={childForm.grade} onChange={(e) => setChildForm((p) => ({ ...p, grade: Number(e.target.value) }))} style={S.select}>
                    {grades.map((g) => <option key={g.level} value={g.level}>{g.label}</option>)}
                  </select>
                </label>
                <label style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Semester</span>
                  <select value={childForm.semester} onChange={(e) => setChildForm((p) => ({ ...p, semester: Number(e.target.value) }))} style={S.select}>
                    {semesters.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </label>
              </div>
              {childError && <p style={{ color: '#ff7675', fontSize: 13, margin: '0 0 8px' }}>{childError}</p>}
              <button type='submit' disabled={childSubmitting} style={{
                width: '100%', padding: '12px 0', border: 'none', borderRadius: 12,
                background: '#6c5ce7', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                opacity: childSubmitting ? 0.6 : 1,
              }}>
                {childSubmitting ? 'Membuat...' : 'Buat Akun Anak'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── Assign Module Modal ─── */}
      {showAssignModal && (
        <div style={S.modalOverlay} onClick={() => { setShowAssignModal(false); setAssignSuccess(null); setAssignError(null) }}>
          <div style={S.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 18 }}>📚 Tugaskan Modul</h3>
              <button type='button' onClick={() => { setShowAssignModal(false); setAssignSuccess(null); setAssignError(null) }} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <label style={{ display: 'block', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Anak</span>
              <select value={selectedChildId} onChange={(e) => setSelectedChildId(e.target.value)} style={S.select}>
                <option value=''>-- Pilih Anak --</option>
                {children.map((c) => <option key={c.id} value={c.id}>{c.name} (Kelas {c.grade})</option>)}
              </select>
            </label>
            {selectedChildId && (
              <label style={{ display: 'block', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Mata Pelajaran</span>
                <select value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)} style={S.select}>
                  <option value=''>-- Pilih Mata Pelajaran --</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.icon} {s.shortName}</option>)}
                </select>
              </label>
            )}
            {selectedChildId && selectedSubjectId && (
              <label style={{ display: 'block', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Topik</span>
                <select value={selectedModuleId} onChange={(e) => setSelectedModuleId(e.target.value)} style={S.select}>
                  <option value=''>-- Pilih Topik --</option>
                  {availableModules.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
                </select>
              </label>
            )}
            {selectedModule && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Pilih Bahasan</span>
                  <button type='button' onClick={toggleAllFrames} style={{ fontSize: 12, color: '#6c5ce7', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                    {selectedFrames.length === selectedModule.frames.length ? 'Batalkan Semua' : 'Pilih Semua'}
                  </button>
                </div>
                <div style={{ border: '1px solid #eee', borderRadius: 10, padding: 8, maxHeight: 180, overflowY: 'auto' }}>
                  {selectedModule.frames.map((frame) => (
                    <label key={frame.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8, cursor: 'pointer', background: selectedFrames.includes(frame.id) ? '#f0eeff' : 'transparent' }}>
                      <input type='checkbox' checked={selectedFrames.includes(frame.id)} onChange={() => toggleFrame(frame.id)} style={{ width: 16, height: 16 }} />
                      <span>{KIND_ICON[frame.kind] ?? '📄'}</span>
                      <span style={{ fontSize: 13 }}>{frame.title}</span>
                      <span style={{ fontSize: 11, color: '#999' }}>({KIND_LABEL[frame.kind] ?? frame.kind})</span>
                    </label>
                  ))}
                </div>
                <p style={{ fontSize: 11, color: '#999', margin: '4px 0 0' }}>{selectedFrames.length} dari {selectedModule.frames.length} panel dipilih</p>
              </div>
            )}
            {selectedModule && (
              <label style={{ display: 'block', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>📅 Deadline</span>
                <input type='datetime-local' value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={S.input} />
              </label>
            )}
            {assignError && <p style={{ color: '#ff7675', fontSize: 13, margin: '0 0 8px' }}>{assignError}</p>}
            {assignSuccess && <p style={{ color: '#00b894', fontSize: 13, fontWeight: 600, margin: '0 0 8px' }}>{assignSuccess}</p>}
            {selectedModule && selectedFrames.length > 0 && (
              <button type='button' disabled={assigning} onClick={handleAssign} style={{
                width: '100%', padding: '12px 0', border: 'none', borderRadius: 12,
                background: '#6c5ce7', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                opacity: assigning ? 0.6 : 1,
              }}>
                {assigning ? 'Menugaskan...' : `Tugaskan ke ${children.find((c) => c.id === selectedChildId)?.name ?? 'Anak'}`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── Edit Assignment Modal ─── */}
      {editingAssignment && (
        <div style={S.modalOverlay} onClick={() => setEditingAssignment(null)}>
          <div style={S.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 18 }}>✏️ Edit Tugas</h3>
              <button type='button' onClick={() => setEditingAssignment(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <p style={{ fontSize: 13, color: '#666', margin: '0 0 4px' }}>Judul</p>
            <p style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>{editingAssignment.title}</p>
            <p style={{ fontSize: 13, color: '#666', margin: '0 0 4px' }}>Untuk</p>
            <p style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>{getChildName(editingAssignment.childId)}</p>
            <label style={{ display: 'block', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>📅 Deadline</span>
              <input type='date' value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} style={S.input} />
            </label>
            {editModule && editSelectedFrames.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 13, color: '#666', margin: '0 0 6px' }}>Bahasan yang ditugaskan</p>
                <div style={{ border: '1px solid #eee', borderRadius: 10, padding: 8 }}>
                  {editModule.frames.filter((f) => editSelectedFrames.includes(f.id)).map((frame) => (
                    <div key={frame.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', fontSize: 13 }}>
                      <span>{KIND_ICON[frame.kind] ?? '📄'}</span>
                      <span>{frame.title}</span>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 11, color: '#999', margin: '4px 0 0' }}>{editSelectedFrames.length} bahasan dipilih</p>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button type='button' onClick={() => setEditingAssignment(null)} style={{ padding: '10px 20px', border: '1px solid #ddd', borderRadius: 10, background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Batal</button>
              <button type='button' onClick={handleSaveEdit} disabled={editSaving} style={{ padding: '10px 20px', border: 'none', borderRadius: 10, background: '#6c5ce7', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 13, opacity: editSaving ? 0.6 : 1 }}>
                {editSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
