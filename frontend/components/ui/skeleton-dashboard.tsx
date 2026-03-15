'use client';

import { Card, CardBody, CardHeader, Divider } from '@heroui/react';
import { Skeleton } from '@/components/ui/skeleton';

export function SkeletonDashboard() {
    return (
        <div className="space-y-6 pb-8 animate-in fade-in duration-500">
            {/* Welcome Header Skeleton */}
            <div className="flex items-center justify-between px-1">
                <div className="space-y-2">
                    <Skeleton className="h-9 w-56 rounded-lg" />
                    <Skeleton className="h-4 w-72 rounded-md opacity-70" />
                </div>
                <div className="flex gap-3">
                    <Skeleton className="h-10 w-32 rounded-lg" />
                    <Skeleton className="h-10 w-10 rounded-lg" />
                </div>
            </div>

            {/* Quick Stats Grid 1 */}
            <div className="space-y-4">
                <Skeleton className="h-4 w-32 ml-1 rounded-md opacity-60" />
                <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y divide-border/50 sm:divide-y-0 sm:divide-x">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="p-5 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-2.5">
                                        <Skeleton className="h-3.5 w-24 rounded-md opacity-70" />
                                        <Skeleton className="h-7 w-32 rounded-lg" />
                                    </div>
                                    <Skeleton className="h-10 w-10 rounded-xl bg-accent/50" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-3 w-12 rounded-full bg-success/20" />
                                    <Skeleton className="h-3 w-20 rounded-full opacity-50" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Performance Stats Grid 2 */}
            <div className="space-y-4">
                <Skeleton className="h-4 w-32 ml-1 rounded-md opacity-60" />
                <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y divide-border/50 sm:divide-y-0 sm:divide-x">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="p-5 space-y-5">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-11 w-11 rounded-xl shadow-inner bg-accent/40" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-3.5 w-24 rounded-md opacity-70" />
                                        <Skeleton className="h-5 w-28 rounded-md" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Skeleton className="h-3 w-16 rounded-full opacity-60" />
                                        <Skeleton className="h-3 w-8 rounded-full opacity-60" />
                                    </div>
                                    <Skeleton className="h-2 w-full rounded-full bg-accent/30" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Widgets Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                {/* Main Insight Widget */}
                <div className="lg:col-span-3">
                    <Card className="border border-border/50 bg-card shadow-sm h-[400px]">
                        <CardHeader className="p-5 flex items-center gap-4">
                            <Skeleton className="h-10 w-10 rounded-xl bg-accent/40" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-5 w-40 rounded-md" />
                                <Skeleton className="h-3.5 w-60 rounded-md opacity-60" />
                            </div>
                            <div className="flex gap-2">
                                <Skeleton className="h-8 w-8 rounded-md opacity-50" />
                                <Skeleton className="h-8 w-8 rounded-md opacity-50" />
                            </div>
                        </CardHeader>
                        <Divider className="opacity-50" />
                        <CardBody className="p-6 flex flex-col justify-between">
                            <div className="space-y-3">
                                <Skeleton className="h-9 w-44 rounded-lg" />
                                <Skeleton className="h-4 w-32 rounded-md opacity-60" />
                            </div>
                            <div className="flex items-end justify-between gap-4 h-52 px-2 pb-2">
                                {[60, 45, 75, 50, 90, 65, 80, 55, 70, 40, 85, 60, 75, 45].map((height, i) => (
                                    <Skeleton
                                        key={i}
                                        className="flex-1 rounded-t-lg bg-accent/40"
                                        style={{ height: `${height}%`, opacity: 0.2 + (i % 4) * 0.15 }}
                                    />
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Secondary List Widget */}
                <div className="lg:col-span-2">
                    <Card className="border border-border/50 bg-card shadow-sm h-[400px]">
                        <CardHeader className="p-5 flex items-center gap-4">
                            <Skeleton className="h-10 w-10 rounded-xl bg-accent/40" />
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-36 rounded-md" />
                                <Skeleton className="h-3.5 w-56 rounded-md opacity-60" />
                            </div>
                        </CardHeader>
                        <Divider className="opacity-50" />
                        <CardBody className="p-5 space-y-6">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <Skeleton className="h-11 w-11 rounded-full shrink-0 bg-accent/30" />
                                    <div className="flex-1 space-y-2.5">
                                        <div className="flex justify-between items-center">
                                            <Skeleton className="h-4 w-36 rounded-md" />
                                            <Skeleton className="h-4 w-14 rounded-md" />
                                        </div>
                                        <Skeleton className="h-3 w-56 rounded-md opacity-60" />
                                    </div>
                                </div>
                            ))}
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
}
