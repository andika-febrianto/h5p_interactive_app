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
import { RichTextEditor } from '../../components/teacher/RichTextEditor';
import { Pagination } from '../../components/Pagination';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const KIND_ICON: Record<string, string> = {
  text: '📄',
  quiz: '❓',
  dragdrop: '🧩',
  video: '🎬',
  pdf: '📕',
  shortanswer: '✏️',
};

/** Sortable frame row that supports drag-and-drop reordering */
function SortableFrameRow({
  f,
  globalIndex,
  editingSlug,
  editingFrame,
  totalFrames,
  onMove,
  onSave,
  onToggleEdit,
  onDelete,
}: {
  f: Frame;
  globalIndex: number;
  editingSlug: string | null;
  editingFrame: Frame | null;
  totalFrames: number;
  onMove: (index: number, direction: -1 | 1) => void;
  onSave: (payload: Record<string, unknown>) => Promise<void>;
  onToggleEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: f.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: 'relative',
    zIndex: isDragging ? 50 : undefined,
  };

  const kindLabel: Record<string, string> = {
    text: 'Materi Teks',
    quiz: 'Kuis Pilihan Ganda',
    dragdrop: 'Aktivitas Seret & Letak',
    video: 'Video Interaktif',
    pdf: 'Dokumen PDF',
    shortanswer: 'Isian Singkat',
  };

  return (
    <div className="stepsweb-frame-row" ref={setNodeRef} style={style}>
      <div className="stepsweb-frame-card">
        <div className="stepsweb-frame-header">
          <span className="stepsweb-frame-drag" {...attributes} {...listeners} title="Geser untuk mengubah posisi">
            ⠿
          </span>
          <h3 className="stepsweb-frame-title">{f.title || `Panel ${f.panel}`}</h3>
          <div className="stepsweb-frame-actions">
            <button
              type="button"
              className="stepsweb-btn-arrow"
              onClick={() => onMove(globalIndex, -1)}
              disabled={globalIndex === 0}
              title="Pindah ke atas"
            >
              ▲
            </button>
            <button
              type="button"
              className="stepsweb-btn-arrow"
              onClick={() => onMove(globalIndex, 1)}
              disabled={globalIndex === totalFrames - 1}
              title="Pindah ke bawah"
            >
              ▼
            </button>
            <button
              type="button"
              className="stepsweb-btn-delete"
              onClick={() => onDelete(f.id)}
              title="Hapus panel"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="stepsweb-frame-meta">
          <span className="stepsweb-frame-meta-item">
            <strong>Jenis:</strong> {KIND_ICON[f.kind]} {kindLabel[f.kind] ?? f.kind}
          </span>
          <span className="stepsweb-frame-meta-item">
            <strong>Panel:</strong> {f.panel}
          </span>
        </div>
        <div className="stepsweb-frame-edit-row">
          <button
            type="button"
            className="stepsweb-btn-edit"
            onClick={() => onToggleEdit(f.id)}
          >
            {editingSlug === f.id ? '✕ Tutup' : '✎ Sunting'}
          </button>
        </div>
      </div>

      {editingSlug === f.id && editingFrame && (
        <div className="stepsweb-edit-panel">
          <FrameForm
            frame={editingFrame}
            isNew={false}
            onSave={onSave}
            onCancel={() => onToggleEdit(f.id)}
          />
        </div>
      )}
    </div>
  );
}

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

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

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

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!mod || !moduleId) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = mod.frames.findIndex((f) => f.id === active.id);
    const newIndex = mod.frames.findIndex((f) => f.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(mod.frames.map((f) => f.id), oldIndex, newIndex);
    try {
      await reorderFrames(moduleId, newOrder);
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
            <RichTextEditor
              value={form.subtitle}
              onChange={(html) => setForm({ ...form, subtitle: html })}
              placeholder="Tulis subjudul modul..."
            />
          </label>
          <label className="auth-field">
            <span>Ringkasan (tampil di kartu modul)</span>
            <RichTextEditor
              value={form.summary}
              onChange={(html) => setForm({ ...form, summary: html })}
              placeholder="Tulis ringkasan singkat modul..."
            />
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

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={mod.frames.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                <div className="frame-list">
                  {visibleFrames.map((f, localIdx) => {
                    const i = pageStart + localIdx;
                    return (
                      <SortableFrameRow
                        key={f.id}
                        f={f}
                        globalIndex={i}
                        editingSlug={editingSlug}
                        editingFrame={editingSlug === f.id ? editingFrame : null}
                        totalFrames={mod.frames.length}
                        onMove={handleMove}
                        onSave={handleSaveFrame}
                        onToggleEdit={(id) => {
                          setAddingFrame(false);
                          setEditingSlug(editingSlug === id ? null : id);
                        }}
                        onDelete={handleDeleteFrame}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>

            <Pagination page={framePage} totalPages={totalFramePages} onChange={setFramePage} />

            {addingFrame ? (
              <div className="stepsweb-edit-panel" style={{ marginTop: 16 }}>
                <FrameForm frame={null} isNew onSave={handleSaveFrame} onCancel={() => setAddingFrame(false)} />
              </div>
            ) : (
              <button
                type="button"
                className="stepsweb-add-item"
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
