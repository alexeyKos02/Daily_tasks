import {
  format,
  addDays,
  nextMonday,
  nextTuesday,
  nextWednesday,
  nextThursday,
  nextFriday,
  nextSaturday,
  nextSunday,
  isToday,
  isBefore,
  startOfDay,
  parseISO
} from 'date-fns'
import { ru } from 'date-fns/locale'

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  try {
    const date = parseISO(dateStr)
    return format(date, 'd MMMM yyyy', { locale: ru })
  } catch {
    return dateStr
  }
}

export function formatDateShort(dateStr: string | null): string {
  if (!dateStr) return ''
  try {
    const date = parseISO(dateStr)
    return format(date, 'd MMM', { locale: ru })
  } catch {
    return dateStr
  }
}

export function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false
  try {
    const date = parseISO(dateStr)
    return isBefore(startOfDay(date), startOfDay(new Date()))
  } catch {
    return false
  }
}

export function isTodayDate(dateStr: string | null): boolean {
  if (!dateStr) return false
  try {
    return isToday(parseISO(dateStr))
  } catch {
    return false
  }
}

export function toISODateString(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function todayISO(): string {
  return toISODateString(new Date())
}

/**
 * Extracts a due date from a Russian-language text segment.
 * Returns ISO date string or null.
 */
export function extractDateFromText(text: string): string | null {
  const lower = text.toLowerCase()
  const today = new Date()

  // Relative: сегодня
  if (/сегодня/.test(lower)) return toISODateString(today)

  // Relative: завтра
  if (/завтра/.test(lower)) return toISODateString(addDays(today, 1))

  // Relative: послезавтра
  if (/послезавтра/.test(lower)) return toISODateString(addDays(today, 2))

  // Next week
  if (/на следующей неделе|следующая неделя|следующей недели/.test(lower))
    return toISODateString(addDays(today, 7))

  // Day names
  const dayMap: Record<string, () => Date> = {
    понедельник: () => nextMonday(today),
    вторник: () => nextTuesday(today),
    среду: () => nextWednesday(today),
    среда: () => nextWednesday(today),
    четверг: () => nextThursday(today),
    пятницу: () => nextFriday(today),
    пятница: () => nextFriday(today),
    субботу: () => nextSaturday(today),
    суббота: () => nextSaturday(today),
    воскресенье: () => nextSunday(today)
  }

  for (const [day, fn] of Object.entries(dayMap)) {
    if (lower.includes(day)) return toISODateString(fn())
  }

  // Explicit Russian dates: "15 апреля", "3 марта 2026"
  const russianMonths: Record<string, number> = {
    января: 0, февраля: 1, марта: 2, апреля: 3, мая: 4, июня: 5,
    июля: 6, августа: 7, сентября: 8, октября: 9, ноября: 10, декабря: 11
  }

  const ruDateMatch = lower.match(/(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)(?:\s+(\d{4}))?/)
  if (ruDateMatch) {
    const day = parseInt(ruDateMatch[1])
    const month = russianMonths[ruDateMatch[2]]
    const year = ruDateMatch[3] ? parseInt(ruDateMatch[3]) : today.getFullYear()
    const date = new Date(year, month, day)
    if (!isNaN(date.getTime())) return toISODateString(date)
  }

  // Numeric dates: 15.04.2026, 15/04/2026, 15.04
  const numDateMatch = lower.match(/(\d{1,2})[./](\d{1,2})(?:[./](\d{4}))?/)
  if (numDateMatch) {
    const day = parseInt(numDateMatch[1])
    const month = parseInt(numDateMatch[2]) - 1
    const year = numDateMatch[3] ? parseInt(numDateMatch[3]) : today.getFullYear()
    const date = new Date(year, month, day)
    if (!isNaN(date.getTime()) && month >= 0 && month <= 11) return toISODateString(date)
  }

  // "до X" prefix patterns
  const deadlineMatch = lower.match(/до\s+(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)(?:\s+(\d{4}))?/)
  if (deadlineMatch) {
    const day = parseInt(deadlineMatch[1])
    const month = russianMonths[deadlineMatch[2]]
    const year = deadlineMatch[3] ? parseInt(deadlineMatch[3]) : today.getFullYear()
    const date = new Date(year, month, day)
    if (!isNaN(date.getTime())) return toISODateString(date)
  }

  return null
}
