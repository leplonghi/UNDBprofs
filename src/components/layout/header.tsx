import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserNav } from './user-nav';

export function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden" />
        <h1 className="text-lg font-semibold md:text-xl">ProfAssist</h1>
      </div>
      <UserNav />
    </header>
  );
}
