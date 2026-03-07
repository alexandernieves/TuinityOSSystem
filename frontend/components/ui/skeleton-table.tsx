'use client';

import { Skeleton } from '@heroui/react';

interface SkeletonTableProps {
    rows?: number;
    columns?: number;
    hasHeader?: boolean;
}

export function SkeletonTable({ rows = 5, columns = 4, hasHeader = true }: SkeletonTableProps) {
    return (
        <div className="w-full space-y-4">
            {hasHeader && (
                <div className="flex items-center justify-between mb-6">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48 rounded-lg" />
                        <Skeleton className="h-4 w-64 rounded-lg" />
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-9 w-24 rounded-lg" />
                        <Skeleton className="h-9 w-32 rounded-lg" />
                    </div>
                </div>
            )}

            <div className="overflow-hidden rounded-xl border border-border-default bg-surface-main shadow-sm">
                {/* Table Head */}
                <div className="grid grid-cols-4 bg-surface-secondary px-6 py-3 gap-4">
                    {Array.from({ length: columns }).map((_, i) => (
                        <Skeleton key={`head-${i}`} className="h-4 w-24 rounded-lg" />
                    ))}
                </div>

                {/* Table Body */}
                <div className="divide-y divide-border-default">
                    {Array.from({ length: rows }).map((_, rowIndex) => (
                        <div key={`row-${rowIndex}`} className="grid grid-cols-4 px-6 py-4 gap-4 items-center">
                            {Array.from({ length: columns }).map((_, colIndex) => (
                                <div key={`cell-${rowIndex}-${colIndex}`} className="flex items-center gap-3">
                                    {colIndex === 0 && <Skeleton className="h-8 w-8 rounded-full shrink-0" />}
                                    <Skeleton className={`h-4 rounded-lg ${colIndex === 0 ? 'w-32' : 'w-24'}`} />
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
