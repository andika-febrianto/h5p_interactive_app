import React, { useMemo, useState } from 'react'

/**
 * ModulBelajar.tsx
 * Single-file React + TypeScript conversion of the "Perpustakaan Belajar"
 * parent dashboard, using inline object styles (const S = {...}) instead
 * of Tailwind classes.
 */

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
// Data types
// ---------------------------------------------------------------------------

interface Child {
  id: string
  name: string
  initial: string
  grade: string
  points: number
  status: string
  active: boolean
  avatarBg: string
}

interface Subject {
  id: string
  icon: string
  name: string
  shortName: string
  selected?: boolean
}

interface TopicItem {
  id: string
  icon: string
  label: string
  type: string
}

// ---------------------------------------------------------------------------
// Static content (mirrors original markup)
// ---------------------------------------------------------------------------

const CHILDREN: Child[] = [
  {
    id: 'dylan',
    name: 'Dylan Pratama',
    initial: 'D',
    grade: 'Kelas 3 SD • Sem. 1',
    points: 20,
    status: 'Modul Aktif',
    active: true,
    avatarBg: colors.brand600,
  },
  {
    id: 'zaki',
    name: 'Zaki Al-Fatih',
    initial: 'Z',
    grade: 'Kelas 1 SD • Sem. 1',
    points: 10,
    status: 'Selesai Hari Ini ✓',
    active: false,
    avatarBg: colors.slate100,
  },
]

const SUBJECTS: Subject[] = [
  {
    id: 'bahasa-indonesia',
    icon: '📖',
    name: 'Bahasa Indonesia',
    shortName: 'B. Indonesia',
  },
  {
    id: 'ipas',
    icon: '🔬',
    name: 'IPAS (Ilmu Pengetahuan Alam dan Sosial)',
    shortName: 'IPAS',
  },
  {
    id: 'matematika',
    icon: '➗',
    name: 'Matematika',
    shortName: 'Matematika',
    selected: true,
  },
  {
    id: 'pai',
    icon: '🕌',
    name: 'Pendidikan Agama Islam (PAI)',
    shortName: 'PAI',
  },
  { id: 'sbdp', icon: '🎨', name: 'Seni Budaya & Prakarya', shortName: 'SBdP' },
  {
    id: 'bahasa-inggris',
    icon: '🇬🇧',
    name: 'Bahasa Inggris (English For Kids)',
    shortName: 'B. Inggris',
  },
]

