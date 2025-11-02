'use client';

import React, { useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

type EventCategory =
  | 'integradora-segunda'
  | 'integradora-quarta'
  | 'integradora-sexta'
  | 'modular-i'
  | 'modular-ii'
  | 'modular-iii'
  | 'feriado'
  | 'substitutiva'
  | 'prova-final';

interface CalendarEvent {
  date: Date;
  description: string;
  category: EventCategory;
}

const events: CalendarEvent[] = [
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
  'integradora-segunda': 'bg-orange-500',
  'integradora-quarta': 'bg-blue-500',
  'integradora-sexta': 'bg-purple-500',
  'modular-i': 'bg-green-500',
  'modular-ii': 'bg-teal-500',
  'modular-iii': 'bg-pink-500',
  'feriado': 'bg-yellow-400 text-black',
  'substitutiva': 'bg-red-500',
  'prova-final': 'bg-red-700',
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
};

const monthNames = [ "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro" ];

const CalendarMonth = ({ month, year, events }: { month: number, year: number, events: CalendarEvent[]}) => {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startingDay = firstDay.getDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const eventsByDay = events.reduce((acc, event) => {
    if (event.date.getMonth() === month && event.date.getFullYear() === year) {
        const day = event.date.getDate();
        if (!acc[day]) {
            acc[day] = [];
        }
        acc[day].push(event);
    }
    return acc;
  }, {} as Record<number, CalendarEvent[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-xl text-primary">
          {monthNames[month-7]} {year}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-center text-sm font-semibold text-muted-foreground">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => <div key={day}>{day}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1 mt-2">
          {Array.from({ length: startingDay }).map((_, i) => (
            <div key={`empty-${i}`}></div>
          ))}
          {days.map((day) => {
            const dayEvents = eventsByDay[day] || [];
            return (
              <div
                key={day}
                className={cn(
                  'relative flex h-12 w-full items-center justify-center rounded-md border text-sm font-medium',
                  dayEvents.length > 0 && 'text-white',
                  dayEvents.length === 1 && categoryColors[dayEvents[0].category],
                  dayEvents.length === 0 && 'bg-card'
                )}
              >
                {dayEvents.length > 1 ? (
                    <div className='w-full h-full grid grid-cols-2'>
                        {dayEvents.slice(0,4).map(event => (
                             <div key={event.description} className={cn('w-full h-full', categoryColors[event.category])}></div>
                        ))}
                    </div>
                ) : null}
                 <span className={cn(
                    'absolute',
                    dayEvents.length > 0 ? 'text-white' : 'text-foreground'
                 )}>{day}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};


export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(7); // 7 = Agosto
  const year = 2025;
  const lastMonth = 11; // 11 = Dezembro

  const handlePrevMonth = () => {
    setCurrentMonth(m => m > 7 ? m - 1 : 7);
  };

  const handleNextMonth = () => {
    setCurrentMonth(m => m < lastMonth ? m + 1 : lastMonth);
  };
  
  const currentMonthEvents = events.filter(e => e.date.getMonth() === currentMonth && e.date.getFullYear() === year)
                                    .sort((a,b) => a.date.getDate() - b.date.getDate());

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-primary">Calendário Arquitetura e Urbanismo</h1>
        <p className="text-muted-foreground">2º Semestre de 2025</p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
             {/* Navegação Mobile */}
            <div className="md:hidden flex items-center justify-between">
                <Button variant="outline" size="icon" onClick={handlePrevMonth} disabled={currentMonth === 7}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-xl font-bold text-primary">{monthNames[currentMonth-7]} {year}</h2>
                 <Button variant="outline" size="icon" onClick={handleNextMonth} disabled={currentMonth === lastMonth}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
            
            {/* Visão Desktop */}
            <div className='hidden md:grid md:grid-cols-1 lg:grid-cols-3 gap-4'>
                <CalendarMonth month={7} year={year} events={events} />
                <CalendarMonth month={8} year={year} events={events} />
                <CalendarMonth month={9} year={year} events={events} />
                <CalendarMonth month={10} year={year} events={events} />
                <CalendarMonth month={11} year={year} events={events} />
            </div>

            {/* Visão Mobile */}
            <div className="md:hidden">
                 <CalendarMonth month={currentMonth} year={year} events={events} />
            </div>

        </div>

        <div className="md:col-span-1 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Legenda</CardTitle>
                </CardHeader>
                 <CardContent className="space-y-2">
                    {Object.entries(categoryLabels).map(([key, label]) => (
                        <div key={key} className="flex items-center gap-2">
                           <div className={cn("h-4 w-4 rounded-full", categoryColors[key as EventCategory])}></div>
                           <span className="text-sm">{label}</span>
                        </div>
                    ))}
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Eventos de {monthNames[currentMonth-7]}</CardTitle>
                </CardHeader>
                <CardContent>
                    {currentMonthEvents.length > 0 ? (
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead className="w-[80px]">Data</TableHead>
                            <TableHead>Evento</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {currentMonthEvents.map((event, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-medium">{event.date.toLocaleDateString('pt-BR', {day: '2-digit'})}</TableCell>
                                <TableCell>
                                    <div className='flex items-center gap-2'>
                                        <div className={cn("h-2 w-2 rounded-full", categoryColors[event.category])}></div>
                                        <span>{event.description}</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                        </Table>
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
