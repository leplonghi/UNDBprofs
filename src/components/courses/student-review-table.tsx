'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import type { ExtractedStudent } from '@/types';

interface StudentReviewTableProps {
  students: ExtractedStudent[];
  setStudents: React.Dispatch<React.SetStateAction<ExtractedStudent[]>>;
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
    <div className="max-h-80 overflow-y-auto rounded-md border">
        <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-[50px] text-right">Ação</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {students.map((student, index) => (
                <TableRow key={index}>
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
  );
}
