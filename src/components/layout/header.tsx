// src/components/layout/header.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AppLogo } from '@/components/layout/AppLogo';
import { UserNav } from './user-nav';
import { cn } from '@/lib/utils';
import {
  BookCopy,
  Calendar,
  Folder,
  LayoutDashboard,
  Users2
} from 'lucide-react';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/disciplinas', label: 'Disciplinas', icon: BookCopy },
  { href: '/comunidade', label: 'Comunidade', icon: Users2 },
  { href: '/documentos', label: 'Documentos', icon: Folder },
  { href: '/calendario', label: 'Calendário', icon: Calendar },
];

export default function Header() {
  const pathname = usePathname();
  
  return (
    <header className="flex h-16 items-center justify-between px-4">
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <AppLogo className="h-10 w-auto" />
        </Link>
        <nav className="hidden md:flex items-center gap-4">
          {menuItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md text-muted-foreground transition-colors hover:text-primary hover:bg-accent',
                  isActive && 'text-primary bg-accent'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <UserNav />
    </header>
  );
}
