import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchModules,
  deleteModule,
  createModule,
  fetchSubjects,
  type ModuleSummary,
  ApiError,
} from '../../lib/api';
import type { Subject } from '../../types/storyboard';
import { slugify } from '../../lib/idgen';
import { grades, semesters } from '../../data/grades';
import { Pagination } from '../../components/Pagination';

const PAGE_SIZE = 8;

/* ── Generic Modal Shell ── */
function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Tutup">
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export default function ModuleManager() {
  const navigate = useNavigate();
  const [modules, setModules] = useState<ModuleSummary[] | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  /* ── Modul Baru modal state ── */
  const [showNewModal, setShowNewModal] = useState(false);
  const [newForm, setNewForm] = useState({
    subjectId: '',
    grade: 1,
    semester: 1 as 1 | 2,
    title: '',
    subtitle: '',
    summary: '',
    estimatedMinutes: '10-15 menit',
    accent: '#6c5ce7',
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);



  const load = () => {
    fetchModules({})
      .then(setModules)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Gagal memuat data.'));
  };

  useEffect(() => {
    load();
    fetchSubjects()
      .then(setSubjects)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const filtered = useMemo(() => {
    if (!modules) return [];
    const q = search.trim().toLowerCase();
    if (!q) return modules;
    return modules.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.subtitle.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        m.subjectId.toLowerCase().includes(q)
    );
  }, [modules, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Hapus modul "${title}"? Semua panel di dalamnya ikut terhapus.`)) return;
    setError(null);
    try {
      await deleteModule(id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menghapus.');
    }
  };

  /* ── Create Module ── */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);
    try {
      const id = slugify(newForm.title);
      const created = await createModule({
        id,
        subjectId: newForm.subjectId,
        grade: newForm.grade,
        semester: newForm.semester,
        title: newForm.title,
        subtitle: newForm.subtitle,
        summary: newForm.summary,
        estimatedMinutes: newForm.estimatedMinutes,
        accent: newForm.accent,
      });
      setShowNewModal(false);
      setNewForm({
        subjectId: '',
        grade: 1,
        semester: 1,
        title: '',
        subtitle: '',
        summary: '',
        estimatedMinutes: '10-15 menit',
        accent: '#6c5ce7',
      });
      load();
      navigate(`/guru/modul/${created.id}`);
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : 'Gagal membuat modul.');
    } finally {
      setCreating(false);
    }
  };

  const subjectLabel = (id: string) => subjects.find((s) => s.id === id)?.shortName ?? id;
  const gradeLabel = (level: number) => grades.find((g) => g.level === level)?.label ?? `${level}`;
  const semesterLabel = (val: number) => semesters.find((s) => s.value === val)?.label ?? `Sem ${val}`;

  return (
    <div className="home-page">
      <div className="home-inner">
        <button type="button" className="home-back" onClick={() => navigate('/guru')}>
          ← Kelola Konten
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}>
          <div>
            <p className="home-eyebrow">Guru</p>
            <h1 className="home-title" style={{ marginBottom: 0 }}>Kelola Modul</h1>
          </div>
          <button type="button" className="btn-primary" onClick={() => setShowNewModal(true)}>
            + Modul Baru
          </button>
        </div>
        <p className="home-lede">Pilih modul untuk menyunting panelnya, atau buat modul baru.</p>

        {error && <p className="auth-error" style={{ maxWidth: 480 }}>{error}</p>}

        <div className="table-toolbar">
          <input
            type="search"
            className="table-search-input"
            placeholder="Cari judul, mata pelajaran, atau id modul..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {modules !== null && (
            <span className="table-toolbar-count">
              {filtered.length} dari {modules.length} modul
            </span>
          )}
        </div>

        {modules === null ? (
          <p className="home-empty">Memuat...</p>
        ) : filtered.length === 0 ? (
          <p className="home-empty">Tidak ada modul yang cocok dengan pencarian "{search}".</p>
        ) : (
          <>
            <div className="report-table-wrap">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Judul</th>
                    <th>Mapel</th>
                    <th>Kelas</th>
                    <th>Semester</th>
                    <th>Panel</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((m) => (
                    <tr key={m.id}>
                      <td>{m.title}</td>
                      <td>{subjectLabel(m.subjectId)}</td>
                      <td>{gradeLabel(m.grade)}</td>
                      <td>{semesterLabel(m.semester)}</td>
                      <td>{m.frameCount}</td>
                      <td style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => navigate(`/guru/modul/${m.id}`)}
                        >
                          Sunting
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => handleDelete(m.id, m.title)}
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </div>

      {/* ── Modul Baru Modal ── */}
      <Modal open={showNewModal} onClose={() => setShowNewModal(false)} title="✨ Modul Baru">
        <form className="modal-form" onSubmit={handleCreate}>
          <label className="auth-field">
            <span>Mata Pelajaran *</span>
            <select
              value={newForm.subjectId}
              onChange={(e) => setNewForm({ ...newForm, subjectId: e.target.value })}
              required
            >
              <option value="">Pilih mata pelajaran</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.icon} {s.shortName}</option>
              ))}
            </select>
          </label>

          <div className="modal-form-row">
            <label className="auth-field">
              <span>Kelas *</span>
              <select
                value={newForm.grade}
                onChange={(e) => setNewForm({ ...newForm, grade: Number(e.target.value) })}
                required
              >
                {grades.map((g) => (
                  <option key={g.level} value={g.level}>{g.label}</option>
                ))}
              </select>
            </label>
            <label className="auth-field">
              <span>Semester *</span>
              <select
                value={newForm.semester}
                onChange={(e) => setNewForm({ ...newForm, semester: Number(e.target.value) as 1 | 2 })}
                required
              >
                {semesters.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="auth-field">
            <span>Judul Modul *</span>
            <input
              type="text"
              value={newForm.title}
              onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
              required
              placeholder="Contoh: Bilangan Cacah sampai 1000"
            />
          </label>

          <label className="auth-field">
            <span>Sub Judul</span>
            <input
              type="text"
              value={newForm.subtitle}
              onChange={(e) => setNewForm({ ...newForm, subtitle: e.target.value })}
              placeholder="Ringkasan singkat untuk kartu modul"
            />
          </label>

          <label className="auth-field">
            <span>Ringkasan (tampilan di kartu)</span>
            <textarea
              value={newForm.summary}
              onChange={(e) => setNewForm({ ...newForm, summary: e.target.value })}
              rows={3}
              placeholder="Deskripsi modul yang ditampilkan di kartu murid"
            />
          </label>

          <div className="modal-form-row">
            <label className="auth-field">
              <span>Estimasi Waktu</span>
              <input
                type="text"
                value={newForm.estimatedMinutes}
                onChange={(e) => setNewForm({ ...newForm, estimatedMinutes: e.target.value })}
                placeholder="10-15 menit"
              />
            </label>
            <label className="auth-field">
              <span>Warna Aksen</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="color"
                  value={newForm.accent}
                  onChange={(e) => setNewForm({ ...newForm, accent: e.target.value })}
                  style={{ width: 48, height: 40, padding: 2, borderRadius: 8, cursor: 'pointer' }}
                />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--muted)' }}>
                  {newForm.accent}
                </span>
              </div>
            </label>
          </div>

          {createError && <p className="auth-error">{createError}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => setShowNewModal(false)}>
              Batal
            </button>
            <button type="submit" className="btn-primary" disabled={creating}>
              {creating ? 'Membuat...' : '✨ Buat Modul'}
            </button>
          </div>
        </form>
      </Modal>


    </div>
  );
}
