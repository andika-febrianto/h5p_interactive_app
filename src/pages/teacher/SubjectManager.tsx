import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchSubjects, createSubject, updateSubject, deleteSubject, ApiError } from '../../lib/api';
import { slugify } from '../../lib/idgen';
import type { Subject } from '../../types/storyboard';
import { RichTextEditor } from '../../components/teacher/RichTextEditor';

const emptyForm = { name: '', shortName: '', description: '', icon: '📘', accent: '#5B5FEF' };

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

export default function SubjectManager() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* ── Pelajaran Baru modal ── */
  const [showNewModal, setShowNewModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  /* ── Sunting modal ── */
  const [editSubject, setEditSubject] = useState<Subject | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = () => {
    fetchSubjects()
      .then(setSubjects)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Gagal memuat data.'));
  };

  useEffect(load, []);

  /* Populate edit form when editSubject changes */
  useEffect(() => {
    if (editSubject) {
      setEditForm({
        name: editSubject.name,
        shortName: editSubject.shortName,
        description: editSubject.description,
        icon: editSubject.icon,
        accent: editSubject.accent,
      });
      setSaveError(null);
    }
  }, [editSubject]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const id = slugify(form.shortName || form.name);
      await createSubject({ id, ...form });
      setForm(emptyForm);
      setShowNewModal(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal membuat mata pelajaran.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSubject) return;
    setSaveError(null);
    setSaving(true);
    try {
      await updateSubject(editSubject.id, {
        name: editForm.name,
        shortName: editForm.shortName,
        description: editForm.description,
        icon: editForm.icon,
        accent: editForm.accent,
      });
      setEditSubject(null);
      load();
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Gagal menyimpan perubahan.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Hapus mata pelajaran "${id}"?`)) return;
    setError(null);
    try {
      await deleteSubject(id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menghapus.');
    }
  };

  return (
    <div className="home-page">
      <div className="home-inner">
        <button type="button" className="home-back" onClick={() => navigate('/guru')}>
          ← Kelola Konten
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}>
          <div>
            <p className="home-eyebrow">Guru</p>
            <h1 className="home-title" style={{ marginBottom: 0 }}>Kelola Mata Pelajaran</h1>
          </div>
          <button type="button" className="btn-primary" onClick={() => setShowNewModal(true)}>
            + Pelajaran Baru
          </button>
        </div>

        {error && <p className="auth-error" style={{ maxWidth: 480 }}>{error}</p>}

        {subjects === null ? (
          <p className="home-empty">Memuat...</p>
        ) : subjects.length === 0 ? (
          <p className="home-empty">Belum ada mata pelajaran.</p>
        ) : (
          <div className="report-table-wrap">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Ikon</th>
                  <th>Nama</th>
                  <th>Short Name</th>
                  <th>id</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((s) => (
                  <tr key={s.id}>
                    <td>{s.icon}</td>
                    <td>{s.name}</td>
                    <td>{s.shortName}</td>
                    <td><code>{s.id}</code></td>
                    <td style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setEditSubject(s)}
                      >
                        Sunting
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => handleDelete(s.id)}
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pelajaran Baru Modal ── */}
      <Modal open={showNewModal} onClose={() => setShowNewModal(false)} title="✨ Pelajaran Baru">
        <form className="modal-form" onSubmit={handleCreate}>
          <label className="auth-field">
            <span>Nama lengkap *</span>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="mis. Ilmu Pengetahuan Alam"
              required
            />
          </label>
          <label className="auth-field">
            <span>Nama singkat (untuk kartu) *</span>
            <input
              value={form.shortName}
              onChange={(e) => setForm({ ...form, shortName: e.target.value })}
              placeholder="mis. IPA"
              required
            />
          </label>
          <label className="auth-field">
            <span>Deskripsi singkat</span>
            <div className="modal-rich-text-wrap">
              <RichTextEditor
                value={form.description}
                onChange={(html) => setForm({ ...form, description: html })}
                placeholder="Deskripsi mata pelajaran ini..."
              />
            </div>
          </label>
          <div className="modal-form-row">
            <label className="auth-field">
              <span>Ikon (emoji)</span>
              <input
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                placeholder="🔬"
                required
              />
            </label>
            <label className="auth-field">
              <span>Warna aksen</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="color"
                  value={form.accent}
                  onChange={(e) => setForm({ ...form, accent: e.target.value })}
                  style={{ width: 48, height: 40, padding: 2, borderRadius: 8, cursor: 'pointer' }}
                />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--muted)' }}>
                  {form.accent}
                </span>
              </div>
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => setShowNewModal(false)}>
              Batal
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Menyimpan...' : '✨ Tambah Pelajaran'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Sunting Pelajaran Modal ── */}
      <Modal open={!!editSubject} onClose={() => setEditSubject(null)} title={`Sunting: ${editSubject?.name ?? ''}`}>
        {editSubject && (
          <form className="modal-form" onSubmit={handleSaveEdit}>
            <div className="modal-form-row">
              <label className="auth-field">
                <span>id (slug)</span>
                <input
                  type="text"
                  value={editSubject.id}
                  readOnly
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
              </label>
              <label className="auth-field">
                <span>Ikon (emoji)</span>
                <input
                  value={editForm.icon}
                  onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })}
                  required
                />
              </label>
            </div>

            <label className="auth-field">
              <span>Nama lengkap *</span>
              <input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </label>
            <label className="auth-field">
              <span>Nama singkat (untuk kartu) *</span>
              <input
                value={editForm.shortName}
                onChange={(e) => setEditForm({ ...editForm, shortName: e.target.value })}
                required
              />
            </label>
            <label className="auth-field">
              <span>Deskripsi singkat</span>
              <div className="modal-rich-text-wrap">
                <RichTextEditor
                  value={editForm.description}
                  onChange={(html) => setEditForm({ ...editForm, description: html })}
                  placeholder="Deskripsi mata pelajaran ini..."
                />
              </div>
            </label>
            <label className="auth-field">
              <span>Warna aksen</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="color"
                  value={editForm.accent}
                  onChange={(e) => setEditForm({ ...editForm, accent: e.target.value })}
                  style={{ width: 48, height: 40, padding: 2, borderRadius: 8, cursor: 'pointer' }}
                />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--muted)' }}>
                  {editForm.accent}
                </span>
              </div>
            </label>

            {saveError && <p className="auth-error">{saveError}</p>}

            <button type="submit" className="btn-primary modal-submit-btn" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
}
