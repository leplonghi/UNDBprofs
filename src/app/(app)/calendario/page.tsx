'use client';

import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { AcademicEvent, Course } from '@/types';
import { isToday, isSameDay } from 'date-fns';


type EventCategory =
  | 'integradora-segunda'
  | 'integradora-quarta'
  | 'integradora-sexta'
  | 'modular-i'
  | 'modular-ii'
  | 'modular-iii'
  | 'feriado'
  | 'substitutiva'
  | 'prova-final'
  | 'course-event';

interface CalendarEvent {
  date: Date;
  description: string;
  category: EventCategory;
  courseCode?: string;
}

const staticEvents: Omit<CalendarEvent, 'courseCode'>[] = [
  // Agosto
  { date: new Date(2025, 7, 13), description: 'Início INTEGRADORA QUARTA FEIRA', category: 'integradora-quarta' },
  { date: new Date(2025, 7, 14), description: 'Início I MODULAR', category: 'modular-i' },
  { date: new Date(2025, 7, 18), description: 'Início INTEGRADORA SEGUNDA FEIRA', category: 'integradora-segunda' },
  { date: new Date(2025, 7, 28), description: 'N1 - I MODULAR', category: 'modular-i' },
  // Setembro
  { date: new Date(2025, 8, 7), description: 'Feriado (Independência do Brasil)', category: 'feriado' },
  { date: new Date(2025, 8, 8), description: 'Feriado (Aniversário de São Luís)', category: 'feriado' },
  { date: new Date(2025, 8, 16), description: 'N2 - I MODULAR', category: 'modular-i' },
  { date: new Date(2025, 8, 18), description: 'Início II MODULAR', category: 'modular-ii' },
  { date: new Date(2025, 8, 27), description: 'SUBSTITUTIVA - I MODULAR', category: 'substitutiva' },
  // Outubro
  { date: new Date(2025, 9, 4), description: 'PROVA FINAL - I MODULAR', category: 'prova-final' },
  { date: new Date(2025, 9, 6), description: 'N1 - INTEGRADORA SEGUNDA FEIRA', category: 'integradora-segunda' },
  { date: new Date(2025, 9, 7), description: 'N1 - II MODULAR', category: 'modular-ii' },
  { date: new Date(2025, 9, 8), description: 'N1 - INTEGRADORA QUARTA FEIRA', category: 'integradora-quarta' },
  { date: new Date(2025, 9, 12), description: 'Feriado de Nossa Senhora Aparecida', category: 'feriado' },
  { date: new Date(2025, 9, 13), description: 'Antecipação do Dia dos Professores', category: 'feriado' },
  { date: new Date(2025, 9, 28), description: 'N2 - II MODULAR', category: 'modular-ii' },
  { date: new Date(2025, 9, 30), description: 'Início III MODULAR', category: 'modular-iii' },
  // Novembro
  { date: new Date(2025, 10, 6), description: 'SUBSTITUTIVA - II MODULAR', category: 'substitutiva' },
  { date: new Date(2025, 10, 11), description: 'PROVA FINAL - II MODULAR', category: 'prova-final' },
  { date: new Date(2025, 10, 13), description: 'N1 - III MODULAR', category: 'modular-iii' },
  { date: new Date(2025, 10, 15), description: 'Feriado (Proclamação da República)', category: 'feriado' },
  { date: new Date(2025, 10, 20), description: 'Feriado (Consciência Negra)', category: 'feriado' },
  { date: new Date(2025, 10, 24), description: 'N2 - INTEGRADORA SEGUNDA FEIRA', category: 'integradora-segunda' },
  { date: new Date(2025, 10, 26), description: 'N2 - INTEGRADORA QUARTA FEIRA', category: 'integradora-quarta' },
  { date: new Date(2025, 10, 27), description: 'N2 - III MODULAR', category: 'modular-iii' },
   // Dezembro
  { date: new Date(2025, 11, 4), description: 'SUBSTITUTIVA - III MODULAR', category: 'substitutiva' },
  { date: new Date(2025, 11, 6), description: 'SUBSTITUTIVA - INTEGRADORA', category: 'substitutiva' },
  { date: new Date(2025, 11, 11), description: 'PROVA FINAL - III MODULAR', category: 'prova-final' },
  { date: new Date(2025, 11, 13), description: 'PROVA FINAL - INTEGRADORA', category: 'prova-final' },
  { date: new Date(2025, 11, 24), description: 'Recesso Natalino', category: 'feriado' },
  { date: new Date(2025, 11, 25), description: 'Natal', category: 'feriado' },
  { date: new Date(2025, 11, 31), description: 'Recesso de Ano Novo', category: 'feriado' },
];

const categoryColors: Record<EventCategory, string> = {
  'integradora-segunda': 'bg-orange-400',
  'integradora-quarta': 'bg-teal-400',
  'integradora-sexta': 'bg-purple-400',
  'modular-i': 'bg-lime-400',
  'modular-ii': 'bg-rose-400',
  'modular-iii': 'bg-pink-400',
  'feriado': 'bg-yellow-400',
  'substitutiva': 'bg-red-500',
  'prova-final': 'bg-red-700',
  'course-event': 'bg-primary',
};


const categoryLabels: Record<EventCategory, string> = {
  'integradora-segunda': 'Integradora Segunda-Feira',
  'integradora-quarta': 'Integradora Quarta-Feira',
  'integradora-sexta': 'Integradora Sexta-Feira',
  'modular-i': 'I Modular',
  'modular-ii': 'II Modular',
  'modular-iii': 'III Modular',
  'feriado': 'Feriado / Recesso',
  'substitutiva': 'Avaliação Substitutiva',
  'prova-final': 'Prova Final',
  'course-event': 'Evento de Disciplina',
};

