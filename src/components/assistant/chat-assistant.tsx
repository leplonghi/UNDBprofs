'use client';
import React, { useState, useRef, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send, X, Bot, User, Loader2 } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Course, AcademicEvent } from '@/types';
import { assistantFlow, type AssistantMessage } from '@/ai/flows/assistant-flow';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const assistantEventEmitter = {
  _listeners: new Set<(action: 'open') => void>(),
  subscribe(listener: (action: 'open') => void) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  },
  emit(action: 'open') {
    this._listeners.forEach(listener => listener(action));
  },
};


const suggestionPrompts = [
  "Minhas disciplinas",
  "Meus compromissos da semana",
  "Como eu adiciono alunos a uma turma?",
  "O que é o Café Pedagógico?",
  "Me ajude a navegar no app"
];

export function ChatAssistant() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      role: 'model',
      content: `Olá, ${user?.displayName?.split(' ')[0] || 'Professor(a)'}! Sou o UNDBot, seu assistente docente. Posso te ajudar com suas disciplinas, prazos, turmas ou recursos da comunidade. O que você gostaria de saber hoje?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isPending, startTransition] = useTransition();

  const coursesQuery = useMemoFirebase(
    () => (user ? query(collection(firestore, `professors/${user.uid}/courses`)) : null),
    [user, firestore]
  );
  const { data: courses } = useCollection<Course>(coursesQuery);

  const academicEventsQuery = useMemoFirebase(
    () => (user ? query(collection(firestore, `professors/${user.uid}/academicEvents`)) : null),
    [user, firestore]
  );
  const { data: academicEvents } = useCollection<AcademicEvent>(academicEventsQuery);

  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  useEffect(() => {
    const unsubscribe = assistantEventEmitter.subscribe((action) => {
      if (action === 'open') {
        setIsOpen(true);
      }
    });
    return unsubscribe;
  }, []);

  const handleSend = async (prompt?: string) => {
    const currentInput = prompt || input;
    if (!currentInput.trim()) return;

    const userMessage: AssistantMessage = { role: 'user', content: currentInput };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    startTransition(async () => {
      try {
        const history = [...messages, userMessage];
        const context = {
            professorName: user?.displayName || 'Professor(a)',
            courses: courses || [],
            academicEvents: academicEvents || [],
        }
        const result = await assistantFlow({ history, context });
        setMessages((prev) => [...prev, { role: 'model', content: result }]);
      } catch (error) {
        console.error("Assistant flow error:", error);
        setMessages((prev) => [...prev, { role: 'model', content: "Desculpe, ocorreu um erro ao processar sua solicitação. Tente novamente." }]);
      }
    });
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="fixed bottom-4 right-4 md:bottom-6 md:right-6 h-16 w-16 rounded-full shadow-lg animate-pulse"
              onClick={() => setIsOpen(true)}
              size="icon"
            >
              <Bot className="h-8 w-8" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Assistente Docente</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 md:bottom-6 md:right-6 w-[calc(100vw-2rem)] h-[calc(100vh-4rem)] md:w-96 md:h-auto flex flex-col shadow-2xl z-50">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
            <Bot className="h-6 w-6 text-primary" />
            <CardTitle>Assistente Docente</CardTitle>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
          <X className="h-5 w-5" />
        </Button>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'model' && <Bot className="h-5 w-5 text-primary flex-shrink-0" />}
            <div className={`rounded-lg px-3 py-2 text-sm max-w-xs ${msg.role === 'model' ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
              {msg.content}
            </div>
             {msg.role === 'user' && <User className="h-5 w-5 text-muted-foreground flex-shrink-0" />}
          </div>
        ))}
        {isPending && (
          <div className="flex items-start gap-3">
             <Bot className="h-5 w-5 text-primary flex-shrink-0" />
             <div className="rounded-lg px-3 py-2 text-sm bg-muted flex items-center">
                <Loader2 className="h-4 w-4 animate-spin" />
             </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </CardContent>
      <CardFooter className="flex-col items-start gap-2">
         {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 mb-2">
              {suggestionPrompts.map(prompt => (
                  <Button key={prompt} size="sm" variant="outline" onClick={() => handleSend(prompt)}>
                      {prompt}
                  </Button>
              ))}
          </div>
        )}
        <div className="flex w-full gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              disabled={isPending}
            />
            <Button onClick={() => handleSend()} disabled={isPending || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
