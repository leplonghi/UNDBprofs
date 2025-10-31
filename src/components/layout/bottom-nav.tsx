'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookCopy,
  Calendar,
  FileUp,
  Folder,
  LayoutDashboard,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/disciplinas', label: 'Disciplinas', icon: BookCopy },
  { href: '/importar', label: 'Importar', icon: FileUp },
  { href: '/documentos', label: 'Documentos', icon: Folder },
  { href: '/calendario', label: 'Calendário', icon: Calendar },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 border-t bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around">
        {menuItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 p-2 text-xs text-muted-foreground transition-colors hover:text-primary',
                isActive && 'text-primary'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
