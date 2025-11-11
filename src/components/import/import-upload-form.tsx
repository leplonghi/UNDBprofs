'use client';

import { useState, useRef, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UploadCloud } from 'lucide-react';
import {
  importCourseFromLessonPlan,
  type ImportCourseFromLessonPlanOutput,
} from '@/ai/flows/import-course-from-lesson-plan';
import type { User } from 'firebase/auth';

interface ImportUploadFormProps {
  user: User | null;
  onExtractionComplete: (data: ImportCourseFromLessonPlanOutput) => void;
}

export function ImportUploadForm({
  user,
  onExtractionComplete,
}: ImportUploadFormProps) {
  const { toast } = useToast();
  const [isExtracting, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleFileDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  };

  const handleExtraction = () => {
    if (!file) {
      toast({
        variant: 'destructive',
        title: 'Nenhum arquivo selecionado',
        description: 'Por favor, selecione um arquivo PDF para importar.',
      });
      return;
    }
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Usuário não autenticado',
        description: 'Por favor, faça login novamente para continuar.',
      });
      return;
    }

    startTransition(() => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const lessonPlanDataUri = reader.result as string;
          const result = await importCourseFromLessonPlan({ lessonPlanDataUri });
          toast({
            title: 'Extração Concluída!',
            description: 'Revise as informações extraídas antes de salvar.',
          });
          onExtractionComplete(result);
        } catch (error) {
          console.error('Extraction failed:', error);
          toast({
            variant: 'destructive',
            title: 'Erro na Extração',
            description:
              'Não foi possível processar o arquivo. Tente novamente ou verifique o console para mais detalhes.',
          });
        }
      };
      reader.onerror = (error) => {
        console.error('File reading error:', error);
        toast({
          variant: 'destructive',
          title: 'Erro de Leitura',
          description: 'Não foi possível ler o arquivo selecionado.',
        });
      };
    });
  };

  return (
    <div className="p-6 space-y-4">
      <label
        htmlFor="pdf-upload"
        className="flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors"
        onDrop={handleFileDrop}
        onDragOver={handleDragOver}
      >
        <UploadCloud className="w-12 h-12 text-muted-foreground" />
        <p className="mt-4 text-sm text-muted-foreground">
          {file
            ? `Arquivo selecionado: ${file.name}`
            : 'Arraste e solte um PDF aqui, ou clique para selecionar'}
        </p>
      </label>
      <input
        id="pdf-upload"
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        onClick={handleExtraction}
        disabled={isExtracting || !file}
        className="w-full"
      >
        {isExtracting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        {isExtracting ? 'Extraindo Dados...' : 'Iniciar Extração com IA'}
      </Button>
    </div>
  );
}
