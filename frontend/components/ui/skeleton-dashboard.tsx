'use client';

import { Card, CardBody, CardHeader, Skeleton, Divider } from '@heroui/react';
import { motion } from 'framer-motion';

export function SkeletonDashboard() {
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.05 },
        },
    };

    return (
        <div className="space-y-6 pb-8">
            {/* Welcome Header Skeleton */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48 rounded-lg" />
                    <Skeleton className="h-4 w-64 rounded-lg" />
                </div>
                <Skeleton className="h-8 w-32 rounded-lg" />
            </div>

            <div className="space-y-4">
                <Skeleton className="h-3 w-32 rounded-lg" />
                <div className="overflow-hidden rounded-xl border border-border-default bg-surface-main shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y divide-border-default sm:divide-y-0 sm:divide-x">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="p-5 space-y-3">
                                <div className="flex justify-between">
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-24 rounded-lg" />
                                        <Skeleton className="h-6 w-32 rounded-lg" />
                                    </div>
                                    <Skeleton className="h-10 w-10 rounded-xl" />
                                </div>
                                <Skeleton className="h-3 w-16 rounded-lg" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <Skeleton className="h-3 w-32 rounded-lg" />
                <div className="overflow-hidden rounded-xl border border-border-default bg-surface-main shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y divide-border-default sm:divide-y-0 sm:divide-x">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="p-5 space-y-4">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-10 w-10 rounded-xl" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-20 rounded-lg" />
                                        <Skeleton className="h-5 w-24 rounded-lg" />
                                    </div>
                                </div>
                                <Skeleton className="h-2 w-full rounded-full" />
                                <div className="flex justify-between">
                                    <Skeleton className="h-3 w-16 rounded-lg" />
                                    <Skeleton className="h-3 w-8 rounded-lg" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                <div className="lg:col-span-3">
                    <Card className="border border-border-default bg-surface-main shadow-sm h-[320px]">
                        <CardHeader className="p-5 space-x-3">
                            <Skeleton className="h-9 w-9 rounded-lg" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-32 rounded-lg" />
                                <Skeleton className="h-3 w-24 rounded-lg" />
                            </div>
                        </CardHeader>
                        <Divider />
                        <CardBody className="p-5 flex flex-col justify-between">
                            <div className="space-y-2">
                                <Skeleton className="h-8 w-32 rounded-lg" />
                                <Skeleton className="h-4 w-24 rounded-lg" />
                            </div>
                            <div className="flex items-end justify-between gap-3 h-32">
                                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                                    <Skeleton key={i} className="flex-1 rounded-t-md" style={{ height: `${20 + i * 10}%` }} />
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                    <Card className="border border-border-default bg-surface-main shadow-sm h-[320px]">
                        <CardHeader className="p-5 space-x-3">
                            <Skeleton className="h-9 w-9 rounded-lg" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-32 rounded-lg" />
                                <Skeleton className="h-3 w-24 rounded-lg" />
                            </div>
                        </CardHeader>
                        <Divider />
                        <CardBody className="p-4 space-y-4">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <Skeleton className="h-3 w-8 rounded-lg" />
                                    <Skeleton className="h-6 flex-1 rounded-md" />
                                    <Skeleton className="h-3 w-16 rounded-lg" />
                                </div>
                            ))}
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
}
