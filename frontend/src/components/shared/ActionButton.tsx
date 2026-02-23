import React from 'react';
import { LucideIcon, RefreshCw } from 'lucide-react';

interface ActionButtonProps {
    onClick: () => void;
    icon: LucideIcon;
    label: string;
    variant?: 'primary' | 'secondary' | 'danger';
    className?: string;
    disabled?: boolean;
    isLoading?: boolean;
    hideLabelOnMobile?: boolean;
}

export function ActionButton({
    onClick,
    icon: Icon,
    label,
    variant = 'secondary',
    className = '',
    disabled = false,
    isLoading = false,
    hideLabelOnMobile = true
}: ActionButtonProps) {

    const baseClasses = "flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed group";

    const variants = {
        primary: "bg-[#2563EB] text-white hover:bg-[#1D4ED8]",
        secondary: "bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC] hover:border-[#CBD5E1]",
        danger: "bg-white border border-red-100 text-[#DC2626] hover:bg-red-50 hover:border-red-200"
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled || isLoading}
            className={`${baseClasses} ${variants[variant]} ${className}`}
        >
            {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
                <Icon className={`w-4 h-4 transition-transform ${variant === 'primary' ? 'group-hover:rotate-90' : 'group-hover:scale-110'}`} />
            )}
            <span className={hideLabelOnMobile ? 'hidden sm:inline' : ''}>
                {label}
            </span>
        </button>
    );
}
