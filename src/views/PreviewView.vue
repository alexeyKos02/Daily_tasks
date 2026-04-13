<template>
  <div class="preview-view">
    <div class="view-header">
      <div class="header-top">
        <button class="btn btn-ghost back-btn" @click="goBack">
          <i class="pi pi-arrow-left" />
          Назад
        </button>
      </div>
      <h1 class="view-title">Проверьте результат</h1>
      <p class="view-subtitle">
        Распознано <strong>{{ store.pendingParsed.length }}</strong> задач. Всё верно?
        Проверьте и при необходимости исправьте.
      </p>
    </div>

    <!-- Empty state -->
    <div v-if="store.pendingParsed.length === 0" class="empty-preview card">
      <i class="pi pi-inbox" />
      <p>Задачи не найдены. Попробуйте другой текст.</p>
      <button class="btn btn-ghost" @click="goBack">Вернуться</button>
    </div>

    <!-- Confirmation banner -->
    <div v-else class="confirm-banner card">
      <div class="banner-icon">
        <i class="pi pi-question-circle" />
      </div>
      <div class="banner-content">
        <strong>Всё нормально распозналось?</strong>
        <span>Проверьте задачи ниже, исправьте формулировки или даты, добавьте нужные — и подтвердите список.</span>
      </div>
      <div class="banner-actions">
        <button class="btn btn-ghost" @click="goBack">
          <i class="pi pi-refresh" />
          Перегенерировать
        </button>
        <button class="btn btn-primary" @click="confirmAll">
          <i class="pi pi-check" />
          Подтвердить ({{ store.pendingParsed.length }})
        </button>
      </div>
    </div>

    <!-- Task list -->
    <div class="preview-list">
      <TransitionGroup name="list">
        <div
          v-for="(task, index) in store.pendingParsed"
          :key="index"
          class="preview-item card"
          :class="{ editing: editingIndex === index }"
        >
          <!-- View mode -->
          <template v-if="editingIndex !== index">
            <div class="preview-item-header">
              <div class="priority-dot" :class="task.priority" />
              <span class="item-index">#{{ index + 1 }}</span>
              <div class="item-actions">
                <button class="icon-btn" @click="startEdit(index)" title="Редактировать">
                  <i class="pi pi-pencil" />
                </button>
                <button class="icon-btn danger" @click="store.removePendingTask(index)" title="Удалить">
                  <i class="pi pi-trash" />
                </button>
              </div>
            </div>

            <h3 class="item-title">{{ task.title }}</h3>

            <div class="item-meta">
              <span v-if="task.dueDate" class="meta-badge date">
                <i class="pi pi-calendar" />
                {{ formatDate(task.dueDate) }}
              </span>
              <span v-else class="meta-badge no-date">
                <i class="pi pi-calendar-times" />
                Дата не указана
              </span>
              <span class="meta-badge" :class="'priority-badge-' + task.priority">
                <i class="pi pi-flag" />
                {{ priorityLabel[task.priority] }}
              </span>
            </div>

            <div v-if="task.sourceText && task.sourceText !== task.title" class="source-text">
              <i class="pi pi-align-left" />
              {{ task.sourceText }}
            </div>
          </template>

          <!-- Edit mode -->
          <template v-else>
            <div class="edit-form">
              <div class="edit-field">
                <label>Название задачи</label>
                <InputText v-model="editBuffer.title" class="w-full" />
              </div>

              <div class="edit-row">
                <div class="edit-field">
                  <label>Дата исполнения</label>
                  <DatePicker
                    v-model="editDateBuffer"
                    date-format="dd.mm.yy"
                    show-button-bar
                    placeholder="Выбрать дату"
                    class="w-full"
                  />
                </div>
                <div class="edit-field">
                  <label>Приоритет</label>
                  <Select
                    v-model="editBuffer.priority"
                    :options="priorityOptions"
                    option-label="label"
                    option-value="value"
                    class="w-full"
                  />
                </div>
              </div>

              <div class="edit-field">
                <label>Описание (опционально)</label>
                <Textarea v-model="editBuffer.description" :rows="2" class="w-full" />
              </div>

              <div class="edit-actions">
                <button class="btn btn-ghost" @click="cancelEdit">Отмена</button>
                <button class="btn btn-primary" @click="saveEdit(index)">
                  <i class="pi pi-check" />
                  Сохранить
                </button>
              </div>
            </div>
          </template>
        </div>
      </TransitionGroup>

      <!-- Add task button -->
      <button class="add-task-btn" @click="addEmptyTask">
        <i class="pi pi-plus" />
        Добавить задачу вручную
      </button>
    </div>

    <!-- Bottom confirm bar -->
    <div v-if="store.pendingParsed.length > 0" class="bottom-bar">
      <span class="bottom-bar-info">{{ store.pendingParsed.length }} задач готово к добавлению</span>
      <button class="btn btn-primary large" @click="confirmAll">
        <i class="pi pi-check-circle" />
        Подтвердить и сохранить
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import DatePicker from 'primevue/datepicker'
import Select from 'primevue/select'
import { useToast } from 'primevue/usetoast'
import { useTaskStore } from '@/stores/taskStore'
import { formatDate, toISODateString } from '@/utils/dateUtils'
import type { ParsedTask, TaskPriority } from '@/types'

