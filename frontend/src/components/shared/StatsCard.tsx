import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface StatsCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    color: string;
    loading?: boolean;
}

export function StatsCard({ label, value, icon: Icon, color, loading }: StatsCardProps) {
    return (
        <div className="bg-white rounded-lg p-4 border border-[#E2E8F0] shadow-sm flex-1">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs text-[#475569] font-medium uppercase tracking-wider">{label}</p>
                    {loading ? (
                        <Skeleton className="h-8 w-16 mt-1" />
                    ) : (
                        <p className="text-2xl font-semibold text-[#0F172A] mt-1 tabular-nums">{value}</p>
                    )}
                </div>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}1A` }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                </div>
            </div>
        </div>
    );
}
