'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { ExtractedStudent } from '@/types';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface StudentReviewTableProps {
  students: ExtractedStudent[];
  setStudents: React.Dispatch<React.SetStateAction<ExtractedStudent[]>>;
}

const ConfidenceIndicator = ({ confidence }: { confidence: number }) => {
    if (confidence > 0.8) {
        return (
            <Tooltip>
                <TooltipTrigger>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                </TooltipTrigger>
                <TooltipContent>
                    <p>Confiança Alta ({Math.round(confidence * 100)}%)</p>
                </TooltipContent>
            </Tooltip>
        )
    }
    if (confidence > 0.5) {
        return (
            <Tooltip>
                <TooltipTrigger>
                     <AlertTriangle className="h-5 w-5 text-yellow-500" />
                </TooltipTrigger>
                <TooltipContent>
                    <p>Confiança Média ({Math.round(confidence * 100)}%)</p>
                </TooltipContent>
            </Tooltip>
        )
    }
    return (
        <Tooltip>
            <TooltipTrigger>
                <AlertTriangle className="h-5 w-5 text-red-500" />
            </TooltipTrigger>
            <TooltipContent>
                <p>Confiança Baixa ({Math.round(confidence * 100)}%)</p>
            </TooltipContent>
        </Tooltip>
    )
}

export function StudentReviewTable({ students, setStudents }: StudentReviewTableProps) {
  
  const handleStudentChange = (index: number, field: keyof ExtractedStudent, value: string) => {
    const updatedStudents = [...students];
    updatedStudents[index] = { ...updatedStudents[index], [field]: value };
    setStudents(updatedStudents);
  };

  const removeStudent = (index: number) => {
    const updatedStudents = students.filter((_, i) => i !== index);
    setStudents(updatedStudents);
  };

  return (
    <TooltipProvider>
      <div className="max-h-80 overflow-y-auto rounded-md border">
          <Table>
              <TableHeader>
                  <TableRow>
                  <TableHead className="w-[40px]">Conf.</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead className="w-[50px] text-right">Ação</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                  {students.map((student, index) => (
                  <TableRow key={index}>
                      <TableCell>
                          <ConfidenceIndicator confidence={student.confidence} />
                      </TableCell>
                      <TableCell>
                      <Input
                          value={student.name}
                          onChange={(e) => handleStudentChange(index, 'name', e.target.value)}
                          className="border-0"
                      />
                      </TableCell>
                      <TableCell>
                      <Input
                          value={student.email}
                          onChange={(e) => handleStudentChange(index, 'email', e.target.value)}
                          className="border-0"
                      />
                      </TableCell>
                       <TableCell>
                      <Input
                          value={student.registrationId || ''}
                          onChange={(e) => handleStudentChange(index, 'registrationId', e.target.value)}
                          className="border-0"
                          placeholder='N/A'
                      />
                      </TableCell>
                      <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => removeStudent(index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                      </TableCell>
                  </TableRow>
                  ))}
              </TableBody>
          </Table>
      </div>
    </TooltipProvider>
  );
}