const router = useRouter()
const store = useTaskStore()
const toast = useToast()

const editingIndex = ref<number | null>(null)
const editBuffer = reactive<ParsedTask>({
  title: '',
  description: '',
  dueDate: null,
  priority: 'medium',
  sourceText: ''
})
const editDateBuffer = ref<Date | null>(null)

const priorityLabel: Record<TaskPriority, string> = {
  high: 'Высокий',
  medium: 'Средний',
  low: 'Низкий'
}

const priorityOptions = [
  { label: 'Высокий', value: 'high' },
  { label: 'Средний', value: 'medium' },
  { label: 'Низкий', value: 'low' }
]

function goBack() {
  store.clearPending()
  router.push('/')
}

function startEdit(index: number) {
  const task = store.pendingParsed[index]
  editBuffer.title = task.title
  editBuffer.description = task.description
  editBuffer.dueDate = task.dueDate
  editBuffer.priority = task.priority
  editBuffer.sourceText = task.sourceText
  editDateBuffer.value = task.dueDate ? new Date(task.dueDate + 'T00:00:00') : null
  editingIndex.value = index
}

function cancelEdit() {
  editingIndex.value = null
}

function saveEdit(index: number) {
  const dueDate = editDateBuffer.value ? toISODateString(editDateBuffer.value) : null
  store.updatePendingTask(index, {
    title: editBuffer.title,
    description: editBuffer.description,
    dueDate,
    priority: editBuffer.priority
  })
  editingIndex.value = null
}

function addEmptyTask() {
  store.addPendingTask({
    title: 'Новая задача',
    description: '',
    dueDate: null,
    priority: 'medium',
    sourceText: ''
  })
  // Auto-open edit for the new task
  setTimeout(() => startEdit(store.pendingParsed.length - 1), 50)
}

function confirmAll() {
  const count = store.pendingParsed.length
  store.confirmPending()
  toast.add({
    severity: 'success',
    summary: 'Задачи добавлены',
    detail: `${count} задач успешно сохранено`,
    life: 3000
  })
  router.push('/tasks')
}
</script>

<style scoped>
.preview-view { max-width: 760px; }

.header-top { margin-bottom: 12px; }
.back-btn { padding: 7px 12px; font-size: 13px; }

/* Confirm banner */
.confirm-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: var(--primary-soft);
  border-color: var(--primary);
  margin-bottom: 20px;
}

.banner-icon .pi {
  font-size: 24px;
  color: var(--primary);
}

.banner-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 14px;
}
.banner-content strong { color: var(--text); }
.banner-content span { color: var(--text-muted); font-size: 13px; }

.banner-actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

/* List */
.preview-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 80px;
}

.preview-item {
  padding: 16px 18px;
  transition: all 0.2s;
}
.preview-item.editing {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(99,102,241,.1);
}

.preview-item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.item-index {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 600;
}

.item-actions {
  margin-left: auto;
  display: flex;
  gap: 4px;
}

.icon-btn {
  background: none;
  border: none;
  padding: 5px 7px;
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 13px;
  transition: all 0.15s;
}
.icon-btn:hover { background: var(--surface-hover); color: var(--text); }
.icon-btn.danger:hover { color: var(--danger); background: #fef2f2; }

.item-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 10px;
  line-height: 1.4;
}

.item-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.meta-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  padding: 3px 9px;
  border-radius: 99px;
  font-weight: 500;
}
.meta-badge.date { background: #e0e7ff; color: #4338ca; }
.meta-badge.no-date { background: var(--surface-hover); color: var(--text-muted); }
.priority-badge-high { background: #fef2f2; color: #dc2626; }
.priority-badge-medium { background: #fffbeb; color: #b45309; }
.priority-badge-low { background: #f0fdf4; color: #15803d; }

.source-text {
  font-size: 12px;
  color: var(--text-muted);
  display: flex;
  gap: 6px;
  align-items: flex-start;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed var(--border);
  font-style: italic;
}

/* Edit form */
.edit-form { display: flex; flex-direction: column; gap: 14px; }
.edit-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.edit-field { display: flex; flex-direction: column; gap: 6px; }
.edit-field label { font-size: 12px; font-weight: 600; color: var(--text-muted); }
.edit-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 4px; }

/* Add task button */
.add-task-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px;
  border: 2px dashed var(--border);
  border-radius: var(--radius);
  background: none;
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.add-task-btn:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-soft); }

/* Bottom bar */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: var(--sidebar-w);
  right: 0;
  background: var(--surface);
  border-top: 1px solid var(--border);
  padding: 14px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  z-index: 50;
}
.bottom-bar-info { font-size: 14px; color: var(--text-muted); }
.btn.large { padding: 12px 24px; font-size: 15px; }

/* Empty state */
.empty-preview {
  text-align: center;
  padding: 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: var(--text-muted);
}
.empty-preview .pi { font-size: 40px; }

/* Transitions */
.list-enter-active, .list-leave-active { transition: all 0.25s; }
.list-enter-from, .list-leave-to { opacity: 0; transform: translateY(-8px); }

.w-full { width: 100%; }
</style>
