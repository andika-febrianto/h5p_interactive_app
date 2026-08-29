import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchSubjects, createSubject, deleteSubject, ApiError } from '../../lib/api';
import { slugify } from '../../lib/idgen';
import type { Subject } from '../../types/storyboard';

const emptyForm = { name: '', shortName: '', description: '', icon: '📘', accent: '#5B5FEF' };

export default function SubjectManager() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    fetchSubjects()
      .then(setSubjects)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Gagal memuat data.'));
  };

  useEffect(load, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const id = slugify(form.shortName || form.name);
      await createSubject({ id, ...form });
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal membuat mata pelajaran.');
    } finally {
      setSubmitting(false);
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

        <p className="home-eyebrow">Guru</p>
        <h1 className="home-title">Kelola Mata Pelajaran</h1>

        {error && <p className="auth-error" style={{ maxWidth: 480 }}>{error}</p>}

        <form className="auth-form" style={{ maxWidth: 480, marginBottom: 32 }} onSubmit={handleCreate}>
          <label className="auth-field">
            <span>Nama lengkap</span>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="mis. Ilmu Pengetahuan Alam"
              required
            />
          </label>
          <label className="auth-field">
            <span>Nama singkat (untuk kartu)</span>
            <input
              value={form.shortName}
              onChange={(e) => setForm({ ...form, shortName: e.target.value })}
              placeholder="mis. IPA"
              required
            />
          </label>
          <label className="auth-field">
            <span>Deskripsi singkat</span>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Satu kalimat tentang mata pelajaran ini"
              required
            />
          </label>
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
            <input
              type="color"
              value={form.accent}
              onChange={(e) => setForm({ ...form, accent: e.target.value })}
              style={{ height: 44, padding: 4 }}
            />
          </label>
          <button className="btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Menyimpan...' : '+ Tambah Mata Pelajaran'}
          </button>
        </form>

        {subjects === null ? (
          <p className="home-empty">Memuat...</p>
        ) : (
          <div className="report-table-wrap">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Ikon</th>
                  <th>Nama</th>
                  <th>id</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((s) => (
                  <tr key={s.id}>
                    <td>{s.icon}</td>
                    <td>{s.name}</td>
                    <td><code>{s.id}</code></td>
                    <td>
                      <button type="button" className="btn-secondary" onClick={() => handleDelete(s.id)}>
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
    </div>
  );
}
