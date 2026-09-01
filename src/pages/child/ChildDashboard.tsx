import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../../components/TopBar'
import { useAuth } from '../../context/AuthContext'
import {
  fetchChildAssignments,
  fetchModule,
  type ParentAssignment,
  type Module,
} from '../../lib/api'

const KIND_LABEL: Record<string, string> = {
  text: 'Baca Materi',
  quiz: 'Kerjakan Kuis',
  dragdrop: 'Latihan Drag & Drop',
  video: 'Tonton Video',
  pdf: 'Baca Dokumen',
  shortanswer: 'Kerjakan Latihan',
}

const KIND_ICON: Record<string, string> = {
  text: '📄',
  quiz: '❓',
  dragdrop: '🧩',
  video: '🎬',
  pdf: '📕',
  shortanswer: '✏️',
}

export default function ChildDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Assignments state
  const [assignments, setAssignments] = useState<ParentAssignment[]>([])
  const [assignmentsLoading, setAssignmentsLoading] = useState(true)

  // Module details for assignments
  const [moduleCache, setModuleCache] = useState<Record<string, Module>>({})

  // Load assignments for this child
  useEffect(() => {
    if (!user?.id) return
    fetchChildAssignments(user.id)
      .then((data) => {
        setAssignments(data)
        // Pre-fetch module details for assignments with materialId
        data.forEach((a) => {
          if (a.materialId && !moduleCache[a.materialId]) {
            fetchModule(a.materialId)
              .then((mod) => setModuleCache((prev) => ({ ...prev, [a.materialId!]: mod })))
              .catch(() => {})
          }
        })
      })
      .catch(() => setAssignments([]))
      .finally(() => setAssignmentsLoading(false))
  }, [user?.id])

  // Count stats
  const pendingCount = assignments.filter((a) => a.status === 'pending').length
  const inProgressCount = assignments.filter((a) => a.status === 'in_progress').length
  const completedCount = assignments.filter((a) => a.status === 'completed').length

  // Get filtered frames for an assignment
  const getFilteredFrames = (assignment: ParentAssignment) => {
    const mod = assignment.materialId ? moduleCache[assignment.materialId] : null
    if (!mod) return []
    if (!assignment.selectedFrames || assignment.selectedFrames.length === 0) {
      return mod.frames // Show all frames if none selected
    }
    return mod.frames.filter((f) => assignment.selectedFrames!.includes(f.id))
  }

  return (
    <div className='home-page'>
      <div className='home-inner'>
        <TopBar />

        <p className='home-eyebrow'>Halo, {user?.name}! 👋</p>
        <h1 className='home-title'>Tugas Belajarku</h1>
        <p className='home-lede'>
          Kerjakan tugas yang diberikan orang tuamu, atau mulai belajar mandiri.
        </p>

        {/* Stats */}
        {assignments.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: 12,
              marginBottom: 24,
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                flex: 1,
                minWidth: 120,
                padding: '12px 16px',
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                textAlign: 'center',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--warning)' }}>
                {pendingCount}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Menunggu
              </div>
            </div>
            <div
              style={{
                flex: 1,
                minWidth: 120,
                padding: '12px 16px',
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                textAlign: 'center',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary)' }}>
                {inProgressCount}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Dikerjakan
              </div>
            </div>
            <div
              style={{
                flex: 1,
                minWidth: 120,
                padding: '12px 16px',
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                textAlign: 'center',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--success)' }}>
                {completedCount}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Selesai
              </div>
            </div>
          </div>
        )}

        {/* Assignments */}
        {assignmentsLoading ? (
          <p className='home-empty'>Memuat tugas...</p>
        ) : assignments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ fontSize: 48, marginBottom: 12 }}>📝</p>
            <p className='home-empty' style={{ marginBottom: 16 }}>
              Belum ada tugas dari orang tua.
            </p>
            <button
              type='button'
              className='btn-primary'
              onClick={() => {
                if (user?.grade && user?.semester) {
                  navigate(`/kelas/${user.grade}/semester/${user.semester}`)
                } else {
                  navigate('/kelas')
                }
              }}
            >
              Mulai Belajar Mandiri
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {assignments.map((a) => {
              const filteredFrames = getFilteredFrames(a)

              return (
                <div
                  key={a.id}
                  className='subject-card'
                  style={{
                    cursor: a.materialId ? 'pointer' : 'default',
                    borderColor:
                      a.status === 'completed'
                        ? 'var(--success)'
                        : 'var(--border)',
                  }}
                  onClick={() => {
                    if (a.materialId) {
                      navigate(`/modul/${a.materialId}`)
                    }
                  }}
                >
                  <div style={{ flex: 1 }}>
                    {/* Assignment Title */}
                    <h4 className='module-card-title' style={{ fontSize: 15 }}>
                      {a.status === 'completed' ? '✅ ' : a.status === 'in_progress' ? '📝 ' : '⏳ '}
                      {a.title}
                    </h4>

                    {/* Frame-based tasks list */}
                    {filteredFrames.length > 0 && (
                      <div style={{ marginTop: 10, marginBottom: 8 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                          Yang harus dikerjakan:
                        </p>
                        {filteredFrames.map((frame, i) => (
                          <div
                            key={frame.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              padding: '5px 0',
                              fontSize: 13,
                              color: 'var(--text-primary)',
                            }}
                          >
                            <span style={{ fontSize: 14 }}>
                              {KIND_ICON[frame.kind] ?? '📄'}
                            </span>
                            <span>
                              {i + 1}. {KIND_LABEL[frame.kind] ?? frame.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Status */}
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
                          ? 'Menunggu dikerjakan'
                          : a.status === 'in_progress'
                            ? 'Sedang dikerjakan'
                            : a.status === 'completed'
                              ? 'Selesai dikerjakan'
                              : 'Terlambat'}
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

                  {/* Start button */}
                  {a.materialId && (
                    <button
                      type='button'
                      className='btn-primary btn-small'
                      style={{ fontSize: 12, flexShrink: 0 }}
                    >
                      Kerjakan →
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
