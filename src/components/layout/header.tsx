'use client';
import { UserNav } from './user-nav';
import { ThemeToggle } from '@/components/theme-toggle';
import Image from 'next/image';
import Link from 'next/link';

export function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
      <Link href="/dashboard" className="flex items-center gap-2">
        <Image
            src="https://firebasestorage.googleapis.com/v0/b/studio-37592126-ec313.firebasestorage.app/o/logoundbprofs.png?alt=media&token=5d978abf-eb33-4c3f-a87c-826ad093c8ff"
            alt="UNDBprof Logo"
            width={32}
            height={32}
            className="h-8 w-auto"
        />
        <h1 className="text-lg font-semibold md:text-xl">UNDBprof</h1>
      </Link>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <UserNav />
      </div>
    </header>
  );
}
