'use client';
import { ThemeProvider } from '@/components/theme-provider';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Header } from '@/components/layout/header';

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex-1 p-4 pb-20 sm:p-6">{children}</main>
        <BottomNav />
      </div>
    </ThemeProvider>
  );
}
