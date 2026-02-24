import React from 'react';

export interface Column<T> {
    header: string;
    key: string;
    align?: 'left' | 'right' | 'center';
    className?: string;
    render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    loading?: boolean;
    onRowClick?: (item: T) => void;
    emptyMessage?: string;
    Skeleton?: React.ComponentType;
}

export function DataTable<T>({ columns, data, loading, onRowClick, emptyMessage, Skeleton }: DataTableProps<T>) {
    if (loading && Skeleton) return <Skeleton />;

    if (!loading && data.length === 0) {
        return (
            <div className="p-12 text-center bg-white border-t border-[#E2E8F0]">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#F7F9FC] flex items-center justify-center">
                    <svg className="w-8 h-8 text-[#94A3B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-[#0F172A] mb-2">No se encontraron resultados</h3>
                <p className="text-sm text-[#94A3B8]">{emptyMessage || 'Intenta ajustar tus filtros de búsqueda.'}</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-[#F7F9FC] border-b border-[#E2E8F0]">
                    <tr>
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                className={`px-4 py-3 text-[10px] font-bold text-[#475569] uppercase tracking-[0.15em] ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                                    } ${col.className || ''}`}
                            >
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] bg-white">
                    {data.map((item, idx) => (
                        <tr
                            key={(item as any).id || idx}
                            className={`hover:bg-[#F7F9FC] transition-colors cursor-pointer group`}
                            onClick={() => onRowClick?.(item)}
                        >
                            {columns.map((col) => (
                                <td
                                    key={col.key}
                                    className={`px-4 py-3 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                                        }`}
                                >
                                    {col.render ? col.render(item) : (item as any)[col.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
