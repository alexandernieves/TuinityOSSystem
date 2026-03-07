'use client';

import { Skeleton } from '@heroui/react';

interface SkeletonGridProps {
    items?: number;
}

export function SkeletonGrid({ items = 8 }: SkeletonGridProps) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: items }).map((_, i) => (
                <div
                    key={i}
                    className="flex flex-col overflow-hidden rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414]"
                >
                    {/* Image Skeleton */}
                    <Skeleton className="aspect-[4/3] w-full" />

                    {/* Info Skeleton */}
                    <div className="p-4 space-y-3">
                        <div className="flex gap-2 items-baseline">
                            <Skeleton className="h-6 w-16 rounded-lg" />
                            <Skeleton className="h-4 w-12 rounded-lg" />
                        </div>
                        <Skeleton className="h-4 w-full rounded-lg" />
                        <div className="space-y-2">
                            <Skeleton className="h-3 w-24 rounded-lg" />
                            <Skeleton className="h-3 w-20 rounded-lg" />
                        </div>
                        <div className="pt-3 border-t border-gray-100 dark:border-[#2a2a2a] flex justify-between items-center">
                            <div className="flex gap-2 items-center">
                                <Skeleton className="h-6 w-6 rounded-full" />
                                <Skeleton className="h-3 w-16 rounded-lg" />
                            </div>
                            <Skeleton className="h-4 w-8 rounded-lg" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
