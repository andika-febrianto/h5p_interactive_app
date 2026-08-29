function getPageNumbers(current: number, total: number): (number | '…')[] {
  const delta = 1;
  const range: (number | '…')[] = [];
  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);

  range.push(1);
  if (left > 2) range.push('…');
  for (let i = left; i <= right; i++) range.push(i);
  if (right < total - 1) range.push('…');
  if (total > 1) range.push(total);

  return range;
}

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav className="pagination" aria-label="Navigasi halaman">
      <button
        type="button"
        className="btn-secondary btn-small"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
      >
        ‹ Sebelumnya
      </button>

      <div className="pagination-numbers">
        {getPageNumbers(page, totalPages).map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="pagination-ellipsis">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={`pagination-number ${p === page ? 'is-active' : ''}`}
              onClick={() => onChange(p)}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          )
        )}
      </div>

      <button
        type="button"
        className="btn-secondary btn-small"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
      >
        Berikutnya ›
      </button>
    </nav>
  );
}
