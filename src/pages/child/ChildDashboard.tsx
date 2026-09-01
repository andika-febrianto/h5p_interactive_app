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
import { getSubjectById } from '../../data/subjects'

export default function ChildDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [assignments, setAssignments] = useState<ParentAssignment[]>([])
  const [assignmentsLoading, setAssignmentsLoading] = useState(true)
  const [moduleCache, setModuleCache] = useState<Record<string, Module>>({})

  useEffect(() => {
    if (!user?.id) return
    fetchChildAssignments(user.id)
      .then((data) => {
        setAssignments(data)
        data.forEach((a) => {
          if (a.materialId && !moduleCache[a.materialId]) {
            fetchModule(a.materialId)
              .then((mod) =>
                setModuleCache((prev) => ({
                  ...prev,
                  [a.materialId!]: mod,
                })),
              )
              .catch(() => {})
          }
        })
      })
      .catch(() => setAssignments([]))
      .finally(() => setAssignmentsLoading(false))
  }, [user?.id])

  const getFilteredFrames = (assignment: ParentAssignment) => {
    const mod = assignment.materialId ? moduleCache[assignment.materialId] : null
    if (!mod) return []
    if (!assignment.selectedFrames || assignment.selectedFrames.length === 0) {
      return mod.frames
    }
    return mod.frames.filter((f) => assignment.selectedFrames!.includes(f.id))
  }

  const getSubjectName = (subjectId?: string | null) => {
    if (!subjectId) return ''
    const sub = getSubjectById(subjectId)
    return sub?.shortName || sub?.name || subjectId
  }

  return (
    <div className='home-page'>
      <div className='home-inner'>
        <TopBar />

        <p className='home-eyebrow'>Halo, {user?.name}! 👋</p>
        <h1 className='home-title'>Tugas Saya</h1>

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
                  navigate(
                    `/kelas/${user.grade}/semester/${user.semester}`,
                  )
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
              const mod = a.materialId ? moduleCache[a.materialId] : null
              const subjectName = getSubjectName(mod?.subjectId)
              const topicName = mod?.title || a.title
              const statusIcon =
                a.status === 'completed'
                  ? '✅'
                  : a.status === 'in_progress'
                    ? '📝'
                    : '⏳'
              const statusLabel =
                a.status === 'completed'
                  ? 'Selesai'
                  : a.status === 'in_progress'
                    ? 'Sedang dikerjakan'
                    : 'Menunggu dikerjakan'

              return (
                <div
                  key={a.id}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 20,
                  }}
                >
                  {/* Header: subject + topic */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                    }}
                  >
                    <span style={{ fontSize: 28 }}>📚</span>
                    <div style={{ flex: 1 }}>
                      {subjectName && (
                        <p
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: 'var(--primary)',
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                            marginBottom: 2,
                          }}
                        >
                          {subjectName}
                        </p>
                      )}
                      <h3
                        style={{
                          fontSize: 17,
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          margin: 0,
                        }}
                      >
                        {topicName}
                      </h3>
                    </div>
                  </div>

                  {/* Meta: from + deadline */}
                  <div
                    style={{
                      display: 'flex',
                      gap: 16,
                      marginTop: 10,
                      fontSize: 13,
                      color: 'var(--text-secondary)',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span>
                      👤 Dari:{' '}
                      <strong style={{ color: 'var(--text-primary)' }}>
                        {a.parentId ? 'Orang Tua' : 'Sistem'}
                      </strong>
                    </span>
                    {a.dueDate && (
                      <span>
                        📅 Deadline:{' '}
                        <strong style={{ color: 'var(--text-primary)' }}>
                          {new Date(a.dueDate).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </strong>
                      </span>
                    )}
                    <span>{filteredFrames.length} bahasan</span>
                  </div>

                  {/* Frames checklist */}
                  {filteredFrames.length > 0 && (
                    <div
                      style={{
                        marginTop: 14,
                        borderTop: '1px solid var(--border)',
                        paddingTop: 12,
                      }}
                    >
                      {filteredFrames.map((frame) => (
                        <div
                          key={frame.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '6px 0',
                            fontSize: 14,
                            color: 'var(--text-primary)',
                          }}
                        >
                          <span style={{ opacity: 0.4, fontSize: 16 }}>☐</span>
                          <span>{frame.title}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Status + Kerjakan button */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 14,
                      paddingTop: 12,
                      borderTop: '1px solid var(--border)',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        color:
                          a.status === 'completed'
                            ? 'var(--success)'
                            : 'var(--text-secondary)',
                        fontWeight: 600,
                      }}
                    >
                      {statusIcon} {statusLabel}
                    </span>
                    {a.materialId && a.status !== 'completed' && (
                      <button
                        type='button'
                        className='btn-primary btn-small'
                        onClick={() =>
                          navigate(`/modul/${a.materialId}?assignment=${a.id}`)
                        }
                      >
                        Kerjakan →
                      </button>
                    )}
                    {a.materialId && a.status === 'completed' && (
                      <button
                        type='button'
                        className='btn-secondary btn-small'
                        onClick={() =>
                          navigate(`/modul/${a.materialId}?assignment=${a.id}`)
                        }
                      >
                        Tinjau Ulang →
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
