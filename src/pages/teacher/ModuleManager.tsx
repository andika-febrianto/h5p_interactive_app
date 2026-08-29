import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchModules, deleteModule, type ModuleSummary, ApiError } from '../../lib/api';
import { Pagination } from '../../components/Pagination';

const PAGE_SIZE = 8;

export default function ModuleManager() {
  const navigate = useNavigate();
  const [modules, setModules] = useState<ModuleSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const load = () => {
    fetchModules({})
      .then(setModules)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Gagal memuat data.'));
  };

  useEffect(load, []);

  // Jump back to page 1 whenever the search term changes, so results from a
  // new search are never hidden behind whatever page the teacher was on.
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
          <button type="button" className="btn-primary" onClick={() => navigate('/guru/modul/baru')}>
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
                      <td>{m.subjectId}</td>
                      <td>{m.grade}</td>
                      <td>{m.semester}</td>
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
    </div>
  );
}
