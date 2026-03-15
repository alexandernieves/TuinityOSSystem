'use client';

import { Skeleton } from '@/components/ui/skeleton';

interface SkeletonGridProps {
    items?: number;
}

export function SkeletonGrid({ items = 8 }: SkeletonGridProps) {
    return (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-in fade-in duration-500">
            {Array.from({ length: items }).map((_, i) => (
                <div
                    key={i}
                    className="group flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm hover:shadow-md transition-all duration-300"
                >
                    {/* Image Skeleton */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden">
                        <Skeleton className="h-full w-full rounded-none" />
                        <div className="absolute top-3 right-3">
                            <Skeleton className="h-6 w-12 rounded-full opacity-60" />
                        </div>
                    </div>

                    {/* Info Skeleton */}
                    <div className="p-4 space-y-4 flex-1 flex flex-col">
                        <div className="space-y-1.5">
                            <div className="flex gap-2 items-center">
                                <Skeleton className="h-5 flex-1 rounded-md" />
                                <Skeleton className="h-5 w-16 rounded-md opacity-80" />
                            </div>
                            <Skeleton className="h-3.5 w-full rounded-md opacity-60" />
                        </div>

                        <div className="mt-auto space-y-3">
                            <div className="flex flex-wrap gap-2">
                                <Skeleton className="h-5 w-14 rounded-full opacity-40" />
                                <Skeleton className="h-5 w-20 rounded-full opacity-40" />
                            </div>

                            <div className="pt-4 border-t border-border/40 flex justify-between items-center">
                                <div className="flex gap-2.5 items-center">
                                    <Skeleton className="h-7 w-7 rounded-full bg-accent/30" />
                                    <Skeleton className="h-3 w-20 rounded-md opacity-50" />
                                </div>
                                <Skeleton className="h-4 w-10 rounded-md opacity-60" />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
