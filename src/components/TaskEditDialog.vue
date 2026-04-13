<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    modal
    :header="task ? 'Редактировать задачу' : 'Новая задача'"
    :style="{ width: '540px' }"
    :pt="{ root: { class: 'task-dialog' } }"
  >
    <div v-if="localTask" class="dialog-body">
      <div class="field">
        <label>Название <span class="required">*</span></label>
        <InputText v-model="localTask.title" class="w-full" placeholder="Название задачи" />
      </div>

      <div class="field">
        <label>Описание</label>
        <Textarea v-model="localTask.description" :rows="3" class="w-full" placeholder="Подробности..." />
      </div>

      <div class="field-row">
        <div class="field">
          <label>Дата исполнения</label>
          <DatePicker
            v-model="localDate"
            date-format="dd.mm.yy"
            show-button-bar
            placeholder="Выбрать дату"
            class="w-full"
          />
        </div>
        <div class="field">
          <label>Приоритет</label>
          <Select
            v-model="localTask.priority"
            :options="priorityOptions"
            option-label="label"
            option-value="value"
            class="w-full"
          />
        </div>
      </div>

      <!-- Comments section -->
      <div class="field" v-if="task && task.comments.length > 0">
        <label>Комментарии</label>
        <div class="comments-list">
          <div v-for="comment in task.comments" :key="comment.id" class="comment-item">
            <div class="comment-text">{{ comment.text }}</div>
            <div class="comment-meta">
              <span>{{ formatDate(comment.createdAt) }}</span>
              <button class="del-comment" @click="deleteComment(comment.id)">
                <i class="pi pi-times" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="field" v-if="task">
        <label>Добавить комментарий</label>
        <div class="comment-input-row">
          <InputText v-model="newComment" class="flex-1" placeholder="Введите комментарий..." @keydown.enter="submitComment" />
          <button class="btn btn-ghost" @click="submitComment" :disabled="!newComment.trim()">
            <i class="pi pi-send" />
          </button>
        </div>
      </div>
    </div>

    <template #footer>
      <button class="btn btn-ghost" @click="$emit('update:visible', false)">Отмена</button>
      <button class="btn btn-primary" @click="save" :disabled="!localTask?.title?.trim()">
        <i class="pi pi-check" />
        Сохранить
      </button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import DatePicker from 'primevue/datepicker'
import Select from 'primevue/select'
import { useTaskStore } from '@/stores/taskStore'
import { toISODateString, formatDate as _formatDate } from '@/utils/dateUtils'
import type { Task } from '@/types'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'

const props = defineProps<{ visible: boolean; task: Task | null }>()
const emit = defineEmits<{
  'update:visible': [v: boolean]
  saved: []
}>()

const store = useTaskStore()
const newComment = ref('')

const localTask = ref<Partial<Task> | null>(null)
const localDate = ref<Date | null>(null)

watch(() => props.task, (t) => {
  if (t) {
    localTask.value = { ...t }
    localDate.value = t.dueDate ? new Date(t.dueDate + 'T00:00:00') : null
  } else {
    localTask.value = null
    localDate.value = null
  }
}, { immediate: true })

const priorityOptions = [
  { label: 'Высокий', value: 'high' },
  { label: 'Средний', value: 'medium' },
  { label: 'Низкий', value: 'low' }
]

function formatDate(isoStr: string): string {
  try {
    return format(parseISO(isoStr), 'd MMM yyyy, HH:mm', { locale: ru })
  } catch { return '' }
}

function save() {
  if (!localTask.value?.title?.trim() || !props.task) return
  const dueDate = localDate.value ? toISODateString(localDate.value) : null
  store.updateTask(props.task.id, {
    title: localTask.value.title,
    description: localTask.value.description || '',
    dueDate,
    priority: localTask.value.priority || 'medium'
  })
  emit('saved')
  emit('update:visible', false)
}

function submitComment() {
  if (!newComment.value.trim() || !props.task) return
  store.addComment(props.task.id, newComment.value.trim())
  newComment.value = ''
}

function deleteComment(commentId: string) {
  if (!props.task) return
  store.deleteComment(props.task.id, commentId)
}
</script>

<style scoped>
.dialog-body { display: flex; flex-direction: column; gap: 16px; }

.field { display: flex; flex-direction: column; gap: 6px; }
.field label { font-size: 12px; font-weight: 600; color: var(--text-muted); }
.required { color: var(--danger); }

.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

.comments-list { display: flex; flex-direction: column; gap: 8px; }
.comment-item {
  background: var(--surface-hover);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 13px;
}
.comment-text { color: var(--text); margin-bottom: 6px; line-height: 1.5; }
.comment-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-muted);
}
.del-comment {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 11px;
  padding: 2px 4px;
  border-radius: 4px;
}
.del-comment:hover { color: var(--danger); }

.comment-input-row { display: flex; gap: 8px; }
.flex-1 { flex: 1; }

.w-full { width: 100%; }
</style>
