import { useState, useMemo } from 'react'
import {
  type ChildInfo,
  type ParentAssignment,
  type Subject,
  type ModuleSummary,
  type Module,
  type FrameProgress,
} from '../../lib/api'

// ── Design Tokens ──
const C = {
  brand50: '#EEF2FF',
  brand100: '#E0E7FF',
  brand500: '#6366F1',
  brand600: '#5B4DFF',
  brand700: '#4F46E5',
  brandPurple: '#5B4AE4',
  emerald700: '#047857',
  emerald800: '#065F46',
  white: '#FFFFFF',
  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1E293B',
  slate900: '#0F172A',
  emerald50: '#ECFDF5',
  emerald100: '#D1FAE5',
  emerald500: '#10B981',
  emerald600: '#059669',
  amber50: '#FFFBEB',
  amber100: '#FEF3C7',
  amber500: '#F59E0B',
  amber600: '#D97706',
  amber700: '#B45309',
  rose50: '#FFF1F2',
  rose100: '#FFE4E6',
  rose200: '#FECDD3',
  rose500: '#F43F5E',
  rose600: '#E11D48',
  rose700: '#BE123C',
  red50: '#FEF2F2',
  red100: '#FEE2E2',
  red200: '#FECACA',
  red500: '#EF4444',
  red600: '#DC2626',
  red700: '#B91C1C',
  blue50: '#EFF6FF',
  blue100: '#DBEAFE',
  blue500: '#3B82F6',
  blue600: '#2563EB',
  blue700: '#1D4ED8',
  indigo50: '#EEF2FF',
  indigo100: '#E0E7FF',
  indigo500: '#6366F1',
}

const FF = '"Plus Jakarta Sans", system-ui, sans-serif'

// ── Props ──
interface JadwalTugasProps {
  children: ChildInfo[]
  selectedChildIdx: number
  onChildChange: (idx: number) => void
  assignments: ParentAssignment[]
  subjects: Subject[]
  modules: ModuleSummary[]
  moduleCache: Record<string, Module>
  assignmentProgress: Record<string, Record<string, FrameProgress>>
}

// ── Helper: get subject for a materialId ──
function getSubjectForAssignment(
  materialId: string | null,
  modules: ModuleSummary[],
  subjects: Subject[],
): Subject | undefined {
  if (!materialId) return undefined
  const mod = modules.find((m) => m.id === materialId)
  if (!mod) return undefined
  return subjects.find((s) => s.id === mod.subjectId)
}

// ── Helper: compute score from progress ──
function computeScore(
  assignmentId: string,
  assignmentProgress: Record<string, Record<string, FrameProgress>>,
): number | null {
  const progress = assignmentProgress[assignmentId]
  if (!progress || Object.keys(progress).length === 0) return null
  let totalCorrect = 0
  let totalQuestions = 0
  for (const frame of Object.values(progress)) {
    totalCorrect += frame.correct
    totalQuestions += frame.total
  }
  if (totalQuestions === 0) return null
  return Math.round((totalCorrect / totalQuestions) * 100)
}

