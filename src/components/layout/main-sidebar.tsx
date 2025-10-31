'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookCopy,
  Calendar,
  FileUp,
  Folder,
  GraduationCap,
  LayoutDashboard,
  Users,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/disciplinas', label: 'Disciplinas', icon: BookCopy },
  { href: '/turmas', label: 'Turmas', icon: Users },
  { href: '/importar', label: 'Importar com IA', icon: FileUp },
  { href: '/alunos', label: 'Alunos', icon: GraduationCap },
  { href: '/documentos', label: 'Documentos', icon: Folder },
  { href: '/calendario', label: 'Calendário', icon: Calendar },
];

export function MainSidebar() {
  const pathname = usePathname();
  const logo = PlaceHolderImages.find((img) => img.id === 'undb-logo');

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        {logo && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src={logo.imageUrl}
              alt={logo.description}
              width={120}
              height={32}
              className="object-contain"
            />
          </Link>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href)}
                tooltip={{ children: item.label }}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
