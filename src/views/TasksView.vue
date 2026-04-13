<template>
  <div class="tasks-view">
    <div class="view-header">
      <div class="header-row">
        <div>
          <h1 class="view-title">Все задачи</h1>
          <p class="view-subtitle">{{ store.filteredTasks.length }} задач</p>
        </div>
        <RouterLink to="/" class="btn btn-primary">
          <i class="pi pi-plus" />
          Новые задачи
        </RouterLink>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
      <!-- Search -->
      <div class="search-wrap">
        <i class="pi pi-search search-icon" />
        <InputText
          v-model="store.searchQuery"
          placeholder="Поиск по задачам..."
          class="search-input"
        />
        <button v-if="store.searchQuery" class="clear-search" @click="store.searchQuery = ''">
          <i class="pi pi-times" />
        </button>
      </div>

      <!-- Filters -->
      <div class="filters">
        <button
          v-for="f in filters"
          :key="f.value"
          class="filter-btn"
          :class="{ active: store.filter === f.value }"
          @click="store.filter = f.value"
        >
          {{ f.label }}
          <span class="filter-count" v-if="store.counts[f.value] > 0">
            {{ store.counts[f.value] }}
          </span>
        </button>
      </div>
    </div>

    <!-- Task list -->
    <div class="task-list" v-if="store.filteredTasks.length > 0">
      <TransitionGroup name="list">
        <TaskCard
          v-for="task in store.filteredTasks"
          :key="task.id"
          :task="task"
          @edit="openEdit"
        />
      </TransitionGroup>
    </div>

    <!-- Empty state -->
    <div v-else class="empty-state card">
      <i :class="emptyIcon" />
      <h3>{{ emptyTitle }}</h3>
      <p>{{ emptyDesc }}</p>
      <RouterLink v-if="store.filter === 'all' && !store.searchQuery" to="/" class="btn btn-primary">
        <i class="pi pi-plus" />
        Добавить задачи
      </RouterLink>
      <button v-else class="btn btn-ghost" @click="resetFilters">
        <i class="pi pi-filter-slash" />
        Сбросить фильтры
      </button>
    </div>

    <!-- Edit dialog -->
    <TaskEditDialog v-model:visible="editVisible" :task="editTask" @saved="editTask = null" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import InputText from 'primevue/inputtext'
import { useTaskStore } from '@/stores/taskStore'
import TaskCard from '@/components/TaskCard.vue'
import TaskEditDialog from '@/components/TaskEditDialog.vue'
import type { Task, FilterType } from '@/types'

const store = useTaskStore()

const editVisible = ref(false)
const editTask = ref<Task | null>(null)

const filters: { label: string; value: FilterType }[] = [
  { label: 'Все', value: 'all' },
  { label: 'Активные', value: 'active' },
  { label: 'Выполненные', value: 'completed' },
  { label: 'Сегодня', value: 'today' },
  { label: 'Просроченные', value: 'overdue' }
]

function openEdit(task: Task) {
  editTask.value = task
  editVisible.value = true
}

function resetFilters() {
  store.filter = 'all'
  store.searchQuery = ''
}

const emptyIcon = computed(() => {
  if (store.searchQuery) return 'pi pi-search'
  const icons: Record<FilterType, string> = {
    all: 'pi pi-inbox',
    active: 'pi pi-check-circle',
    completed: 'pi pi-check-square',
    today: 'pi pi-calendar',
    overdue: 'pi pi-exclamation-circle'
  }
  return icons[store.filter]
})

const emptyTitle = computed(() => {
  if (store.searchQuery) return 'Ничего не найдено'
  const titles: Record<FilterType, string> = {
    all: 'Задач пока нет',
    active: 'Нет активных задач',
    completed: 'Нет выполненных задач',
    today: 'Нет задач на сегодня',
    overdue: 'Нет просроченных задач'
  }
  return titles[store.filter]
})

const emptyDesc = computed(() => {
  if (store.searchQuery) return `По запросу «${store.searchQuery}» ничего не найдено`
  const descs: Record<FilterType, string> = {
    all: 'Вставьте текст на главном экране — приложение разберёт его на задачи',
    active: 'Все задачи выполнены!',
    completed: 'Отметьте задачи как выполненные',
    today: 'Назначьте задачам дату исполнения на сегодня',
    overdue: 'Отлично! Просроченных задач нет'
  }
  return descs[store.filter]
})
</script>

<style scoped>
.tasks-view { max-width: 780px; }

.header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

/* Toolbar */
.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: center;
}

.search-wrap {
  position: relative;
  flex: 1;
  min-width: 200px;
}
.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  font-size: 14px;
  pointer-events: none;
}
.search-input {
  width: 100%;
  padding-left: 36px !important;
}
.clear-search {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 12px;
  padding: 4px;
  border-radius: 4px;
}
.clear-search:hover { color: var(--text); }

/* Filters */
.filters {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 13px;
  border-radius: 99px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.filter-btn:hover { color: var(--text); border-color: var(--text-muted); }
.filter-btn.active {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}

.filter-count {
  background: rgba(255,255,255,0.25);
  border-radius: 99px;
  padding: 0 6px;
  font-size: 11px;
  font-weight: 700;
  min-width: 18px;
  text-align: center;
}
.filter-btn:not(.active) .filter-count {
  background: var(--primary-soft);
  color: var(--primary);
}

/* Task list */
.task-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 32px;
  text-align: center;
  gap: 12px;
  color: var(--text-muted);
}
.empty-state .pi { font-size: 48px; margin-bottom: 8px; }
.empty-state h3 { font-size: 18px; font-weight: 600; color: var(--text); }
.empty-state p { font-size: 14px; max-width: 300px; line-height: 1.6; }

/* Transitions */
.list-enter-active, .list-leave-active { transition: all 0.2s; }
.list-enter-from, .list-leave-to { opacity: 0; transform: translateX(-8px); }
.list-move { transition: transform 0.2s; }
</style>
