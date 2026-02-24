import React from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface ProductImageProps {
    src?: string | null;
    size?: number;
    className?: string;
}

export function SharedProductImage({ src, size = 10, className = "" }: ProductImageProps) {
    const sizeMap: Record<number, string> = {
        8: 'w-8 h-8',
        10: 'w-10 h-10',
        12: 'w-12 h-12',
        14: 'w-14 h-14',
        16: 'w-16 h-16',
        20: 'w-20 h-20',
    };

    const sizeClass = sizeMap[size] || 'w-10 h-10';

    return (
        <div className={`${sizeClass} rounded-lg bg-[#F7F9FC] border border-[#E2E8F0] flex items-center justify-center shrink-0 overflow-hidden ${className}`}>
            {src ? (
                <img src={src} alt="Producto" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            ) : (
                <ImageIcon className="w-1/2 h-1/2 text-[#94A3B8]" />
            )}
        </div>
    );
}
