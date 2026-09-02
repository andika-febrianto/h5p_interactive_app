import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../../components/TopBar'
import { useAuth } from '../../context/AuthContext'
import {
  fetchChildAssignments,
  fetchModule,
  fetchChildModuleProgress,
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  fetchAssignmentQuestions,
  askQuestion,
  markAssignmentStarted,
  checkStudentNotifications,
  type ParentAssignment,
  type Module,
  type FrameProgress,
  type Notification,
  type Question,
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

  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)

  // Questions
  const [expandedAssignment, setExpandedAssignment] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Record<string, Question[]>>({})
  const [newQuestion, setNewQuestion] = useState('')
  const [sendingQuestion, setSendingQuestion] = useState(false)

  // Load assignments
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

  // Load notifications
  const loadNotifications = useCallback(() => {
    if (!user?.id) return
    fetchNotifications()
      .then(setNotifications)
      .catch(() => setNotifications([]))
    fetchUnreadCount()
      .then((data) => setUnreadCount(data.count))
      .catch(() => setUnreadCount(0))
  }, [user?.id])

  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 30000) // Poll every 30s
    // Trigger student notification checks on load
    checkStudentNotifications().catch(() => {})
    return () => clearInterval(interval)
  }, [loadNotifications])

  // Load questions when assignment is expanded
  const loadQuestions = useCallback(async (assignmentId: string) => {
    try {
      const data = await fetchAssignmentQuestions(assignmentId)
      setQuestions((prev) => ({ ...prev, [assignmentId]: data }))
    } catch {
      setQuestions((prev) => ({ ...prev, [assignmentId]: [] }))
    }
  }, [])

  useEffect(() => {
    if (expandedAssignment) {
      loadQuestions(expandedAssignment)
    }
  }, [expandedAssignment, loadQuestions])

  // Handle notification click
  const handleNotificationClick = async (notif: Notification) => {
    await markNotificationRead(notif.id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)),
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
    if (notif.assignmentId) {
      // Navigate to the assignment's module if it has a materialId
      const assignment = assignments.find((a) => a.id === notif.assignmentId)
      if (assignment?.materialId) {
        navigate(`/modul/${assignment.materialId}?assignment=${notif.assignmentId}`)
      }
    }
  }

  // Handle marking all notifications as read
  const handleMarkAllRead = async () => {
    await markAllNotificationsRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  // Handle sending a question
  const handleSendQuestion = async (assignmentId: string) => {
    if (!newQuestion.trim()) return
    setSendingQuestion(true)
    try {
      await askQuestion(assignmentId, newQuestion.trim())
      setNewQuestion('')
      await loadQuestions(assignmentId)
    } catch {
      // Silently fail
    } finally {
      setSendingQuestion(false)
    }
  }

  // Handle starting assignment
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

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <p className='home-eyebrow'>Halo, {user?.name}! 👋</p>
            <h1 className='home-title'>Tugas Saya</h1>
          </div>

          {/* Notification Bell */}
          <div style={{ position: 'relative' }}>
            <button
              type='button'
              onClick={() => setShowNotifications(!showNotifications)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 24,
                cursor: 'pointer',
                position: 'relative',
                padding: 8,
              }}
            >
              🔔
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    background: 'var(--error)',
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 700,
                    borderRadius: '50%',
                    width: 18,
                    height: 18,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  width: 340,
                  maxHeight: 400,
                  overflowY: 'auto',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                  zIndex: 100,
                  marginTop: 8,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Notifikasi</h4>
                  {unreadCount > 0 && (
                    <button
                      type='button'
                      onClick={handleMarkAllRead}
                      style={{
                        fontSize: 11,
                        color: 'var(--primary)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Tandai semua dibaca
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <p style={{ padding: 16, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
                    Belum ada notifikasi
                  </p>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      style={{
                        padding: '10px 16px',
                        borderBottom: '1px solid var(--border)',
                        cursor: 'pointer',
                        background: notif.read ? 'transparent' : 'rgba(59, 130, 246, 0.05)',
                        borderLeft: notif.read ? '3px solid transparent' : '3px solid var(--primary)',
                      }}
                    >
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {(() => {
                          const icons: Record<string, string> = {
                            // Student notifications (12)
                            new_assignment: '📚',
                            new_module_available: '✨',
                            continue_learning: '📖',
                            assignment_almost_due: '⏰',
                            assignment_completed_child: '🎉',
                            perfect_score: '🏆',
                            badge_earned: '🥇',
                            study_streak: '🔥',
                            streak_lost: '💤',
                            achievement_unlocked: '⭐',
                            encouragement: '💪',
                            daily_reminder: '📅',
                            // Parent-originated
                            parent_reply: '💬',
                            assignment_created: '📚',
                            child_started: '📝',
                            child_completed: '✅',
                            high_score: '🌟',
                            low_score: '⚠️',
                            child_account_created: '🎉',
                            no_activity: '😴',
                            deadline_approaching: '⏰',
                            assignment_overdue: '🚨',
                            weekly_report: '📊',
                            monthly_report: '🏆',
                            new_badge: '🥇',
                            child_question: '❓',
                          }
                          return icons[notif.type] ?? '📢'
                        })()}{' '}
                        {notif.title}
                      </p>
                      <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-secondary)' }}>
                        {notif.message}
                      </p>
                      <p style={{ margin: '4px 0 0', fontSize: 10, color: 'var(--text-tertiary)' }}>
                        {new Date(notif.createdAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

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
              const isExpanded = expandedAssignment === a.id
              const assignmentQuestions = questions[a.id] ?? []

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

                            <span style={{ fontSize: 16, flexShrink: 0 }}>
                              {KIND_ICON[frame.kind] ?? '📄'}
                            </span>

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
                    <div style={{ display: 'flex', gap: 8 }}>
                      {/* Question button */}
                      <button
                        type='button'
                        className='btn-secondary btn-small'
                        onClick={() =>
                          setExpandedAssignment(isExpanded ? null : a.id)
                        }
                        style={{ fontSize: 12 }}
                      >
                        💬 Tanya Orang Tua ({assignmentQuestions.length})
                      </button>
                      {a.materialId && progress.pct < 100 && (
                        <button
                          type='button'
                          className='btn-primary btn-small'
                          onClick={() => handleStartAssignment(a)}
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

                  {/* Questions Section */}
                  {isExpanded && (
                    <div
                      style={{
                        marginTop: 14,
                        padding: 16,
                        background: 'var(--gray-50)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>
                        💬 Pertanyaan ke Orang Tua
                      </h4>

                      {/* Existing questions */}
                      {assignmentQuestions.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                          {assignmentQuestions.map((q) => (
                            <div
                              key={q.id}
                              style={{
                                padding: 12,
                                background: '#fff',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border)',
                              }}
                            >
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                                ❓ {q.question}
                              </p>
                              {q.reply ? (
                                <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--success)', paddingLeft: 16, borderLeft: '2px solid var(--success)' }}>
                                  💬 {q.reply}
                                  <span style={{ fontSize: 10, color: 'var(--text-tertiary)', marginLeft: 8 }}>
                                    {new Date(q.repliedAt!).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </p>
                              ) : (
                                <p style={{ margin: '8px 0 0', fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                  Menunggu balasan...
                                </p>
                              )}
                              <p style={{ margin: '4px 0 0', fontSize: 10, color: 'var(--text-tertiary)' }}>
                                {new Date(q.createdAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Ask question form */}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          type='text'
                          value={newQuestion}
                          onChange={(e) => setNewQuestion(e.target.value)}
                          placeholder='Ketik pertanyaan ke orang tua...'
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 13,
                            background: '#fff',
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !sendingQuestion) {
                              handleSendQuestion(a.id)
                            }
                          }}
                        />
                        <button
                          type='button'
                          className='btn-primary btn-small'
                          onClick={() => handleSendQuestion(a.id)}
                          disabled={sendingQuestion || !newQuestion.trim()}
                          style={{ fontSize: 12 }}
                        >
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
    </div>
  )
}
