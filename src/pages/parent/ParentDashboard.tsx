import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../../components/TopBar'
import { useAuth } from '../../context/AuthContext'
import {
  fetchChildren,
  addChild,
  unlinkChild,
  fetchChildProgress,
  fetchAssignments,
  createAssignment,
  deleteAssignment,
  fetchModules,
  fetchModule,
  fetchSubjects,
  type ChildInfo,
  type ModuleProgress,
  type ParentAssignment,
  type ModuleSummary,
  type Module,
  type Subject,
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
  const [progress, setProgress] = useState<ModuleProgress[]>([])
  const [progressLoading, setProgressLoading] = useState(false)

  // Assignment state
  const [assignments, setAssignments] = useState<ParentAssignment[]>([])
  const [assignmentsLoading, setAssignmentsLoading] = useState(true)
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

  // Load children
  useEffect(() => {
    fetchChildren()
      .then(setChildren)
      .catch(() => setChildren([]))
      .finally(() => setChildrenLoading(false))
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
      setProgress([])
      return
    }
    setProgressLoading(true)
    fetchChildProgress(selectedChild.id)
      .then(setProgress)
      .catch(() => setProgress([]))
      .finally(() => setProgressLoading(false))
  }, [selectedChild])

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
        // Auto-select all frames by default
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
      setChildForm({ name: '', email: '', password: '', grade: 1, semester: 1 })
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
        setProgress([])
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
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
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
      setAssignSuccess(
        `✓ "${selectedModule.title}" (${selectedFrames.length} panel) berhasil ditugaskan ke ${selectedChildInfo?.name ?? 'anak'}!`
      )
      // Reload assignments
      const updated = await fetchAssignments()
      setAssignments(updated)
      // Reset form
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

  // Get selected child info
  const selectedChildInfo = children.find((c) => c.id === selectedChildId)

  return (
    <div className='home-page'>
      <div className='home-inner'>
        <TopBar />
        <button
          type='button'
          className='home-back'
          onClick={() => navigate('/kelas')}
        >
          ← Ke perpustakaan belajar
        </button>

        <p className='home-eyebrow'>Orang Tua · {user?.name}</p>
        <h1 className='home-title'>Dashboard Orang Tua</h1>
        <p className='home-lede'>
          Buat akun anak, tugaskan materi belajar, dan pantau progresnya.
        </p>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <button
            type='button'
            className={activeTab === 'children' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveTab('children')}
          >
            👨‍👩‍👧 Anak Saya
          </button>
          <button
            type='button'
            className={activeTab === 'assignments' ? 'btn-primary' : 'btn-secondary'}
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
                <h3 style={{ margin: '0 0 12px', fontFamily: 'var(--font-display)' }}>
                  Buat Akun Anak
                </h3>
                <form onSubmit={handleCreateChild}>
                  <label className='auth-field'>
                    <span>Nama Lengkap Anak</span>
                    <input
                      type='text'
                      value={childForm.name}
                      onChange={(e) =>
                        setChildForm((prev) => ({ ...prev, name: e.target.value }))
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
                        setChildForm((prev) => ({ ...prev, email: e.target.value }))
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
                        setChildForm((prev) => ({ ...prev, password: e.target.value }))
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
                  {childError && (
                    <p className='auth-error'>{childError}</p>
                  )}
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                        <h3 className='module-card-title'>
                          {child.name}
                        </h3>
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

            {/* Progress Section */}
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
                ) : progress.length === 0 ? (
                  <p className='home-empty'>Belum ada progres belajar.</p>
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                      gap: 12,
                    }}
                  >
                    {progress.map((p) => (
                      <div
                        key={p.moduleId}
                        className='subject-card'
                        style={{ cursor: 'default' }}
                      >
                        <h4 className='module-card-title' style={{ fontSize: 14 }}>
                          {p.title}
                        </h4>
                        <p className='module-card-summary' style={{ fontSize: 12 }}>
                          Selesai: {p.completed}/{p.total} panel
                        </p>
                        <div
                          style={{
                            marginTop: 8,
                            height: 6,
                            borderRadius: 999,
                            background: 'var(--gray-200)',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${p.total > 0 ? (p.completed / p.total) * 100 : 0}%`,
                              background: 'var(--secondary)',
                              borderRadius: 999,
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>
                        <p
                          className='module-card-summary'
                          style={{ fontSize: 11, marginTop: 4 }}
                        >
                          Akurasi: {p.accuracy}%
                        </p>
                      </div>
                    ))}
                  </div>
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
              <h3 style={{ margin: '0 0 12px', fontFamily: 'var(--font-display)' }}>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>
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
                          style={{ width: 16, height: 16 }}
                        />
                        <span style={{ fontSize: 14 }}>
                          {KIND_ICON[frame.kind] ?? '📄'}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>
                          {frame.title}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                          ({KIND_LABEL[frame.kind] ?? frame.kind})
                        </span>
                      </label>
                    ))}
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>
                    {selectedFrames.length} dari {selectedModule.frames.length} panel dipilih
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
                <p style={{ color: 'var(--success)', fontWeight: 600, fontSize: 13, marginTop: 8 }}>
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
            <h3 style={{ margin: '0 0 12px', fontFamily: 'var(--font-display)' }}>
              📋 Daftar Tugas
            </h3>
            {assignmentsLoading ? (
              <p className='home-empty'>Memuat tugas...</p>
            ) : assignments.length === 0 ? (
              <p className='home-empty'>Belum ada tugas yang dibuat.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {assignments.map((a) => (
                  <div
                    key={a.id}
                    className='subject-card'
                    style={{ cursor: 'default' }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                      }}
                    >
                      <div>
                        <h4 className='module-card-title' style={{ fontSize: 14 }}>
                          📖 {a.title}
                        </h4>
                        <p className='module-card-summary' style={{ fontSize: 12 }}>
                          Untuk: {getChildName(a.childId)}
                          {a.selectedFrames && (
                            <> · {a.selectedFrames.length} panel</>
                          )}
                        </p>
                        <p
                          className='module-card-summary'
                          style={{ fontSize: 11, marginTop: 4 }}
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
                          {a.dueDate && (
                            <>
                              {' · Deadline: '}
                              {new Date(a.dueDate).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </>
                          )}
                        </p>
                      </div>
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
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
