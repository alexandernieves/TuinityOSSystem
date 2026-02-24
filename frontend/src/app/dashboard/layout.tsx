'use client';

import type { ReactNode } from 'react';

export default function DashboardLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <div style={{ backgroundColor: '#F8F9FA', height: '100vh', overflowY: 'auto' }}>
            {children}
        </div>
    );
}
