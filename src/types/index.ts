export type TaskStatus = 'pending' | 'completed'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface Comment {
  id: string
  text: string
  createdAt: string
}

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  dueDate: string | null
  priority: TaskPriority
  comments: Comment[]
  createdAt: string
  sourceText?: string
}

export interface ParsedTask {
  title: string
  description: string
  dueDate: string | null
  priority: TaskPriority
  sourceText: string
}

export type FilterType = 'all' | 'active' | 'completed' | 'today' | 'overdue'
