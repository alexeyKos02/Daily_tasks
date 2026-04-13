import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Task, ParsedTask, FilterType, TaskPriority } from '@/types'
import { todayISO, isOverdue, isTodayDate } from '@/utils/dateUtils'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function loadFromStorage(): Task[] {
  try {
    const raw = localStorage.getItem('daily-tasks')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveToStorage(tasks: Task[]): void {
  localStorage.setItem('daily-tasks', JSON.stringify(tasks))
}

export const useTaskStore = defineStore('tasks', () => {
  const tasks = ref<Task[]>(loadFromStorage())
  const filter = ref<FilterType>('all')
  const searchQuery = ref('')

  // Pending tasks from parsing, waiting for user confirmation
  const pendingParsed = ref<ParsedTask[]>([])

  function persist() {
    saveToStorage(tasks.value)
  }

  // ─── Filtering ────────────────────────────────────────────────────────────

  const filteredTasks = computed(() => {
    let result = tasks.value

    // Search
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase()
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.comments.some(c => c.text.toLowerCase().includes(q))
      )
    }

    // Filter
    switch (filter.value) {
      case 'active':
        result = result.filter(t => t.status === 'pending')
        break
      case 'completed':
        result = result.filter(t => t.status === 'completed')
        break
      case 'today':
        result = result.filter(t => isTodayDate(t.dueDate))
        break
      case 'overdue':
        result = result.filter(t => t.status === 'pending' && isOverdue(t.dueDate))
        break
    }

    // Sort: overdue first, then by date, then by priority weight
    const priorityWeight: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 }
    return [...result].sort((a, b) => {
      const aOverdue = a.status === 'pending' && isOverdue(a.dueDate) ? -1 : 0
      const bOverdue = b.status === 'pending' && isOverdue(b.dueDate) ? -1 : 0
      if (aOverdue !== bOverdue) return aOverdue - bOverdue

      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate)
      if (a.dueDate) return -1
      if (b.dueDate) return 1

      return priorityWeight[a.priority] - priorityWeight[b.priority]
    })
  })

  const counts = computed(() => ({
    all: tasks.value.length,
    active: tasks.value.filter(t => t.status === 'pending').length,
    completed: tasks.value.filter(t => t.status === 'completed').length,
    today: tasks.value.filter(t => isTodayDate(t.dueDate)).length,
    overdue: tasks.value.filter(t => t.status === 'pending' && isOverdue(t.dueDate)).length
  }))

  // ─── Task CRUD ────────────────────────────────────────────────────────────

  function addTask(parsed: ParsedTask): Task {
    const task: Task = {
      id: generateId(),
      title: parsed.title,
      description: parsed.description,
      status: 'pending',
      dueDate: parsed.dueDate,
      priority: parsed.priority,
      comments: [],
      createdAt: new Date().toISOString(),
      sourceText: parsed.sourceText
    }
    tasks.value.unshift(task)
    persist()
    return task
  }

  function addTasks(parsedList: ParsedTask[]): void {
    const newTasks: Task[] = parsedList.map(parsed => ({
      id: generateId(),
      title: parsed.title,
      description: parsed.description,
      status: 'pending' as const,
      dueDate: parsed.dueDate,
      priority: parsed.priority,
      comments: [],
      createdAt: new Date().toISOString(),
      sourceText: parsed.sourceText
    }))
    tasks.value.unshift(...newTasks)
    persist()
  }

  function updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>): void {
    const idx = tasks.value.findIndex(t => t.id === id)
    if (idx !== -1) {
      tasks.value[idx] = { ...tasks.value[idx], ...updates }
      persist()
    }
  }

  function toggleTask(id: string): void {
    const task = tasks.value.find(t => t.id === id)
    if (task) {
      task.status = task.status === 'completed' ? 'pending' : 'completed'
      persist()
    }
  }

  function deleteTask(id: string): void {
    tasks.value = tasks.value.filter(t => t.id !== id)
    persist()
  }

  function addComment(taskId: string, text: string): void {
    const task = tasks.value.find(t => t.id === taskId)
    if (task) {
      task.comments.push({
        id: generateId(),
        text,
        createdAt: new Date().toISOString()
      })
      persist()
    }
  }

  function deleteComment(taskId: string, commentId: string): void {
    const task = tasks.value.find(t => t.id === taskId)
    if (task) {
      task.comments = task.comments.filter(c => c.id !== commentId)
      persist()
    }
  }

  // ─── Pending parsed tasks ─────────────────────────────────────────────────

  function setPendingParsed(list: ParsedTask[]): void {
    pendingParsed.value = list
  }

  function confirmPending(): void {
    addTasks(pendingParsed.value)
    pendingParsed.value = []
  }

  function clearPending(): void {
    pendingParsed.value = []
  }

  function updatePendingTask(index: number, updates: Partial<ParsedTask>): void {
    if (pendingParsed.value[index]) {
      pendingParsed.value[index] = { ...pendingParsed.value[index], ...updates }
    }
  }

  function removePendingTask(index: number): void {
    pendingParsed.value.splice(index, 1)
  }

  function addPendingTask(task: ParsedTask): void {
    pendingParsed.value.push(task)
  }

  // ─── Calendar helpers ─────────────────────────────────────────────────────

  function getTasksForDate(dateStr: string): Task[] {
    return tasks.value.filter(t => t.dueDate === dateStr)
  }

  function getDatesWithTasks(): Set<string> {
    return new Set(tasks.value.map(t => t.dueDate).filter(Boolean) as string[])
  }

  return {
    tasks,
    filter,
    searchQuery,
    pendingParsed,
    filteredTasks,
    counts,
    addTask,
    addTasks,
    updateTask,
    toggleTask,
    deleteTask,
    addComment,
    deleteComment,
    setPendingParsed,
    confirmPending,
    clearPending,
    updatePendingTask,
    removePendingTask,
    addPendingTask,
    getTasksForDate,
    getDatesWithTasks
  }
})