const monthNames = [ "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro" ];
const year = 2025;
const months = [7, 8, 9, 10, 11]; // Agosto a Dezembro


const CalendarMonth = ({ month, year, events }: { month: number, year: number, events: CalendarEvent[]}) => {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startingDay = firstDay.getDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const eventsByDay = useMemo(() => {
     return events.reduce((acc, event) => {
      if (event.date.getMonth() === month && event.date.getFullYear() === year) {
          const day = event.date.getDate();
          if (!acc[day]) {
              acc[day] = [];
          }
          acc[day].push(event);
      }
      return acc;
    }, {} as Record<number, CalendarEvent[]>);
  }, [events, month, year]);

  return (
    <Card className="flex-1 min-w-[280px]">
      <CardHeader className="p-4">
        <CardTitle className="text-center text-lg font-bold text-primary">
          {monthNames[month]} {year}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-muted-foreground">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => <div key={day}>{day}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1 mt-2">
          {Array.from({ length: startingDay }).map((_, i) => (
            <div key={`empty-${i}`}></div>
          ))}
          {days.map((day) => {
            const dayEvents = eventsByDay[day] || [];
            const dayDate = new Date(year, month, day);
            const today = isToday(dayDate);

            return (
              <TooltipProvider key={day}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div
                            className={cn(
                                'relative flex h-10 w-full flex-col items-center justify-center rounded-sm border p-1 text-xs font-medium',
                                today ? 'bg-accent border-primary' : 'bg-card'
                            )}
                        >
                            <span className={cn('flex h-6 w-6 items-center justify-center rounded-full', today && 'bg-primary text-primary-foreground')}>{day}</span>
                            {dayEvents.length > 0 && (
                                <div className="flex flex-wrap justify-center gap-1 mt-1">
                                    {dayEvents.slice(0, 4).map((event, index) => (
                                        <div key={index} className={cn("h-1.5 w-1.5 rounded-full", categoryColors[event.category])}></div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </TooltipTrigger>
                    {dayEvents.length > 0 && (
                         <TooltipContent>
                            <ul className='space-y-1'>
                                {dayEvents.map((event, index) => (
                                    <li key={index} className="flex items-center gap-2 text-xs">
                                        <div className={cn("h-2 w-2 rounded-full", categoryColors[event.category])}></div>
                                        <span>{event.description} {event.courseCode && `(${event.courseCode})`}</span>
                                    </li>
                                ))}
                            </ul>
                        </TooltipContent>
                    )}
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};


export default function CalendarPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

  const coursesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `professors/${user.uid}/courses`));
  }, [user, firestore]);
  const { data: courses, isLoading: isLoadingCourses } = useCollection<Course>(coursesQuery);

  const allEventsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `professors/${user.uid}/academicEvents`));
  }, [user, firestore]);

  const { data: academicEvents, isLoading: isLoadingEvents } = useCollection<AcademicEvent>(allEventsQuery);

  const dynamicEvents = useMemo(() => {
      if (!academicEvents || !courses) return [];

      const coursesById = courses.reduce((acc, course) => {
        acc[course.id] = course;
        return acc;
      }, {} as Record<string, Course>)

      return academicEvents.map(event => ({
          date: new Date(event.dateTime),
          description: event.name,
          category: 'course-event' as EventCategory,
          courseCode: coursesById[event.courseId]?.code,
      }));
  }, [academicEvents, courses]);
  
  const allEvents = useMemo(() => [...staticEvents, ...dynamicEvents], [dynamicEvents]);

  const allMonthsEvents = useMemo(() => {
      return allEvents.filter(e => e.date.getFullYear() === year);
  }, [allEvents])

  const currentMonthEvents = allMonthsEvents
    .filter(e => e.date.getMonth() === currentMonth)
    .sort((a,b) => a.date.getTime() - b.date.getTime());

  const isLoading = isLoadingCourses || isLoadingEvents;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-primary">Calendário Arquitetura e Urbanismo</h1>
        <p className="text-muted-foreground">2º Semestre de {year}</p>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-4">
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                {isLoading ? (
                    Array.from({length: 5}).map((_, i) => <Skeleton key={i} className="h-72 w-full" />)
                ) : (
                    months.map(month => (
                        <CalendarMonth key={month} month={month} year={year} events={allMonthsEvents} />
                    ))
                )}
            </div>
        </div>

        <div className="xl:col-span-1 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Legenda</CardTitle>
                </CardHeader>
                 <CardContent className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {Object.entries(categoryLabels).map(([key, label]) => (
                        <div key={key} className="flex items-center gap-2">
                           <div className={cn("h-4 w-4 rounded-full border", categoryColors[key as EventCategory])}></div>
                           <span className="text-sm">{label}</span>
                        </div>
                    ))}
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Eventos de {monthNames[currentMonth]}</CardTitle>
                    <CardDescription>Passe o mouse sobre um evento para destacar o mês.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-40 w-full" /> : 
                    currentMonthEvents.length > 0 ? (
                        <div className="max-h-96 overflow-y-auto">
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead className="w-[80px]">Data</TableHead>
                            <TableHead>Evento</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {currentMonthEvents.map((event, index) => (
                            <TableRow key={index} onMouseEnter={() => setCurrentMonth(event.date.getMonth())}>
                                <TableCell className="font-medium">{event.date.toLocaleDateString('pt-BR', {day: '2-digit'})}</TableCell>
                                <TableCell>
                                    <div className='flex items-center gap-2'>
                                        <div className={cn("h-2 w-2 flex-shrink-0 rounded-full", categoryColors[event.category])}></div>
                                        <span>{event.description} {event.courseCode && `(${event.courseCode})`}</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                        </Table>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">Nenhum evento para este mês.</p>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
