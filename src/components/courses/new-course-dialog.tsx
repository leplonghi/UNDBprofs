'use client';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';

export function NewCourseDialog() {
  return (
    <Button asChild>
      <Link href="/disciplinas/nova">
        <PlusCircle className="mr-2 h-4 w-4" />
        Nova Disciplina
      </Link>
    </Button>
  );
}