// ── Helper: days until due ──
function daysUntilDue(dueDate: string | null): number | null {
  if (!dueDate) return null
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

// ── Helper: format date in Indonesian ──
function formatDateID(dateStr: string): string {
  const d = new Date(dateStr)
  const day = d.getDate()
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`
}

// ── Helper: get month label ──
function getMonthLabel(dateStr: string): string {
  const d = new Date(dateStr)
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  return months[d.getMonth()]
}

type TaskStatus = 'overdue' | 'upcoming-tomorrow' | 'upcoming-week' | 'completed' | 'upcoming-far' | 'no-date'

interface ScheduleTask {
  assignment: ParentAssignment
  subject?: Subject
  score: number | null
  status: TaskStatus
  daysUntil: number | null
  dateLabel: string
  childName: string
}

function classifyTask(
  a: ParentAssignment,
): TaskStatus {
  if (a.status === 'completed') return 'completed'
  const days = daysUntilDue(a.dueDate)
  if (days !== null && days < 0) return 'overdue'
  if (days !== null && days === 0) return 'upcoming-tomorrow'
  if (days !== null && days <= 7) return 'upcoming-week'
  if (days !== null && days > 7) return 'upcoming-far'
  if (!a.dueDate) return 'no-date'
  return 'upcoming-far'
}

function getStatusBadge(status: TaskStatus): { bg: string; border: string; text: string; label: string } {
  switch (status) {
    case 'overdue':
      return { bg: '#FFF5F5', border: '#FED7D7', text: '#DC2626', label: 'Perlu Perhatian / Terlambat' }
    case 'upcoming-tomorrow':
      return { bg: '#FFFBEB', border: '#FDE68A', text: '#D97706', label: 'Besok' }
    case 'upcoming-week':
      return { bg: '#EFF6FF', border: '#BFDBFE', text: '#2563EB', label: 'Mendatang' }
    case 'completed':
      return { bg: '#ECFDF5', border: '#A7F3D0', text: '#059669', label: 'Selesai' }
    case 'upcoming-far':
      return { bg: '#F8FAFC', border: '#E2E8F0', text: '#475569', label: 'Mendatang' }
    default:
      return { bg: '#F8FAFC', border: '#E2E8F0', text: '#475569', label: 'Tidak ada tenggat' }
  }
}

// ── Main Component ──
export default function JadwalTugas({
  children: childrenData,
  selectedChildIdx,
  assignments,
  subjects,
  modules,
  assignmentProgress,
}: JadwalTugasProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [childFilter, setChildFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const perPage = 8

  // Build schedule tasks
  const scheduleTasks = useMemo((): ScheduleTask[] => {
    return assignments.map((a) => {
      const subject = getSubjectForAssignment(a.materialId, modules, subjects)
      const score = computeScore(a.id, assignmentProgress)
      const status = classifyTask(a)
      const days = daysUntilDue(a.dueDate)
      const dateLabel = a.dueDate
        ? formatDateID(a.dueDate)
        : a.createdAt
        ? formatDateID(a.createdAt)
        : '-'
      const childName = a.child?.name ?? childrenData.find((c) => c.id === a.childId)?.name ?? 'Anak'
      return { assignment: a, subject, score, status, daysUntil: days, dateLabel, childName }
    })
  }, [assignments, modules, subjects, assignmentProgress, childrenData])

  // Filter by child selection
  const activeChildId = childrenData[selectedChildIdx]?.id
  const filteredByChild = useMemo(() => {
    if (childFilter === 'all') return scheduleTasks
    if (childFilter === 'selected') return scheduleTasks.filter((t) => t.assignment.childId === activeChildId)
    return scheduleTasks.filter((t) => t.assignment.childId === childFilter)
  }, [scheduleTasks, childFilter, activeChildId])

  // Filter by status
  const filteredByStatus = useMemo(() => {
    if (statusFilter === 'all') return filteredByChild
    return filteredByChild.filter((t) => t.status === statusFilter)
  }, [filteredByChild, statusFilter])

  // Filter by search
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return filteredByStatus
    const q = searchQuery.toLowerCase()
    return filteredByStatus.filter(
      (t) =>
        t.assignment.title.toLowerCase().includes(q) ||
        t.subject?.name?.toLowerCase().includes(q) ||
        t.childName.toLowerCase().includes(q),
    )
  }, [filteredByStatus, searchQuery])

  // Sort: overdue first, then by days until due
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const order: Record<TaskStatus, number> = {
        overdue: 0,
        'upcoming-tomorrow': 1,
        'upcoming-week': 2,
        'upcoming-far': 3,
        'no-date': 4,
        completed: 5,
      }
      const diff = order[a.status] - order[b.status]
      if (diff !== 0) return diff
      const aDays = a.daysUntil ?? 999
      const bDays = b.daysUntil ?? 999
      return aDays - bDays
    })
  }, [filtered])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage))
  const safePage = Math.min(page, totalPages)
  const paginated = sorted.slice((safePage - 1) * perPage, safePage * perPage)

  // Stats
  const stats = useMemo(() => {
    const active = scheduleTasks.filter((t) => t.assignment.childId === activeChildId)
    const overdue = active.filter((t) => t.status === 'overdue').length
    const upcoming = active.filter((t) => t.status.startsWith('upcoming') || t.status === 'no-date').length
    const completed = active.filter((t) => t.status === 'completed').length
    const totalWithDue = active.filter((t) => t.daysUntil !== null).length
    const completedOnTime = active.filter(
      (t) => t.status === 'completed' && t.daysUntil !== null && t.daysUntil >= 0,
    ).length
    const compliance = totalWithDue > 0 ? Math.round((completedOnTime / totalWithDue) * 100) : 100
    return { overdue, upcoming, completed, compliance }
  }, [scheduleTasks, activeChildId])

  // Quick filter counts
  const quickFilterCounts = useMemo(() => {
    const active = childFilter === 'all' ? scheduleTasks : scheduleTasks.filter((t) => {
      if (childFilter === 'selected') return t.assignment.childId === activeChildId
      return t.assignment.childId === childFilter
    })
    return {
      all: active.length,
      overdue: active.filter((t) => t.status === 'overdue').length,
      thisWeek: active.filter((t) => t.status === 'upcoming-tomorrow' || t.status === 'upcoming-week').length,
    }
  }, [scheduleTasks, childFilter, activeChildId])

  // Get active child name for display
  const activeChildName = childrenData[selectedChildIdx]?.name?.split(' ')[0] ?? 'Anak'

  // Reset page on filter change
  const handleFilterChange = (setter: (v: string) => void) => (v: string) => {
    setter(v)
    setPage(1)
  }

  return (
    <div style={{ fontFamily: FF, maxWidth: 1100, margin: '0 auto' }}>
      {/* ── Quick Overview Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {/* Terlambat */}
        <div style={{
          background: C.rose50,
          border: `1px solid ${C.rose100}`,
          borderRadius: 16,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: C.rose100,
            color: C.rose600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontSize: 20,
          }}>⚠️</div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.rose600, lineHeight: 1.1 }}>{stats.overdue} Tugas</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#9F1239', opacity: 0.8 }}>Perlu Perhatian / Terlambat</div>
          </div>
        </div>
        {/* Mendatang */}
        <div style={{
          background: C.indigo50,
          border: `1px solid ${C.indigo100}`,
          borderRadius: 16,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: C.indigo100,
            color: C.brandPurple,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontSize: 20,
          }}>📅</div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.brandPurple, lineHeight: 1.1 }}>{stats.upcoming} Tugas</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#3730A3', opacity: 0.8 }}>Target Mendatang</div>
          </div>
        </div>
        {/* Selesai */}
        <div style={{
          background: C.emerald50,
          border: `1px solid ${C.emerald100}`,
          borderRadius: 16,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: C.emerald100,
            color: C.emerald600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontSize: 20,
          }}>✅</div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.emerald600, lineHeight: 1.1 }}>{stats.completed} Tugas</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#065F46', opacity: 0.8 }}>Selesai Bulan Ini</div>
          </div>
        </div>
        {/* Kepatuhan */}
        <div style={{
          background: C.slate50,
          border: `1px solid ${C.slate200}`,
          borderRadius: 16,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: '#E2E8F0B3',
            color: C.slate700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontSize: 20,
          }}>⚡</div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.slate800, lineHeight: 1.1 }}>{stats.compliance}%</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.slate500 }}>Ketepatan Waktu Anak</div>
          </div>
        </div>
      </div>

      {/* ── Main Schedule Card ── */}
      <div style={{
        background: C.white,
        borderRadius: 24,
        border: `1px solid ${C.slate200}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '28px 32px 20px', borderBottom: `1px solid ${C.slate100}` }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: C.slate900, margin: 0, letterSpacing: '-0.02em' }}>
                Jadwal & Target Mendatang
              </h1>
              <p style={{ fontSize: 14, color: C.slate500, margin: '4px 0 0', fontWeight: 500 }}>
                Pantau tenggat waktu tugas {activeChildName} & anak lainnya
              </p>
            </div>
            {/* View toggle */}
            <div style={{
              display: 'inline-flex',
              borderRadius: 10,
              background: C.slate100,
              padding: 3,
              fontSize: 12,
              fontWeight: 600,
              color: C.slate600,
            }}>
              <button
                type="button"
                style={{
                  padding: '6px 12px',
                  background: C.white,
                  color: C.brandPurple,
                  borderRadius: 8,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  fontFamily: FF,
                }}
              >
                <span style={{ fontSize: 13 }}>☰</span> Daftar
              </button>
              <button
                type="button"
                style={{
                  padding: '6px 12px',
                  background: 'transparent',
                  color: C.slate500,
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontFamily: FF,
                  fontSize: 12,
                }}
              >
                <span style={{ fontSize: 13 }}>📆</span> Kalender
              </button>
            </div>
          </div>

          {/* Filter toolbar */}
          <div style={{
            marginTop: 20,
            paddingTop: 20,
            borderTop: `1px solid ${C.slate100}`,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 12,
          }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: '1 1 300px', minWidth: 200 }}>
              <span style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                color: C.slate400,
                fontSize: 14,
              }}>🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
                placeholder="Cari jadwal, nama materi tugas, atau mata pelajaran..."
                style={{
                  width: '100%',
                  paddingLeft: 40,
                  paddingRight: 16,
                  paddingTop: 10,
                  paddingBottom: 10,
                  fontSize: 13,
                  background: C.slate50,
                  border: `1px solid ${C.slate200}`,
                  borderRadius: 12,
                  outline: 'none',
                  fontFamily: FF,
                  color: C.slate800,
                  boxSizing: 'border-box',
                }}
              />
            </div>
            {/* Filter dropdowns */}
            <select
              value={childFilter}
              onChange={(e) => handleFilterChange(setChildFilter)(e.target.value)}
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: '8px 12px',
                background: C.slate50,
                border: `1px solid ${C.slate200}`,
                borderRadius: 12,
                color: C.slate700,
                fontFamily: FF,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="all">Semua Anak</option>
              <option value="selected">Anak Aktif Saja</option>
              {childrenData.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange(setStatusFilter)(e.target.value)}
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: '8px 12px',
                background: C.slate50,
                border: `1px solid ${C.slate200}`,
                borderRadius: 12,
                color: C.slate700,
                fontFamily: FF,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="all">Semua Status</option>
              <option value="overdue">Perlu Perhatian (Terlambat)</option>
              <option value="upcoming-tomorrow">Besok</option>
              <option value="upcoming-week">Minggu Ini</option>
              <option value="completed">Sudah Selesai</option>
              <option value="upcoming-far">Mendatang</option>
            </select>
          </div>

          {/* Quick filter pills */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 16,
            overflowX: 'auto',
            paddingBottom: 4,
          }}>
            {[
              { key: 'all', label: `Semua (${quickFilterCounts.all})`, active: statusFilter === 'all' },
              { key: 'overdue', label: `⚠️ Terlambat (${quickFilterCounts.overdue})`, active: statusFilter === 'overdue' },
              { key: 'thisWeek', label: `📅 Minggu Ini (${quickFilterCounts.thisWeek})`, active: statusFilter === 'upcoming-tomorrow' || statusFilter === 'upcoming-week' },
            ].map((pill) => (
              <button
                key={pill.key}
                type="button"
                onClick={() => {
                  if (pill.key === 'all') handleFilterChange(setStatusFilter)('all')
                  else if (pill.key === 'overdue') handleFilterChange(setStatusFilter)('overdue')
                  else handleFilterChange(setStatusFilter)('upcoming-week')
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: 9999,
                  background: pill.active ? C.slate900 : C.slate100,
                  color: pill.active ? C.white : C.slate600,
                  fontSize: 12,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontFamily: FF,
                  boxShadow: pill.active ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                {pill.label}
              </button>
            ))}
            {/* Subject pill counts */}
            {subjects.slice(0, 4).map((sub) => {
              const count = scheduleTasks.filter(
                (t) =>
                  t.subject?.id === sub.id &&
                  (childFilter === 'all' || t.assignment.childId === (childFilter === 'selected' ? activeChildId : childFilter)),
              ).length
              if (count === 0) return null
              return (
                <button
                  key={sub.id}
                  type="button"
                  style={{
                    padding: '6px 14px',
                    borderRadius: 9999,
                    background: C.slate100,
                    color: C.slate600,
                    fontSize: 12,
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'default',
                    whiteSpace: 'nowrap',
                    fontFamily: FF,
                  }}
                >
                  {sub.icon} {sub.shortName} ({count})
                </button>
              )
            })}
          </div>
        </div>

        {/* Task List */}
        <div style={{ padding: '20px 32px' }}>
          {paginated.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '48px 24px',
              color: C.slate400,
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: C.slate600 }}>Tidak ada jadwal tugas</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Semua tugas sudah selesai atau belum ada tugas yang ditetapkan.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {paginated.map((task) => {
                const badge = getStatusBadge(task.status)
                const isOverdue = task.status === 'overdue'
                const isCompleted = task.status === 'completed'
                const subjectIcon = task.subject?.icon ?? '📚'
                // childInitial not needed
                const childFullName = childrenData.find((c) => c.id === task.assignment.childId)?.name ?? task.childName

                return (
                  <div
                    key={task.assignment.id}
                    style={{
                      background: isOverdue ? '#FFF5F5' : C.white,
                      border: `1px solid ${isOverdue ? '#FED7D7' : C.slate200}`,
                      borderRadius: 16,
                      padding: '18px 24px',
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 16,
                      transition: 'all 0.15s ease',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
                      e.currentTarget.style.borderColor = isOverdue ? '#F87171' : C.slate300
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'none'
                      e.currentTarget.style.borderColor = isOverdue ? '#FED7D7' : C.slate200
                    }}
                  >
                    {/* Left side */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0, flex: 1 }}>
                      {/* Date capsule */}
                      <div style={{
                        width: 56,
                        height: 64,
                        borderRadius: 16,
                        background: isOverdue ? C.white : C.slate50,
                        border: `1px solid ${isOverdue ? C.slate200 : C.slate200}`,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <span style={{ fontSize: 22, fontWeight: 900, color: C.slate900, lineHeight: 1 }}>
                          {task.assignment.dueDate ? new Date(task.assignment.dueDate).getDate() : '—'}
                        </span>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: isOverdue ? C.slate500 : C.brandPurple,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginTop: 2,
                        }}>
                          {task.assignment.dueDate
                            ? getMonthLabel(task.assignment.dueDate).substring(0, 3).toUpperCase()
                            : '—'}
                        </span>
                      </div>

                      {/* Content */}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                          <h2 style={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: C.slate900,
                            margin: 0,
                            lineHeight: 1.3,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {task.assignment.title}
                          </h2>
                          <span style={{
                            background: badge.bg,
                            border: `1px solid ${badge.border}`,
                            color: badge.text,
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '2px 10px',
                            borderRadius: 9999,
                            whiteSpace: 'nowrap',
                          }}>
                            {badge.label}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: C.slate500, fontWeight: 500, marginTop: 4 }}>
                          {subjectIcon} {task.subject?.shortName ?? 'Umum'} · {childFullName}
                          {task.score !== null && (
                            <span style={{
                              marginLeft: 8,
                              fontSize: 11,
                              fontWeight: 700,
                              color: task.score >= 80 ? C.emerald600 : task.score >= 60 ? C.amber600 : C.red600,
                            }}>
                              {task.score}/100
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right CTA */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
                      {isOverdue ? (
                        <button
                          type="button"
                          style={{
                            padding: '10px 20px',
                            borderRadius: 12,
                            fontWeight: 700,
                            fontSize: 13,
                            background: '#FCE7E7',
                            color: C.red600,
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            fontFamily: FF,
                            transition: 'all 0.15s',
                            whiteSpace: 'nowrap',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#F8D7DA'; e.currentTarget.style.color = C.red700 }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = '#FCE7E7'; e.currentTarget.style.color = C.red600 }}
                        >
                          <span>Bantu {activeChildName} Mulai</span>
                          <span style={{ fontSize: 14 }}>→</span>
                        </button>
                      ) : isCompleted ? (
                        <button
                          type="button"
                          style={{
                            padding: '10px 20px',
                            borderRadius: 12,
                            fontWeight: 700,
                            fontSize: 13,
                            background: C.emerald50,
                            color: C.emerald700,
                            border: `1px solid ${C.emerald100}`,
                            cursor: 'pointer',
                            fontFamily: FF,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          ✅ Selesai
                        </button>
                      ) : (
                        <button
                          type="button"
                          style={{
                            padding: '10px 20px',
                            borderRadius: 12,
                            fontWeight: 700,
                            fontSize: 13,
                            background: C.brand50,
                            color: C.brandPurple,
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            fontFamily: FF,
                            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                            transition: 'all 0.15s',
                            whiteSpace: 'nowrap',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = C.brand100 }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = C.brand50 }}
                        >
                          <span>Siapkan Materi</span>
                          <span style={{ fontSize: 14 }}>›</span>
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {sorted.length > perPage && (
          <div style={{
            padding: '16px 32px',
            borderTop: `1px solid ${C.slate100}`,
            background: `${C.slate50}80`,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}>
            <div style={{ fontSize: 13, color: C.slate500, fontWeight: 500 }}>
              Menampilkan{' '}
              <span style={{ fontWeight: 700, color: C.slate900 }}>
                {(safePage - 1) * perPage + 1} - {Math.min(safePage * perPage, sorted.length)}
              </span>{' '}
              dari <span style={{ fontWeight: 700, color: C.slate900 }}>{sorted.length}</span> jadwal tugas aktif
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px 0 0 8px',
                  border: `1px solid ${C.slate200}`,
                  background: C.white,
                  fontSize: 12,
                  fontWeight: 700,
                  color: safePage <= 1 ? C.slate300 : C.slate600,
                  cursor: safePage <= 1 ? 'not-allowed' : 'pointer',
                  fontFamily: FF,
                }}
              >
                ‹ Sebelumnya
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  style={{
                    padding: '8px 14px',
                    border: `1px solid ${p === safePage ? C.brandPurple : C.slate200}`,
                    background: p === safePage ? C.brandPurple : C.white,
                    color: p === safePage ? C.white : C.slate700,
                    fontSize: 12,
                    fontWeight: p === safePage ? 800 : 700,
                    cursor: 'pointer',
                    fontFamily: FF,
                  }}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  padding: '8px 12px',
                  borderRadius: '0 8px 8px 0',
                  border: `1px solid ${C.slate200}`,
                  background: C.white,
                  fontSize: 12,
                  fontWeight: 700,
                  color: safePage >= totalPages ? C.slate300 : C.slate600,
                  cursor: safePage >= totalPages ? 'not-allowed' : 'pointer',
                  fontFamily: FF,
                }}
              >
                Selanjutnya ›
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
