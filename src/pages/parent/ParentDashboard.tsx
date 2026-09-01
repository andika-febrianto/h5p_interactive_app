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
  fetchSubjects,
  type ChildInfo,
  type ModuleProgress,
  type ParentAssignment,
  type ModuleSummary,
  type Subject,
} from '../../lib/api'
import { ApiError } from '../../lib/api'
import { grades, semesters } from '../../data/grades'

type Tab = 'children' | 'assignments'

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
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [selectedChildId, setSelectedChildId] = useState('')
  const [availableModules, setAvailableModules] = useState<ModuleSummary[]>([])
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
        setAvailableModules([])
      }
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Gagal menghapus anak.')
    }
  }

  // Assign module to child
  const handleAssignModule = async (moduleId: string, moduleTitle: string) => {
    if (!selectedChildId) return
    setAssignError(null)
    setAssignSuccess(null)
    setAssigning(true)
    try {
      await createAssignment({
        childId: selectedChildId,
        title: moduleTitle,
        materialId: moduleId,
      })
      setAssignSuccess(`✓ "${moduleTitle}" berhasil ditugaskan!`)
      // Reload assignments
      const updated = await fetchAssignments()
      setAssignments(updated)
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
            📋 Tugas
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
            {/* Assignment Form: Select Child → Subject → Module → Assign */}
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
                📚 Tugaskan Materi
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                Pilih anak, mata pelajaran, lalu klik "Tugaskan" pada modul yang diinginkan.
              </p>

              {/* Step 1: Select Child */}
              <label className='auth-field'>
                <span>1. Pilih Anak</span>
                <select
                  value={selectedChildId}
                  onChange={(e) => {
                    setSelectedChildId(e.target.value)
                    setSelectedSubjectId('')
                    setAvailableModules([])
                    setAssignError(null)
                    setAssignSuccess(null)
                  }}
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
                  <span>2. Pilih Mata Pelajaran</span>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => {
                      setSelectedSubjectId(e.target.value)
                      setAvailableModules([])
                      setAssignError(null)
                      setAssignSuccess(null)
                    }}
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

              {/* Error/Success messages */}
              {assignError && <p className='auth-error'>{assignError}</p>}
              {assignSuccess && (
                <p style={{ color: 'var(--success)', fontWeight: 600, fontSize: 13, marginTop: 8 }}>
                  {assignSuccess}
                </p>
              )}

              {/* Step 3: Available Modules */}
              {selectedChildId && selectedSubjectId && (
                <div style={{ marginTop: 12 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                    3. Pilih Modul untuk ditugaskan:
                  </p>
                  {availableModules.length === 0 ? (
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      Tidak ada modul tersedia untuk mata pelajaran ini.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {availableModules.map((mod) => (
                        <div
                          key={mod.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '10px 12px',
                            background: 'var(--gray-50)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border)',
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: 600, fontSize: 13 }}>
                              {mod.title}
                            </span>
                            <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginLeft: 8 }}>
                              {mod.estimatedMinutes} · {mod.frameCount} panel
                            </span>
                          </div>
                          <button
                            type='button'
                            className='btn-primary btn-small'
                            disabled={assigning}
                            onClick={() => handleAssignModule(mod.id, mod.title)}
                          >
                            {assigning ? '...' : `Tugaskan ke ${selectedChildInfo?.name ?? 'Anak'}`}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