const TOPIC_ITEMS: TopicItem[] = [
  {
    id: 't1',
    icon: '📄',
    label: 'Mengenal Bilangan Cacah sampai 1.000',
    type: '(Materi)',
  },
  {
    id: 't2',
    icon: '📕',
    label: 'Baca Buku Aslinya (Opsional)',
    type: '(Dokumen PDF)',
  },
  {
    id: 't3',
    icon: '🎬',
    label: 'Video: Membaca dan Menulis Bilangan',
    type: '(Video Interaktif)',
  },
  {
    id: 't4',
    icon: '🧩',
    label: 'Pasangkan Bilangan dengan Cara Membacanya',
    type: '(Drag & Drop)',
  },
  {
    id: 't5',
    icon: '📄',
    label: 'Nilai Tempat: Ratusan, Puluhan, Satuan',
    type: '(Materi)',
  },
  {
    id: 't6',
    icon: '🎮',
    label: 'Kuis Cepat Nilai Tempat',
    type: '(Kuis 10 Soal)',
  },
  {
    id: 't7',
    icon: '✍️',
    label: 'Latihan Menulis Bilangan Berdasarkan Gambar',
    type: '(Latihan Interaktif)',
  },
]

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

  // Header
  header: {
    backgroundColor: colors.white,
    borderBottom: `1px solid ${colors.slate100}`,
    position: 'sticky',
    top: 0,
    zIndex: 40,
    boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
  },
  headerInner: {
    maxWidth: 1440,
    margin: '0 auto',
    padding: '0 24px',
    height: 80,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  brandGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    minWidth: 'max-content',
  },
  brandMark: {
    width: 40,
    height: 40,
    backgroundColor: colors.brand600,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.white,
    boxShadow: `0 4px 10px ${colors.brand600}33`,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: colors.slate900,
    lineHeight: 1.15,
    letterSpacing: '-0.01em',
    margin: 0,
  },
  brandTitleAccent: { color: colors.brand600 },
  modeBadge: {
    display: 'inline-block',
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: colors.brand600,
    backgroundColor: colors.brand50,
    padding: '2px 8px',
    borderRadius: 999,
    marginTop: 2,
  },

  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(248,250,252,0.8)',
    padding: 6,
    borderRadius: 16,
    border: `1px solid ${colors.slate100}`,
  },
  navLink: {
    padding: '8px 16px',
    fontSize: 14,
    fontWeight: 600,
    color: colors.slate600,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    textDecoration: 'none',
    cursor: 'pointer',
  },
  navLinkActive: {
    padding: '8px 16px',
    fontSize: 14,
    fontWeight: 600,
    color: colors.white,
    backgroundColor: colors.brand600,
    borderRadius: 12,
    boxShadow: `0 2px 6px ${colors.brand600}4D`,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    textDecoration: 'none',
    cursor: 'pointer',
  },

  headerActions: { display: 'flex', alignItems: 'center', gap: 16 },
  switchLink: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    fontWeight: 600,
    color: colors.brand600,
    backgroundColor: colors.brand50,
    padding: '8px 14px',
    borderRadius: 12,
    textDecoration: 'none',
    cursor: 'pointer',
  },
  bellButton: {
    position: 'relative',
    padding: 10,
    color: colors.slate500,
    backgroundColor: colors.slate50,
    borderRadius: 12,
    border: `1px solid ${colors.slate200}`,
    cursor: 'pointer',
  },
  bellBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    backgroundColor: colors.rose500,
    color: colors.white,
    fontSize: 10,
    fontWeight: 700,
    borderRadius: 999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `2px solid ${colors.white}`,
  },
  profilePill: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 8,
    paddingTop: 4,
    paddingBottom: 4,
    paddingRight: 12,
    backgroundColor: colors.white,
    border: `1px solid ${colors.slate200}`,
    borderRadius: 16,
    boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
    cursor: 'pointer',
  },
  profileAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.blue600,
    color: colors.white,
    fontWeight: 700,
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: { fontSize: 12, fontWeight: 700, color: colors.slate800 },
  profileRoleTag: {
    backgroundColor: colors.emerald50,
    color: colors.emerald700,
    border: `1px solid ${colors.emerald200}`,
    fontSize: 10,
    padding: '1px 6px',
    borderRadius: 4,
    fontWeight: 600,
  },
  profileSub: {
    fontSize: 10,
    color: colors.slate400,
    display: 'block',
    maxWidth: 150,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  // Main
  main: {
    flex: 1,
    maxWidth: 1440,
    width: '100%',
    margin: '0 auto',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },

  // Banner section
  bannerSection: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
    border: `1px solid ${colors.slate100}`,
    boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
  },
  bannerFlex: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 24,
  },
  semesterBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '4px 12px',
    backgroundColor: colors.brand50,
    border: `1px solid ${colors.brand100}`,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    color: colors.brand700,
    marginBottom: 12,
  },
  dotPulse: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.mint,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 800,
    color: colors.slate900,
    letterSpacing: '-0.02em',
    margin: 0,
  },
  pageSubtitle: {
    color: colors.slate500,
    fontSize: 14,
    marginTop: 4,
    maxWidth: 560,
  },

  childCardsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
  },
  childCardActive: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(245,243,255,0.5)',
    border: `2px solid ${colors.brand600}`,
    borderRadius: 16,
    padding: 14,
    boxShadow: '0 1px 2px rgba(15,23,42,0.05)',
    minWidth: 240,
  },
  childCardInactive: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    border: `1px solid ${colors.slate200}`,
    borderRadius: 16,
    padding: 14,
    minWidth: 220,
    cursor: 'pointer',
  },
  childAvatarWrap: { position: 'relative' },
  childAvatarActive: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.brand600,
    color: colors.white,
    fontWeight: 800,
    fontSize: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `0 4px 10px ${colors.brand600}4D`,
  },
  childAvatarInactive: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.slate100,
    color: colors.slate600,
    fontWeight: 800,
    fontSize: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 14,
    height: 14,
    backgroundColor: colors.emerald500,
    border: `2px solid ${colors.white}`,
    borderRadius: 999,
  },
  childRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  childNameActive: { fontSize: 14, fontWeight: 800, color: colors.slate900 },
  childNameInactive: { fontSize: 14, fontWeight: 700, color: colors.slate800 },
  activeTag: {
    fontSize: 10,
    fontWeight: 700,
    color: colors.white,
    backgroundColor: colors.brand600,
    padding: '2px 8px',
    borderRadius: 999,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  pilihBtn: {
    fontSize: 12,
    fontWeight: 600,
    color: colors.brand600,
    backgroundColor: colors.brand50,
    padding: '4px 10px',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
  },
  childGrade: {
    fontSize: 12,
    color: colors.slate500,
    fontWeight: 600,
    marginTop: 2,
  },
  childMetaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    fontSize: 11,
    color: colors.slate500,
    fontWeight: 500,
  },
  pointsAmber: { color: colors.amber, fontWeight: 700 },
  statusEmerald: { color: colors.emerald600, fontWeight: 600 },

  manageColumn: { display: 'flex', flexDirection: 'column', gap: 6 },
  manageBtn: {
    padding: '8px 14px',
    fontSize: 12,
    fontWeight: 600,
    color: colors.white,
    backgroundColor: colors.brand600,
    borderRadius: 12,
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    boxShadow: '0 1px 2px rgba(15,23,42,0.05)',
    cursor: 'pointer',
  },
  addChildBtn: {
    padding: '6px 12px',
    fontSize: 11,
    fontWeight: 600,
    color: colors.slate600,
    backgroundColor: colors.slate100,
    borderRadius: 12,
    border: 'none',
    textAlign: 'center',
    cursor: 'pointer',
  },

  filterBar: {
    marginTop: 24,
    paddingTop: 20,
    borderTop: `1px solid ${colors.slate100}`,
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  filterGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
  },
  dropdownChip: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.slate50,
    border: `1px solid ${colors.slate200}`,
    padding: '8px 14px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 700,
    color: colors.slate700,
  },
  dropdownChipLabel: { color: colors.slate400, fontWeight: 400 },
  curriculumTag: {
    padding: '6px 12px',
    backgroundColor: colors.emerald50,
    border: `1px solid ${colors.emerald200}`,
    color: colors.emerald700,
    fontSize: 12,
    fontWeight: 700,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  searchWrap: { position: 'relative', width: '100%', maxWidth: 288 },
  searchInput: {
    width: '100%',
    paddingLeft: 36,
    paddingRight: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: colors.slate50,
    border: `1px solid ${colors.slate200}`,
    borderRadius: 12,
    fontSize: 12,
    color: colors.slate800,
    outline: 'none',
    boxSizing: 'border-box',
  },
  searchIconPos: {
    position: 'absolute',
    left: 12,
    top: 10,
    color: colors.slate400,
    pointerEvents: 'none',
  },

  // Grid
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: 24,
    alignItems: 'start',
  },

  panel: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
    border: `1px solid ${colors.slate100}`,
    boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  panelHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottom: `1px solid ${colors.slate100}`,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: 800,
    color: colors.slate900,
    margin: 0,
  },
  panelSubtitle: { fontSize: 12, color: colors.slate500, marginTop: 2 },
  countBadge: {
    fontSize: 12,
    fontWeight: 700,
    color: colors.brand600,
    backgroundColor: colors.brand50,
    padding: '4px 10px',
    borderRadius: 8,
  },

  tableWrap: { overflowX: 'auto' },
  table: {
    width: '100%',
    textAlign: 'left',
    fontSize: 12,
    borderCollapse: 'collapse',
  },
  theadRow: {
    backgroundColor: 'rgba(237,233,254,0.6)',
    color: colors.brand700,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  th: { padding: '12px 12px' },
  tbodyRowBase: {
    borderTop: `1px solid ${colors.slate100}`,
    cursor: 'pointer',
  },
  td: { padding: '14px 12px', fontWeight: 500 },
  tdIcon: { padding: '14px 12px', fontSize: 18 },
  tdName: { padding: '14px 12px', fontWeight: 700, color: colors.slate800 },
  tdNameSelected: {
    padding: '14px 12px',
    fontWeight: 800,
    color: colors.brand700,
  },
  tdMono: {
    padding: '14px 12px',
    fontFamily: 'monospace',
    fontSize: 11,
    color: colors.slate500,
  },
  tdMonoSelected: {
    padding: '14px 12px',
    fontFamily: 'monospace',
    fontSize: 11,
    color: colors.brand600,
  },
  tdRight: { padding: '14px 12px', textAlign: 'right' },
  selectedRowBadge: {
    display: 'inline-block',
    marginLeft: 6,
    padding: '2px 6px',
    fontSize: 9,
    backgroundColor: colors.brand600,
    color: colors.white,
    borderRadius: 4,
    textTransform: 'uppercase',
    fontWeight: 700,
  },
  rowActionBtn: {
    padding: '4px 10px',
    borderRadius: 8,
    color: colors.slate400,
    background: 'none',
    border: 'none',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  checkCircle: {
    width: 24,
    height: 24,
    backgroundColor: colors.brand600,
    color: colors.white,
    borderRadius: 999,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
  },

  progressCard: {
    marginTop: 8,
    background: `linear-gradient(90deg, ${colors.brand500}, #4338CA)`,
    borderRadius: 16,
    padding: 16,
    color: colors.white,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: colors.brand100,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  progressTitle: { fontSize: 13, fontWeight: 700, margin: '2px 0' },
  progressSub: { fontSize: 11, color: colors.brand100, margin: 0 },
  quizBtn: {
    padding: '8px 14px',
    backgroundColor: colors.white,
    color: colors.brand700,
    fontSize: 12,
    fontWeight: 700,
    borderRadius: 12,
    border: 'none',
    boxShadow: '0 1px 2px rgba(15,23,42,0.05)',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
  },

  formLabel: {
    display: 'block',
    fontSize: 12,
    fontWeight: 700,
    color: colors.slate700,
    marginBottom: 6,
  },
  selectBox: {
    width: '100%',
    backgroundColor: colors.white,
    border: `1px solid ${colors.slate200}`,
    borderRadius: 16,
    padding: '12px 16px',
    fontSize: 12,
    fontWeight: 700,
    color: colors.slate800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 1px 2px rgba(15,23,42,0.05)',
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
  selectBoxLeft: { display: 'flex', alignItems: 'center', gap: 10 },

  bahasanHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  bahasanTitle: {
    fontSize: 14,
    fontWeight: 800,
    color: colors.slate900,
    margin: 0,
  },
  deselectBtn: {
    fontSize: 12,
    fontWeight: 700,
    color: colors.brand600,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },

  topicList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    maxHeight: 380,
    overflowY: 'auto',
    paddingRight: 4,
  },
  topicItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: 'rgba(245,243,255,0.5)',
    border: `1px solid ${colors.brand100}`,
    borderRadius: 16,
    cursor: 'pointer',
  },
  checkbox: {
    width: 16,
    height: 16,
    accentColor: colors.brand600,
    flexShrink: 0,
  },
  topicIcon: { fontSize: 16, lineHeight: 1 },
  topicTextRow: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  topicLabel: { fontSize: 12, fontWeight: 700, color: colors.slate800 },
  topicType: { fontSize: 11, color: colors.slate400, fontWeight: 500 },

  footerActionsRow: {
    paddingTop: 16,
    borderTop: `1px solid ${colors.slate100}`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  counterText: { fontSize: 12, fontWeight: 700, color: colors.slate500 },
  footerBtnRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  saveBtn: {
    flex: 1,
    padding: '10px 16px',
    backgroundColor: colors.slate100,
    color: colors.slate700,
    fontSize: 12,
    fontWeight: 700,
    borderRadius: 12,
    border: 'none',
    cursor: 'pointer',
  },
  assignBtn: {
    flex: 1,
    padding: '10px 20px',
    backgroundColor: colors.brand600,
    color: colors.white,
    fontSize: 12,
    fontWeight: 700,
    borderRadius: 12,
    border: 'none',
    boxShadow: `0 4px 10px ${colors.brand600}4D`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    cursor: 'pointer',
  },

  // Footer
  footer: {
    backgroundColor: colors.white,
    borderTop: '1px solid rgba(226,232,240,0.8)',
    padding: '20px 0',
    marginTop: 'auto',
  },
  footerInner: {
    maxWidth: 1440,
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    fontSize: 12,
    color: colors.slate500,
  },
  footerBrand: { display: 'flex', alignItems: 'center', gap: 8 },
  footerBrandMark: {
    width: 20,
    height: 20,
    backgroundColor: colors.brand600,
    color: colors.white,
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10,
    fontWeight: 700,
  },
  footerLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: 20,
    color: colors.slate500,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  footerLink: {
    color: colors.slate500,
    textDecoration: 'none',
    cursor: 'pointer',
  },
}

// Responsive: two-column grid + row layouts above tablet width
const gridDesktop: React.CSSProperties = {
  gridTemplateColumns: 'repeat(12, 1fr)',
}
const panelDesktop: React.CSSProperties = { gridColumn: 'span 6 / span 6' }
const navDesktop: React.CSSProperties = { display: 'flex' }
const headerActionsRowDesktop: React.CSSProperties = { flexDirection: 'row' }

// ---------------------------------------------------------------------------
// Small icon helpers (inline SVG, no external deps)
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

const IconGrid: React.FC = () => (
  <svg
    width={16}
    height={16}
    viewBox='0 0 24 24'
    fill='none'
    stroke={colors.slate400}
    strokeWidth={2}
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path d='M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' />
  </svg>
)

const IconBook: React.FC<{ color?: string }> = ({ color = colors.white }) => (
  <svg
    width={16}
    height={16}
    viewBox='0 0 24 24'
    fill='none'
    stroke={color}
    strokeWidth={2}
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' />
  </svg>
)

const IconChart: React.FC = () => (
  <svg
    width={16}
    height={16}
    viewBox='0 0 24 24'
    fill='none'
    stroke={colors.slate400}
    strokeWidth={2}
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' />
  </svg>
)

const IconCalendar: React.FC = () => (
  <svg
    width={16}
    height={16}
    viewBox='0 0 24 24'
    fill='none'
    stroke={colors.slate400}
    strokeWidth={2}
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
  </svg>
)

const IconArrowRight: React.FC = () => (
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
    <path d='M14 5l7 7m0 0l-7 7m7-7H3' />
  </svg>
)

const IconBell: React.FC = () => (
  <svg
    width={20}
    height={20}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth={2}
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' />
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ModulBelajar: React.FC = () => {
  const [activeChildId, setActiveChildId] = useState<string>('dylan')
  const [activeSubjectId, setActiveSubjectId] = useState<string>('matematika')
  const [search, setSearch] = useState<string>('')

  const [checkedTopics, setCheckedTopics] = useState<Record<string, boolean>>(
    () => Object.fromEntries(TOPIC_ITEMS.map((t) => [t.id, true])),
  )

  const allSelected = useMemo(
    () => TOPIC_ITEMS.every((t) => checkedTopics[t.id]),
    [checkedTopics],
  )
  const selectedCount = useMemo(
    () => Object.values(checkedTopics).filter(Boolean).length,
    [checkedTopics],
  )

  const toggleTopic = (id: string) => {
    setCheckedTopics((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleAllTopics = () => {
    const next = !allSelected
    setCheckedTopics(Object.fromEntries(TOPIC_ITEMS.map((t) => [t.id, next])))
  }

  const activeSubject =
    SUBJECTS.find((s) => s.id === activeSubjectId) ?? SUBJECTS[2]
  const activeChild =
    CHILDREN.find((c) => c.id === activeChildId) ?? CHILDREN[0]

  return (
    <div style={S.page}>
      {/* ---------------------------------------------------------------- */}
      {/* Header */}
      {/* ---------------------------------------------------------------- */}
      <header style={S.header}>
        <div style={S.headerInner}>
          <div style={S.brandGroup}>
            <div style={S.brandMark}>
              <svg
                width={24}
                height={24}
                viewBox='0 0 24 24'
                fill='currentColor'
              >
                <path d='M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z' />
              </svg>
            </div>
            <div>
              <h1 style={S.brandTitle}>
                Perpustakaan
                <br />
                <span style={S.brandTitleAccent}>Belajar</span>
              </h1>
              <span style={S.modeBadge}>Mode Orang Tua / Pendamping SD</span>
            </div>
          </div>

          <nav style={{ ...S.nav, ...navDesktop }}>
            <a style={S.navLink}>
              <IconGrid />
              Ringkasan
            </a>
            <a style={S.navLinkActive}>
              <IconBook />
              Modul Belajar
            </a>
            <a style={S.navLink}>
              <IconChart />
              Laporan &amp; Rapor
            </a>
            <a style={S.navLink}>
              <IconCalendar />
              Jadwal &amp; Tugas
            </a>
          </nav>

          <div style={S.headerActions}>
            <a style={S.switchLink}>
              <span>Beralih ke Akun Siswa</span>
              <IconArrowRight />
            </a>
            <button style={S.bellButton} aria-label='Notifikasi'>
              <IconBell />
              <span style={S.bellBadge}>3</span>
            </button>
            <div style={S.profilePill}>
              <div style={S.profileAvatar}>A</div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={S.profileName}>Pak Andika</span>
                  <span style={S.profileRoleTag}>Orang Tua</span>
                </div>
                <span style={S.profileSub}>
                  Ayah dari Dylan (Kls 3) &amp; Zaki (Kls 1)
                </span>
              </div>
              <IconChevronDown />
            </div>
          </div>
        </div>
      </header>

      {/* ---------------------------------------------------------------- */}
      {/* Main */}
      {/* ---------------------------------------------------------------- */}
      <main style={S.main}>
        {/* Banner & child switcher */}
        <section style={S.bannerSection}>
          <div style={S.bannerFlex}>
            <div>
              <div style={S.semesterBadge}>
                <span style={S.dotPulse} />
                Semester Ganjil TA 2026/2027 • Kurikulum Merdeka
              </div>
              <h2 style={S.pageTitle}>Modul Belajar Siswa</h2>
              <p style={S.pageSubtitle}>
                Pilih kurikulum, telusuri mata pelajaran, dan atur penugasan
                bahasan materi yang disesuaikan dengan kemampuan anak Anda.
              </p>
            </div>

            <div style={S.childCardsRow}>
              {CHILDREN.map((child) =>
                child.id === activeChildId ? (
                  <div key={child.id} style={S.childCardActive}>
                    <div style={S.childAvatarWrap}>
                      <div style={S.childAvatarActive}>{child.initial}</div>
                      <span style={S.onlineDot} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={S.childRow}>
                        <span style={S.childNameActive}>{child.name}</span>
                        <span style={S.activeTag}>Aktif</span>
                      </div>
                      <p style={{ ...S.childGrade, color: colors.brand700 }}>
                        {child.grade}
                      </p>
                      <div style={S.childMetaRow}>
                        <span style={S.pointsAmber}>★ {child.points} Poin</span>
                        <span>•</span>
                        <span style={S.statusEmerald}>● {child.status}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div key={child.id} style={S.childCardInactive}>
                    <div style={S.childAvatarInactive}>{child.initial}</div>
                    <div style={{ flex: 1 }}>
                      <div style={S.childRow}>
                        <span style={S.childNameInactive}>{child.name}</span>
                        <button
                          style={S.pilihBtn}
                          onClick={() => setActiveChildId(child.id)}
                        >
                          Pilih
                        </button>
                      </div>
                      <p style={S.childGrade}>{child.grade}</p>
                      <div style={S.childMetaRow}>
                        <span style={{ color: colors.amber, fontWeight: 500 }}>
                          ★ {child.points} Poin
                        </span>
                        <span>•</span>
                        <span style={{ color: colors.emerald600 }}>
                          {child.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ),
              )}

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
                <span>Kelas 3 SD</span>
                <IconChevronDown color={colors.slate400} />
              </div>
              <div style={S.dropdownChip}>
                <span style={S.dropdownChipLabel}>Semester:</span>
                <span>Semester 1 (Ganjil 2026/2027)</span>
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

        {/* Master-detail grid */}
        <div style={{ ...S.grid, ...gridDesktop }}>
          {/* Left panel: subject list */}
          <section style={{ ...S.panel, ...panelDesktop }}>
            <div style={S.panelHeaderRow}>
              <div>
                <h3 style={S.panelTitle}>Daftar Mata Pelajaran</h3>
                <p style={S.panelSubtitle}>
                  Pilih salah satu mapel untuk menampilkan modul &amp; bahasan.
                </p>
              </div>
              <span style={S.countBadge}>{SUBJECTS.length} Mata Pelajaran</span>
            </div>

            <div style={S.tableWrap}>
              <table style={S.table}>
                <thead>
                  <tr style={S.theadRow}>
                    <th style={S.th} scope='col'>
                      Ikon
                    </th>
                    <th style={S.th} scope='col'>
                      Nama
                    </th>
                    <th style={S.th} scope='col'>
                      Short Name
                    </th>
                    <th style={S.th} scope='col'>
                      ID
                    </th>
                    <th style={{ ...S.th, textAlign: 'right' }} scope='col'>
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {SUBJECTS.map((subject) => {
                    const isSelected = subject.id === activeSubjectId
                    return (
                      <tr
                        key={subject.id}
                        onClick={() => setActiveSubjectId(subject.id)}
                        style={{
                          ...S.tbodyRowBase,
                          backgroundColor: isSelected
                            ? 'rgba(237,233,254,0.7)'
                            : 'transparent',
                          borderLeft: isSelected
                            ? `4px solid ${colors.brand600}`
                            : '4px solid transparent',
                        }}
                      >
                        <td style={S.tdIcon}>{subject.icon}</td>
                        <td style={isSelected ? S.tdNameSelected : S.tdName}>
                          {subject.name}
                          {isSelected && (
                            <span style={S.selectedRowBadge}>Terpilih</span>
                          )}
                        </td>
                        <td
                          style={{
                            ...S.td,
                            color: isSelected
                              ? colors.brand900
                              : colors.slate600,
                          }}
                        >
                          {subject.shortName}
                        </td>
                        <td style={isSelected ? S.tdMonoSelected : S.tdMono}>
                          {subject.id}
                        </td>
                        <td style={S.tdRight}>
                          {isSelected ? (
                            <span style={S.checkCircle}>✓</span>
                          ) : (
                            <button style={S.rowActionBtn}>Pilih →</button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div style={S.progressCard}>
              <div>
                <span style={S.progressLabel}>
                  Status Modul {activeSubject.shortName}
                </span>
                <h4 style={S.progressTitle}>12 Topik Tersedia • 45% Selesai</h4>
                <p style={S.progressSub}>
                  9 dari 20 materi latihan telah diselesaikan{' '}
                  {activeChild.name.split(' ')[0]} dengan sangat baik.
                </p>
              </div>
              <button style={S.quizBtn}>Uji Pemahaman Anak</button>
            </div>
          </section>

          {/* Right panel: module config */}
          <section style={{ ...S.panel, ...panelDesktop }}>
            <div>
              <h3 style={S.panelTitle}>
                Detail Topik &amp; Pilih Bahasan Materi
              </h3>
              <p style={S.panelSubtitle}>
                Atur aktivitas belajar yang akan ditampilkan pada dasbor siswa{' '}
                {activeChild.name.split(' ')[0]}.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={S.formLabel}>Mata Pelajaran</label>
                <div style={S.selectBox}>
                  <div style={S.selectBoxLeft}>
                    <span style={{ fontSize: 16 }}>{activeSubject.icon}</span>
                    <span>{activeSubject.name}</span>
                  </div>
                  <IconChevronDown color={colors.slate500} />
                </div>
              </div>

              <div>
                <label style={S.formLabel}>Topik</label>
                <div style={S.selectBox}>
                  <span>Bilangan Cacah sampai 1.000</span>
                  <IconChevronDown color={colors.slate500} />
                </div>
              </div>
            </div>

            <div style={S.bahasanHeaderRow}>
              <h4 style={S.bahasanTitle}>Pilih Bahasan</h4>
              <button style={S.deselectBtn} onClick={toggleAllTopics}>
                {allSelected ? 'Batalkan Semua' : 'Pilih Semua'}
              </button>
            </div>

            <div style={S.topicList}>
              {TOPIC_ITEMS.map((item) => (
                <label key={item.id} style={S.topicItem}>
                  <input
                    type='checkbox'
                    style={S.checkbox}
                    checked={!!checkedTopics[item.id]}
                    onChange={() => toggleTopic(item.id)}
                  />
                  <span style={S.topicIcon}>{item.icon}</span>
                  <div style={S.topicTextRow}>
                    <span style={S.topicLabel}>{item.label}</span>
                    <span style={S.topicType}>{item.type}</span>
                  </div>
                </label>
              ))}
            </div>

            <div style={S.footerActionsRow}>
              <span style={S.counterText}>
                {selectedCount} dari {TOPIC_ITEMS.length} panel dipilih
              </span>
              <div style={{ ...S.footerBtnRow, ...headerActionsRowDesktop }}>
                <button style={S.saveBtn}>Simpan Pengaturan</button>
                <button style={S.assignBtn}>
                  <IconPlus />
                  Tugaskan ke {activeChild.name.split(' ')[0]}
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* ---------------------------------------------------------------- */}
      {/* Footer */}
      {/* ---------------------------------------------------------------- */}
      <footer style={S.footer}>
        <div style={S.footerInner}>
          <div style={S.footerBrand}>
            <div style={S.footerBrandMark}>P</div>
            <span>
              © 2026 <strong>Perpustakaan Belajar</strong>. Platform Edukasi
              Interaktif Ramah Anak SD &amp; Orang Tua.
            </span>
          </div>
          <div style={S.footerLinks}>
            <a style={S.footerLink}>Pusat Bantuan Orang Tua</a>
            <span>•</span>
            <a style={S.footerLink}>Panduan Kurikulum Merdeka</a>
            <span>•</span>
            <a style={S.footerLink}>Kebijakan Privasi Anak</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default ModulBelajar
