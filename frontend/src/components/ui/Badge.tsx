import React from 'react';
import { clsx } from 'clsx';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'critical';

export interface BadgeProps {
    variant: BadgeVariant;
    children: React.ReactNode;
    className?: string;
    icon?: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
    success: 'bg-[#2D8A4E]/10 text-[#2D8A4E] border-[#2D8A4E]/20',
    warning: 'bg-[#F39C12]/10 text-[#F39C12] border-[#F39C12]/20',
    error: 'bg-[#C0392B]/10 text-[#C0392B] border-[#C0392B]/20',
    info: 'bg-[#2980B9]/10 text-[#2980B9] border-[#2980B9]/20',
    critical: 'bg-[#6D0E0E]/10 text-[#6D0E0E] border-[#6D0E0E]/20',
};

export const Badge: React.FC<BadgeProps> = ({ variant, children, className, icon }) => {
    return (
        <span
            className={clsx(
                'inline-flex items-center gap-1',
                'px-2 py-1',
                'rounded-md',
                'text-xs font-medium',
                'border',
                variantStyles[variant],
                className
            )}
        >
            {icon}
            {children}
        </span>
    );
};
