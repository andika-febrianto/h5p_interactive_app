import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../../components/TopBar'
import { useAuth } from '../../context/AuthContext'
import {
  fetchChildAssignments,
  fetchModule,
  fetchChildModuleProgress,
  type ParentAssignment,
  type Module,
  type FrameProgress,
} from '../../lib/api'
import { getSubjectById } from '../../data/subjects'

const KIND_ICON: Record<string, string> = {
  text: '📖',
  quiz: '📝',
  dragdrop: '🧩',
  video: '🎬',
  pdf: '📕',
  shortanswer: '✏️',
}

export default function ChildDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [assignments, setAssignments] = useState<ParentAssignment[]>([])
  const [assignmentsLoading, setAssignmentsLoading] = useState(true)
  const [moduleCache, setModuleCache] = useState<Record<string, Module>>({})
  const [progressCache, setProgressCache] = useState<
    Record<string, Record<string, FrameProgress>>
  >({})

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

            // Fetch frame-level progress for this module
            fetchChildModuleProgress(user.id!, a.materialId)
              .then((frames) => {
                const map: Record<string, FrameProgress> = {}
                frames.forEach((f) => {
                  map[f.frameSlug] = f
                })
                setProgressCache((prev) => ({
                  ...prev,
                  [a.materialId!]: map,
                }))
              })
              .catch(() => {})
          }
        })
      })
      .catch(() => setAssignments([]))
      .finally(() => setAssignmentsLoading(false))
  }, [user?.id])

  const getFilteredFrames = (assignment: ParentAssignment) => {
    const mod = assignment.materialId
      ? moduleCache[assignment.materialId]
      : null
    if (!mod) return []
    if (
      !assignment.selectedFrames ||
      assignment.selectedFrames.length === 0
    ) {
      return mod.frames
    }
    return mod.frames.filter((f) =>
      assignment.selectedFrames!.includes(f.id),
    )
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
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {assignments.map((a) => {
              const filteredFrames = getFilteredFrames(a)
              const mod = a.materialId
                ? moduleCache[a.materialId]
                : null
              const subjectName = getSubjectName(mod?.subjectId)
              const topicName = mod?.title || a.title
              const progress = getAssignmentProgress(a)

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
                      <strong
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {a.parentId ? 'Orang Tua' : 'Sistem'}
                      </strong>
                    </span>
                    {a.dueDate && (
                      <span>
                        📅 Deadline:{' '}
                        <strong
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {new Date(
                            a.dueDate,
                          ).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </strong>
                      </span>
                    )}
                    <span>
                      {progress.completed}/{progress.total}{' '}
                      bahasan selesai
                    </span>
                  </div>

                  {/* Progress Bar */}
                  {filteredFrames.length > 0 && (
                    <div style={{ marginTop: 14 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 6,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: 'var(--text-secondary)',
                          }}
                        >
                          Progress
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color:
                              progress.pct === 100
                                ? 'var(--success)'
                                : 'var(--primary)',
                          }}
                        >
                          {progress.pct}%
                        </span>
                      </div>
                      <div
                        style={{
                          height: 8,
                          borderRadius: 999,
                          background: 'var(--gray-200)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${progress.pct}%`,
                            background:
                              progress.pct === 100
                                ? 'var(--success)'
                                : 'var(--primary)',
                            borderRadius: 999,
                            transition: 'width 0.4s ease',
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Frames list with per-frame progress */}
                  {filteredFrames.length > 0 && (
                    <div
                      style={{
                        marginTop: 14,
                        borderTop: '1px solid var(--border)',
                        paddingTop: 12,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      {filteredFrames.map((frame, idx) => {
                        const fp = getFrameProgress(
                          a.materialId,
                          frame.id,
                        )
                        const isCompleted = fp?.completed ?? false
                        const accuracy = fp?.accuracy ?? 0

                        return (
                          <div
                            key={frame.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              padding: '8px 10px',
                              borderRadius: 'var(--radius-sm)',
                              background: isCompleted
                                ? 'rgba(16, 185, 129, 0.08)'
                                : 'transparent',
                              border: isCompleted
                                ? '1px solid rgba(16, 185, 129, 0.2)'
                                : '1px solid transparent',
                            }}
                          >
                            {/* Step number */}
                            <span
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 11,
                                fontWeight: 700,
                                background: isCompleted
                                  ? 'var(--success)'
                                  : 'var(--gray-200)',
                                color: isCompleted
                                  ? '#fff'
                                  : 'var(--text-secondary)',
                                flexShrink: 0,
                              }}
                            >
                              {isCompleted ? '✓' : idx + 1}
                            </span>

                            {/* Icon */}
                            <span style={{ fontSize: 16, flexShrink: 0 }}>
                              {KIND_ICON[frame.kind] ?? '📄'}
                            </span>

                            {/* Title */}
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 500,
                                color: 'var(--text-primary)',
                                flex: 1,
                                textDecoration: isCompleted
                                  ? 'line-through'
                                  : 'none',
                                opacity: isCompleted ? 0.7 : 1,
                              }}
                            >
                              {frame.title}
                            </span>

                            {/* Accuracy badge */}
                            {isCompleted && accuracy > 0 && (
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  color:
                                    accuracy >= 80
                                      ? 'var(--success)'
                                      : accuracy >= 60
                                        ? '#f59e0b'
                                        : 'var(--error)',
                                  background:
                                    accuracy >= 80
                                      ? 'rgba(16, 185, 129, 0.1)'
                                      : accuracy >= 60
                                        ? 'rgba(245, 158, 11, 0.1)'
                                        : 'rgba(239, 68, 68, 0.1)',
                                  padding: '2px 8px',
                                  borderRadius: 999,
                                }}
                              >
                                {accuracy}%
                              </span>
                            )}
                          </div>
                        )
                      })}
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
                          progress.pct === 100
                            ? 'var(--success)'
                            : progress.pct > 0
                              ? 'var(--primary)'
                              : 'var(--text-secondary)',
                        fontWeight: 600,
                      }}
                    >
                      {progress.pct === 100
                        ? '✅ Selesai'
                        : progress.pct > 0
                          ? `📝 ${progress.pct}% selesai`
                          : '⏳ Menunggu dikerjakan'}
                    </span>
                    {a.materialId && progress.pct < 100 && (
                      <button
                        type='button'
                        className='btn-primary btn-small'
                        onClick={() =>
                          navigate(
                            `/modul/${a.materialId}?assignment=${a.id}`,
                          )
                        }
                      >
                        {progress.pct > 0 ? 'Lanjutkan →' : 'Kerjakan →'}
                      </button>
                    )}
                    {a.materialId && progress.pct === 100 && (
                      <button
                        type='button'
                        className='btn-secondary btn-small'
                        onClick={() =>
                          navigate(
                            `/modul/${a.materialId}?assignment=${a.id}`,
                          )
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
