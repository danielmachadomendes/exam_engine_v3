import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function PaginationControls({ page, pageSize, total, totalPages, onPageChange }) {
  if (total === 0) return null;

  const firstItem = (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between gap-4 border-t border-slate-800 px-4 py-3 text-xs text-slate-400">
      <span>
        Showing {firstItem}-{lastItem} of {total}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Previous
        </button>
        <span>Page {page} of {Math.max(totalPages, 1)}</span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
