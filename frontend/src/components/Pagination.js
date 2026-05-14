import React from 'react';

/**
 * Pagination — controlled pagination component matching the platform pattern:
 *   props: { page, totalPages, onPageChange }
 *
 * Renders "Prev / 1 2 ... N / Next" with current page highlighted and
 * keyboard-friendly button affordances. Used by paginated lists
 * (e.g. TradeJournal, AI results history).
 */
export default function Pagination({ page = 1, totalPages = 1, onPageChange = () => {} }) {
  if (!totalPages || totalPages <= 1) return null;

  const safePage = Math.min(Math.max(1, page), totalPages);
  const goto = (p) => {
    if (p < 1 || p > totalPages || p === safePage) return;
    onPageChange(p);
  };

  // Build a windowed page list: 1 ... p-1 p p+1 ... N
  const pages = [];
  const window = 1;
  const set = new Set([1, totalPages, safePage, safePage - window, safePage + window]);
  for (let i = safePage - window; i <= safePage + window; i++) if (i > 0 && i <= totalPages) set.add(i);
  const sorted = Array.from(set).filter(n => n >= 1 && n <= totalPages).sort((a, b) => a - b);
  let prev = 0;
  for (const n of sorted) {
    if (n - prev > 1) pages.push('…');
    pages.push(n);
    prev = n;
  }

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        type="button"
        onClick={() => goto(safePage - 1)}
        disabled={safePage === 1}
        aria-label="Previous page"
      >
        Prev
      </button>
      {pages.map((p, idx) =>
        p === '…' ? (
          <span key={`gap-${idx}`} className="pagination-gap">…</span>
        ) : (
          <button
            type="button"
            key={p}
            onClick={() => goto(p)}
            aria-current={p === safePage ? 'page' : undefined}
            className={p === safePage ? 'active' : ''}
          >
            {p}
          </button>
        )
      )}
      <button
        type="button"
        onClick={() => goto(safePage + 1)}
        disabled={safePage === totalPages}
        aria-label="Next page"
      >
        Next
      </button>
    </nav>
  );
}
