'use client';

import React, { useState, useMemo, useCallback } from 'react';
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
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { AcademicEvent, Course } from '@/types';
import { isToday, isSameDay, addMonths, subMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
    'integradora-segunda': 'bg-orange-400 text-orange-900',
    'integradora-quarta': 'bg-teal-400 text-teal-900',
    'integradora-sexta': 'bg-purple-400 text-purple-900',
    'modular-i': 'bg-lime-400 text-lime-900',
    'modular-ii': 'bg-rose-400 text-rose-900',
    'modular-iii': 'bg-pink-400 text-pink-900',
    'feriado': 'bg-yellow-400 text-yellow-900',
    'substitutiva': 'bg-red-500 text-white',
    'prova-final': 'bg-red-700 text-white',
    'course-event': 'bg-primary text-primary-foreground',
};

const categoryBgColors: Record<EventCategory, string> = {
  'integradora-segunda': 'bg-orange-100 dark:bg-orange-900/20',
  'integradora-quarta': 'bg-teal-100 dark:bg-teal-900/20',
  'integradora-sexta': 'bg-purple-100 dark:bg-purple-900/20',
  'modular-i': 'bg-lime-100 dark:bg-lime-900/20',
  'modular-ii': 'bg-rose-100 dark:bg-rose-900/20',
  'modular-iii': 'bg-pink-100 dark:bg-pink-900/20',
  'feriado': 'bg-yellow-100 dark:bg-yellow-900/20',
  'substitutiva': 'bg-red-100 dark:bg-red-900/20',
  'prova-final': 'bg-red-200 dark:bg-red-900/40',
  'course-event': 'bg-primary/10',
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

const CalendarMonth = ({
  currentDate,
  events,
  setHoveredDate,
}: {
  currentDate: Date;
  events: CalendarEvent[];
  setHoveredDate: (date: Date | null) => void;
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
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
    <Card className="flex-1">
      <CardContent className="p-2">
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-muted-foreground">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 mt-2">
          {Array.from({ length: startingDay }).map((_, i) => (
            <div key={`empty-${i}`}></div>
          ))}
          {days.map((day) => {
            const dayEvents = eventsByDay[day] || [];
            const dayDate = new Date(year, month, day);
            const today = isToday(dayDate);
            const bgColor = dayEvents.length > 0 ? categoryBgColors[dayEvents[0].category] : 'transparent';

            return (
              <TooltipProvider key={day} delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      onMouseEnter={() => setHoveredDate(dayDate)}
                      onMouseLeave={() => setHoveredDate(null)}
                      className={cn(
                        'relative flex h-14 w-full flex-col items-center justify-start rounded-md border p-1.5 text-xs font-medium transition-colors',
                         bgColor,
                         today && 'border-2 border-primary'
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-6 w-6 items-center justify-center rounded-full',
                          today && 'bg-primary text-primary-foreground'
                        )}
                      >
                        {day}
                      </span>
                      {dayEvents.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-0.5 mt-1">
                          {dayEvents.slice(0, 4).map((event, index) => (
                            <div
                              key={index}
                              className={cn(
                                'h-1.5 w-1.5 rounded-full',
                                categoryColors[event.category].split(' ')[0] // Get only bg color
                              )}
                            ></div>
                          ))}
                        </div>
                      )}
                    </div>
                  </TooltipTrigger>
                  {dayEvents.length > 0 && (
                    <TooltipContent>
                      <ul className="space-y-1">
                        {dayEvents.map((event, index) => (
                          <li
                            key={index}
                            className="flex items-center gap-2 text-xs"
                          >
                            <div
                              className={cn(
                                'h-2 w-2 rounded-full',
                                categoryColors[event.category].split(' ')[0]
                              )}
                            ></div>
                            <span>
                              {event.description}{' '}
                              {event.courseCode && `(${event.courseCode})`}
                            </span>
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
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(() => new Date(2025, 7, 1)); // Start in August 2025
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  const coursesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `professors/${user.uid}/courses`));
  }, [user, firestore]);
  const { data: courses, isLoading: isLoadingCourses } =
    useCollection<Course>(coursesQuery);

  const allEventsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `professors/${user.uid}/academicEvents`));
  }, [user, firestore]);

  const { data: academicEvents, isLoading: isLoadingEvents } =
    useCollection<AcademicEvent>(allEventsQuery);

  const dynamicEvents = useMemo(() => {
    if (!academicEvents || !courses) return [];

    const coursesById = courses.reduce((acc, course) => {
      acc[course.id] = course;
      return acc;
    }, {} as Record<string, Course>);

    return academicEvents.map((event) => ({
      date: new Date(event.dateTime),
      description: event.name,
      category: 'course-event' as EventCategory,
      courseCode: coursesById[event.courseId]?.code,
    }));
  }, [academicEvents, courses]);

  const allEvents = useMemo(
    () => [...staticEvents, ...dynamicEvents],
    [dynamicEvents]
  );
  
  const currentMonthEvents = useMemo(() => {
    return allEvents
      .filter((e) => e.date.getMonth() === currentDate.getMonth() && e.date.getFullYear() === currentDate.getFullYear())
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [allEvents, currentDate]);

  const changeMonth = useCallback((amount: number) => {
    setCurrentDate(current => {
        const newMonth = current.getMonth() + amount;
        // Clamp between Aug 2025 and Dec 2025
        if (newMonth < 7) return new Date(2025, 7, 1);
        if (newMonth > 11) return new Date(2025, 11, 1);
        return addMonths(current, amount);
    });
  }, []);

  const isLoading = isLoadingCourses || isLoadingEvents;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-primary">
            Calendário Arquitetura e Urbanismo
          </h1>
          <p className="text-muted-foreground">2º Semestre de 2025</p>
        </div>
      </div>


      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
            <Card>
                 <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-xl capitalize">
                      {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => changeMonth(-1)} disabled={currentDate.getMonth() <= 7}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => changeMonth(1)} disabled={currentDate.getMonth() >= 11}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                 </CardHeader>
                 <CardContent>
                    {isLoading ? (
                         <Skeleton className="h-96 w-full" />
                    ) : (
                        <CalendarMonth currentDate={currentDate} events={allEvents} setHoveredDate={setHoveredDate} />
                    )}
                 </CardContent>
            </Card>

            <Card className="lg:hidden">
                 <CardHeader>
                    <CardTitle>Legenda</CardTitle>
                </CardHeader>
                 <CardContent className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {Object.entries(categoryLabels).map(([key, label]) => (
                        <div key={key} className="flex items-center gap-2">
                           <div className={cn("h-3 w-3 rounded-full border", categoryColors[key as EventCategory].split(' ')[0])}></div>
                           <span className="text-sm">{label}</span>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
            <Card className="hidden lg:block">
                 <CardHeader>
                    <CardTitle>Legenda</CardTitle>
                </CardHeader>
                 <CardContent className="grid grid-cols-1 gap-y-2">
                    {Object.entries(categoryLabels).map(([key, label]) => (
                        <div key={key} className="flex items-center gap-2">
                           <div className={cn("h-3 w-3 rounded-full border", categoryColors[key as EventCategory].split(' ')[0])}></div>
                           <span className="text-sm">{label}</span>
                        </div>
                    ))}
                </CardContent>
            </Card>

          <Card>
            <CardHeader>
              <CardTitle>Eventos de {format(currentDate, 'MMMM', {locale: ptBR})}</CardTitle>
              <CardDescription>
                Eventos importantes para o mês selecionado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : currentMonthEvents.length > 0 ? (
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
                        <TableRow key={index} className={cn(hoveredDate && isSameDay(event.date, hoveredDate) && 'bg-accent')}>
                          <TableCell className="font-medium">
                            {format(event.date, 'dd/MM')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className={cn(
                                  'h-2 w-2 flex-shrink-0 rounded-full',
                                  categoryColors[event.category].split(' ')[0]
                                )}
                              ></div>
                              <span className="text-xs">{event.description} {event.courseCode && `(${event.courseCode})`}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum evento para este mês.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
