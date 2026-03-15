'use client';

import { Skeleton } from '@/components/ui/skeleton';

interface SkeletonTableProps {
    rows?: number;
    columns?: number;
    hasHeader?: boolean;
}

export function SkeletonTable({ rows = 6, columns = 4, hasHeader = true }: SkeletonTableProps) {
    return (
        <div className="w-full space-y-5 animate-in fade-in duration-500">
            {hasHeader && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-1">
                    <div className="space-y-2">
                        <Skeleton className="h-9 w-52 rounded-lg" />
                        <Skeleton className="h-4 w-72 rounded-md opacity-60" />
                    </div>
                    <div className="flex gap-2.5">
                        <Skeleton className="h-10 w-28 rounded-xl" />
                        <Skeleton className="h-10 w-36 rounded-xl bg-primary/10" />
                    </div>
                </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
                {/* Table Head */}
                <div className="grid grid-cols-4 bg-muted/30 px-6 py-4 gap-4 border-b border-border/50">
                    {Array.from({ length: columns }).map((_, i) => (
                        <Skeleton key={`head-${i}`} className="h-4 w-24 rounded-md opacity-70" />
                    ))}
                </div>

                {/* Table Body */}
                <div className="divide-y divide-border/40">
                    {Array.from({ length: rows }).map((_, rowIndex) => (
                        <div key={`row-${rowIndex}`} className="grid grid-cols-4 px-6 py-4.5 gap-4 items-center">
                            {Array.from({ length: columns }).map((_, colIndex) => (
                                <div key={`cell-${rowIndex}-${colIndex}`} className="flex items-center gap-3">
                                    {colIndex === 0 && (
                                        <Skeleton className="h-9 w-9 rounded-xl shrink-0 bg-accent/30" />
                                    )}
                                    <div className="space-y-1.5 flex-1">
                                        <Skeleton
                                            className={`h-4 rounded-md ${colIndex === 0 ? 'w-36' : colIndex === columns - 1 ? 'w-16 ml-auto' : 'w-24'}`}
                                        />
                                        {colIndex === 0 && (
                                            <Skeleton className="h-3 w-24 rounded-md opacity-50" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>

                {/* Table Footer / Pagination Skeleton */}
                <div className="px-6 py-4 border-t border-border/40 flex items-center justify-between bg-muted/10">
                    <Skeleton className="h-4 w-40 rounded-md opacity-50" />
                    <div className="flex gap-2">
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                </div>
            </div>
        </div>
    );
}
