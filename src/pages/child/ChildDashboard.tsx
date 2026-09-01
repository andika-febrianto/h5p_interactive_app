import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../../components/TopBar'
import { useAuth } from '../../context/AuthContext'
import {
  fetchChildAssignments,
  type ParentAssignment,
} from '../../lib/api'

type Tab = 'assignments' | 'browse'

export default function ChildDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('assignments')

  // Assignments state
  const [assignments, setAssignments] = useState<ParentAssignment[]>([])
  const [assignmentsLoading, setAssignmentsLoading] = useState(true)

  // Load assignments for this child
  useEffect(() => {
    if (!user?.id) return
    fetchChildAssignments(user.id)
      .then(setAssignments)
      .catch(() => setAssignments([]))
      .finally(() => setAssignmentsLoading(false))
  }, [user?.id])

  // Count stats
  const pendingCount = assignments.filter((a) => a.status === 'pending').length
  const inProgressCount = assignments.filter((a) => a.status === 'in_progress').length
  const completedCount = assignments.filter((a) => a.status === 'completed').length

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

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <button
            type='button'
            className={activeTab === 'assignments' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveTab('assignments')}
          >
            📋 Tugas dari Orang Tua
          </button>
          <button
            type='button'
            className={activeTab === 'browse' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => {
              setActiveTab('browse')
              if (user?.grade && user?.semester) {
                navigate(`/kelas/${user.grade}/semester/${user.semester}`)
              } else {
                navigate('/kelas')
              }
            }}
          >
            📚 Belajar Mandiri
          </button>
        </div>

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {assignments.map((a) => (
                  <div
                    key={a.id}
                    className='subject-card'
                    style={{
                      cursor: a.materialId ? 'pointer' : 'default',
                      borderColor:
                        a.status === 'completed'
                          ? 'var(--success)'
                          : a.status === 'overdue'
                            ? 'var(--error)'
                            : 'var(--border)',
                    }}
                    onClick={() => {
                      if (a.materialId) {
                        navigate(`/modul/${a.materialId}`)
                      }
                    }}
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
                          {a.status === 'completed' ? '✅ ' : a.status === 'in_progress' ? '📝 ' : '⏳ '}
                          {a.title}
                        </h4>
                        {a.description && (
                          <p className='module-card-summary' style={{ fontSize: 12 }}>
                            {a.description}
                          </p>
                        )}
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
                      {a.materialId && (
                        <button
                          type='button'
                          className='btn-primary btn-small'
                          style={{ fontSize: 12 }}
                        >
                          Kerjakan →
                        </button>
                      )}
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
