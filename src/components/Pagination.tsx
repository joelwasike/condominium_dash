import React from 'react';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, total, pageSize, onPageChange }: PaginationProps) {
  if (!totalPages || totalPages <= 1) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', marginTop: '8px' }}>
      <span style={{ fontSize: '14px', color: '#64748b' }}>
        Showing {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total}
      </span>
      <div style={{ display: 'flex', gap: '4px' }}>
        <button
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', background: page === 1 ? '#f1f5f9' : 'white', cursor: page === 1 ? 'default' : 'pointer', fontSize: '13px' }}
        >
          First
        </button>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', background: page === 1 ? '#f1f5f9' : 'white', cursor: page === 1 ? 'default' : 'pointer', fontSize: '13px' }}
        >
          Prev
        </button>
        <span style={{ padding: '6px 12px', fontSize: '13px', color: '#334155' }}>
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', background: page === totalPages ? '#f1f5f9' : 'white', cursor: page === totalPages ? 'default' : 'pointer', fontSize: '13px' }}
        >
          Next
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages}
          style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', background: page === totalPages ? '#f1f5f9' : 'white', cursor: page === totalPages ? 'default' : 'pointer', fontSize: '13px' }}
        >
          Last
        </button>
      </div>
    </div>
  );
}
