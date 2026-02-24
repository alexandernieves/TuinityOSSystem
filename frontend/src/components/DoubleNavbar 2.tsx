'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { Tooltip, Button } from '@heroui/react';
import clsx from 'clsx';
import { subMenus, MenuItem } from '@/config/dashboard-menu';
import { loadSession } from '@/lib/auth-storage';
import { api } from '@/lib/api';

type MeResponse = {
  role?: string;
};

type IconEl = React.ComponentType<{ className?: string }>;

export function DoubleNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeSegment, setActiveSegment] = useState<string>('inventory');
  const [me, setMe] = useState<MeResponse | null>(null);

  useEffect(() => {
    const session = loadSession();
    if (!session?.accessToken) return;

    api<MeResponse>('/auth/me', {
      method: 'GET',
      accessToken: session.accessToken,
    }).then(data => setMe(data))
      .catch(console.error);
  }, []);

  // Filter sections by role
  const filteredSections = Object.entries(subMenus).filter(([_, section]) => {
    if (!section.roles) return true;
    if (!me?.role) return false;
    return section.roles.includes(me.role);
  });

  const activeSection = subMenus[activeSegment];

  // Filter items in active section by role
  const filteredItems = activeSection?.items.filter(item => {
    if (!item.roles) return true;
    if (!me?.role) return false;
    return item.roles.includes(me.role);
  }) || [];

  return (
    <div className="flex h-screen bg-white">
      {/* Level 1: Main Icons */}
      <div className="flex flex-col items-center w-20 border-r border-gray-200 py-6 bg-slate-900 text-white">
        <div className="mb-10 p-2 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
          <div className="h-6 w-6 bg-white rounded-md" />
        </div>

        <div className="flex flex-col gap-5 w-full px-2">
          {filteredSections.map(([key, section]) => (
            <Tooltip
              key={key}
              content={section.title}
              placement="right"
              delay={0}
              closeDelay={0}
            >
              <Button
                isIconOnly
                onClick={() => setActiveSegment(key)}
                className={clsx(
                  "w-12 h-12 rounded-2xl transition-all duration-300",
                  activeSegment === key
                    ? "bg-blue-600 text-white shadow-xl shadow-blue-600/30 scale-110"
                    : "bg-transparent text-slate-400 hover:text-white hover:bg-slate-800"
                )}
              >
                {/* Assuming all items have an icon in the first item or section header - 
                    actually subMenus entries don't have a section-level icon currently in the type, 
                    we use the first item's icon as a representative */}
                {React.isValidElement(section.items[0]?.icon) &&
                  React.cloneElement(section.items[0].icon as React.ReactElement, { className: "w-6 h-6" } as any)}
              </Button>
            </Tooltip>
          ))}
        </div>

        <div className="mt-auto pb-4">
          <Button isIconOnly variant="light" className="text-slate-400 hover:text-red-400">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Level 2: Sub-links Panel */}
      <div className="flex flex-col w-72 border-r border-gray-100 py-8 px-8 bg-white overflow-y-auto">
        <div className="mb-10">
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">{activeSection?.title}</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{activeSection?.description}</p>
        </div>

        <div className="flex flex-col gap-2">
          {filteredItems.map((item, idx) => (
            <div key={idx} className="group flex flex-col gap-1">
              <button
                onClick={() => {
                  if (item.href) router.push(item.href);
                }}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black transition-all duration-300 uppercase tracking-tight",
                  item.href && pathname === item.href // Corrected active check
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <div className={clsx(
                  "p-2 rounded-xl transition-colors",
                  activeSegment === item.label ? "bg-blue-100 text-blue-600" : "bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600"
                )}>
                  {React.isValidElement(item.icon) && React.cloneElement(item.icon as React.ReactElement, { className: "w-4 h-4" } as any)}
                </div>
                {item.label}
                {item.subItems && <ChevronRight className="w-4 h-4 ml-auto text-slate-300" />}
              </button>

              {/* Optional: Render one level of sub-items if they exist */}
              {item.subItems && (
                <div className="ml-10 flex flex-col gap-1 mt-1 border-l-2 border-slate-50 pl-4 py-1">
                  {item.subItems.filter(sub => {
                    if (!sub.roles) return true;
                    if (!me?.role) return false;
                    return sub.roles.includes(me.role);
                  }).map((sub, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => sub.href && router.push(sub.href)}
                      className="text-left py-1.5 text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-wide"
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

