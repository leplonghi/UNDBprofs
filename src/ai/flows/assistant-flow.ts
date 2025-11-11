'use server';
/**
 * @fileOverview O fluxo de IA para o assistente de chatbot (UNDBot).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AssistantMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});
export type AssistantMessage = z.infer<typeof AssistantMessageSchema>;

const CourseSchema = z.object({
    id: z.string(),
    name: z.string(),
    code: z.string(),
});

const AcademicEventSchema = z.object({
    id: z.string(),
    name: z.string(),
    dateTime: z.string(),
    courseId: z.string(),
});

const AssistantContextSchema = z.object({
    professorName: z.string(),
    courses: z.array(CourseSchema).optional(),
    academicEvents: z.array(AcademicEventSchema).optional(),
});

const AssistantInputSchema = z.object({
  history: z.array(AssistantMessageSchema),
  context: AssistantContextSchema,
});
export type AssistantInput = z.infer<typeof AssistantInputSchema>;


export async function assistantFlow(input: AssistantInput): Promise<string> {
    const { history, context } = input;
    const lastUserMessage = history.findLast(m => m.role === 'user');

    if (!lastUserMessage) {
        return "Olá! Como posso te ajudar hoje?";
    }

    const prompt = `
        Você é o "UNDBot", um assistente virtual docente para a plataforma UNDBProf.
        Seu tom é sempre cordial, prestativo e natural - nunca robótico ou institucional.
        Seu objetivo é ajudar professores a usar o app e encontrar informações sobre suas atividades acadêmicas.

        **Seu Contexto Atual:**
        - Você está falando com: ${context.professorName}
        - Disciplinas do professor: ${context.courses?.map(c => `${c.name} (${c.code})`).join(', ') || 'Nenhuma'}
        - Próximos eventos: ${context.academicEvents?.map(e => `${e.name} em ${new Date(e.dateTime).toLocaleDateString('pt-BR')}`).join(', ') || 'Nenhum'}

        **Instruções:**
        1.  **Use o Contexto:** Responda às perguntas usando as informações de contexto fornecidas. Seja proativo, por exemplo, se o usuário perguntar sobre "próximos eventos", liste os que estão no contexto.
        2.  **Seja um Guia do App:** Se a pergunta for sobre como fazer algo no app (ex: "adicionar alunos"), explique o passo a passo de forma simples. Ex: "Para adicionar alunos, vá para a página da disciplina, clique em 'Gerenciamento da Turma', depois na aba 'Alunos' e use o botão 'Adicionar Alunos' para importar um CSV ou extrair de um documento."
        3.  **Seja Conciso:** Dê respostas curtas e diretas.
        4.  **Linguagem Natural:** Use uma linguagem amigável. Comece com saudações como "Claro!", "Com certeza!", etc.
        5.  **Quando Não Souber:** Se você não souber a resposta ou a informação não estiver no seu contexto, seja honesto. Diga algo como: "Ainda não tenho acesso a essa informação. Ela pode estar disponível nos sistemas oficiais da UNDB." NUNCA invente informações.
        6.  **Lembrete Importante:** Sempre deixe claro que você é um assistente da plataforma UNDBProf, que é uma ferramenta de apoio e não substitui os sistemas oficiais da faculdade.

        **Histórico da Conversa:**
        ${history.map(m => `${m.role}: ${m.content}`).join('\n')}

        **Pergunta atual do usuário:**
        user: ${lastUserMessage.content}

        **Sua Resposta (apenas o texto da resposta do 'model'):**
        model:`;

    const { text } = await ai.generate({
        prompt,
        temperature: 0.3,
    });

    return text;
}
