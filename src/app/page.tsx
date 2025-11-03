// src/app/page.tsx
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function Home() {
  // Assim que abrir a raiz, redireciona pro login
  redirect('/login');
}
