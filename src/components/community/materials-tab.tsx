'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { AddMaterialDialog } from './add-material-dialog';
import { MaterialsTable } from './materials-table';
import { useMaterials } from '@/hooks/use-materials';
import { Skeleton } from '../ui/skeleton';

export function MaterialsTab() {
  const [isAddMaterialOpen, setIsAddMaterialOpen] = React.useState(false);
  const { materials, isLoading } = useMaterials();

  return (
    <>
      <AddMaterialDialog isOpen={isAddMaterialOpen} onOpenChange={setIsAddMaterialOpen} />
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Boas Práticas & Materiais</CardTitle>
            <CardDescription>
              Compartilhe e encontre materiais de aula, atividades e referências.
            </CardDescription>
          </div>
          <Button className="mt-4 md:mt-0" onClick={() => setIsAddMaterialOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Compartilhar Material
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <MaterialsTable materials={materials || []} />
          )}
        </CardContent>
      </Card>
    </>
  );
}
