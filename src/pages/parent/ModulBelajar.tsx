import React, { useMemo, useState, useEffect, useCallback } from 'react'
import {
  type ChildInfo,
  type ModuleSummary,
  fetchModule,
} from '../../lib/api'
import type { Subject, FrameKind } from '../../types/storyboard'

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------
const C = {
  brand50: '#F5F3FF',
  brand100: '#EDE9FE',
  brand200: '#DDD6FE',
  brand500: '#6366F1',
  brand600: '#5B4DFF',
  brand700: '#4F46E5',
  brand800: '#4338CA',
  brand900: '#312E81',
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
  emerald200: '#A7F3D0',
  emerald500: '#10B981',
  emerald600: '#059669',
  amber50: '#FFFBEB',
  amber100: '#FEF3C7',
  amber200: '#FDE68A',
  amber500: '#F59E0B',
  amber600: '#D97706',
  amber700: '#B45309',
  blue50: '#EFF6FF',
  blue500: '#3B82F6',
  blue600: '#2563EB',
  red50: '#FEF2F2',
  red100: '#FEE2E2',
  red500: '#EF4444',
}

const FF =
  "'Plus Jakarta Sans', Inter, system-ui, -apple-system, sans-serif"

// ---------------------------------------------------------------------------
// KIND helpers
// ---------------------------------------------------------------------------
const KIND_ICON: Record<string, string> = {
  text: '📄',
  quiz: '🎮',
  dragdrop: '🧩',
  video: '🎬',
  pdf: '📕',
  shortanswer: '✍️',
}

const KIND_LABEL: Record<string, string> = {
  text: 'Materi',
  quiz: 'Kuis 10 Soal',
  dragdrop: 'Drag & Drop',
  video: 'Video Interaktif',
  pdf: 'Dokumen PDF',
  shortanswer: 'Latihan Interaktif',
}

// Subject accent fallback
const SUBJECT_COLORS: Record<string, string> = {
  '#4F46E5': '#4F46E5',
  '#0EA5E9': '#0EA5E9',
  '#10B981': '#10B981',
  '#F59E0B': '#F59E0B',
  '#F43F5E': '#F43F5E',
  '#8B5CF6': '#8B5CF6',
}

