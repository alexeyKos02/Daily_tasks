import type { ParsedTask, TaskPriority } from '@/types'
import { extractDateFromText } from './dateUtils'

const HIGH_PRIORITY_KEYWORDS = [
  'срочно', 'срочная', 'критично', 'критическая', 'важно', 'важная',
  'немедленно', 'asap', '!!!', 'горит', 'приоритет'
]

const LOW_PRIORITY_KEYWORDS = [
  'когда будет время', 'не срочно', 'потом', 'при случае', 'желательно'
]

const ACTION_VERBS = [
  'сделать', 'выполнить', 'проверить', 'подготовить', 'написать', 'отправить',
  'позвонить', 'встретиться', 'обсудить', 'изучить', 'прочитать', 'скачать',
  'установить', 'настроить', 'починить', 'исправить', 'добавить', 'удалить',
  'обновить', 'создать', 'разработать', 'спланировать', 'организовать',
  'договориться', 'купить', 'заказать', 'оплатить', 'согласовать', 'review',
  'протестировать', 'задеплоить', 'задокументировать', 'описать', 'уточнить',
  'свяжись', 'запусти', 'завершить', 'закончить'
]

function detectPriority(text: string): TaskPriority {
  const lower = text.toLowerCase()
  if (HIGH_PRIORITY_KEYWORDS.some(kw => lower.includes(kw))) return 'high'
  if (LOW_PRIORITY_KEYWORDS.some(kw => lower.includes(kw))) return 'low'
  return 'medium'
}

function cleanTitle(text: string): string {
  return text
    // Remove bullet markers
    .replace(/^[\s]*[-–—•▪▶►*]+\s*/, '')
    // Remove numbered list markers
    .replace(/^[\s]*\d+[.)]\s*/, '')
    // Remove checkbox markers
    .replace(/^\[[ xX]?\]\s*/, '')
    // Remove priority/deadline prefixes like "Срочно:"
    .replace(/^(срочно|важно|asap|приоритет)\s*[:!]\s*/i, '')
    .trim()
}

function stripDateMentions(text: string): string {
  return text
    .replace(/\bдо\s+\d{1,2}\s+\w+(\s+\d{4})?\b/gi, '')
    .replace(/\b(сегодня|завтра|послезавтра)\b/gi, '')
    .replace(/\bв\s+(понедельник|вторник|среду|четверг|пятницу|субботу|воскресенье)\b/gi, '')
    .replace(/\bна следующей неделе\b/gi, '')
    .replace(/\b\d{1,2}[./]\d{1,2}([./]\d{4})?\b/g, '')
    .replace(/\b\d{1,2}\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)(\s+\d{4})?\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function isTaskLike(line: string): boolean {
  const lower = line.toLowerCase().trim()
  if (!lower) return false
  // Bullet or numbered
  if (/^[-–—•▪▶►*]\s/.test(line.trim())) return true
  if (/^\d+[.)]\s/.test(line.trim())) return true
  if (/^\[[ xX]?\]/.test(line.trim())) return true
  // Contains action verb
  if (ACTION_VERBS.some(v => lower.startsWith(v) || lower.includes(' ' + v + ' '))) return true
  // Has priority keyword
  if (HIGH_PRIORITY_KEYWORDS.some(kw => lower.includes(kw))) return true
  return false
}

/**
 * Splits raw text into candidate task strings using multiple strategies.
 */
function splitIntoSegments(rawText: string): string[] {
  const lines = rawText.split(/\n/)
  const segments: string[] = []
  let currentBuffer = ''

  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed) {
      if (currentBuffer.trim()) {
        segments.push(currentBuffer.trim())
        currentBuffer = ''
      }
      continue
    }

    const isBullet = /^[-–—•▪▶►*]\s/.test(trimmed)
    const isNumbered = /^\d+[.)]\s/.test(trimmed)
    const isCheckbox = /^\[[ xX]?\]/.test(trimmed)

    if (isBullet || isNumbered || isCheckbox) {
      if (currentBuffer.trim()) {
        segments.push(currentBuffer.trim())
      }
      currentBuffer = trimmed
    } else if (currentBuffer && !isBullet && !isNumbered) {
      // Continuation of previous task
      currentBuffer += ' ' + trimmed
    } else {
      if (currentBuffer.trim()) segments.push(currentBuffer.trim())
      currentBuffer = trimmed
    }
  }

  if (currentBuffer.trim()) segments.push(currentBuffer.trim())

  // If no structured list found, try splitting by sentence/comma
  if (segments.length <= 1 && rawText.trim().length > 0) {
    const sentenceSplit = rawText
      .split(/[;;\n]/)
      .map(s => s.trim())
      .filter(s => s.length > 3)
    if (sentenceSplit.length > 1) return sentenceSplit
    // Last resort: whole text = one task
    return [rawText.trim()]
  }

  return segments.filter(s => s.length > 2)
}

export function parseTextToTasks(rawText: string): ParsedTask[] {
  const segments = splitIntoSegments(rawText)
  const tasks: ParsedTask[] = []

  for (const segment of segments) {
    if (!segment.trim()) continue

    const rawTitle = cleanTitle(segment)
    const dueDate = extractDateFromText(segment)
    const priority = detectPriority(segment)
    const title = stripDateMentions(rawTitle)

    if (!title) continue

    // Capitalize first letter
    const finalTitle = title.charAt(0).toUpperCase() + title.slice(1)

    // Use cleaned source text as default description
    const description = cleanTitle(segment) !== finalTitle
      ? cleanTitle(segment)
      : segment.trim()

    tasks.push({
      title: finalTitle,
      description,
      dueDate,
      priority,
      sourceText: segment
    })
  }

  return tasks
}
