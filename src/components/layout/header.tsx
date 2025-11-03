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
          src="https://firebasestorage.googleapis.com/v0/b/studio-3759592126-ec313.appspot.com/o/Branding%2Fpublic%2Flogoundbprofs.png?alt=media&v=1"
          alt="UNDBprof Logo"
          width={160}
          height={48}
          className="h-8 w-auto"
          priority
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