function getAccent(subject: Subject): string {
  return SUBJECT_COLORS[subject.accent] || subject.accent || C.brand600
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface ModulBelajarProps {
  childrenData: ChildInfo[]
  selectedChildIdx: number
  onChildChange: (idx: number) => void
  subjects: Subject[]
  modules: ModuleSummary[]
  loading: boolean
  navigate: (path: string) => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const ModulBelajar: React.FC<ModulBelajarProps> = ({
  childrenData,
  selectedChildIdx,
  subjects,
  modules,
  loading,
  navigate,
}) => {
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null)
  const [selectedTopicId, setSelectedTopicId] = useState<string>('')
  const [selectedFrames, setSelectedFrames] = useState<string[]>([])
  const [topicFrames, setTopicFrames] = useState<
    { id: string; kind: FrameKind; title: string; panel: string }[]
  >([])
  const [topicLoading, setTopicLoading] = useState(false)

  const activeChild = childrenData[selectedChildIdx] ?? childrenData[0] ?? null

  // Filter subjects that have modules
  const subjectsWithModules = useMemo(() => {
    const ids = new Set(modules.map((m) => m.subjectId))
    return subjects.filter((s) => ids.has(s.id))
  }, [subjects, modules])

  // Modules for active subject
  const activeSubjectModules = useMemo(() => {
    if (!activeSubjectId) return []
    return modules.filter((m) => m.subjectId === activeSubjectId)
  }, [modules, activeSubjectId])

  const activeSubject = useMemo(
    () => subjects.find((s) => s.id === activeSubjectId) ?? null,
    [subjects, activeSubjectId],
  )

  // Auto-select first subject
  useEffect(() => {
    if (subjectsWithModules.length > 0 && !activeSubjectId) {
      setActiveSubjectId(subjectsWithModules[0].id)
    }
  }, [subjectsWithModules, activeSubjectId])

  // Auto-select first topic when subject changes
  useEffect(() => {
    if (activeSubjectModules.length > 0) {
      setSelectedTopicId(activeSubjectModules[0].id)
    } else {
      setSelectedTopicId('')
    }
    setSelectedFrames([])
    setTopicFrames([])
  }, [activeSubjectId, activeSubjectModules])

  // Fetch frames for selected topic
  const loadTopicFrames = useCallback(async (moduleId: string) => {
    setTopicLoading(true)
    try {
      const mod = await fetchModule(moduleId)
      setTopicFrames(
        mod.frames.map((f) => ({
          id: f.id,
          kind: f.kind,
          title: f.title,
          panel: f.panel,
        })),
      )
      setSelectedFrames(mod.frames.map((f) => f.id))
    } catch {
      setTopicFrames([])
      setSelectedFrames([])
    } finally {
      setTopicLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedTopicId) {
      loadTopicFrames(selectedTopicId)
    }
  }, [selectedTopicId, loadTopicFrames])

  // Toggle frame selection
  const toggleFrame = (frameId: string) => {
    setSelectedFrames((prev) =>
      prev.includes(frameId)
        ? prev.filter((id) => id !== frameId)
        : [...prev, frameId],
    )
  }

  const deselectAll = () => setSelectedFrames([])

  const childName = activeChild?.name?.split(' ')[0] ?? 'Anak'

  // Compute completion stats for a subject
  const getSubjectStats = (subjectId: string) => {
    const count = modules.filter((m) => m.subjectId === subjectId).length
    // Simulated completion since we don't have per-module completion here
    return { total: count }
  }

  // Total topics for active subject
  const activeTopicCount = activeSubjectModules.length

  // Render
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: 24,
        fontFamily: FF,
      }}
    >
      {/* ─── LEFT PANEL: Mata Pelajaran ─── */}
      <section
        style={{
          gridColumn: 'span 5 / span 5',
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 20,
          }}
        >
          <div>
            <h3
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: C.slate900,
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              Mata Pelajaran
            </h3>
            <p
              style={{
                fontSize: 14,
                color: C.slate400,
                margin: '4px 0 0',
              }}
            >
              Pilih mata pelajaran untuk melihat topik & materi.
            </p>
          </div>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: C.brand600,
              backgroundColor: C.brand50,
              padding: '5px 12px',
              borderRadius: 8,
              border: `1px solid ${C.brand200}`,
            }}
          >
            {subjectsWithModules.length} Mapel
          </span>
        </div>

        {/* Subject cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading ? (
            <div
              style={{
                padding: 40,
                textAlign: 'center',
                color: C.slate400,
                fontSize: 14,
              }}
            >
              Memuat mata pelajaran...
            </div>
          ) : subjectsWithModules.length === 0 ? (
            <div
              style={{
                padding: 40,
                textAlign: 'center',
                color: C.slate400,
                fontSize: 14,
              }}
            >
              Belum ada mata pelajaran tersedia.
            </div>
          ) : (
            subjectsWithModules.map((subject) => {
              const isSelected = subject.id === activeSubjectId
              const stats = getSubjectStats(subject.id)
              const accent = getAccent(subject)

              return (
                <div
                  key={subject.id}
                  onClick={() => setActiveSubjectId(subject.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '16px 18px',
                    borderRadius: 14,
                    border: isSelected
                      ? `2px solid ${C.brand600}`
                      : `1px solid ${C.slate200}`,
                    backgroundColor: isSelected ? C.brand50 : C.white,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative',
                  }}
                >
                  {/* Subject icon */}
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      backgroundColor: `${accent}18`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 24,
                      flexShrink: 0,
                    }}
                  >
                    {subject.icon}
                  </div>

                  {/* Subject info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: C.slate900,
                        }}
                      >
                        {subject.name}
                      </span>
                      {isSelected && (
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 800,
                            color: C.brand600,
                            backgroundColor: C.brand100,
                            padding: '2px 8px',
                            borderRadius: 6,
                            textTransform: 'uppercase' as const,
                            letterSpacing: '0.05em',
                          }}
                        >
                          AKTIF DIPILIH
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: C.slate400,
                        marginTop: 3,
                      }}
                    >
                      {isSelected ? (
                        <>
                          <span style={{ color: C.brand600, fontWeight: 600 }}>
                            Sedang Dipelajari
                          </span>
                          <span> • {stats.total} Topik Tersedia</span>
                        </>
                      ) : (
                        <>
                          {stats.total} Topik{' '}
                          <span style={{ color: C.slate300 }}>•</span>{' '}
                          {stats.total > 0 ? 'Tersedia' : 'Belum ada'}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right side */}
                  {isSelected ? (
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: C.brand600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                  ) : (
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: C.brand600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        flexShrink: 0,
                      }}
                    >
                      Pilih{' '}
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </span>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Status Card */}
        {activeSubject && (
          <div
            style={{
              marginTop: 20,
              padding: '20px 22px',
              borderRadius: 16,
              background: `linear-gradient(135deg, ${C.brand700} 0%, ${C.brand500} 100%)`,
              color: C.white,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            <div style={{ flex: 1 }}>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.08em',
                  color: 'rgba(255,255,255,0.7)',
                  margin: 0,
                }}
              >
                STATUS MODUL {activeSubject.shortName?.toUpperCase() ?? activeSubject.name.toUpperCase()}
              </p>
              <h4
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: C.white,
                  margin: '6px 0 4px',
                }}
              >
                {activeTopicCount} Topik Tersedia
              </h4>
              <p
                style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.75)',
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                Modul pembelajaran untuk {childName} di {activeSubject.name}.
              </p>
            </div>
            <button
              onClick={() => navigate('/guru/report')}
              style={{
                padding: '10px 20px',
                borderRadius: 12,
                border: '2px solid rgba(255,255,255,0.3)',
                backgroundColor: 'rgba(255,255,255,0.15)',
                color: C.white,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap' as const,
                transition: 'all 0.2s',
                backdropFilter: 'blur(4px)',
              }}
            >
              Uji Pemahaman Anak
            </button>
          </div>
        )}
      </section>

      {/* ─── RIGHT PANEL: Detail Topik & Pilih Bahasan ─── */}
      <section
        style={{
          gridColumn: 'span 7 / span 7',
          backgroundColor: C.white,
          borderRadius: 20,
          border: `1px solid ${C.slate100}`,
          padding: 28,
          boxShadow: '0 4px 20px -4px rgba(0,0,0,0.04)',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h3
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: C.slate900,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            Detail Topik & Pilih Bahasan Materi
          </h3>
          <p
            style={{
              fontSize: 13,
              color: C.slate400,
              margin: '6px 0 0',
            }}
          >
            Atur aktivitas belajar yang akan ditampilkan pada dasbor siswa{' '}
            {childName}.
          </p>
        </div>

        {/* Mata Pelajaran dropdown */}
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: C.slate600,
              display: 'block',
              marginBottom: 6,
            }}
          >
            Mata Pelajaran
          </label>
          <div
            style={{
              position: 'relative',
            }}
          >
            <select
              value={activeSubjectId ?? ''}
              onChange={(e) => setActiveSubjectId(e.target.value || null)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 12,
                border: `1px solid ${C.slate200}`,
                backgroundColor: C.white,
                fontSize: 14,
                fontWeight: 600,
                color: C.slate800,
                appearance: 'none' as const,
                cursor: 'pointer',
                outline: 'none',
                fontFamily: FF,
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 16px center',
              }}
            >
              {subjectsWithModules.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.icon} {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Topik dropdown */}
        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: C.slate600,
              display: 'block',
              marginBottom: 6,
            }}
          >
            Topik
          </label>
          <select
            value={selectedTopicId}
            onChange={(e) => setSelectedTopicId(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 12,
              border: `1px solid ${C.slate200}`,
              backgroundColor: C.white,
              fontSize: 14,
              fontWeight: 600,
              color: C.slate800,
              appearance: 'none' as const,
              cursor: 'pointer',
              outline: 'none',
              fontFamily: FF,
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 16px center',
            }}
          >
            {activeSubjectModules.length === 0 && (
              <option value="">Tidak ada topik</option>
            )}
            {activeSubjectModules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        </div>

        {/* Pilih Bahasan header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <h4
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: C.slate900,
              margin: 0,
            }}
          >
            Pilih Bahasan
          </h4>
          {topicFrames.length > 0 && (
            <button
              onClick={deselectAll}
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: C.brand600,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Batalkan Semua
            </button>
          )}
        </div>

        {/* Frame list */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {topicLoading ? (
            <div
              style={{
                padding: 30,
                textAlign: 'center',
                color: C.slate400,
                fontSize: 13,
              }}
            >
              Memuat panel...
            </div>
          ) : topicFrames.length === 0 ? (
            <div
              style={{
                padding: 40,
                textAlign: 'center',
                color: C.slate400,
                fontSize: 14,
              }}
            >
              {selectedTopicId
                ? 'Tidak ada panel untuk topik ini.'
                : 'Pilih topik untuk melihat bahasan materi.'}
            </div>
          ) : (
            topicFrames.map((frame) => {
              const isChecked = selectedFrames.includes(frame.id)
              return (
                <div
                  key={frame.id}
                  onClick={() => toggleFrame(frame.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '13px 14px',
                    borderRadius: 10,
                    backgroundColor: isChecked
                      ? `${C.brand50}80`
                      : 'transparent',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s',
                  }}
                >
                  {/* Checkbox */}
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      border: isChecked
                        ? 'none'
                        : `2px solid ${C.slate300}`,
                      backgroundColor: isChecked ? C.brand600 : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.15s',
                    }}
                  >
                    {isChecked && (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </div>

                  {/* Icon */}
                  <span style={{ fontSize: 18, flexShrink: 0 }}>
                    {KIND_ICON[frame.kind] ?? '📄'}
                  </span>

                  {/* Title */}
                  <span
                    style={{
                      flex: 1,
                      fontSize: 13,
                      fontWeight: 600,
                      color: C.slate800,
                    }}
                  >
                    {frame.title}
                  </span>

                  {/* Kind label */}
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: C.slate400,
                      flexShrink: 0,
                    }}
                  >
                    ({KIND_LABEL[frame.kind] ?? frame.kind})
                  </span>
                </div>
              )
            })
          )}
        </div>

        {/* Footer bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 20,
            paddingTop: 16,
            borderTop: `1px solid ${C.slate100}`,
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: C.slate400,
            }}
          >
            {selectedFrames.length} dari {topicFrames.length} panel dipilih
          </span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              style={{
                padding: '10px 18px',
                borderRadius: 10,
                border: `1px solid ${C.slate200}`,
                backgroundColor: C.white,
                color: C.slate600,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: FF,
              }}
            >
              Simpan Pengaturan
            </button>
            <button
              onClick={() => {
                if (selectedTopicId) navigate(`/modul/${selectedTopicId}`)
              }}
              style={{
                padding: '10px 18px',
                borderRadius: 10,
                border: 'none',
                backgroundColor: C.brand600,
                color: C.white,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontFamily: FF,
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 4v16m8-8H4" />
              </svg>
              Tugaskan ke {childName}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ModulBelajar
