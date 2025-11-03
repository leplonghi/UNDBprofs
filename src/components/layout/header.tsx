// src/components/layout/header.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { AppLogo } from '@/components/layout/AppLogo';
import { UserNav } from './user-nav';

export default function Header() {
  return (
    <header className="flex items-center justify-between border-b bg-background px-4 py-2">
      <Link href="/dashboard" className="flex items-center gap-2">
        <AppLogo className="h-10 w-auto" />
      </Link>

      <UserNav />
    </header>
  );
}
