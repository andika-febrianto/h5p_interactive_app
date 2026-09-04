import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
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
  text: '📄', quiz: '❓', dragdrop: '🧩', video: '🎬', pdf: '📕', shortanswer: '✏️',
}
const KIND_LABEL: Record<string, string> = {
  text: 'Materi', quiz: 'Kuis', dragdrop: 'Drag & Drop', video: 'Video Interaktif', pdf: 'Dokumen PDF', shortanswer: 'Isian Singkat',
}

type ViewMode = 'overview' | 'modules' | 'reports' | 'schedule'

// ── Inline Styles ──
const S = {
  page: { minHeight: '100vh', background: '#F8FAFC', fontFamily: 'var(--font-body)' } as React.CSSProperties,
  header: { position: 'sticky' as const, top: 0, zIndex: 40, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' } as React.CSSProperties,
  headerInner: { maxWidth: 1280, margin: '0 auto', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 80 } as React.CSSProperties,
  brandArea: { display: 'flex', alignItems: 'center', gap: 12 } as React.CSSProperties,
  brandIcon: { width: 44, height: 44, borderRadius: 16, background: '#5B4DFF', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, boxShadow: '0 4px 12px rgba(91,77,255,0.2)' } as React.CSSProperties,
  brandTitle: { fontSize: 20, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' } as React.CSSProperties,
  brandSub: { fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'rgba(91,77,255,0.8)', background: '#F5F3FF', padding: '2px 8px', borderRadius: 999, display: 'inline-block', marginTop: 2 } as React.CSSProperties,
  tabs: { display: 'flex', alignItems: 'center', gap: 6, padding: 6, background: '#f1f5f9', borderRadius: 16, border: '1px solid #e2e8f0' } as React.CSSProperties,
  tab: (active: boolean) => ({
    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 12,
    fontSize: 13, fontWeight: active ? 700 : 600, cursor: 'pointer', border: 'none',
    background: active ? '#5B4DFF' : 'transparent', color: active ? '#fff' : '#64748b',
    transition: 'all 0.2s',
  }) as React.CSSProperties,
  headerRight: { display: 'flex', alignItems: 'center', gap: 12 } as React.CSSProperties,
  switchBtn: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#5B4DFF', background: '#F5F3FF', padding: '8px 12px', borderRadius: 12, border: '1px solid rgba(91,77,255,0.15)', cursor: 'pointer', transition: 'all 0.2s' } as React.CSSProperties,
  bellBtn: { position: 'relative' as const, padding: 10, borderRadius: 12, border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', transition: 'all 0.2s' } as React.CSSProperties,
  bellBadge: { position: 'absolute' as const, top: 6, right: 6, width: 16, height: 16, borderRadius: '50%', background: '#F43F5E', color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' } as React.CSSProperties,
  divider: { width: 1, height: 28, background: '#e2e8f0' } as React.CSSProperties,
  profileArea: { display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' } as React.CSSProperties,
  avatar: { width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #5B4DFF, #6366F1)', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, boxShadow: '0 2px 8px rgba(91,77,255,0.2)' } as React.CSSProperties,
  main: { maxWidth: 1280, margin: '0 auto', padding: '32px 32px 64px' } as React.CSSProperties,

  // Welcome Hero
  hero: { borderRadius: 24, padding: '32px 40px', marginBottom: 32, position: 'relative' as const, overflow: 'hidden', background: 'linear-gradient(135deg, #F5F3FF 0%, #EEF2FF 50%, #EDE9FE 100%)', border: '1px solid rgba(91,77,255,0.15)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' } as React.CSSProperties,
  heroInner: { display: 'flex', flexDirection: 'row' as const, justifyContent: 'space-between', alignItems: 'center', gap: 24, position: 'relative' as const, zIndex: 1, flexWrap: 'wrap' as const } as React.CSSProperties,
  heroBadge: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(91,77,255,0.15)', fontSize: 11, fontWeight: 600, color: '#5B4DFF', marginBottom: 8 } as React.CSSProperties,
  heroDot: { width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' } as React.CSSProperties,
  heroTitle: { fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: '8px 0 4px', lineHeight: 1.2 } as React.CSSProperties,
  heroSub: { fontSize: 14, color: '#64748b', lineHeight: 1.6, maxWidth: 520 } as React.CSSProperties,
  heroRight: { display: 'flex', flexWrap: 'wrap' as const, alignItems: 'center', gap: 12, flexShrink: 0 } as React.CSSProperties,
  childCard: { display: 'flex', alignItems: 'center', gap: 12, background: '#fff', padding: '10px 16px', borderRadius: 16, border: '1px solid rgba(91,77,255,0.1)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' } as React.CSSProperties,
  childAvatar: { width: 40, height: 40, borderRadius: 12, background: '#5B4DFF', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, boxShadow: '0 2px 8px rgba(91,77,255,0.2)' } as React.CSSProperties,
  childLabel: { fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' as const, color: '#94a3b8' } as React.CSSProperties,
  childName: { fontSize: 14, fontWeight: 700, color: '#0f172a', marginTop: 2 } as React.CSSProperties,
  childGrade: { fontSize: 12, fontWeight: 500, color: '#5B4DFF', marginTop: 1 } as React.CSSProperties,
  starCard: { display: 'flex', alignItems: 'center', gap: 10, background: '#FFFBEB', padding: '12px 16px', borderRadius: 16, border: '1px solid #FDE68A' } as React.CSSProperties,
  starText: { fontSize: 14, fontWeight: 800, color: '#92400E', lineHeight: 1.2 } as React.CSSProperties,
  starSub: { fontSize: 11, fontWeight: 600, color: 'rgba(146,64,14,0.7)', marginTop: 2 } as React.CSSProperties,
  manageBtn: { padding: '12px 16px', borderRadius: 16, background: '#5B4DFF', color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba(91,77,255,0.2)', transition: 'all 0.2s' } as React.CSSProperties,

  // Grid
  grid: { display: 'grid', gridTemplateColumns: '1fr 360px', gap: 32, alignItems: 'start' } as React.CSSProperties,
  leftCol: { display: 'flex', flexDirection: 'column' as const, gap: 32 } as React.CSSProperties,
  rightCol: { display: 'flex', flexDirection: 'column' as const, gap: 24 } as React.CSSProperties,

  // Cards
  card: { background: '#fff', borderRadius: 24, padding: 28, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px -2px rgba(91,77,255,0.05), 0 2px 6px -1px rgba(0,0,0,0.02)' } as React.CSSProperties,
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid #f1f5f9', marginBottom: 20 } as React.CSSProperties,
  sectionTitle: { fontSize: 17, fontWeight: 700, color: '#0f172a', margin: 0 } as React.CSSProperties,
  sectionSub: { fontSize: 12, color: '#94a3b8', marginTop: 2 } as React.CSSProperties,

  // Progress
  progressCard: { padding: 20, borderRadius: 16, background: 'linear-gradient(135deg, #f8fafc, rgba(91,77,255,0.04))', border: '1px solid #f1f5f9', marginTop: 20 } as React.CSSProperties,
  progressBar: { height: 14, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden', padding: 2 } as React.CSSProperties,
  progressBarInner: (pct: number): React.CSSProperties => ({
    height: '100%', width: `${pct}%`, borderRadius: 999,
    background: 'linear-gradient(90deg, #5B4DFF, #6366F1)',
    transition: 'width 0.5s ease',
  }),

  // Subject chips
  subjectChips: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 16 } as React.CSSProperties,
  subjectChip: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px',
    borderRadius: 12, background: '#f8fafc', border: '1px solid #f1f5f9',
  } as React.CSSProperties,

  // Chart
  chartArea: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, height: 176, padding: '16px 8px 12px', borderBottom: '1px solid #f1f5f9', marginBottom: 12 } as React.CSSProperties,
  barGroup: { flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 6 } as React.CSSProperties,
  bar: (h: number, active: boolean, peak: boolean) => ({
    width: '100%', maxWidth: 48, height: h, borderRadius: 8,
    background: peak ? '#5B4DFF' : active ? 'rgba(91,77,255,0.35)' : '#e2e8f0',
    transition: 'height 0.4s ease',
  }) as React.CSSProperties,

  // Schedule
  schedItem: (borderColor: string, bgColor: string): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14,
    padding: '16px', borderRadius: 16, border: `1px solid ${borderColor}`, background: bgColor,
    transition: 'all 0.2s', cursor: 'pointer',
  }) as React.CSSProperties,
  schedDate: { width: 48, height: 48, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as React.CSSProperties,
  schedBadge: (color: string, bg: string, border: string): React.CSSProperties => ({
    fontSize: 10, fontWeight: 700, color, background: bg, border: `1px solid ${border}`,
    padding: '3px 10px', borderRadius: 999, flexShrink: 0,    whiteSpace: 'nowrap' as const,
  }),
  perfCard: {
    background: 'linear-gradient(135deg, #1E1B4B, #2A1F6D, #0f172a)', borderRadius: 24, padding: 28,
    color: '#fff', position: 'relative' as const, overflow: 'hidden',
    boxShadow: '0 10px 30px -5px rgba(30,27,75,0.3)',
  } as React.CSSProperties,
  radialProgress: (pct: number): React.CSSProperties => ({
    width: 96, height: 96, borderRadius: '50%',
    background: `conic-gradient(#818CF8 0% ${pct}%, rgba(255,255,255,0.12) ${pct}% 100%)`,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  }) as React.CSSProperties,
  radialInner: { width: 72, height: 72, borderRadius: '50%', background: '#1E1B4B', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center' } as React.CSSProperties,

  // Activity feed
  actItem: { display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0' } as React.CSSProperties,
  actIcon: (bg: string, color: string) => ({
    width: 32, height: 32, borderRadius: 12, background: bg, color,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${bg}`,
  }) as React.CSSProperties,

  // Quick action grid
  quickGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 } as React.CSSProperties,
  quickBtn: {
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center', textAlign: 'center' as const,
    padding: '16px 12px', borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0',
    cursor: 'pointer', transition: 'all 0.2s', fontSize: 12,
  } as React.CSSProperties,
  quickIcon: (color: string) => ({
    width: 36, height: 36, borderRadius: 12, background: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center', color,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 8,
  }) as React.CSSProperties,

  // FAB
  fab: {
    position: 'fixed' as const, bottom: 24, right: 24, zIndex: 100,
    display: 'flex', alignItems: 'center', gap: 10, padding: '14px 24px',
    background: '#5B4DFF', color: '#fff', border: 'none', borderRadius: 999,
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(91,77,255,0.35)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  } as React.CSSProperties,

  // Footer
  footer: { background: '#fff', borderTop: '1px solid #e2e8f0', padding: '24px 32px', marginTop: 64 } as React.CSSProperties,
  footerInner: { maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: 12 } as React.CSSProperties,
  footerLink: { fontSize: 12, fontWeight: 600, color: '#94a3b8', textDecoration: 'none', transition: 'color 0.2s' } as React.CSSProperties,

  // Modal
  modalOverlay: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(4px)' } as React.CSSProperties,
  modalBox: { background: '#fff', borderRadius: 20, padding: 28, width: '90%', maxWidth: 560, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' } as React.CSSProperties,
  input: { width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, outline: 'none', background: '#fff', boxSizing: 'border-box' as const, fontFamily: 'var(--font-body)' } as React.CSSProperties,
  select: { width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, outline: 'none', background: '#fff', cursor: 'pointer', boxSizing: 'border-box' as const, fontFamily: 'var(--font-body)' } as React.CSSProperties,
  btnPrimary: { width: '100%', padding: '12px 0', border: 'none', borderRadius: 12, background: '#5B4DFF', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' } as React.CSSProperties,
  btnSecondary: { padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: 10, background: '#fff', color: '#5B4DFF', fontSize: 12, fontWeight: 600, cursor: 'pointer' } as React.CSSProperties,
}

export default function ParentDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState<ViewMode>('overview')



  // Children state
  const [children, setChildren] = useState<ChildInfo[]>([])
  const [childrenLoading, setChildrenLoading] = useState(true)
  const [showCreateChild, setShowCreateChild] = useState(false)
  const [childForm, setChildForm] = useState({ name: '', email: '', password: '', grade: 1, semester: 1 })
  const [childError, setChildError] = useState<string | null>(null)
  const [childSubmitting, setChildSubmitting] = useState(false)

  // Selected child for hero
  const [selectedChildIdx, setSelectedChildIdx] = useState(0)
  const selectedChild = children[selectedChildIdx] ?? null

  // Progress state
  const [, setProgressLoading] = useState(false)
  const [assignmentProgress, setAssignmentProgress] = useState<Record<string, Record<string, FrameProgress>>>({})
  const [moduleCache, setModuleCache] = useState<Record<string, Module>>({})

  // Assignment state
  const [assignments, setAssignments] = useState<ParentAssignment[]>([])
  const [, setAssignmentsLoading] = useState(true)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedChildId, setSelectedChildId] = useState('')
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [selectedModuleId, setSelectedModuleId] = useState('')

  const [availableModules, setAvailableModules] = useState<ModuleSummary[]>([])
  const [selectedModule, setSelectedModule] = useState<Module | null>(null)
  const [selectedFrames, setSelectedFrames] = useState<string[]>([])
  const [dueDate, setDueDate] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [editingAssignment, setEditingAssignment] =
    useState<ParentAssignment | null>(null)
  const [editDueDate, setEditDueDate] = useState('')
  const [editSelectedFrames] = useState<string[]>([])
  const [editModule] = useState<Module | null>(null)
  const [editSaving, setEditSaving] = useState(false)

  // ── Data Loading ──
  useEffect(() => {
    fetchChildren().then(setChildren).catch(() => setChildren([])).finally(() => setChildrenLoading(false))
  }, [])
  useEffect(() => {
    checkDeadlines().catch(() => {})
    generateWeeklyReport().catch(() => {})
    generateMonthlyReport().catch(() => {})
  }, [])
  useEffect(() => {
    fetchAssignments().then(setAssignments).catch(() => setAssignments([])).finally(() => setAssignmentsLoading(false))
  }, [])
  useEffect(() => {
    fetchSubjects().then(setSubjects).catch(() => setSubjects([]))
  }, [])

  useEffect(() => {
    if (!selectedChild) { setAssignmentProgress({}); return }
    setProgressLoading(true)
    const childAssignments = assignments.filter((a) => a.childId === selectedChild.id)
    if (childAssignments.length === 0) { setProgressLoading(false); return }
    const fetches: Promise<unknown>[] = []
    childAssignments.forEach((a) => {
      if (a.materialId) {
        if (!moduleCache[a.materialId]) {
          fetches.push(fetchModule(a.materialId).then((mod) => setModuleCache((prev) => ({ ...prev, [a.materialId!]: mod }))).catch(() => {}))
        }
        fetches.push(fetchChildModuleProgress(selectedChild.id, a.materialId).then((frames) => {
          const map: Record<string, FrameProgress> = {}
          frames.forEach((f) => { map[f.frameSlug] = f })
          setAssignmentProgress((prev) => ({ ...prev, [a.materialId!]: map }))
        }).catch(() => {}))
      }
    })
    Promise.all(fetches).finally(() => setProgressLoading(false))
  }, [selectedChild, assignments])

  useEffect(() => {
    if (!selectedChildId || !selectedSubjectId) { setAvailableModules([]); return }
    const child = children.find((c) => c.id === selectedChildId)
    if (child?.grade && child?.semester) {
      fetchModules({ grade: child.grade, semester: child.semester, subjectId: selectedSubjectId }).then(setAvailableModules).catch(() => setAvailableModules([]))
    }
  }, [selectedChildId, selectedSubjectId, children])

  useEffect(() => {
    if (!selectedModuleId) { setSelectedModule(null); setSelectedFrames([]); return }
    fetchModule(selectedModuleId).then((mod) => { setSelectedModule(mod); setSelectedFrames(mod.frames.map((f) => f.id)) }).catch(() => { setSelectedModule(null); setSelectedFrames([]) })
  }, [selectedModuleId])

  useEffect(() => {
    setSelectedModuleId(''); setSelectedModule(null); setSelectedFrames([]); setDueDate(''); setAssignError(null); setAssignSuccess(null)
  }, [selectedChildId, selectedSubjectId])

  // ── Handlers ──
  const handleCreateChild = async (e: React.FormEvent) => {
    e.preventDefault(); setChildError(null); setChildSubmitting(true)
    try {
      const newChild = await addChild({ name: childForm.name, email: childForm.email, password: childForm.password, grade: childForm.grade, semester: childForm.semester })
      setChildren((prev) => [...prev, newChild])
      setChildForm({ name: '', email: '', password: '', grade: 1, semester: 1 })
      setShowCreateChild(false)
    } catch (err) { setChildError(err instanceof ApiError ? err.message : 'Gagal membuat akun anak.') }
    finally { setChildSubmitting(false) }
  }

  const toggleFrame = (id: string) => setSelectedFrames((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id])
  const toggleAllFrames = () => {
    if (!selectedModule) return
    if (selectedFrames.length === selectedModule.frames.length) setSelectedFrames([])
    else setSelectedFrames(selectedModule.frames.map((f) => f.id))
  }

  const handleAssign = async () => {
    if (!selectedChildId || !selectedModule || selectedFrames.length === 0) return
    setAssignError(null); setAssignSuccess(null); setAssigning(true)
    try {
      const childInfo = children.find((c) => c.id === selectedChildId)
      await createAssignment({ childId: selectedChildId, title: selectedModule.title, materialId: selectedModule.id, selectedFrames, dueDate: dueDate ? new Date(dueDate).toISOString() : undefined })
      setAssignSuccess(`✓ "${selectedModule.title}" (${selectedFrames.length} panel) berhasil ditugaskan ke ${childInfo?.name ?? 'anak'}!`)
      const updated = await fetchAssignments(); setAssignments(updated)
      setSelectedModuleId(''); setSelectedModule(null); setSelectedFrames([]); setDueDate(''); setSelectedChildId(''); setSelectedSubjectId('')
      setTimeout(() => { setShowAssignModal(false); setAssignSuccess(null) }, 1500)
    } catch (err) { setAssignError(err instanceof ApiError ? err.message : 'Gagal menugaskan modul.') }
    finally { setAssigning(false) }
  }

  const _handleDeleteAssignment = async (id: string) => {
    if (!confirm('Yakin ingin menghapus tugas ini?')) return
    try { await deleteAssignment(id); setAssignments((prev) => prev.filter((a) => a.id !== id)) }
    catch (err) { alert(err instanceof ApiError ? err.message : 'Gagal menghapus tugas.') }
  }
  void _handleDeleteAssignment

  const getChildName = (childId: string) => children.find((c) => c.id === childId)?.name ?? childId

  const loadChildQuestions = useCallback(async (childId: string) => {
    const childAssignments = assignments.filter((a) => a.childId === childId)
    const allQ: Record<string, Question[]> = {}
    await Promise.all(childAssignments.map(async (a) => { try { allQ[a.id] = await fetchAssignmentQuestions(a.id) } catch { allQ[a.id] = [] } }))
    void allQ
  }, [assignments])

  useEffect(() => { if (selectedChild) loadChildQuestions(selectedChild.id) }, [selectedChild, loadChildQuestions])

  const handleSaveEdit = async () => {
    if (!editingAssignment) return; setEditSaving(true)
    try {
      await updateAssignment(editingAssignment.id, { dueDate: editDueDate || undefined, status: editingAssignment.status })
      setAssignments((prev) => prev.map((a) => a.id === editingAssignment.id ? { ...a, dueDate: editDueDate ? new Date(editDueDate).toISOString() : a.dueDate } : a))
      setEditingAssignment(null)
    } catch { /* silently */ } finally { setEditSaving(false) }
  }

  const _handleReply = async (_questionId: string) => {
    try { if (selectedChild) await loadChildQuestions(selectedChild.id) }
    catch { /* silently */ }
  }
  void _handleReply

  const getFrameProgress = (materialId: string | null, frameSlug: string): FrameProgress | null => {
    if (!materialId) return null; return assignmentProgress[materialId]?.[frameSlug] ?? null
  }
  const getAssignmentCompletion = (a: ParentAssignment): { completed: number; total: number; pct: number } => {
    if (!a.selectedFrames || !a.materialId) return { completed: 0, total: 0, pct: 0 }
    const total = a.selectedFrames.length; let completed = 0
    a.selectedFrames.forEach((fid) => { const fp = getFrameProgress(a.materialId, fid); if (fp?.completed) completed++ })
    return { completed, total, pct: total > 0 ? Math.round((completed / total) * 100) : 0 }
  }

  // ── Derived Data ──
  const totalModulesCompleted = assignments.filter((a) => a.status === 'completed').length
  const totalPoints = totalModulesCompleted * 10 + children.length * 20
  const overallAvgScore = (() => {
    const pcts = assignments.map((a) => getAssignmentCompletion(a).pct).filter((p) => p > 0)
    if (pcts.length === 0) return 78
    return Math.round(pcts.reduce((s, p) => s + p, 0) / pcts.length)
  })()

  const _childProgress = (child: ChildInfo) => {
    const ca = assignments.filter((a) => a.childId === child.id)
    if (ca.length === 0) return { latest: null as ParentAssignment | null, pct: 0 }
    const latest = ca.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))[0]
    return { latest, pct: getAssignmentCompletion(latest).pct }
  }
  void _childProgress

  const deadlineStatus = (a: ParentAssignment) => {
    if (a.status === 'completed') return { label: 'Tepat Waktu', color: '#059669', bg: '#d1fae5', border: '#a7f3d0' }
    if (!a.dueDate) return { label: a.status === 'in_progress' ? 'Dikerjakan' : 'Menunggu', color: '#475569', bg: '#f8fafc', border: '#e2e8f0' }
    const now = new Date(); const due = new Date(a.dueDate); const hrs = (due.getTime() - now.getTime()) / (1000 * 60 * 60)
    if (hrs < 0) return { label: 'Perlu Perhatian / Terlambat', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' }
    if (hrs <= 24) return { label: 'Besok Sore', color: '#d97706', bg: '#fffbeb', border: '#fde68a' }
    return { label: 'Tepat Waktu', color: '#059669', bg: '#d1fae5', border: '#a7f3d0' }
  }

  const firstName = user?.name?.split(' ')[0] ?? 'Orang Tua'
  const childName = selectedChild?.name ?? 'Anak'
  const childInitial = childName.charAt(0).toUpperCase()
  const childGradeText = selectedChild ? `Kelas ${selectedChild.grade ?? '?'} SD` : ''
  const childSemText = selectedChild ? `Sem. ${selectedChild.semester ?? '?'}` : ''

  const activeAssignments = assignments.filter((a) => a.status !== 'completed' && a.childId === (selectedChild?.id ?? ''))
  const overdueCount = activeAssignments.filter((a) => {
    if (!a.dueDate) return false; return new Date(a.dueDate).getTime() < Date.now()
  }).length
  const bellCount = overdueCount || (assignments.filter((a) => a.status === 'pending').length > 0 ? Math.min(assignments.filter((a) => a.status === 'pending').length, 3) : 0)

  const barData = [
    { day: 'Sen', min: 30, h: 55, active: true, peak: false },
    { day: 'Sel', min: 55, h: 100, active: true, peak: false },
    { day: 'Rab', min: 40, h: 75, active: true, peak: false },
    { day: 'Kam', min: 68, h: 130, active: true, peak: true },
    { day: 'Jum', min: 45, h: 82, active: true, peak: false },
    { day: 'Sab', min: 15, h: 30, active: false, peak: false },
    { day: 'Min', min: 10, h: 20, active: false, peak: false },
  ]

  const upcomingItems = assignments.filter((a) => a.status !== 'completed').slice(0, 3)

  const recentActivities = assignments.slice(0, 3).map((a) => {
    const isCompleted = a.status === 'completed'
    const isInProgress = a.status === 'in_progress'
    return { ...a, isCompleted, isInProgress }
  })

  const tabs = [
    { key: 'overview', label: 'Ringkasan', icon: '⊞' },
    { key: 'modules', label: 'Modul Belajar', icon: '📖' },
    { key: 'reports', label: 'Laporan & Rapor', icon: '📊' },
    { key: 'schedule', label: 'Jadwal & Tugas', icon: '📅' },
  ] as const

  return (
    <div style={S.page}>
      {/* ── HEADER ── */}
      <header style={S.header}>
        <div style={S.headerInner}>
          <div style={S.brandArea}>
            <div style={S.brandIcon}>
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/></svg>
            </div>
            <div>
              <div style={S.brandTitle}>Perpustakaan <span style={{ color: '#5B4DFF' }}>Belajar</span></div>
              <span style={S.brandSub}>Mode Orang Tua / Pendamping SD</span>
            </div>
          </div>

          <nav style={S.tabs}>
            {tabs.map((t) => (
              <button key={t.key} style={S.tab(viewMode === t.key)} onClick={() => setViewMode(t.key as ViewMode)}>
                <span>{t.icon}</span><span>{t.label}</span>
              </button>
            ))}
          </nav>

          <div style={S.headerRight}>
            <button style={S.switchBtn} onClick={() => navigate('/anak')}>
              <span>Beralih ke Akun Siswa</span>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button style={S.bellBtn}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {bellCount > 0 && <span style={S.bellBadge}>{bellCount}</span>}
            </button>
            <div style={S.divider} />
            <div style={S.profileArea} onClick={() => setShowCreateChild(true)}>
              <div style={S.avatar}>{user?.name?.charAt(0)?.toUpperCase() ?? 'P'}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{user?.name ?? 'Pengguna'}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Ayah dari {childName} ({childGradeText})</div>
              </div>
              <svg width="16" height="16" fill="none" stroke="#94a3b8" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main style={S.main}>
        {/* Welcome Hero */}
        <section style={S.hero}>
          <div style={{ position: 'absolute', right: -40, bottom: -40, width: 256, height: 256, borderRadius: '50%', background: 'rgba(91,77,255,0.12)', filter: 'blur(60px)' }} />
          <div style={{ position: 'absolute', top: 8, right: '33%', width: 128, height: 128, borderRadius: '50%', background: 'rgba(245,158,11,0.12)', filter: 'blur(40px)' }} />
          <div style={S.heroInner}>
            <div style={{ maxWidth: 560 }}>
              <div style={S.heroBadge}><span style={S.heroDot} /> Status Pendamping Aktif: Semester Ganjil 2026/2027</div>
              <h1 style={S.heroTitle}>Selamat Datang Kembali, {firstName}! 👋</h1>
              <p style={S.heroSub}>Pantau kemajuan belajar {childName}, pastikan misi terselesaikan tepat waktu, dan dukung minat belajar dengan mudah hari ini.</p>
            </div>
            <div style={S.heroRight}>
              <div style={S.childCard}>
                <div style={S.childAvatar}>{childInitial}</div>
                <div>
                  <div style={S.childLabel}>Profil Anak</div>
                  <div style={S.childName}>{childName}</div>
                  <div style={S.childGrade}>{childGradeText} • {childSemText}</div>
                </div>
                {children.length > 1 && (
                  <button style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4, color: '#94a3b8' }} onClick={() => setSelectedChildIdx((i) => (i + 1) % children.length)}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                )}
              </div>
              <div style={S.starCard}>
                <span style={{ fontSize: 24 }}>⭐</span>
                <div>
                  <div style={S.starText}>{totalPoints} Poin Apresiasi</div>
                  <div style={S.starSub}>Tukar hadiah orang tua</div>
                </div>
              </div>
              <button style={S.manageBtn} onClick={() => setShowAssignModal(true)}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Kelola Profil
              </button>
            </div>
          </div>
        </section>

        {/* Grid: 8/4 */}
        <div style={S.grid}>
          {/* LEFT */}
          <div style={S.leftCol}>
            {/* Progress Belajar */}
            <section style={S.card}>
              <div style={S.cardHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 16, background: '#F5F3FF', border: '1px solid #EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5B4DFF' }}>
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#5B4DFF', background: '#F5F3FF', padding: '2px 8px', borderRadius: 4 }}>Modul Yang Sedang Berjalan</span>
                    <h2 style={{ ...S.sectionTitle, marginTop: 4 }}>Progress Belajar {childName}</h2>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', background: '#FFFBEB', color: '#92400E', borderRadius: 999, border: '1px solid #FDE68A' }}>Matematika Dasar</span>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', background: '#d1fae5', color: '#065f46', borderRadius: 999, border: '1px solid #a7f3d0' }}>Semester 1</span>
                </div>
              </div>

              {selectedChild && activeAssignments.length > 0 ? (() => {
                const mainAssignment = activeAssignments[0]
                const comp = getAssignmentCompletion(mainAssignment)
                return (
                  <div style={S.progressCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <div>
                        <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Materi Utama Saat Ini:</p>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '4px 0 0' }}>{mainAssignment.title}</h3>
                        <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>{comp.total} panel ditugaskan</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 28, fontWeight: 900, color: '#5B4DFF' }}>{comp.pct}%</span>
                        <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>{comp.completed} dari {comp.total} selesai</p>
                      </div>
                    </div>
                    <div style={S.progressBar}><div style={S.progressBarInner(comp.pct)} /></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(226,232,240,0.5)' }}>
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>Kuis latihan lulus: {totalModulesCompleted}x</span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button style={S.btnSecondary} onClick={() => navigate(`/modul/${mainAssignment.materialId}`)}>Lihat Detail Materi</button>
                        <button style={{ ...S.btnSecondary, background: '#5B4DFF', color: '#fff', border: 'none' }} onClick={() => navigate(`/modul/${mainAssignment.materialId}`)}>Uji Pemahaman Anak</button>
                      </div>
                    </div>
                  </div>
                )
              })() : (
                <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                  {childrenLoading ? 'Memuat data...' : 'Belum ada modul aktif. Klik "+ Beri Tugas" untuk membuat tugas baru.'}
                </div>
              )}

              <div style={S.subjectChips}>
                {subjects.slice(0, 3).map((s) => {
                  const sAssignments = assignments.filter((a) => a.materialId && moduleCache[a.materialId]?.subjectId === s.id)
                  const pct = sAssignments.length > 0 ? Math.round(sAssignments.reduce((sum, a) => sum + getAssignmentCompletion(a).pct, 0) / sAssignments.length) : 0
                  return (
                    <div key={s.id} style={S.subjectChip}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.accent }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{s.shortName}</span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: s.accent }}>{pct}% Selesai</span>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Weekly Chart */}
            <section style={S.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#5B4DFF' }} />
                    <h2 style={S.sectionTitle}>Aktivitas Belajar Mingguan</h2>
                  </div>
                  <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Waktu interaksi {childName} menyelesaikan latihan & video</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>Rata-rata Harian</span>
                    <p style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', margin: '2px 0 0' }}>42 Menit / Hari</p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#059669', background: '#d1fae5', padding: '4px 10px', borderRadius: 8, border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    +14% vs mgg lalu
                  </span>
                </div>
              </div>
              <div style={S.chartArea}>
                {barData.map((b) => (
                  <div key={b.day} style={S.barGroup}>
                    <span style={{ fontSize: 10, fontWeight: b.peak ? 800 : 600, color: b.peak ? '#5B4DFF' : '#94a3b8', background: b.peak ? '#F5F3FF' : 'transparent', padding: b.peak ? '1px 6px' : 0, borderRadius: 4 }}>
                      {b.min}m{b.peak ? ' ⭐' : ''}
                    </span>
                    <div style={S.bar(b.h, b.active, b.peak)} />
                    <span style={{ fontSize: 11, fontWeight: b.peak ? 700 : 500, color: b.peak ? '#5B4DFF' : '#94a3b8' }}>{b.day}{b.peak ? ' (Hari Ini)' : ''}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#94a3b8' }}>
                <div style={{ display: 'flex', gap: 16 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: 4, background: '#5B4DFF' }} /> Hari Aktif</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: 4, background: '#e2e8f0' }} /> Akhir Pekan</span>
                </div>
                <span style={{ fontWeight: 600, color: '#334155' }}>Total: <strong style={{ color: '#0f172a' }}>3 Jam 48 Menit</strong></span>
              </div>
            </section>

            {/* Upcoming Schedule */}
            <section style={S.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h2 style={S.sectionTitle}>Jadwal & Target Mendatang</h2>
                  <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Pantau tenggat waktu tugas {childName}</p>
                </div>
                <button style={{ ...S.btnSecondary, fontSize: 11, fontWeight: 700, color: '#5B4DFF' }} onClick={() => setShowAssignModal(true)}>+ Tambah Pengingat</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {upcomingItems.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: 20 }}>Tidak ada jadwal mendatang</p>
                ) : upcomingItems.map((a) => {
                  const ds = deadlineStatus(a)
                  const due = a.dueDate ? new Date(a.dueDate) : new Date()
                  const isOverdue = ds.label.includes('Terlambat') || ds.label.includes('Perlu Perhatian')
                  return (
                    <div key={a.id} style={S.schedItem(ds.border, ds.bg)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={S.schedDate}>
                          <span style={{ fontSize: 16, fontWeight: 800, color: isOverdue ? '#dc2626' : '#0f172a' }}>{due.getDate()}</span>
                          <span style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const }}>{due.toLocaleDateString('id-ID', { month: 'short' })}</span>
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' as const }}>
                            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0 }}>{a.title}</h3>
                            <span style={S.schedBadge(ds.color, ds.bg, ds.border)}>{ds.label}</span>
                          </div>
                          <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>
                            {subjects.find((s) => a.materialId && moduleCache[a.materialId]?.subjectId === s.id)?.shortName ?? 'Umum'} • {getChildName(a.childId)}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        {isOverdue ? (
                          <button style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', background: '#fee2e2', padding: '6px 14px', borderRadius: 10, border: 'none', cursor: 'pointer' }} onClick={() => navigate(`/modul/${a.materialId}`)}>Bantu {childName.split(' ')[0]} Mulai</button>
                        ) : (
                          <button style={{ fontSize: 11, fontWeight: 600, color: '#475569', background: '#f1f5f9', padding: '6px 14px', borderRadius: 10, border: 'none', cursor: 'pointer' }} onClick={() => alert('Pengingat WhatsApp akan dikirim saat fitur tersedia.')}>Atur Pengingat WA</button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          </div>

          {/* RIGHT */}
          <aside style={S.rightCol}>
            {/* Performance Summary */}
            <section style={S.perfCard}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: 176, height: 176, borderRadius: '50%', background: 'rgba(91,77,255,0.2)', filter: 'blur(60px)' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#C4B5FD' }}>Ringkasan Performa</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: 'rgba(79,70,229,0.6)', color: '#C7D2FE', border: '1px solid rgba(91,77,255,0.3)' }}>Bulan Ini</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, margin: '20px 0' }}>
                  <div style={S.radialProgress(overallAvgScore)}>
                    <div style={S.radialInner}>
                      <span style={{ fontSize: 24, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{overallAvgScore}%</span>
                      <span style={{ fontSize: 9, fontWeight: 600, color: '#C4B5FD', textTransform: 'uppercase' as const, marginTop: 2 }}>Rata Skor</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#FCD34D', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>🏆 Top {children.length > 0 ? Math.max(5, 20 - totalModulesCompleted) : 15}% Se-Kelas</div>
                    <h4 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: '0 0 4px', lineHeight: 1.3 }}>Perkembangan Sangat Baik!</h4>
                    <p style={{ fontSize: 12, color: '#C7D2FE', margin: 0, lineHeight: 1.4 }}>{childName} konsisten berlatih terutama di materi hitung cepat.</p>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid rgba(79,70,229,0.6)', paddingTop: 12, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[['📚', 'Total Modul Tuntas:', `${totalModulesCompleted} Modul`], ['⏱️', 'Durasi Pekan Ini:', '3.5 Jam'], ['🎯', 'Kuis Nilai Sempurna:', `${Math.min(totalModulesCompleted * 2, 6)} Kali`]].map(([icon, label, val]) => (
                    <div key={String(label)} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#C7D2FE' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span>{icon}</span> {label}</span>
                      <span style={{ fontWeight: 700, color: '#fff' }}>{val}</span>
                    </div>
                  ))}
                </div>
                <button style={{ width: '100%', marginTop: 20, padding: '12px 0', borderRadius: 12, background: '#fff', color: '#1E1B4B', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} onClick={() => { setViewMode('reports') }}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Unduh Laporan Rapor Lengkap (PDF)
                </button>
              </div>
            </section>

            {/* Recent Activity */}
            <section style={S.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>Aktivitas Belajar Terkini</h3>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#5B4DFF', cursor: 'pointer' }} onClick={() => setViewMode('reports')}>Lihat Semua</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {recentActivities.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: 12 }}>Belum ada aktivitas</p>
                ) : recentActivities.map((a) => (
                  <div key={a.id} style={S.actItem}>
                    <div style={S.actIcon(a.isCompleted ? '#d1fae5' : a.isInProgress ? '#F5F3FF' : '#FEF2F2', a.isCompleted ? '#059669' : a.isInProgress ? '#5B4DFF' : '#dc2626')}>
                      {a.isCompleted ? '✅' : a.isInProgress ? '👁️' : '⚠️'}
                    </div>
                    <div>
                      <p style={{ fontSize: 12, color: '#334155', margin: 0 }}>
                        {getChildName(a.childId)} {a.isCompleted ? 'menyelesaikan' : a.isInProgress ? 'mengerjakan' : 'ditugaskan'} <strong>{a.title}</strong>
                      </p>
                      <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, marginTop: 2, display: 'block' }}>
                        {a.createdAt ? new Date(a.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Quick Actions */}
            <section style={S.card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }}>Aksi Cepat Pendamping</h3>
              <div style={S.quickGrid}>
                {[
                  { icon: '📅', label: 'Atur Jadwal', sub: 'Target harian', color: '#5B4DFF', action: () => setViewMode('schedule') },
                  { icon: '📊', label: 'Analitik Skor', sub: 'Grafik detail', color: '#6366F1', action: () => setViewMode('reports') },
                  { icon: '🔒', label: 'Batas Waktu', sub: 'Screen time', color: '#d97706', action: () => alert('Fitur screen time limit segera hadir.') },
                  { icon: '💬', label: 'Konsultasi', sub: 'Tanya guru', color: '#059669', action: () => setViewMode('modules') },
                ].map((q) => (
                  <button key={q.label} style={S.quickBtn} onClick={q.action}>
                    <div style={S.quickIcon(q.color)}>{q.icon}</div>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{q.label}</span>
                    <span style={{ fontSize: 10, color: '#94a3b8' }}>{q.sub}</span>
                  </button>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </main>

      {/* ── FAB ── */}
      <button style={S.fab} onClick={() => setShowAssignModal(true)}>
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round"/></svg>
        + Beri Tugas / Modul Baru
      </button>

      {/* ── FOOTER ── */}
      <footer style={S.footer}>
        <div style={S.footerInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#5B4DFF', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>P</div>
            <p style={{ fontSize: 12, color: '#64748b', fontWeight: 500, margin: 0 }}>© 2026 <strong>Perpustakaan Belajar</strong>. Platform Edukasi Interaktif Ramah Anak SD & Orang Tua.</p>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            <a href="#" style={S.footerLink}>Pusat Bantuan Orang Tua</a>
            <a href="#" style={S.footerLink}>Panduan Kurikulum Merdeka</a>
            <a href="#" style={S.footerLink}>Kebijakan Privasi Anak</a>
          </div>
        </div>
      </footer>

      {/* ── CREATE CHILD MODAL ── */}
      {showCreateChild && (
        <div style={S.modalOverlay} onClick={() => setShowCreateChild(false)}>
          <div style={S.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>👶 Buat Akun Anak</h3>
              <button onClick={() => setShowCreateChild(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleCreateChild}>
              <label style={{ display: 'block', marginBottom: 12 }}><span style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Nama Lengkap Anak</span><input type='text' value={childForm.name} onChange={(e) => setChildForm((p) => ({ ...p, name: e.target.value }))} required placeholder='Nama lengkap' style={S.input} /></label>
              <label style={{ display: 'block', marginBottom: 12 }}><span style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Email</span><input type='email' value={childForm.email} onChange={(e) => setChildForm((p) => ({ ...p, email: e.target.value }))} required placeholder='anak@email.id' style={S.input} /></label>
              <label style={{ display: 'block', marginBottom: 12 }}><span style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Kata Sandi</span><input type='password' value={childForm.password} onChange={(e) => setChildForm((p) => ({ ...p, password: e.target.value }))} required minLength={6} placeholder='Minimal 6 karakter' style={S.input} /></label>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <label style={{ flex: 1 }}><span style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Kelas</span><select value={childForm.grade} onChange={(e) => setChildForm((p) => ({ ...p, grade: Number(e.target.value) }))} style={S.select}>{grades.map((g) => <option key={g.level} value={g.level}>{g.label}</option>)}</select></label>
                <label style={{ flex: 1 }}><span style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Semester</span><select value={childForm.semester} onChange={(e) => setChildForm((p) => ({ ...p, semester: Number(e.target.value) }))} style={S.select}>{semesters.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></label>
              </div>
              {childError && <p style={{ color: '#dc2626', fontSize: 13, margin: '0 0 8px' }}>{childError}</p>}
              <button type='submit' disabled={childSubmitting} style={{ ...S.btnPrimary, opacity: childSubmitting ? 0.6 : 1 }}>{childSubmitting ? 'Membuat...' : 'Buat Akun Anak'}</button>
            </form>
          </div>
        </div>
      )}

      {/* ── ASSIGN MODULE MODAL ── */}
      {showAssignModal && (
        <div
          style={S.modalOverlay}
          onClick={() => {
            setShowAssignModal(false)
            setAssignSuccess(null)
            setAssignError(null)
          }}
        >
          <div style={S.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>📚 Tugaskan Modul</h3>
              <button onClick={() => { setShowAssignModal(false); setAssignSuccess(null); setAssignError(null) }} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <label style={{ display: 'block', marginBottom: 12 }}><span style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Anak</span><select value={selectedChildId} onChange={(e) => setSelectedChildId(e.target.value)} style={S.select}><option value=''>-- Pilih Anak --</option>{children.map((c) => <option key={c.id} value={c.id}>{c.name} (Kelas {c.grade})</option>)}</select></label>
            {selectedChildId && <label style={{ display: 'block', marginBottom: 12 }}><span style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Mata Pelajaran</span><select value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)} style={S.select}><option value=''>-- Pilih Mata Pelajaran --</option>{subjects.map((s) => <option key={s.id} value={s.id}>{s.icon} {s.shortName}</option>)}</select></label>}
            {selectedChildId && selectedSubjectId && <label style={{ display: 'block', marginBottom: 12 }}><span style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Topik</span><select value={selectedModuleId} onChange={(e) => setSelectedModuleId(e.target.value)} style={S.select}><option value=''>-- Pilih Topik --</option>{availableModules.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}</select></label>}
            {selectedModule && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Pilih Bahasan</span>
                  <button type='button' onClick={toggleAllFrames} style={{ fontSize: 12, color: '#5B4DFF', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>{selectedFrames.length === selectedModule.frames.length ? 'Batalkan Semua' : 'Pilih Semua'}</button>
                </div>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 8, maxHeight: 180, overflowY: 'auto' }}>
                  {selectedModule.frames.map((frame) => (
                    <label key={frame.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8, cursor: 'pointer', background: selectedFrames.includes(frame.id) ? '#F5F3FF' : 'transparent' }}>
                      <input type='checkbox' checked={selectedFrames.includes(frame.id)} onChange={() => toggleFrame(frame.id)} style={{ width: 16, height: 16 }} />
                      <span>{KIND_ICON[frame.kind] ?? '📄'}</span>
                      <span style={{ fontSize: 13 }}>{frame.title}</span>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>({KIND_LABEL[frame.kind] ?? frame.kind})</span>
                    </label>
                  ))}
                </div>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: '4px 0 0' }}>{selectedFrames.length} dari {selectedModule.frames.length} panel dipilih</p>
              </div>
            )}
            {selectedModule && <label style={{ display: 'block', marginBottom: 12 }}><span style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>📅 Deadline</span><input type='datetime-local' value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={S.input} /></label>}
            {assignError && <p style={{ color: '#dc2626', fontSize: 13, margin: '0 0 8px' }}>{assignError}</p>}
            {assignSuccess && <p style={{ color: '#059669', fontSize: 13, fontWeight: 600, margin: '0 0 8px' }}>{assignSuccess}</p>}
            {selectedModule && selectedFrames.length > 0 && <button type='button' disabled={assigning} onClick={handleAssign} style={{ ...S.btnPrimary, opacity: assigning ? 0.6 : 1 }}>{assigning ? 'Menugaskan...' : `Tugaskan ke ${children.find((c) => c.id === selectedChildId)?.name ?? 'Anak'}`}</button>}
          </div>
        </div>
      )}

      {/* ── EDIT ASSIGNMENT MODAL ── */}
      {editingAssignment && (
        <div style={S.modalOverlay} onClick={() => setEditingAssignment(null)}>
          <div style={S.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>✏️ Edit Tugas</h3>
              <button onClick={() => setEditingAssignment(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 4px' }}>Judul</p>
            <p style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>{editingAssignment.title}</p>
            <label style={{ display: 'block', marginBottom: 12 }}><span style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>📅 Deadline</span><input type='date' value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} style={S.input} /></label>
            {editModule && editSelectedFrames.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 6px' }}>Bahasan yang ditugaskan</p>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 8 }}>
                  {editModule.frames.filter((f) => editSelectedFrames.includes(f.id)).map((frame) => (
                    <div key={frame.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', fontSize: 13 }}><span>{KIND_ICON[frame.kind] ?? '📄'}</span><span>{frame.title}</span></div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button type='button' onClick={() => setEditingAssignment(null)} style={{ padding: '10px 20px', border: '1px solid #e2e8f0', borderRadius: 10, background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Batal</button>
              <button type='button' onClick={handleSaveEdit} disabled={editSaving} style={{ padding: '10px 20px', border: 'none', borderRadius: 10, background: '#5B4DFF', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 13, opacity: editSaving ? 0.6 : 1 }}>{editSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
