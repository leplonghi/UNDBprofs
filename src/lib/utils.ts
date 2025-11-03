import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { StudentSituation } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getStudentSituation(finalGrade: number): StudentSituation {
    if (finalGrade >= 7) {
        return 'Aprovado';
    }
    if (finalGrade >= 4) {
        return 'Prova Final';
    }
    return 'Reprovado';
}
