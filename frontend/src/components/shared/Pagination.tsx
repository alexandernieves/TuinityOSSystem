import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
    if (totalPages <= 1) return null;

    // Generate page numbers to show
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);

        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    const pages = getPageNumbers();

    return (
        <div className="px-4 py-3 bg-[#F7F9FC] border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-[#475569]">
                Página <span className="font-semibold text-[#0F172A]">{currentPage}</span> de <span className="font-semibold text-[#0F172A]">{totalPages}</span>
            </p>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-[#E2E8F0] rounded-lg bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                    <ChevronLeft className="w-4 h-4 text-[#475569]" />
                </button>

                <div className="flex gap-1">
                    {pages.map(n => (
                        <button
                            key={n}
                            onClick={() => onPageChange(n)}
                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === n
                                    ? 'bg-[#2563EB] text-white shadow-lg shadow-blue-600/20'
                                    : 'bg-white text-[#475569] hover:bg-gray-50 border border-[#E2E8F0]'
                                }`}
                        >
                            {n}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-[#E2E8F0] rounded-lg bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                    <ChevronRight className="w-4 h-4 text-[#475569]" />
                </button>
            </div>
        </div>
    );
}
