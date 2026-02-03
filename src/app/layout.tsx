import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-headline',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'UNDBProf - Portal do Professor',
    template: '%s | UNDBProf',
  },
  description: 'Sistema integrado de gestão acadêmica e apoio aos professores da UNDB.',
  applicationName: 'UNDBProf',
  authors: [{ name: 'Antigravity Team' }],
  keywords: ['UNDB', 'Professor', 'Gestão Acadêmica', 'LMS', 'Educação'],
  icons: {
    icon: 'https://firebasestorage.googleapis.com/v0/b/studio-3759592126-ec313.firebasestorage.app/o/Branding%2FPublic%2Ficone%20undbprof.png?alt=media&token=7b4f4441-34e1-434a-b805-43f52e91db6a',
    apple: 'https://firebasestorage.googleapis.com/v0/b/studio-3759592126-ec313.firebasestorage.app/o/Branding%2FPublic%2Ficone%20undbprof.png?alt=media&token=7b4f4441-34e1-434a-b805-43f52e91db6a',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://undbprof.app',
    siteName: 'UNDBProf',
    title: 'UNDBProf - Portal do Professor',
    description: 'Produtividade e gestão para o corpo docente da UNDB.',
    images: [
      {
        url: 'https://firebasestorage.googleapis.com/v0/b/studio-3759592126-ec313.firebasestorage.app/o/Branding%2FPublic%2Ficone%20undbprof.png?alt=media&token=7b4f4441-34e1-434a-b805-43f52e91db6a',
        width: 1200,
        height: 630,
        alt: 'UNDBProf Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UNDBProf',
    description: 'Produtividade e gestão para o corpo docente da UNDB.',
    images: ['https://firebasestorage.googleapis.com/v0/b/studio-3759592126-ec313.firebasestorage.app/o/Branding%2FPublic%2Ficone%20undbprof.png?alt=media&token=7b4f4441-34e1-434a-b805-43f52e91db6a'],
  },
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${inter.variable} ${poppins.variable}`}>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          {children}
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
