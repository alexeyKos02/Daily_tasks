import OpenAI from 'openai'
import type { ParsedTask, TaskPriority } from '@/types'
import { todayISO } from '@/utils/dateUtils'

const SYSTEM_PROMPT = `Ты — ассистент для управления задачами.
Твоя задача — разобрать произвольный текст на отдельные задачи и вернуть их в виде JSON.

Правила:
- Выдели каждую отдельную задачу/действие из текста
- Для каждой задачи определи: название (кратко, до 80 символов), описание (если нужны подробности), дату исполнения (ISO формат YYYY-MM-DD или null), приоритет (high/medium/low)
- Приоритет: high — срочные/важные, low — «когда-нибудь», medium — всё остальное
- Даты: интерпретируй относительные даты («завтра», «в пятницу», «на следующей неделе», «до 15 апреля») относительно сегодняшней даты
- Если дата не упоминается — верни null
- Верни ТОЛЬКО валидный JSON без markdown-блоков, без пояснений

Формат ответа:
{"tasks": [{"title": "...", "description": "...", "dueDate": "YYYY-MM-DD или null", "priority": "high|medium|low", "sourceText": "исходный фрагмент текста"}]}`

interface AITask {
  title: string
  description: string
  dueDate: string | null
  priority: TaskPriority
  sourceText: string
}

interface AIResponse {
  tasks: AITask[]
}

export async function parseTextWithAI(text: string, apiKey: string): Promise<ParsedTask[]> {
  const client = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true
  })

  const today = todayISO()

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Сегодняшняя дата: ${today}\n\nТекст для разбора:\n${text}`
      }
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' }
  })

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error('Пустой ответ от API')

  const parsed: AIResponse = JSON.parse(content)

  if (!Array.isArray(parsed.tasks)) throw new Error('Неверный формат ответа')

  return parsed.tasks.map(t => ({
    title: t.title?.trim() || 'Без названия',
    description: t.description?.trim() || '',
    dueDate: t.dueDate || null,
    priority: (['high', 'medium', 'low'].includes(t.priority) ? t.priority : 'medium') as TaskPriority,
    sourceText: t.sourceText?.trim() || ''
  }))
}
