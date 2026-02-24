'use client';

import { useState } from 'react';
import {
  Home,
  LayoutDashboard,
  BarChart2,
  Calendar,
  User,
  Fingerprint,
  Settings,
  Menu
} from 'lucide-react';
import { Tooltip, Button } from '@heroui/react';
import clsx from 'clsx';

const mainLinksMockdata = [
  { icon: Home, label: 'Home' },
  { icon: LayoutDashboard, label: 'Dashboard' },
  { icon: BarChart2, label: 'Analytics' },
  { icon: Calendar, label: 'Releases' },
  { icon: User, label: 'Account' },
  { icon: Fingerprint, label: 'Security' },
  { icon: Settings, label: 'Settings' },
];

const linksMockdata = [
  'Security',
  'Settings',
  'Dashboard',
  'Releases',
  'Account',
  'Orders',
  'Clients',
  'Databases',
  'Pull Requests',
  'Open Issues',
  'Wiki pages',
];

export function DoubleNavbar() {
  const [active, setActive] = useState('Releases');
  const [activeLink, setActiveLink] = useState('Settings');

  return (
    <div className="flex h-screen bg-white">
      {/* Aside (Icons) */}
      <div className="flex flex-col items-center w-20 border-r border-gray-200 py-6 bg-gray-50/50">
        <div className="mb-8 p-2 bg-blue-600 rounded-lg">
          {/* Logo placeholder */}
          <Menu className="text-white w-6 h-6" />
        </div>

        <div className="flex flex-col gap-4 w-full px-2">
          {mainLinksMockdata.map((link) => (
            <Tooltip
              key={link.label}
              content={link.label}
              placement="right"
              color="foreground"
            >
              <Button
                isIconOnly
                variant={active === link.label ? "solid" : "light"}
                color={active === link.label ? "primary" : "default"}
                onClick={() => setActive(link.label)}
                className={clsx(
                  "w-12 h-12 rounded-xl transition-all",
                  active === link.label ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:text-gray-900"
                )}
              >
                <link.icon className="w-5 h-5" />
              </Button>
            </Tooltip>
          ))}
        </div>
      </div>

      {/* Main (Sub-links) */}
      <div className="flex flex-col w-64 border-r border-gray-200 py-6 px-6 bg-gray-50/30">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 tracking-tight">{active}</h2>
        </div>

        <div className="flex flex-col gap-1">
          {linksMockdata.map((link) => (
            <button
              key={link}
              onClick={() => setActiveLink(link)}
              className={clsx(
                "text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                activeLink === link
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100/50 hover:text-gray-900"
              )}
            >
              {link}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
