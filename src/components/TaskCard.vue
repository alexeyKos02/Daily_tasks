<template>
  <div
    class="task-card"
    :class="{
      'is-completed': task.status === 'completed',
      'is-overdue': isOverdue && task.status === 'pending',
      'is-today': isToday && task.status === 'pending'
    }"
  >
    <!-- Left: checkbox + priority -->
    <div class="card-left">
      <div class="priority-dot" :class="task.priority" />
      <Checkbox
        :model-value="task.status === 'completed'"
        :binary="true"
        @change="store.toggleTask(task.id)"
      />
    </div>

    <!-- Center: content -->
    <div class="card-body">
      <div class="card-title-row">
        <span class="card-title">{{ task.title }}</span>
        <div class="card-badges">
          <span v-if="isOverdue && task.status === 'pending'" class="badge overdue">
            <i class="pi pi-exclamation-triangle" />просрочена
          </span>
          <span v-else-if="isToday && task.status === 'pending'" class="badge today">
            <i class="pi pi-clock" />сегодня
          </span>
          <span v-if="task.priority === 'high'" class="badge high-priority">
            <i class="pi pi-bolt" />срочно
          </span>
        </div>
      </div>

      <p v-if="task.description" class="card-desc">{{ task.description }}</p>

      <div class="card-meta">
        <span v-if="task.dueDate" class="meta-item" :class="{ danger: isOverdue }">
          <i class="pi pi-calendar" />
          {{ formatDate(task.dueDate) }}
        </span>
        <span v-if="task.comments.length" class="meta-item">
          <i class="pi pi-comment" />
          {{ task.comments.length }}
        </span>
        <span class="meta-item muted">
          <i class="pi pi-clock" />
          {{ timeAgo(task.createdAt) }}
        </span>
      </div>
    </div>

    <!-- Right: actions -->
    <div class="card-actions">
      <button class="icon-btn" @click="$emit('edit', task)" title="Редактировать">
        <i class="pi pi-pencil" />
      </button>
      <button class="icon-btn danger" @click="handleDelete" title="Удалить">
        <i class="pi pi-trash" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Checkbox from 'primevue/checkbox'
import { useTaskStore } from '@/stores/taskStore'
import { formatDate, isOverdue as _isOverdue, isTodayDate } from '@/utils/dateUtils'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import type { Task } from '@/types'

const props = defineProps<{ task: Task }>()
defineEmits<{ edit: [task: Task] }>()

const store = useTaskStore()

const isOverdue = computed(() => _isOverdue(props.task.dueDate))
const isToday = computed(() => isTodayDate(props.task.dueDate))

function timeAgo(isoStr: string): string {
  try {
    return formatDistanceToNow(parseISO(isoStr), { addSuffix: true, locale: ru })
  } catch { return '' }
}

function handleDelete() {
  store.deleteTask(props.task.id)
}
</script>

<style scoped>
.task-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  transition: all 0.18s;
}
.task-card:hover { box-shadow: var(--shadow); }

.task-card.is-completed {
  opacity: 0.6;
}
.task-card.is-overdue {
  border-left: 3px solid var(--danger);
}
.task-card.is-today {
  border-left: 3px solid var(--primary);
}

/* Completed title */
.task-card.is-completed .card-title {
  text-decoration: line-through;
  color: var(--text-muted);
}

/* Left */
.card-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding-top: 2px;
}

/* Body */
.card-body { flex: 1; min-width: 0; }

.card-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  line-height: 1.4;
}

.card-badges {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 99px;
}
.badge.overdue { background: #fef2f2; color: var(--danger); }
.badge.today { background: var(--primary-soft); color: var(--primary); }
.badge.high-priority { background: #fffbeb; color: #b45309; }

.card-desc {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 8px;
  line-height: 1.5;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--text-muted);
}
.meta-item .pi { font-size: 12px; }
.meta-item.danger { color: var(--danger); }
.meta-item.muted { opacity: 0.7; }

/* Actions */
.card-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s;
}
.task-card:hover .card-actions { opacity: 1; }

.icon-btn {
  background: none;
  border: none;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 13px;
  transition: all 0.15s;
}
.icon-btn:hover { background: var(--surface-hover); color: var(--text); }
.icon-btn.danger:hover { color: var(--danger); background: #fef2f2; }
</style>
