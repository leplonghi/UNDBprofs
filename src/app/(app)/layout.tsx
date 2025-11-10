'use client';
import { ThemeProvider } from '@/components/theme-provider';
import { BottomNav } from '@/components/layout/bottom-nav';
import Header from '@/components/layout/header';
import { FirebaseClientProvider } from '@/firebase/client-provider';

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <FirebaseClientProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <div className="flex min-h-screen w-full flex-col">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm">
                <Header />
            </header>
            <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">{children}</main>
            <div className="md:hidden">
              <BottomNav />
            </div>
          </div>
      </ThemeProvider>
    </FirebaseClientProvider>
  );
}
