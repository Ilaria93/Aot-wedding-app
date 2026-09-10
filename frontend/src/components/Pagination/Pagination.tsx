import './styles/Pagination.scss';

type PaginationProps = {
  page: number;
  totalPages: number;
  label: string;
  prevLabel: string;
  nextLabel: string;
  onChange: (page: number) => void;
};

/** Prev/next + a status label — shared by every admin section's paginated list. */
export function Pagination({ page, totalPages, label, prevLabel, nextLabel, onChange }: PaginationProps) {
  return (
    <div className="pagination">
      <button type="button" className="pagination__btn" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        {prevLabel}
      </button>
      <span className="pagination__label">{label}</span>
      <button
        type="button"
        className="pagination__btn"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}>
        {nextLabel}
      </button>
    </div>
  );
}
