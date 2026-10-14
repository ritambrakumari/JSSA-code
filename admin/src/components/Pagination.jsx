import React from 'react';

const Pagination = ({ page, totalPages, setPage }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (page <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', page - 1, page, page + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="bg-gray-50 border-t border-gray-150 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-1.5 items-center">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-3 h-8 bg-white border border-gray-200 text-gray-600 text-[9px] font-black uppercase tracking-widest hover:border-[#3AB000] hover:text-[#3AB000] disabled:opacity-50 disabled:hover:border-gray-200 disabled:hover:text-gray-600 transition-colors rounded-none"
        >
          Prev
        </button>

        <div className="flex gap-1">
          {getPageNumbers().map((num, idx) => (
            <button
              key={idx}
              onClick={() => typeof num === 'number' && setPage(num)}
              disabled={num === '...'}
              className={`h-8 min-w-[32px] px-2 flex items-center justify-center text-[11px] font-black transition-colors rounded-none ${num === page
                ? 'bg-[#3AB000] text-white border border-[#3AB000] shadow-sm'
                : num === '...'
                  ? 'text-gray-400 bg-transparent cursor-default'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-[#3AB000] hover:text-[#3AB000]'
                }`}
            >
              {num}
            </button>
          ))}
        </div>

        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="px-3 h-8 bg-white border border-gray-200 text-gray-600 text-[9px] font-black uppercase tracking-widest hover:border-[#3AB000] hover:text-[#3AB000] disabled:opacity-50 disabled:hover:border-gray-200 disabled:hover:text-gray-600 transition-colors rounded-none"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
