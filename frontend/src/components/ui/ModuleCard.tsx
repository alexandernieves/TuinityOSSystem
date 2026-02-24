'use client';

import React from 'react';
import Link from 'next/link';
import { LucideIcon, Layers } from 'lucide-react';
import { Card, CardBody } from '@heroui/react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

export interface ModuleCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    iconColor?: string;        // e.g. "text-[#2563EB]"
    iconBgColor?: string;      // e.g. "bg-[#2563EB]/10"
    href: string;              // Navigation route
    hasSubmodules?: boolean;   // Show badge
    submodulesCount?: number;  // Number in badge
}

export const ModuleCard: React.FC<ModuleCardProps> = ({
    title,
    description,
    icon: Icon,
    iconColor = "text-brand-secondary",
    iconBgColor = "bg-brand-secondary/10",
    href,
    hasSubmodules = false,
    submodulesCount = 0
}) => {
    return (
        <Link href={href} className="block h-full group">
            <motion.div
                whileHover={{ translateY: -4 }}
                transition={{ duration: 0.2 }}
                className="h-full"
            >
                <Card
                    className="h-full border border-border-subtle bg-surface shadow-sm hover:shadow-md transition-all duration-300"
                    radius="lg"
                >
                    <CardBody className="p-6 relative overflow-visible">
                        {/* Submodules Badge */}
                        {hasSubmodules && submodulesCount > 0 && (
                            <div className="absolute top-4 right-4">
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-brand-accent/10 border border-brand-accent/20">
                                    <Layers className="w-3.5 h-3.5 text-brand-accent" />
                                    <span className="text-xs font-semibold text-brand-accent">{submodulesCount}</span>
                                </div>
                            </div>
                        )}

                        {/* Icon */}
                        <div className={clsx(
                            "w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110",
                            iconBgColor
                        )}>
                            <Icon className={clsx("w-6 h-6", iconColor)} />
                        </div>

                        {/* Content */}
                        <h3 className="text-lg font-semibold text-text-primary mb-2 group-hover:text-brand-secondary transition-colors">
                            {title}
                        </h3>

                        <p className="text-sm text-text-secondary leading-relaxed font-normal">
                            {description}
                        </p>
                    </CardBody>
                </Card>
            </motion.div>
        </Link>
    );
};
