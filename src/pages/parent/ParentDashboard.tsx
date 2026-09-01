import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../../components/TopBar'
import { useAuth } from '../../context/AuthContext'
import {
  fetchChildren,
  linkChild,
  unlinkChild,
  fetchChildProgress,
  fetchAssignments,
  createAssignment,
  deleteAssignment,
  type ChildInfo,
  type ModuleProgress,
  type ParentAssignment,
} from '../../lib/api'
import { ApiError } from '../../lib/api'

type Tab = 'children' | 'assignments'

export default function ParentDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('children')

  // Children state
  const [children, setChildren] = useState<ChildInfo[]>([])
  const [childrenLoading, setChildrenLoading] = useState(true)
  const [addChildEmail, setAddChildEmail] = useState('')
  const [addChildError, setAddChildError] = useState<string | null>(null)
  const [addChildSubmitting, setAddChildSubmitting] = useState(false)

  // Progress state
  const [selectedChild, setSelectedChild] = useState<ChildInfo | null>(null)
  const [progress, setProgress] = useState<ModuleProgress[]>([])
  const [progressLoading, setProgressLoading] = useState(false)

  // Assignment state
  const [assignments, setAssignments] = useState<ParentAssignment[]>([])
  const [assignmentsLoading, setAssignmentsLoading] = useState(true)
  const [showAssignmentForm, setShowAssignmentForm] = useState(false)
  const [assignmentForm, setAssignmentForm] = useState({
    childId: '',
    title: '',
    description: '',
    dueDate: '',
  })
  const [assignmentError, setAssignmentError] = useState<string | null>(null)
  const [assignmentSubmitting, setAssignmentSubmitting] = useState(false)

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

  // Add child handler
  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddChildError(null)
    setAddChildSubmitting(true)
    try {
      const newChild = await linkChild(addChildEmail)
      setChildren((prev) => [...prev, newChild])
      setAddChildEmail('')
    } catch (err) {
      setAddChildError(
        err instanceof ApiError ? err.message : 'Gagal menambahkan murid.',
      )
    } finally {
      setAddChildSubmitting(false)
    }
  }

  // Remove child handler
  const handleRemoveChild = async (childId: string) => {
    if (!confirm('Yakin ingin menghapus murid ini dari daftar?')) return
    try {
      await unlinkChild(childId)
      setChildren((prev) => prev.filter((c) => c.id !== childId))
      if (selectedChild?.id === childId) {
        setSelectedChild(null)
        setProgress([])
      }
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Gagal menghapus murid.')
    }
  }

  // Create assignment handler
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    setAssignmentError(null)
    setAssignmentSubmitting(true)
    try {
      const newAssignment = await createAssignment({
        childId: assignmentForm.childId,
        title: assignmentForm.title,
        description: assignmentForm.description || undefined,
        dueDate: assignmentForm.dueDate
          ? new Date(assignmentForm.dueDate).toISOString()
          : undefined,
      })
      setAssignments((prev) => [newAssignment, ...prev])
      setAssignmentForm({ childId: '', title: '', description: '', dueDate: '' })
      setShowAssignmentForm(false)
    } catch (err) {
      setAssignmentError(
        err instanceof ApiError ? err.message : 'Gagal membuat tugas.',
      )
    } finally {
      setAssignmentSubmitting(false)
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
          Kelola anak, pantau progres belajar, dan berikan tugas.
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
            {/* Add Child Form */}
            <div className='auth-form' style={{ marginBottom: 24, padding: 16, background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)' }}>
              <h3 style={{ margin: '0 0 12px', fontFamily: 'var(--font-display)' }}>
                Tambah Murid
              </h3>
              <form
                onSubmit={handleAddChild}
                style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}
              >
                <label className='auth-field' style={{ flex: 1, marginBottom: 0 }}>
                  <span>Email Murid</span>
                  <input
                    type='email'
                    value={addChildEmail}
                    onChange={(e) => setAddChildEmail(e.target.value)}
                    required
                    placeholder='murid@sekolah.id'
                    autoComplete='email'
                  />
                </label>
                <button
                  type='submit'
                  className='btn-primary'
                  disabled={addChildSubmitting}
                  style={{ height: 'fit-content' }}
                >
                  {addChildSubmitting ? 'Menambahkan...' : 'Tambah'}
                </button>
              </form>
              {addChildError && (
                <p className='auth-error' style={{ marginTop: 8 }}>{addChildError}</p>
              )}
            </div>

            {/* Children List */}
            {childrenLoading ? (
              <p className='home-empty'>Memuat data anak...</p>
            ) : children.length === 0 ? (
              <p className='home-empty'>
                Belum ada murid yang ditambahkan. Masukkan email murid di atas untuk memulai.
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
                  Progres Belajar: {selectedChild.name}
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
            {/* Create Assignment */}
            <div style={{ marginBottom: 16 }}>
              <button
                type='button'
                className='btn-primary'
                onClick={() => setShowAssignmentForm(!showAssignmentForm)}
              >
                {showAssignmentForm ? 'Batal' : '+ Buat Tugas Baru'}
              </button>
            </div>

            {showAssignmentForm && (
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
                  Tugas Baru
                </h3>
                <form onSubmit={handleCreateAssignment}>
                  <label className='auth-field'>
                    <span>Pilih Murid</span>
                    <select
                      value={assignmentForm.childId}
                      onChange={(e) =>
                        setAssignmentForm((prev) => ({
                          ...prev,
                          childId: e.target.value,
                        }))
                      }
                      required
                    >
                      <option value=''>-- Pilih Murid --</option>
                      {children.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className='auth-field'>
                    <span>Judul Tugas</span>
                    <input
                      type='text'
                      value={assignmentForm.title}
                      onChange={(e) =>
                        setAssignmentForm((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      required
                      placeholder='Contoh: Selesaikan modul Bilangan Cacah'
                    />
                  </label>
                  <label className='auth-field'>
                    <span>Deskripsi (opsional)</span>
                    <input
                      type='text'
                      value={assignmentForm.description}
                      onChange={(e) =>
                        setAssignmentForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder='Detail tambahan untuk tugas'
                    />
                  </label>
                  <label className='auth-field'>
                    <span>Batas Waktu (opsional)</span>
                    <input
                      type='datetime-local'
                      value={assignmentForm.dueDate}
                      onChange={(e) =>
                        setAssignmentForm((prev) => ({
                          ...prev,
                          dueDate: e.target.value,
                        }))
                      }
                    />
                  </label>
                  {assignmentError && (
                    <p className='auth-error'>{assignmentError}</p>
                  )}
                  <button
                    type='submit'
                    className='btn-primary'
                    disabled={assignmentSubmitting}
                  >
                    {assignmentSubmitting ? 'Membuat...' : 'Buat Tugas'}
                  </button>
                </form>
              </div>
            )}

            {/* Assignments List */}
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
                          {a.title}
                        </h4>
                        <p className='module-card-summary' style={{ fontSize: 12 }}>
                          Untuk: {getChildName(a.childId)}
                          {a.description && ` · ${a.description}`}
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
                              ? 'Menunggu'
                              : a.status === 'in_progress'
                                ? 'Dikerjakan'
                                : a.status === 'completed'
                                  ? 'Selesai'
                                  : 'Terlambat'}
                          </span>
                          {a.dueDate &&
                            ` · Deadline: ${new Date(a.dueDate).toLocaleDateString('id-ID')}`}
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
