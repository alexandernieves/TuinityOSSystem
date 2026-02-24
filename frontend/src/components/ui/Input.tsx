import React from 'react';
import { clsx } from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, leftIcon, rightIcon, className, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-[#2C3E50] mb-2">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {leftIcon && (
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A6C7D]">
                            {leftIcon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={clsx(
                            'w-full px-4 py-3',
                            'border border-[#E1E8ED] rounded-lg',
                            'bg-[#F4F7F6]',
                            'text-[#2C3E50]',
                            'placeholder:text-[#B8C5D0]',
                            'transition-colors duration-150',
                            'focus:outline-none focus:ring-2 focus:ring-[#1A2B3C] focus:border-transparent focus:bg-white',
                            'disabled:opacity-50 disabled:cursor-not-allowed',
                            error && 'border-[#C0392B] focus:ring-[#C0392B]',
                            leftIcon && 'pl-11',
                            rightIcon && 'pr-11',
                            className
                        )}
                        {...props}
                    />
                    {rightIcon && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5A6C7D]">
                            {rightIcon}
                        </div>
                    )}
                </div>
                {error && (
                    <p className="mt-1 text-sm text-[#C0392B]">{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
