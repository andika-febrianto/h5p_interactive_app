import React, { useMemo, useState, useEffect } from 'react'
import {
  type ChildInfo,
  type ModuleSummary,
} from '../../lib/api'
import type { Subject } from '../../types/storyboard'

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------

const colors = {
  brand50: '#F5F3FF',
  brand100: '#EDE9FE',
  brand200: '#DDD6FE',
  brand500: '#6366F1',
  brand600: '#5B4DFF',
  brand700: '#4F46E5',
  brand900: '#312E81',
  softBg: '#F8FAFD',
  mint: '#10B981',
  amber: '#F59E0B',
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
  white: '#FFFFFF',
  emerald50: '#ECFDF5',
  emerald200: '#A7F3D0',
  emerald500: '#10B981',
  emerald600: '#059669',
  emerald700: '#047857',
  rose500: '#F43F5E',
  blue600: '#2563EB',
}

const fontFamily =
  "'Plus Jakarta Sans', Inter, system-ui, -apple-system, sans-serif"

// ---------------------------------------------------------------------------
// KIND_ICON map
// ---------------------------------------------------------------------------

const KIND_ICON: Record<string, string> = {
  text: '📄',
  quiz: '🎮',
  dragdrop: '🧩',
  video: '🎬',
  pdf: '📕',
  shortanswer: '✍️',
}

// ---------------------------------------------------------------------------
// Inline style object
// ---------------------------------------------------------------------------

