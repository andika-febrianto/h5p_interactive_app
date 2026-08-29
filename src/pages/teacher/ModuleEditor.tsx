import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  fetchModule,
  createModule,
  updateModule,
  createFrame,
  updateFrame,
  deleteFrame,
  reorderFrames,
  fetchSubjects,
  ApiError,
} from '../../lib/api';
import { slugify } from '../../lib/idgen';
import type { Module, Frame, Subject } from '../../types/storyboard';
import { FrameForm } from '../../components/teacher/FrameForm';
import { Pagination } from '../../components/Pagination';

const KIND_ICON: Record<string, string> = {
  text: '📄',
  quiz: '❓',
  dragdrop: '🧩',
  video: '🎬',
  pdf: '📕',
  shortanswer: '✏️',
};

const FRAMES_PER_PAGE = 5;

const emptyModuleForm = {
  id: '',
  subjectId: '',
  grade: 1,
  semester: 1 as 1 | 2,
  title: '',
  subtitle: '',
  summary: '',
  estimatedMinutes: '10-15 menit',
  accent: '#5B5FEF',
};

export default function ModuleEditor() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const isNew = moduleId === 'baru';
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [mod, setMod] = useState<Module | null>(null);
  const [form, setForm] = useState(emptyModuleForm);
  const [error, setError] = useState<string | null>(null);
  const [savingModule, setSavingModule] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null); // frame being edited
  const [addingFrame, setAddingFrame] = useState(false);
  const [framePage, setFramePage] = useState(1);

  useEffect(() => {
    fetchSubjects().then(setSubjects).catch(() => {});
  }, []);

  // Returns the freshly-loaded module so callers can act on the up-to-date
  // frame count right after a create/delete (e.g. jump to the right page).
  const loadModule = (): Promise<Module | null> => {
    if (isNew || !moduleId) return Promise.resolve(null);
    return fetchModule(moduleId)
      .then((m) => {
        setMod(m);
        setForm({
          id: m.id,
          subjectId: m.subjectId,
          grade: m.grade,
          semester: m.semester,
          title: m.title,
          subtitle: m.subtitle,
          summary: m.summary,
          estimatedMinutes: m.estimatedMinutes,
          accent: m.accent,
        });
        return m;
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Gagal memuat modul.');
        return null;
      });
  };

  useEffect(() => {
    loadModule();
    setFramePage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId, isNew]);

  // Keep the current page in range whenever the frame count changes (e.g.
  // deleting the last frame on the last page shouldn't leave an empty page).
  useEffect(() => {
    if (!mod) return;
    const totalPages = Math.max(1, Math.ceil(mod.frames.length / FRAMES_PER_PAGE));
    if (framePage > totalPages) setFramePage(totalPages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mod?.frames.length]);

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSavingModule(true);
    try {
      if (isNew) {
        const created = await createModule(form);
        navigate(`/guru/modul/${created.id}`, { replace: true });
      } else if (moduleId) {
        const { id: _id, ...rest } = form;
        await updateModule(moduleId, rest);
        loadModule();
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menyimpan modul.');
    } finally {
      setSavingModule(false);
    }
  };

  const handleSaveFrame = async (payload: Record<string, unknown>) => {
    if (!moduleId || isNew) return;
    const wasNewFrame = !editingSlug;
    if (editingSlug) {
      await updateFrame(moduleId, editingSlug, payload);
    } else {
      await createFrame(moduleId, payload);
    }
    setEditingSlug(null);
    setAddingFrame(false);
    const updated = await loadModule();
    // New panels are appended at the end — jump to the page that shows it,
    // so the teacher isn't left wondering whether it saved.
    if (wasNewFrame && updated) {
      setFramePage(Math.max(1, Math.ceil(updated.frames.length / FRAMES_PER_PAGE)));
    }
  };

  const handleDeleteFrame = async (slug: string) => {
    if (!moduleId || !confirm('Hapus panel ini?')) return;
    try {
      await deleteFrame(moduleId, slug);
      loadModule();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menghapus panel.');
    }
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    if (!mod || !moduleId) return;
    const order = mod.frames.map((f) => f.id);
    const target = index + direction;
    if (target < 0 || target >= order.length) return;
    [order[index], order[target]] = [order[target], order[index]];
    try {
      await reorderFrames(moduleId, order);
      loadModule();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal mengubah urutan.');
    }
  };

  const editingFrame: Frame | null = editingSlug ? mod?.frames.find((f) => f.id === editingSlug) ?? null : null;

  const totalFramePages = mod ? Math.max(1, Math.ceil(mod.frames.length / FRAMES_PER_PAGE)) : 1;
  const pageStart = (framePage - 1) * FRAMES_PER_PAGE;
  const visibleFrames = mod ? mod.frames.slice(pageStart, pageStart + FRAMES_PER_PAGE) : [];

  return (
    <div className="home-page">
      <div className="home-inner">
        <button type="button" className="home-back" onClick={() => navigate('/guru/modul')}>
          ← Semua modul
        </button>

        <p className="home-eyebrow">Guru</p>
        <h1 className="home-title">{isNew ? 'Modul Baru' : `Sunting: ${mod?.title ?? '...'}`}</h1>

        {error && <p className="auth-error" style={{ maxWidth: 560 }}>{error}</p>}

        <form className="auth-form" style={{ maxWidth: 560, marginBottom: 32 }} onSubmit={handleSaveModule}>
          <div className="frame-form-grid">
            <label className="auth-field">
              <span>id modul (slug)</span>
              <input
                value={form.id}
                onChange={(e) => setForm({ ...form, id: slugify(e.target.value) })}
                disabled={!isNew}
                required
              />
            </label>
            <label className="auth-field">
              <span>Mata pelajaran</span>
              <select
                value={form.subjectId}
                onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                required
              >
                <option value="" disabled>
                  Pilih...
                </option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.shortName}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="frame-form-grid">
            <label className="auth-field">
              <span>Kelas</span>
              <input
                type="number"
                min={1}
                max={12}
                value={form.grade}
                onChange={(e) => setForm({ ...form, grade: Number(e.target.value) })}
                required
              />
            </label>
            <label className="auth-field">
              <span>Semester</span>
              <select
                value={form.semester}
                onChange={(e) => setForm({ ...form, semester: Number(e.target.value) as 1 | 2 })}
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
              </select>
            </label>
          </div>
          <label className="auth-field">
            <span>Judul modul</span>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </label>
          <label className="auth-field">
            <span>Subjudul</span>
            <input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} required />
          </label>
          <label className="auth-field">
            <span>Ringkasan (tampil di kartu modul)</span>
            <input value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} required />
          </label>
          <div className="frame-form-grid">
            <label className="auth-field">
              <span>Estimasi waktu</span>
              <input
                value={form.estimatedMinutes}
                onChange={(e) => setForm({ ...form, estimatedMinutes: e.target.value })}
                required
              />
            </label>
            <label className="auth-field">
              <span>Warna aksen</span>
              <input
                type="color"
                value={form.accent}
                onChange={(e) => setForm({ ...form, accent: e.target.value })}
                style={{ height: 44, padding: 4 }}
              />
            </label>
          </div>
          <button className="btn-primary" type="submit" disabled={savingModule}>
            {savingModule ? 'Menyimpan...' : isNew ? 'Buat Modul' : 'Simpan Perubahan'}
          </button>
        </form>

        {!isNew && mod && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
              <h2 className="frame-section-title" style={{ margin: 0 }}>Panel ({mod.frames.length})</h2>
              {mod.frames.length > FRAMES_PER_PAGE && (
                <span className="table-toolbar-count">
                  Halaman {framePage} dari {totalFramePages}
                </span>
              )}
            </div>

            <div className="frame-list">
              {visibleFrames.map((f, localIdx) => {
                const i = pageStart + localIdx; // global index, needed for move up/down
                return (
                  <div className="frame-list-row" key={f.id}>
                    <span className="frame-list-icon">{KIND_ICON[f.kind]}</span>
                    <div className="frame-list-text">
                      <span className="frame-list-title">
                        {f.panel} — {f.title}
                      </span>
                      <span className="frame-list-kind">{f.kind}</span>
                    </div>
                    <div className="frame-list-actions">
                      <button type="button" className="btn-secondary btn-small" onClick={() => handleMove(i, -1)} disabled={i === 0}>
                        ↑
                      </button>
                      <button
                        type="button"
                        className="btn-secondary btn-small"
                        onClick={() => handleMove(i, 1)}
                        disabled={i === mod.frames.length - 1}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="btn-secondary btn-small"
                        onClick={() => {
                          setAddingFrame(false);
                          setEditingSlug(editingSlug === f.id ? null : f.id);
                        }}
                      >
                        {editingSlug === f.id ? 'Tutup' : 'Sunting'}
                      </button>
                      <button type="button" className="btn-secondary btn-small" onClick={() => handleDeleteFrame(f.id)}>
                        Hapus
                      </button>
                    </div>

                    {editingSlug === f.id && editingFrame && (
                      <div className="frame-form-wrap">
                        <FrameForm
                          frame={editingFrame}
                          isNew={false}
                          onSave={handleSaveFrame}
                          onCancel={() => setEditingSlug(null)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <Pagination page={framePage} totalPages={totalFramePages} onChange={setFramePage} />

            {addingFrame ? (
              <div className="frame-form-wrap" style={{ marginTop: 16 }}>
                <FrameForm frame={null} isNew onSave={handleSaveFrame} onCancel={() => setAddingFrame(false)} />
              </div>
            ) : (
              <button
                type="button"
                className="btn-primary"
                style={{ marginTop: 16 }}
                onClick={() => {
                  setEditingSlug(null);
                  setAddingFrame(true);
                }}
              >
                + Tambah Panel
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
