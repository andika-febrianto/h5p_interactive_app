import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../../components/TopBar'
import { useAuth } from '../../context/AuthContext'
import {
  fetchChildren,
  addChild,
  unlinkChild,
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

type Tab = 'children' | 'assignments'

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

export default function ParentDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('children')



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

  // Edit assignment state
  const [editingAssignment, setEditingAssignment] = useState<ParentAssignment | null>(null)
  const [editDueDate, setEditDueDate] = useState('')
  const [editSelectedFrames, setEditSelectedFrames] = useState<string[]>([])
  const [editModule, setEditModule] = useState<Module | null>(null)
  const [editSaving, setEditSaving] = useState(false)

  // Load children
  useEffect(() => {
    fetchChildren()
      .then(setChildren)
      .catch(() => setChildren([]))
      .finally(() => setChildrenLoading(false))
  }, [])

  // Trigger scheduled notification checks on load
  useEffect(() => {
    checkDeadlines().catch(() => {})
    generateWeeklyReport().catch(() => {})
    generateMonthlyReport().catch(() => {})
  }, [])

  // Load assignments
  useEffect(() => {
    fetchAssignments()
      .then(setAssignments)
      .catch(() => setAssignments([]))
      .finally(() => setAssignmentsLoading(false))
  }, [])

  // Load subjects on mount
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

    // Load assignment-level progress for this child
    const childAssignments = assignments.filter(
      (a) => a.childId === selectedChild.id,
    )

    if (childAssignments.length === 0) {
      setProgressLoading(false)
      return
    }

    const fetches: Promise<unknown>[] = []
    childAssignments.forEach((a) => {
      if (a.materialId) {
        // Load module if not cached
        if (!moduleCache[a.materialId]) {
          fetches.push(
            fetchModule(a.materialId)
              .then((mod) =>
                setModuleCache((prev) => ({
                  ...prev,
                  [a.materialId!]: mod,
                })),
              )
              .catch(() => {}),
          )
        }
        // Load frame progress
        fetches.push(
          fetchChildModuleProgress(selectedChild.id, a.materialId)
            .then((frames) => {
              const map: Record<string, FrameProgress> = {}
              frames.forEach((f) => {
                map[f.frameSlug] = f
              })
              setAssignmentProgress((prev) => ({
                ...prev,
                [a.materialId!]: map,
              }))
            })
            .catch(() => {}),
        )
      }
    })
    Promise.all(fetches).finally(() => setProgressLoading(false))
  }, [selectedChild, assignments])

  // Load available modules when child and subject are selected
  useEffect(() => {
    if (!selectedChildId || !selectedSubjectId) {
      setAvailableModules([])
      return
    }
    const child = children.find((c) => c.id === selectedChildId)
    if (child?.grade && child?.semester) {
      fetchModules({
        grade: child.grade,
        semester: child.semester,
        subjectId: selectedSubjectId,
      })
        .then(setAvailableModules)
        .catch(() => setAvailableModules([]))
    }
  }, [selectedChildId, selectedSubjectId, children])

  // Load module details when module is selected
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

  // Reset assignment form when child or subject changes
  useEffect(() => {
    setSelectedModuleId('')
    setSelectedModule(null)
    setSelectedFrames([])
    setDueDate('')
    setAssignError(null)
    setAssignSuccess(null)
  }, [selectedChildId, selectedSubjectId])

  // Create child account handler
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
      setChildForm({
        name: '',
        email: '',
        password: '',
        grade: 1,
        semester: 1,
      })
      setShowCreateChild(false)
    } catch (err) {
      setChildError(
        err instanceof ApiError ? err.message : 'Gagal membuat akun anak.',
      )
    } finally {
      setChildSubmitting(false)
    }
  }

  // Remove child handler
  const handleRemoveChild = async (childId: string) => {
    if (!confirm('Yakin ingin menghapus anak ini dari daftar?')) return
    try {
      await unlinkChild(childId)
      setChildren((prev) => prev.filter((c) => c.id !== childId))
      if (selectedChild?.id === childId) {
        setSelectedChild(null)
        setAssignmentProgress({})
      }
      if (selectedChildId === childId) {
        setSelectedChildId('')
        setSelectedSubjectId('')
        setSelectedModuleId('')
        setSelectedModule(null)
        setSelectedFrames([])
      }
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Gagal menghapus anak.')
    }
  }

  // Toggle frame selection
  const toggleFrame = (id: string) => {
    setSelectedFrames((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    )
  }

  // Select all / deselect all frames
  const toggleAllFrames = () => {
    if (!selectedModule) return
    if (selectedFrames.length === selectedModule.frames.length) {
      setSelectedFrames([])
    } else {
      setSelectedFrames(selectedModule.frames.map((f) => f.id))
    }
  }

  // Assign module to child with selected frames
  const handleAssign = async () => {
    if (!selectedChildId || !selectedModule || selectedFrames.length === 0)
      return
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
      setAssignSuccess(
        `✓ "${selectedModule.title}" (${selectedFrames.length} panel) berhasil ditugaskan ke ${selectedChildInfo?.name ?? 'anak'}!`,
      )
      const updated = await fetchAssignments()
      setAssignments(updated)
      setSelectedModuleId('')
      setSelectedModule(null)
      setSelectedFrames([])
      setDueDate('')
    } catch (err) {
      setAssignError(
        err instanceof ApiError ? err.message : 'Gagal menugaskan modul.',
      )
    } finally {
      setAssigning(false)
    }
  }

  // Delete assignment handler
  const handleDeleteAssignment = async (id: string) => {
    if (!confirm('Yakin ingin menghapus tugas ini?')) return
    try {
      await deleteAssignment(id)
      setAssignments((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Gagal menghapus tugas.')
    }
  }

  // Find child name by id
  const getChildName = (childId: string) =>
    children.find((c) => c.id === childId)?.name ?? childId

  // Load questions for a child's assignments
  const loadChildQuestions = useCallback(
    async (childId: string) => {
      const childAssignments = assignments.filter((a) => a.childId === childId)
      const allQuestions: Record<string, Question[]> = {}
      await Promise.all(
        childAssignments.map(async (a) => {
          try {
            const qs = await fetchAssignmentQuestions(a.id)
            allQuestions[a.id] = qs
          } catch {
            allQuestions[a.id] = []
          }
        }),
      )
      setQuestions(allQuestions)
    },
    [assignments],
  )

  // Load questions when child is selected for progress
  useEffect(() => {
    if (selectedChild) {
      loadChildQuestions(selectedChild.id)
    }
  }, [selectedChild, loadChildQuestions])

  // Handle save edit assignment
  const handleSaveEdit = async () => {
    if (!editingAssignment) return
    setEditSaving(true)
    try {
      await updateAssignment(editingAssignment.id, {
        dueDate: editDueDate || undefined,
        status: editingAssignment.status,
      })
      // Update local state
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === editingAssignment.id
            ? { ...a, dueDate: editDueDate ? new Date(editDueDate).toISOString() : a.dueDate }
            : a,
        ),
      )
      setEditingAssignment(null)
    } catch {
      // silently fail
    } finally {
      setEditSaving(false)
    }
  }

  // Handle reply to question
  const handleReply = async (questionId: string) => {
    const text = replyText[questionId]
    if (!text?.trim()) return
    setSendingReply(questionId)
    try {
      await replyToQuestion(questionId, text.trim())
      setReplyText((prev) => ({ ...prev, [questionId]: '' }))
      // Reload questions
      if (selectedChild) {
        await loadChildQuestions(selectedChild.id)
      }
    } catch {
      // Silently fail
    } finally {
      setSendingReply(null)
    }
  }

  // Get frame progress for a specific assignment
  const getFrameProgressForAssignment = (
    materialId: string | null,
    frameSlug: string,
  ): FrameProgress | null => {
    if (!materialId) return null
    return assignmentProgress[materialId]?.[frameSlug] ?? null
  }

  // Get assignment completion percentage
  const getAssignmentCompletion = (
    assignment: ParentAssignment,
  ): { completed: number; total: number; pct: number } => {
    if (!assignment.selectedFrames || !assignment.materialId)
      return { completed: 0, total: 0, pct: 0 }
    const total = assignment.selectedFrames.length
    let completed = 0
    assignment.selectedFrames.forEach((frameId) => {
      const fp = getFrameProgressForAssignment(assignment.materialId, frameId)
      if (fp?.completed) completed++
    })
    return {
      completed,
      total,
      pct: total > 0 ? Math.round((completed / total) * 100) : 0,
    }
  }

  // Get selected child info
  const selectedChildInfo = children.find((c) => c.id === selectedChildId)

  return (
    <div className='home-page'>
      <div className='home-inner'>
        <TopBar />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <button
              type='button'
              className='home-back'
              onClick={() => navigate('/kelas')}
            >
              ← Ke perpustakaan belajar
            </button>
            <p className='home-eyebrow'>Orang Tua · {user?.name}</p>
            <h1 className='home-title'>Dashboard Orang Tua</h1>
          </div>

        </div>
        <p className='home-lede'>
          Buat akun anak, tugaskan materi belajar, dan pantau progresnya.
        </p>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <button
            type='button'
            className={
              activeTab === 'children' ? 'btn-primary' : 'btn-secondary'
            }
            onClick={() => setActiveTab('children')}
          >
            👨‍👩‍👧 Anak Saya
          </button>
          <button
            type='button'
            className={
              activeTab === 'assignments' ? 'btn-primary' : 'btn-secondary'
            }
            onClick={() => setActiveTab('assignments')}
          >
            📋 Buat Tugas
          </button>
        </div>

        {/* Children Tab */}
        {activeTab === 'children' && (
          <div>
            {/* Create Child Account Button */}
            <div style={{ marginBottom: 16 }}>
              <button
                type='button'
                className='btn-primary'
                onClick={() => setShowCreateChild(!showCreateChild)}
              >
                {showCreateChild ? 'Batal' : '+ Buat Akun Anak Baru'}
              </button>
            </div>

            {/* Create Child Account Form */}
            {showCreateChild && (
              <div
                className='auth-form'
                style={{
                  marginBottom: 24,
                  padding: 16,
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <h3
                  style={{
                    margin: '0 0 12px',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  Buat Akun Anak
                </h3>
                <form onSubmit={handleCreateChild}>
                  <label className='auth-field'>
                    <span>Nama Lengkap Anak</span>
                    <input
                      type='text'
                      value={childForm.name}
                      onChange={(e) =>
                        setChildForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      required
                      placeholder='Nama lengkap anak'
                    />
                  </label>
                  <label className='auth-field'>
                    <span>Email (untuk login anak)</span>
                    <input
                      type='email'
                      value={childForm.email}
                      onChange={(e) =>
                        setChildForm((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      required
                      placeholder='anak@sekolah.id'
                    />
                  </label>
                  <label className='auth-field'>
                    <span>Kata Sandi</span>
                    <input
                      type='password'
                      value={childForm.password}
                      onChange={(e) =>
                        setChildForm((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      required
                      minLength={6}
                      placeholder='Minimal 6 karakter'
                    />
                  </label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <label className='auth-field' style={{ flex: 1 }}>
                      <span>Kelas</span>
                      <select
                        value={childForm.grade}
                        onChange={(e) =>
                          setChildForm((prev) => ({
                            ...prev,
                            grade: Number(e.target.value),
                          }))
                        }
                        required
                      >
                        {grades.map((g) => (
                          <option key={g.level} value={g.level}>
                            {g.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className='auth-field' style={{ flex: 1 }}>
                      <span>Semester</span>
                      <select
                        value={childForm.semester}
                        onChange={(e) =>
                          setChildForm((prev) => ({
                            ...prev,
                            semester: Number(e.target.value),
                          }))
                        }
                        required
                      >
                        {semesters.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  {childError && <p className='auth-error'>{childError}</p>}
                  <button
                    type='submit'
                    className='btn-primary'
                    disabled={childSubmitting}
                  >
                    {childSubmitting ? 'Membuat...' : 'Buat Akun Anak'}
                  </button>
                </form>
              </div>
            )}

            {/* Children List */}
            {childrenLoading ? (
              <p className='home-empty'>Memuat data anak...</p>
            ) : children.length === 0 ? (
              <p className='home-empty'>
                Belum ada akun anak. Klik "Buat Akun Anak Baru" untuk memulai.
              </p>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}
              >
                {children.map((child) => (
                  <div
                    key={child.id}
                    className='subject-card'
                    style={{
                      cursor: 'pointer',
                      borderColor:
                        selectedChild?.id === child.id
                          ? 'var(--primary)'
                          : 'var(--border)',
                    }}
                    onClick={() =>
                      setSelectedChild(
                        selectedChild?.id === child.id ? null : child,
                      )
                    }
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <h3 className='module-card-title'>{child.name}</h3>
                        <p className='module-card-summary'>
                          {child.email}
                          {child.grade && ` · Kelas ${child.grade}`}
                          {child.semester && ` · Semester ${child.semester}`}
                        </p>
                      </div>
                      <button
                        type='button'
                        className='btn-secondary btn-small'
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveChild(child.id)
                        }}
                        style={{ fontSize: 12 }}
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Assignment Progress Section (when child is selected) */}
            {selectedChild && (
              <div style={{ marginTop: 24 }}>
                <h3
                  style={{
                    margin: '0 0 12px',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  📊 Progres Belajar: {selectedChild.name}
                </h3>
                {progressLoading ? (
                  <p className='home-empty'>Memuat progres...</p>
                ) : (
                  (() => {
                    const childAssignments = assignments.filter(
                      (a) => a.childId === selectedChild.id,
                    )
                    if (childAssignments.length === 0) {
                      return (
                        <p className='home-empty'>
                          Belum ada tugas untuk anak ini.
                        </p>
                      )
                    }
                    return (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 16,
                        }}
                      >
                        {childAssignments.map((a) => {
                          const mod = a.materialId
                            ? moduleCache[a.materialId]
                            : null
                          const completion = getAssignmentCompletion(a)
                          const selectedFrameIds = a.selectedFrames ?? []
                          const frames =
                            mod?.frames?.filter((f) =>
                              selectedFrameIds.includes(f.id),
                            ) ?? []

                          return (
                            <div
                              key={a.id}
                              className='subject-card'
                              style={{ cursor: 'default' }}
                            >
                              {/* Assignment header */}
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'flex-start',
                                  marginBottom: 8,
                                }}
                              >
                                <div>
                                  <h4
                                    className='module-card-title'
                                    style={{
                                      fontSize: 15,
                                      margin: 0,
                                    }}
                                  >
                                    📖 {a.title}
                                  </h4>
                                  <p
                                    className='module-card-summary'
                                    style={{
                                      fontSize: 12,
                                      marginTop: 4,
                                    }}
                                  >
                                    {completion.completed}/{completion.total}{' '}
                                    bahasan selesai
                                  </p>
                                </div>
                                <span
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color:
                                      completion.pct === 100
                                        ? 'var(--success)'
                                        : 'var(--primary)',
                                  }}
                                >
                                  {completion.pct}%
                                </span>
                              </div>

                              {/* Overall progress bar */}
                              <div
                                style={{
                                  height: 8,
                                  borderRadius: 999,
                                  background: 'var(--gray-200)',
                                  overflow: 'hidden',
                                  marginBottom: 14,
                                }}
                              >
                                <div
                                  style={{
                                    height: '100%',
                                    width: `${completion.pct}%`,
                                    background:
                                      completion.pct === 100
                                        ? 'var(--success)'
                                        : 'var(--primary)',
                                    borderRadius: 999,
                                    transition: 'width 0.4s ease',
                                  }}
                                />
                              </div>

                              {/* Per-frame progress */}
                              {frames.length > 0 && (
                                <div
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 6,
                                    borderTop: '1px solid var(--border)',
                                    paddingTop: 10,
                                  }}
                                >
                                  {frames.map((frame) => {
                                    const fp = getFrameProgressForAssignment(
                                      a.materialId,
                                      frame.id,
                                    )
                                    const isCompleted = fp?.completed ?? false
                                    const accuracy = fp?.accuracy ?? 0
                                    const framePct = isCompleted
                                      ? 100
                                      : fp
                                        ? fp.total > 0
                                          ? Math.round(
                                              (fp.correct / fp.total) * 100,
                                            )
                                          : 0
                                        : 0

                                    return (
                                      <div
                                        key={frame.id}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 10,
                                          padding: '6px 0',
                                        }}
                                      >
                                        {/* Icon */}
                                        <span
                                          style={{
                                            fontSize: 14,
                                            width: 20,
                                            textAlign: 'center',
                                          }}
                                        >
                                          {isCompleted
                                            ? '✅'
                                            : (KIND_ICON[frame.kind] ?? '📄')}
                                        </span>

                                        {/* Title + bar */}
                                        <div
                                          style={{
                                            flex: 1,
                                          }}
                                        >
                                          <div
                                            style={{
                                              display: 'flex',
                                              justifyContent: 'space-between',
                                              marginBottom: 3,
                                            }}
                                          >
                                            <span
                                              style={{
                                                fontSize: 13,
                                                fontWeight: 500,
                                                color: 'var(--text-primary)',
                                              }}
                                            >
                                              {frame.title}
                                            </span>
                                            <span
                                              style={{
                                                fontSize: 11,
                                                fontWeight: 600,
                                                color: isCompleted
                                                  ? 'var(--success)'
                                                  : 'var(--text-secondary)',
                                              }}
                                            >
                                              {isCompleted
                                                ? accuracy > 0
                                                  ? `${accuracy}%`
                                                  : '✓ Selesai'
                                                : framePct > 0
                                                  ? `${framePct}%`
                                                  : '—'}
                                            </span>
                                          </div>
                                          {/* Mini progress bar */}
                                          <div
                                            style={{
                                              height: 4,
                                              borderRadius: 999,
                                              background: 'var(--gray-200)',
                                              overflow: 'hidden',
                                            }}
                                          >
                                            <div
                                              style={{
                                                height: '100%',
                                                width: `${framePct}%`,
                                                background: isCompleted
                                                  ? 'var(--success)'
                                                  : 'var(--primary)',
                                                borderRadius: 999,
                                                transition: 'width 0.3s ease',
                                              }}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  })}
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
        )}

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div>
            {/* Assignment Form */}
            <div
              className='auth-form'
              style={{
                marginBottom: 24,
                padding: 16,
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <h3
                style={{
                  margin: '0 0 12px',
                  fontFamily: 'var(--font-display)',
                }}
              >
                📚 Buat Tugas
              </h3>

              {/* Step 1: Select Child */}
              <label className='auth-field'>
                <span>Anak</span>
                <select
                  value={selectedChildId}
                  onChange={(e) => setSelectedChildId(e.target.value)}
                >
                  <option value=''>-- Pilih Anak --</option>
                  {children.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Kelas {c.grade} / Semester {c.semester})
                    </option>
                  ))}
                </select>
              </label>

              {/* Step 2: Select Subject */}
              {selectedChildId && (
                <label className='auth-field'>
                  <span>Mata Pelajaran</span>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                  >
                    <option value=''>-- Pilih Mata Pelajaran --</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.icon} {s.shortName}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {/* Step 3: Select Module (Topik) */}
              {selectedChildId && selectedSubjectId && (
                <label className='auth-field'>
                  <span>Topik</span>
                  <select
                    value={selectedModuleId}
                    onChange={(e) => setSelectedModuleId(e.target.value)}
                  >
                    <option value=''>-- Pilih Topik --</option>
                    {availableModules.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {/* Step 4: Select Frames (Bahasan) */}
              {selectedModule && (
                <div style={{ marginTop: 12 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      Pilih Bahasan
                    </span>
                    <button
                      type='button'
                      onClick={toggleAllFrames}
                      style={{
                        fontSize: 12,
                        color: 'var(--primary)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      {selectedFrames.length === selectedModule.frames.length
                        ? 'Batalkan Semua'
                        : 'Pilih Semua'}
                    </button>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      padding: 12,
                      background: 'var(--gray-50)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {selectedModule.frames.map((frame) => (
                      <label
                        key={frame.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '6px 8px',
                          cursor: 'pointer',
                          borderRadius: 'var(--radius-sm)',
                          background: selectedFrames.includes(frame.id)
                            ? 'var(--primary-bg)'
                            : 'transparent',
                        }}
                      >
                        <input
                          type='checkbox'
                          checked={selectedFrames.includes(frame.id)}
                          onChange={() => toggleFrame(frame.id)}
                          style={{
                            width: 16,
                            height: 16,
                          }}
                        />
                        <span style={{ fontSize: 14 }}>
                          {KIND_ICON[frame.kind] ?? '📄'}
                        </span>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                          }}
                        >
                          {frame.title}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            color: 'var(--text-secondary)',
                          }}
                        >
                          ({KIND_LABEL[frame.kind] ?? frame.kind})
                        </span>
                      </label>
                    ))}
                  </div>
                  <p
                    style={{
                      fontSize: 11,
                      color: 'var(--text-secondary)',
                      marginTop: 6,
                    }}
                  >
                    {selectedFrames.length} dari {selectedModule.frames.length}{' '}
                    panel dipilih
                  </p>
                </div>
              )}

              {/* Step 5: Deadline */}
              {selectedModule && (
                <label className='auth-field' style={{ marginTop: 12 }}>
                  <span>Deadline</span>
                  <input
                    type='datetime-local'
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </label>
              )}

              {/* Error/Success messages */}
              {assignError && <p className='auth-error'>{assignError}</p>}
              {assignSuccess && (
                <p
                  style={{
                    color: 'var(--success)',
                    fontWeight: 600,
                    fontSize: 13,
                    marginTop: 8,
                  }}
                >
                  {assignSuccess}
                </p>
              )}

              {/* Assign button */}
              {selectedModule && selectedFrames.length > 0 && (
                <button
                  type='button'
                  className='btn-primary'
                  disabled={assigning}
                  onClick={handleAssign}
                  style={{ marginTop: 12 }}
                >
                  {assigning
                    ? 'Menugaskan...'
                    : `Tugaskan ke ${selectedChildInfo?.name ?? 'Anak'}`}
                </button>
              )}
            </div>

            {/* Existing Assignments List */}
            <h3
              style={{
                margin: '0 0 12px',
                fontFamily: 'var(--font-display)',
              }}
            >
              📋 Daftar Tugas
            </h3>
            {assignmentsLoading ? (
              <p className='home-empty'>Memuat tugas...</p>
            ) : assignments.length === 0 ? (
              <p className='home-empty'>Belum ada tugas yang dibuat.</p>
            ) : (
              <>
                {/* Search & Sort */}
                <div
                  style={{
                    display: 'flex',
                    gap: 10,
                    marginBottom: 16,
                    flexWrap: 'wrap',
                  }}
                >
                  <input
                    type='text'
                    value={taskSearchQuery}
                    onChange={(e) => setTaskSearchQuery(e.target.value)}
                    placeholder='🔍 Cari tugas...'
                    style={{
                      flex: 1,
                      minWidth: 180,
                      fontFamily: 'var(--font-body)',
                      fontSize: 14,
                      padding: '10px 14px',
                      border: '2px solid var(--gray-200)',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--white)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--primary)'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124, 107, 255, 0.12)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--gray-200)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                  <select
                    value={taskSortOrder}
                    onChange={(e) => setTaskSortOrder(e.target.value as typeof taskSortOrder)}
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 14,
                      padding: '10px 14px',
                      border: '2px solid var(--gray-200)',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--white)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      outline: 'none',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--primary)'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124, 107, 255, 0.12)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--gray-200)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <option value='newest'>Terbaru</option>
                    <option value='oldest'>Terlama</option>
                    <option value='deadline'>Deadline</option>
                    <option value='status'>Status</option>
                    <option value='child'>Anak</option>
                  </select>
                </div>

                {/* Filtered & Sorted */}
                {(() => {
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
                    return (
                      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px 0', fontSize: 14 }}>
                        Tidak ada tugas yang cocok dengan pencarian.
                      </p>
                    )
                  }
                  return (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                      }}
                    >
                      {filtered.map((a) => {
                        const completion = getAssignmentCompletion(a)

                  // Deadline-based card color
                  const now = new Date()
                  const isCompleted = a.status === 'completed'
                  let cardBg = ''
                  let cardBorder = ''
                  if (isCompleted) {
                    // Completed = white/default
                  } else if (a.status === 'overdue') {
                    // Overdue
                    cardBg = 'rgba(239, 68, 68, 0.06)'
                    cardBorder = '1.5px solid #ef4444'
                  } else if (a.dueDate) {
                    const due = new Date(a.dueDate)
                    const hoursLeft = (due.getTime() - now.getTime()) / (1000 * 60 * 60)
                    if (hoursLeft < 0) {
                      cardBg = 'rgba(239, 68, 68, 0.06)'
                      cardBorder = '1.5px solid #ef4444'
                    } else if (hoursLeft <= 24) {
                      cardBg = 'rgba(245, 158, 11, 0.06)'
                      cardBorder = '1.5px solid #f59e0b'
                    }
                  }

                  return (
                    <div
                      key={a.id}
                      className='subject-card'
                      style={{
                        cursor: 'default',
                        ...(cardBg ? { background: cardBg } : {}),
                        ...(cardBorder ? { border: cardBorder } : {}),
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <h4
                            className='module-card-title'
                            style={{ fontSize: 16 }}
                          >
                            📖 {a.title}
                          </h4>
                          <p
                            className='module-card-summary'
                            style={{ fontSize: 14 }}
                          >
                            Untuk: {getChildName(a.childId)}
                            {a.selectedFrames && (
                              <> · {a.selectedFrames.length} panel</>
                            )}
                          </p>
                          <p
                            className='module-card-summary'
                            style={{
                              fontSize: 13,
                              marginTop: 4,
                            }}
                          >
                            Status:{' '}
                            <span
                              style={{
                                color:
                                  a.status === 'completed'
                                    ? 'var(--success)'
                                    : a.status === 'overdue'
                                      ? 'var(--error)'
                                      : 'var(--text-secondary)',
                                fontWeight: 600,
                              }}
                            >
                              {a.status === 'pending'
                                ? '⏳ Menunggu'
                                : a.status === 'in_progress'
                                  ? '📝 Dikerjakan'
                                  : a.status === 'completed'
                                    ? '✅ Selesai'
                                    : '⚠️ Terlambat'}
                            </span>
                            {(() => {
                              const aq = questions[a.id] ?? []
                              const unreplied = aq.filter((q) => !q.reply)
                              if (unreplied.length > 0) {
                                return (
                                  <span
                                    style={{
                                      marginLeft: 8,
                                      fontSize: 12,
                                      color: '#f59e0b',
                                      fontWeight: 600,
                                    }}
                                  >
                                    ❓ {unreplied.length} pertanyaan belum
                                    dibalas
                                  </span>
                                )
                              }
                              return null
                            })()}
                            {a.dueDate && (
                              <>
                                {' · Deadline: '}
                                {new Date(a.dueDate).toLocaleDateString(
                                  'id-ID',
                                  {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                  },
                                )}
                              </>
                            )}
                          </p>

                          {/* Progress for this assignment */}
                          {completion.total > 0 && (
                            <div
                              style={{
                                marginTop: 8,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                              }}
                            >
                              <div
                                style={{
                                  flex: 1,
                                  height: 6,
                                  borderRadius: 999,
                                  background: 'var(--gray-200)',
                                  overflow: 'hidden',
                                  maxWidth: 120,
                                }}
                              >
                                <div
                                  style={{
                                    height: '100%',
                                    width: `${completion.pct}%`,
                                    background:
                                      completion.pct === 100
                                        ? 'var(--success)'
                                        : 'var(--primary)',
                                    borderRadius: 999,
                                  }}
                                />
                              </div>
                              <span
                                style={{
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color:
                                    completion.pct === 100
                                      ? 'var(--success)'
                                      : 'var(--text-secondary)',
                                }}
                              >
                                {completion.completed}/{completion.total}
                              </span>
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <button
                            type='button'
                            className='btn-secondary btn-small'
                            onClick={() => {
                              setEditingAssignment(a)
                              setEditDueDate(
                                a.dueDate
                                  ? new Date(a.dueDate).toISOString().split('T')[0]
                                  : '',
                              )
                              setEditSelectedFrames(
                                (a.selectedFrames as string[]) ?? [],
                              )
                              // Load module for frame editing
                              if (a.materialId) {
                                const cached = moduleCache[a.materialId]
                                if (cached) {
                                  setEditModule(cached)
                                } else {
                                  fetchModule(a.materialId)
                                    .then((mod) => setEditModule(mod))
                                    .catch(() => setEditModule(null))
                                }
                              }
                            }}
                            style={{ fontSize: 12 }}
                          >
                            Edit
                          </button>
                          <button
                            type='button'
                            className='btn-secondary btn-small'
                            onClick={() => handleDeleteAssignment(a.id)}
                            style={{ fontSize: 12 }}
                          >
                            Hapus
                          </button>
                        </div>
                      </div>

                      {/* Questions & Reply Section */}
                      {questions[a.id] && questions[a.id].length > 0 && (
                        <div
                          style={{
                            marginTop: 12,
                            paddingTop: 12,
                            borderTop: '1px solid var(--border)',
                          }}
                        >
                          <p
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              marginBottom: 8,
                            }}
                          >
                            💬 Pertanyaan dari {getChildName(a.childId)}:
                          </p>
                          {questions[a.id].map((q) => (
                            <div
                              key={q.id}
                              style={{
                                padding: 10,
                                background: 'var(--gray-50)',
                                borderRadius: 'var(--radius-sm)',
                                marginBottom: 8,
                              }}
                            >
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: 12,
                                  fontWeight: 500,
                                }}
                              >
                                ❓ {q.question}
                              </p>
                              <p
                                style={{
                                  margin: '4px 0 0',
                                  fontSize: 10,
                                  color: 'var(--text-tertiary)',
                                }}
                              >
                                {new Date(q.createdAt).toLocaleString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                              {q.reply ? (
                                <div
                                  style={{
                                    marginTop: 6,
                                    paddingLeft: 12,
                                    borderLeft: '2px solid var(--success)',
                                  }}
                                >
                                  <p
                                    style={{
                                      margin: 0,
                                      fontSize: 12,
                                      color: 'var(--success)',
                                    }}
                                  >
                                    💬 {q.reply}
                                  </p>
                                  <p
                                    style={{
                                      margin: '2px 0 0',
                                      fontSize: 10,
                                      color: 'var(--text-tertiary)',
                                    }}
                                  >
                                    {new Date(q.repliedAt!).toLocaleString(
                                      'id-ID',
                                      {
                                        day: 'numeric',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      },
                                    )}
                                  </p>
                                </div>
                              ) : (
                                <div
                                  style={{
                                    marginTop: 6,
                                    display: 'flex',
                                    gap: 8,
                                  }}
                                >
                                  <input
                                    type='text'
                                    value={replyText[q.id] ?? ''}
                                    onChange={(e) =>
                                      setReplyText((prev) => ({
                                        ...prev,
                                        [q.id]: e.target.value,
                                      }))
                                    }
                                    placeholder='Balas pertanyaan...'
                                    style={{
                                      flex: 1,
                                      padding: '6px 10px',
                                      border: '1px solid var(--border)',
                                      borderRadius: 'var(--radius-sm)',
                                      fontSize: 12,
                                    }}
                                    onKeyDown={(e) => {
                                      if (
                                        e.key === 'Enter' &&
                                        sendingReply !== q.id
                                      ) {
                                        handleReply(q.id)
                                      }
                                    }}
                                  />
                                  <button
                                    type='button'
                                    className='btn-primary btn-small'
                                    onClick={() => handleReply(q.id)}
                                    disabled={
                                      sendingReply === q.id ||
                                      !replyText[q.id]?.trim()
                                    }
                                    style={{ fontSize: 11 }}
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
              )})()}
              </>
            )}
          </div>
        )}

        {/* Edit Assignment Modal */}
        {editingAssignment && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000,
            }}
            onClick={() => setEditingAssignment(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                padding: 24,
                width: '90%',
                maxWidth: 520,
                maxHeight: '80vh',
                overflowY: 'auto',
                boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  ✏️ Edit Tugas
                </h3>
                <button
                  type='button'
                  onClick={() => setEditingAssignment(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: 20,
                    cursor: 'pointer',
                    padding: 4,
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Title (read-only) */}
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
                  Judul
                </p>
                <p style={{ fontSize: 14, fontWeight: 600, margin: '4px 0 0' }}>
                  {editingAssignment.title}
                </p>
              </div>

              {/* For (read-only) */}
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
                  Untuk
                </p>
                <p style={{ fontSize: 14, fontWeight: 600, margin: '4px 0 0' }}>
                  {getChildName(editingAssignment.childId)}
                </p>
              </div>

              {/* Deadline */}
              <label className='auth-field' style={{ marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>📅 Deadline</span>
                <input
                  type='date'
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                />
              </label>

              {/* Selected Frames (read-only view, show what's selected) */}
              {editModule && editSelectedFrames.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 8px' }}>
                    Bahasan yang ditugaskan
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      padding: 10,
                      background: 'var(--gray-50)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                    }}>
                    {editModule.frames
                      .filter((f) => editSelectedFrames.includes(f.id))
                      .map((frame) => (
                        <div
                          key={frame.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '4px 8px',
                            fontSize: 13,
                          }}
                        >
                          <span>{KIND_ICON[frame.kind] ?? '📄'}</span>
                          <span>{frame.title}</span>
                        </div>
                      ))}
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                    {editSelectedFrames.length} bahasan dipilih
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
                <button
                  type='button'
                  className='btn-secondary'
                  onClick={() => setEditingAssignment(null)}
                  style={{ fontSize: 13 }}
                >
                  Batal
                </button>
                <button
                  type='button'
                  className='btn-primary'
                  onClick={handleSaveEdit}
                  disabled={editSaving}
                  style={{ fontSize: 13 }}
                >
                  {editSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
