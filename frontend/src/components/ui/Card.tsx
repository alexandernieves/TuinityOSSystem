import React from 'react';
import { clsx } from 'clsx';

export interface CardProps {
    children: React.ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hover?: boolean;
}

const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
};

export const Card: React.FC<CardProps> = ({
    children,
    className,
    padding = 'md',
    hover = false,
}) => {
    return (
        <div
            className={clsx(
                'bg-white',
                'border border-[#E1E8ED]',
                'rounded-xl',
                'shadow-sm',
                'transition-all duration-150',
                hover && 'hover:shadow-md hover:-translate-y-0.5',
                paddingStyles[padding],
                className
            )}
        >
            {children}
        </div>
    );
};

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
    children,
    className,
}) => {
    return (
        <div className={clsx('text-lg font-medium text-[#2C3E50] mb-4', className)}>
            {children}
        </div>
    );
};

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
    children,
    className,
}) => {
    return <div className={clsx('space-y-4', className)}>{children}</div>;
};