const S: Record<string, React.CSSProperties> = {
  page: {
    backgroundColor: '#F8F9FE',
    color: colors.slate800,
    fontFamily,
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    WebkitFontSmoothing: 'antialiased',
  },

  main: {
    maxWidth: 1440,
    margin: '0 auto',
    padding: '32px 24px',
    width: '100%',
    boxSizing: 'border-box',
  },

  // Banner section
  bannerSection: {
    marginBottom: 32,
  },
  bannerFlex: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 24,
    flexWrap: 'wrap' as const,
  },
  semesterBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
    fontWeight: 600,
    color: colors.brand700,
    backgroundColor: colors.brand50,
    border: `1px solid ${colors.brand200}`,
    padding: '6px 14px',
    borderRadius: 999,
    marginBottom: 12,
  },
  dotPulse: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: colors.emerald500,
    animation: 'pulse 2s infinite',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 800,
    color: colors.slate900,
    margin: '0 0 8px',
    letterSpacing: '-0.02em',
    lineHeight: 1.2,
  },
  pageSubtitle: {
    fontSize: 14,
    color: colors.slate500,
    margin: 0,
    maxWidth: 500,
    lineHeight: 1.6,
  },

  // Child cards row
  childCardsRow: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap' as const,
    alignItems: 'flex-start',
  },
  childCardActive: {
    display: 'flex',
    gap: 14,
    padding: '16px 20px',
    borderRadius: 16,
    border: `2px solid ${colors.brand600}`,
    background: `linear-gradient(135deg, ${colors.brand50} 0%, ${colors.white} 100%)`,
    boxShadow: `0 4px 12px ${colors.brand600}20`,
    minWidth: 240,
    transition: 'all 0.2s',
  },
  childCardInactive: {
    display: 'flex',
    gap: 14,
    padding: '16px 20px',
    borderRadius: 16,
    border: `2px solid ${colors.slate200}`,
    background: colors.white,
    minWidth: 240,
    transition: 'all 0.2s',
    cursor: 'pointer',
  },
  childAvatarWrap: {
    position: 'relative' as const,
  },
  childAvatarActive: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.brand600,
    color: colors.white,
    fontWeight: 800,
    fontSize: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  childAvatarInactive: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.slate100,
    color: colors.slate500,
    fontWeight: 800,
    fontSize: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  onlineDot: {
    position: 'absolute' as const,
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: '50%',
    backgroundColor: colors.emerald500,
    border: `2px solid ${colors.white}`,
  },
  childRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  childNameActive: {
    fontSize: 15,
    fontWeight: 700,
    color: colors.slate900,
  },
  childNameInactive: {
    fontSize: 15,
    fontWeight: 700,
    color: colors.slate700,
  },
  activeTag: {
    fontSize: 10,
    fontWeight: 700,
    color: colors.emerald600,
    backgroundColor: colors.emerald50,
    border: `1px solid ${colors.emerald200}`,
    padding: '2px 8px',
    borderRadius: 6,
  },
  childGrade: {
    fontSize: 12,
    color: colors.brand700,
    fontWeight: 500,
    margin: '2px 0 4px',
  },
  childMetaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 11,
    color: colors.slate400,
    fontWeight: 500,
  },
  pointsAmber: {
    color: colors.amber,
    fontWeight: 600,
  },
  statusEmerald: {
    color: colors.emerald600,
    fontWeight: 600,
  },
  pilihBtn: {
    fontSize: 11,
    fontWeight: 700,
    color: colors.brand600,
    backgroundColor: colors.brand50,
    border: `1px solid ${colors.brand200}`,
    padding: '4px 12px',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },

  manageColumn: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  manageBtn: {
    fontSize: 12,
    fontWeight: 600,
    color: colors.slate600,
    backgroundColor: colors.white,
    border: `1px solid ${colors.slate200}`,
    padding: '8px 14px',
    borderRadius: 10,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  addChildBtn: {
    fontSize: 12,
    fontWeight: 700,
    color: colors.white,
    backgroundColor: colors.brand600,
    border: 'none',
    padding: '8px 14px',
    borderRadius: 10,
    cursor: 'pointer',
  },

  // Filter bar
  filterBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    marginTop: 20,
    flexWrap: 'wrap' as const,
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap' as const,
  },
  dropdownChip: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    borderRadius: 10,
    border: `1px solid ${colors.slate200}`,
    backgroundColor: colors.white,
    fontSize: 13,
    fontWeight: 600,
    color: colors.slate700,
    cursor: 'pointer',
  },
  dropdownChipLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: colors.slate400,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  curriculumTag: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    borderRadius: 8,
    backgroundColor: colors.emerald50,
    border: `1px solid ${colors.emerald200}`,
    fontSize: 12,
    fontWeight: 600,
    color: colors.emerald700,
  },
  searchWrap: {
    position: 'relative' as const,
  },
  searchInput: {
    padding: '10px 14px 10px 38px',
    borderRadius: 12,
    border: `1px solid ${colors.slate200}`,
    backgroundColor: colors.white,
    fontSize: 13,
    fontWeight: 500,
    color: colors.slate800,
    width: 280,
    outline: 'none',
    transition: 'border-color 0.15s',
  },
  searchIconPos: {
    position: 'absolute' as const,
    left: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    color: colors.slate400,
    display: 'flex',
    alignItems: 'center',
  },

  // Grid
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(12, 1fr)',
    gap: 24,
    marginTop: 24,
  },
  panel: {
    backgroundColor: colors.white,
    borderRadius: 20,
    border: `1px solid ${colors.slate100}`,
    padding: 24,
    boxShadow: '0 4px 20px -4px rgba(0,0,0,0.04)',
  },
  panelHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: colors.slate900,
    margin: 0,
    letterSpacing: '-0.01em',
  },
  panelSubtitle: {
    fontSize: 13,
    color: colors.slate400,
    margin: '4px 0 0',
  },
  countBadge: {
    fontSize: 11,
    fontWeight: 700,
    color: colors.brand600,
    backgroundColor: colors.brand50,
    padding: '4px 10px',
    borderRadius: 8,
  },

  // Subject list (card-based)
  subjectCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '14px 16px',
    borderRadius: 14,
    border: `2px solid ${colors.slate100}`,
    backgroundColor: colors.white,
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginBottom: 10,
  },
  subjectCardActive: {
    borderColor: colors.brand600,
    backgroundColor: `${colors.brand50}CC`,
  },
  subjectIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 22,
    flexShrink: 0,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 14,
    fontWeight: 700,
    color: colors.slate900,
  },
  subjectMeta: {
    fontSize: 12,
    color: colors.slate400,
    marginTop: 2,
  },
  subjectModuleBadge: {
    fontSize: 11,
    fontWeight: 700,
    padding: '3px 10px',
    borderRadius: 8,
  },
  subjectChevron: {
    transition: 'transform 0.2s',
    flexShrink: 0,
  },

  // Module items inside expanded subject
  moduleList: {
    marginTop: 8,
    marginLeft: 22,
    paddingLeft: 16,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  moduleItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 14px',
    borderRadius: 12,
    background: colors.white,
    border: `1px solid ${colors.slate100}`,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  moduleIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    flexShrink: 0,
  },
  moduleInfo: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: colors.slate900,
  },
  moduleMeta: {
    fontSize: 11,
    color: colors.slate400,
    marginTop: 2,
  },

  // Progress card
  progressCard: {
    marginTop: 20,
    padding: '16px 20px',
    borderRadius: 14,
    background: `linear-gradient(135deg, ${colors.brand50} 0%, ${colors.white} 100%)`,
    border: `1px solid ${colors.brand200}`,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: colors.brand600,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: 800,
    color: colors.slate900,
    margin: '4px 0',
  },
  progressSub: {
    fontSize: 12,
    color: colors.slate500,
    margin: 0,
  },
  quizBtn: {
    marginTop: 12,
    padding: '8px 16px',
    borderRadius: 10,
    border: 'none',
    backgroundColor: colors.brand600,
    color: colors.white,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  },
}

