import React from 'react';
import { CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';

export type StatusType = 'optimo' | 'bajo' | 'critico' | string;

interface StatusBadgeProps {
    status: StatusType;
    label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
    if (status === 'optimo') return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#16A34A]/10 text-[#16A34A] text-[10px] font-black uppercase tracking-wider">
            <CheckCircle className="w-3 h-3" /> {label || 'Óptimo'}
        </span>
    );
    if (status === 'bajo') return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F59E0B]/10 text-[#F59E0B] text-[10px] font-black uppercase tracking-wider">
            <AlertTriangle className="w-3 h-3" /> {label || 'Bajo'}
        </span>
    );
    if (status === 'critico') return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#DC2626]/10 text-[#DC2626] text-[10px] font-black uppercase tracking-wider">
            <AlertCircle className="w-3 h-3" /> {label || 'Crítico'}
        </span>
    );

    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-wider">
            {label || status}
        </span>
    );
}