// Grid desktop helpers
const gridDesktop: React.CSSProperties = {
  gridTemplateColumns: 'repeat(12, 1fr)',
}
const panelDesktop: React.CSSProperties = { gridColumn: 'span 6 / span 6' }

// ---------------------------------------------------------------------------
// Small icon helpers
// ---------------------------------------------------------------------------

const IconChevronDown: React.FC<{ size?: number; color?: string }> = ({
  size = 16,
  color = colors.slate400,
}) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke={color}
    strokeWidth={2}
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path d='M19 9l-7 7-7-7' />
  </svg>
)

const IconCheckCircle: React.FC = () => (
  <svg
    width={14}
    height={14}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth={2}
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
  </svg>
)

const IconSearch: React.FC = () => (
  <svg
    width={16}
    height={16}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth={2}
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
  </svg>
)

const IconPlus: React.FC = () => (
  <svg
    width={14}
    height={14}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth={2}
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path d='M12 4v16m8-8H4' />
  </svg>
)

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
  onChildChange,
  subjects,
  modules,
  loading,
  navigate,
}) => {
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null)
  const [search, setSearch] = useState<string>('')

  const activeChild = childrenData[selectedChildIdx] ?? childrenData[0] ?? null

  // Auto-expand first subject when modules change
  useEffect(() => {
    if (modules.length > 0 && !activeSubjectId) {
      const firstSubjectId = modules[0]?.subjectId
      if (firstSubjectId) setActiveSubjectId(firstSubjectId)
    }
  }, [modules, activeSubjectId])

  // Filter subjects that have modules for this child's grade/semester
  const subjectsWithModules = useMemo(() => {
    const subjectIdsWithModules = new Set(modules.map((m) => m.subjectId))
    return subjects.filter((s) => subjectIdsWithModules.has(s.id))
  }, [subjects, modules])

  // Get modules for the active subject
  const activeSubjectModules = useMemo(() => {
    if (!activeSubjectId) return []
    return modules.filter((m) => m.subjectId === activeSubjectId)
  }, [modules, activeSubjectId])

  // Search filter
  const filteredModules = useMemo(() => {
    if (!search.trim()) return activeSubjectModules
    const q = search.toLowerCase()
    return activeSubjectModules.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.subjectId.toLowerCase().includes(q),
    )
  }, [activeSubjectModules, search])

  const activeSubject = subjects.find((s) => s.id === activeSubjectId) ?? null

  const childGradeText = activeChild
    ? `Kelas ${activeChild.grade ?? '?'} SD`
    : ''
  const childSemText = activeChild
    ? `Semester ${activeChild.semester ?? '?'}`
    : ''

  return (
    <div>
      {/* Banner & child switcher */}
      <section style={S.bannerSection}>
        <div style={S.bannerFlex}>
          <div>
            <div style={S.semesterBadge}>
              <span style={S.dotPulse} />
              {childSemText ? `${childSemText} • ` : ''}Kurikulum Merdeka
            </div>
            <h2 style={S.pageTitle}>Modul Belajar Siswa</h2>
            <p style={S.pageSubtitle}>
              Pilih kurikulum, telusuri mata pelajaran, dan lihat modul yang
              tersedia untuk anak Anda.
            </p>
          </div>

          <div style={S.childCardsRow}>
            {childrenData.map((child, idx) => {
              const isActive = idx === selectedChildIdx
              const initial = child.name.charAt(0).toUpperCase()
              return isActive ? (
                <div key={child.id} style={S.childCardActive}>
                  <div style={S.childAvatarWrap}>
                    <div style={S.childAvatarActive}>{initial}</div>
                    <span style={S.onlineDot} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={S.childRow}>
                      <span style={S.childNameActive}>{child.name}</span>
                      <span style={S.activeTag}>Aktif</span>
                    </div>
                    <p style={{ ...S.childGrade, color: colors.brand700 }}>
                      Kelas {child.grade ?? '?'} SD • Sem.{' '}
                      {child.semester ?? '?'}
                    </p>
                    <div style={S.childMetaRow}>
                      <span
                        style={{ color: colors.amber, fontWeight: 500 }}
                      >
                        ★ Modul tersedia
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  key={child.id}
                  style={S.childCardInactive}
                  onClick={() => {
                    onChildChange(idx)
                    setActiveSubjectId(null)
                  }}
                >
                  <div style={S.childAvatarInactive}>{initial}</div>
                  <div style={{ flex: 1 }}>
                    <div style={S.childRow}>
                      <span style={S.childNameInactive}>{child.name}</span>
                      <button
                        style={S.pilihBtn}
                        onClick={(e) => {
                          e.stopPropagation()
                          onChildChange(idx)
                          setActiveSubjectId(null)
                        }}
                      >
                        Pilih
                      </button>
                    </div>
                    <p style={S.childGrade}>
                      Kelas {child.grade ?? '?'} SD • Sem.{' '}
                      {child.semester ?? '?'}
                    </p>
                  </div>
                </div>
              )
            })}

            <div style={S.manageColumn}>
              <button style={S.manageBtn}>
                <IconPlus />
                Kelola Profil
              </button>
              <button style={S.addChildBtn}>+ Tambah Anak</button>
            </div>
          </div>
        </div>

        <div style={S.filterBar}>
          <div style={S.filterGroup}>
            <div style={S.dropdownChip}>
              <span style={S.dropdownChipLabel}>Tingkat:</span>
              <span>Kelas {activeChild?.grade ?? '?'} SD</span>
              <IconChevronDown color={colors.slate400} />
            </div>
            <div style={S.dropdownChip}>
              <span style={S.dropdownChipLabel}>Semester:</span>
              <span>Semester {activeChild?.semester ?? '?'}</span>
              <IconChevronDown color={colors.slate400} />
            </div>
            <div style={S.curriculumTag}>
              <IconCheckCircle />
              Kurikulum Merdeka Mandiri
            </div>
          </div>

          <div style={S.searchWrap}>
            <input
              style={S.searchInput}
              placeholder='Cari topik atau materi pelajaran...'
              type='text'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span style={S.searchIconPos}>
              <IconSearch />
            </span>
          </div>
        </div>
      </section>

      {loading ? (
        <div
          style={{
            padding: 60,
            textAlign: 'center',
            color: colors.slate400,
            fontSize: 14,
          }}
        >
          Memuat modul belajar...
        </div>
      ) : modules.length === 0 ? (
        <div
          style={{
            padding: 60,
            textAlign: 'center',
            color: colors.slate400,
            fontSize: 14,
          }}
        >
          Belum ada modul untuk kelas ini.
        </div>
      ) : (
        /* Master-detail grid */
        <div style={{ ...S.grid, ...gridDesktop }}>
          {/* Left panel: subject list */}
          <section style={{ ...S.panel, ...panelDesktop }}>
            <div style={S.panelHeaderRow}>
              <div>
                <h3 style={S.panelTitle}>Daftar Mata Pelajaran</h3>
                <p style={S.panelSubtitle}>
                  Pilih salah satu mapel untuk menampilkan modul & bahasan.
                </p>
              </div>
              <span style={S.countBadge}>
                {subjectsWithModules.length} Mata Pelajaran
              </span>
            </div>

            <div>
              {subjectsWithModules.map((subject) => {
                const isSelected = subject.id === activeSubjectId
                const subjectModules = modules.filter(
                  (m) => m.subjectId === subject.id,
                )
                return (
                  <div key={subject.id}>
                    <div
                      style={{
                        ...S.subjectCard,
                        ...(isSelected ? S.subjectCardActive : {}),
                        borderLeftWidth: isSelected ? 4 : 2,
                        borderLeftStyle: 'solid',
                        borderLeftColor: isSelected
                          ? colors.brand600
                          : colors.slate100,
                      }}
                      onClick={() =>
                        setActiveSubjectId(isSelected ? null : subject.id)
                      }
                    >
                      <div
                        style={{
                          ...S.subjectIconWrap,
                          backgroundColor: `${subject.accent}18`,
                        }}
                      >
                        {subject.icon}
                      </div>
                      <div style={S.subjectInfo}>
                        <div style={S.subjectName}>{subject.name}</div>
                        <div style={S.subjectMeta}>
                          {subjectModules.length} topik tersedia
                        </div>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            ...S.subjectModuleBadge,
                            color: subject.accent,
                            backgroundColor: `${subject.accent}15`,
                          }}
                        >
                          {subjectModules.length} modul
                        </span>
                        <svg
                          width='16'
                          height='16'
                          fill='none'
                          stroke={isSelected ? subject.accent : colors.slate400}
                          strokeWidth='2.5'
                          viewBox='0 0 24 24'
                          style={{
                            transform: isSelected
                              ? 'rotate(180deg)'
                              : 'rotate(0deg)',
                            transition: 'transform 0.2s',
                            flexShrink: 0,
                          }}
                        >
                          <path
                            d='M19 9l-7 7-7-7'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                          />
                        </svg>
                      </div>
                    </div>

                    {/* Expanded module list */}
                    {isSelected && (
                      <div style={S.moduleList}>
                        {subjectModules.map((mod) => (
                          <div
                            key={mod.id}
                            onClick={() => navigate(`/modul/${mod.id}`)}
                            style={S.moduleItem}
                          >
                            <div
                              style={{
                                ...S.moduleIcon,
                                backgroundColor: `${subject.accent}15`,
                              }}
                            >
                              {KIND_ICON[mod.firstFrameKind] ?? '📄'}
                            </div>
                            <div style={S.moduleInfo}>
                              <div style={S.moduleTitle}>{mod.title}</div>
                              <div style={S.moduleMeta}>
                                {mod.frameCount} panel ·{' '}
                                {mod.estimatedMinutes}
                              </div>
                            </div>
                            <svg
                              width='16'
                              height='16'
                              fill='none'
                              stroke={colors.slate400}
                              strokeWidth='2'
                              viewBox='0 0 24 24'
                            >
                              <path
                                d='M9 5l7 7-7 7'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                              />
                            </svg>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Progress summary card */}
            {activeSubject && (
              <div style={S.progressCard}>
                <div>
                  <span style={S.progressLabel}>
                    Status Modul {activeSubject.shortName}
                  </span>
                  <h4 style={S.progressTitle}>
                    {activeSubjectModules.length} Topik Tersedia
                  </h4>
                  <p style={S.progressSub}>
                    Modul pembelajaran untuk{' '}
                    {activeChild?.name?.split(' ')[0] ?? 'anak'} di{' '}
                    {activeSubject.name}.
                  </p>
                </div>
                <button style={S.quizBtn}>Uji Pemahaman Anak</button>
              </div>
            )}
          </section>

          {/* Right panel: detail topik */}
          <section style={{ ...S.panel, ...panelDesktop }}>
            <div>
              <h3 style={S.panelTitle}>Detail Topik & Pilih Bahasan Materi</h3>
              <p style={S.panelSubtitle}>
                Atur aktivitas belajar yang akan ditampilkan pada dasbor siswa{' '}
                {activeChild?.name?.split(' ')[0] ?? 'anak'}.
              </p>
            </div>

            {activeSubjectId && activeSubject ? (
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 20,
                    padding: '12px 14px',
                    borderRadius: 12,
                    backgroundColor: `${activeSubject.accent}11`,
                    border: `1px solid ${activeSubject.accent}30`,
                  }}
                >
                  <span style={{ fontSize: 24 }}>{activeSubject.icon}</span>
                  <div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: colors.slate900,
                      }}
                    >
                      {activeSubject.name}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: colors.slate400,
                      }}
                    >
                      {activeSubjectModules.length} topik · {childGradeText}
                    </div>
                  </div>
                </div>

                {filteredModules.length === 0 ? (
                  <div
                    style={{
                      padding: 40,
                      textAlign: 'center',
                      color: colors.slate400,
                      fontSize: 13,
                    }}
                  >
                    {search.trim()
                      ? 'Tidak ada topik yang sesuai dengan pencarian.'
                      : 'Belum ada topik untuk mata pelajaran ini.'}
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    {filteredModules.map((mod, idx) => (
                      <div
                        key={mod.id}
                        onClick={() => navigate(`/modul/${mod.id}`)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '14px 16px',
                          borderRadius: 14,
                          background: colors.white,
                          border: `1px solid ${colors.slate100}`,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            backgroundColor: `${activeSubject.accent}15`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 18,
                            flexShrink: 0,
                          }}
                        >
                          {KIND_ICON[mod.firstFrameKind] ?? '📄'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: colors.slate900,
                            }}
                          >
                            {mod.title}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: colors.slate400,
                              marginTop: 2,
                            }}
                          >
                            {mod.frameCount} panel · {mod.estimatedMinutes}
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: activeSubject.accent,
                            backgroundColor: `${activeSubject.accent}15`,
                            padding: '4px 10px',
                            borderRadius: 8,
                          }}
                        >
                          #{idx + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 20,
                    paddingTop: 16,
                    borderTop: `1px solid ${colors.slate100}`,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: colors.slate400,
                    }}
                  >
                    {filteredModules.length} dari {activeSubjectModules.length}{' '}
                    topik ditampilkan
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      style={{
                        padding: '8px 16px',
                        borderRadius: 10,
                        border: `1px solid ${colors.slate200}`,
                        backgroundColor: colors.white,
                        color: colors.slate600,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Simpan Pengaturan
                    </button>
                    <button
                      style={{
                        padding: '8px 16px',
                        borderRadius: 10,
                        border: 'none',
                        backgroundColor: colors.brand600,
                        color: colors.white,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <IconPlus />
                      Tugaskan ke {activeChild?.name?.split(' ')[0] ?? 'Anak'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  padding: 60,
                  textAlign: 'center',
                  color: colors.slate400,
                  fontSize: 14,
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 12 }}>📖</div>
                <p style={{ fontWeight: 600, marginBottom: 4 }}>
                  Pilih mata pelajaran
                </p>
                <p style={{ fontSize: 12 }}>
                  Klik salah satu mata pelajaran di panel kiri untuk melihat
                  detail topiknya.
                </p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

export default ModulBelajar
