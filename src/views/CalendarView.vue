<template>
  <div class="calendar-view">
    <div class="view-header">
      <h1 class="view-title">Календарь</h1>
      <p class="view-subtitle">Задачи по датам</p>
    </div>

    <div class="calendar-layout">
      <!-- Calendar widget -->
      <div class="calendar-widget card">
        <div class="cal-nav">
          <button class="icon-btn" @click="prevMonth"><i class="pi pi-chevron-left" /></button>
          <span class="cal-title">{{ currentMonthLabel }}</span>
          <button class="icon-btn" @click="nextMonth"><i class="pi pi-chevron-right" /></button>
        </div>

        <div class="cal-grid">
          <div class="cal-weekday" v-for="d in weekdays" :key="d">{{ d }}</div>
          <!-- Padding cells -->
          <div v-for="_ in firstDayOffset" :key="'pad-' + _" class="cal-day empty" />
          <!-- Day cells -->
          <div
            v-for="day in daysInMonth"
            :key="day"
            class="cal-day"
            :class="{
              today: isCurrentDay(day),
              selected: isSelected(day),
              'has-tasks': hasTasks(day),
              overdue: hasOverdue(day)
            }"
            @click="selectDay(day)"
          >
            <span class="day-num">{{ day }}</span>
            <span v-if="hasTasks(day)" class="day-dot" :class="{ overdue: hasOverdue(day) }" />
          </div>
        </div>

        <div class="cal-legend">
          <span><span class="dot primary" />Задачи</span>
          <span><span class="dot danger" />Просрочены</span>
          <span><span class="dot today-dot" />Сегодня</span>
        </div>
      </div>

      <!-- Right panel: tasks for selected day -->
      <div class="day-panel">
        <div class="day-panel-header">
          <div class="day-panel-title">
            <i class="pi pi-calendar" />
            {{ selectedDayLabel }}
          </div>
          <span class="task-count-badge" v-if="selectedDayTasks.length">
            {{ selectedDayTasks.length }}
          </span>
        </div>

        <div v-if="selectedDayTasks.length > 0" class="day-task-list">
          <div
            v-for="task in selectedDayTasks"
            :key="task.id"
            class="day-task-item"
            :class="{
              completed: task.status === 'completed',
              overdue: task.status === 'pending' && isOverdueFn(task.dueDate)
            }"
          >
            <div class="day-task-check">
              <Checkbox
                :model-value="task.status === 'completed'"
                :binary="true"
                @change="store.toggleTask(task.id)"
              />
            </div>
            <div class="day-task-body">
              <div class="day-task-title">{{ task.title }}</div>
              <div v-if="task.description" class="day-task-desc">{{ task.description }}</div>
            </div>
            <div class="priority-dot" :class="task.priority" />
          </div>
        </div>

        <div v-else class="day-empty">
          <i class="pi pi-calendar-plus" />
          <span>Нет задач на этот день</span>
          <RouterLink to="/" class="btn btn-ghost small">
            <i class="pi pi-plus" />
            Добавить
          </RouterLink>
        </div>

        <!-- Upcoming overdue section -->
        <div v-if="overdueTasksGlobal.length > 0" class="overdue-section">
          <div class="overdue-section-title">
            <i class="pi pi-exclamation-triangle" />
            Просроченные задачи ({{ overdueTasksGlobal.length }})
          </div>
          <div
            v-for="task in overdueTasksGlobal.slice(0, 5)"
            :key="task.id"
            class="overdue-item"
          >
            <span class="overdue-date">{{ formatDate(task.dueDate) }}</span>
            <span class="overdue-title">{{ task.title }}</span>
          </div>
          <RouterLink v-if="overdueTasksGlobal.length > 5" to="/tasks" class="see-more">
            + ещё {{ overdueTasksGlobal.length - 5 }}
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import Checkbox from 'primevue/checkbox'
import { useTaskStore } from '@/stores/taskStore'
import { toISODateString, formatDate, isOverdue as isOverdueFn, isTodayDate } from '@/utils/dateUtils'
import { format, getDaysInMonth, startOfMonth, getDay, addMonths, subMonths, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'

const store = useTaskStore()

const today = new Date()
const currentMonth = ref(new Date(today.getFullYear(), today.getMonth(), 1))
const selectedDate = ref(toISODateString(today))

const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const currentMonthLabel = computed(() =>
  format(currentMonth.value, 'LLLL yyyy', { locale: ru })
    .replace(/^./, c => c.toUpperCase())
)

const daysInMonth = computed(() => getDaysInMonth(currentMonth.value))

// Monday-based offset (0=Mon, 6=Sun)
const firstDayOffset = computed(() => {
  const jsDay = getDay(startOfMonth(currentMonth.value)) // 0=Sun
  return (jsDay === 0 ? 6 : jsDay - 1)
})

function prevMonth() { currentMonth.value = subMonths(currentMonth.value, 1) }
function nextMonth() { currentMonth.value = addMonths(currentMonth.value, 1) }

function dayISO(day: number): string {
  return toISODateString(new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth(), day))
}

function isCurrentDay(day: number) { return isTodayDate(dayISO(day)) }
function isSelected(day: number) { return dayISO(day) === selectedDate.value }
function hasTasks(day: number) { return store.getDatesWithTasks().has(dayISO(day)) }
function hasOverdue(day: number) {
  const iso = dayISO(day)
  return store.tasks.some(t => t.dueDate === iso && t.status === 'pending' && isOverdueFn(iso))
}

function selectDay(day: number) { selectedDate.value = dayISO(day) }

const selectedDayLabel = computed(() => {
  try {
    return format(parseISO(selectedDate.value), 'd MMMM yyyy', { locale: ru })
  } catch { return '' }
})

const selectedDayTasks = computed(() => store.getTasksForDate(selectedDate.value))

const overdueTasksGlobal = computed(() =>
  store.tasks.filter(t => t.status === 'pending' && isOverdueFn(t.dueDate))
    .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
)
</script>

<style scoped>
.calendar-view { max-width: 900px; }

.calendar-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 20px;
  align-items: start;
}

/* Calendar widget */
.calendar-widget { padding: 20px; }

.cal-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.cal-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  text-transform: capitalize;
}

.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.cal-weekday {
  text-align: center;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  padding: 6px 0;
  text-transform: uppercase;
}

.cal-day {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 36px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}
.cal-day:not(.empty):hover { background: var(--surface-hover); }
.cal-day.empty { cursor: default; }

.day-num {
  font-size: 13px;
  color: var(--text);
  font-weight: 500;
  line-height: 1;
}

.cal-day.today { background: var(--primary-soft); }
.cal-day.today .day-num { color: var(--primary); font-weight: 700; }

.cal-day.selected {
  background: var(--primary);
}
.cal-day.selected .day-num { color: #fff; font-weight: 700; }

.day-dot {
  width: 5px; height: 5px;
  border-radius: 50%;
  background: var(--primary);
  position: absolute;
  bottom: 4px;
}
.day-dot.overdue { background: var(--danger); }

.cal-day.overdue .day-num { color: var(--danger); }

.cal-legend {
  display: flex;
  gap: 14px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--border);
  font-size: 11px;
  color: var(--text-muted);
}
.cal-legend span { display: flex; align-items: center; gap: 5px; }
.dot { width: 8px; height: 8px; border-radius: 50%; }
.dot.primary { background: var(--primary); }
.dot.danger { background: var(--danger); }
.dot.today-dot { background: var(--primary); opacity: 0.4; border: 1px solid var(--primary); }

/* Day panel */
.day-panel { display: flex; flex-direction: column; gap: 16px; }

.day-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.day-panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
}
.day-panel-title .pi { color: var(--primary); }

.task-count-badge {
  background: var(--primary);
  color: #fff;
  border-radius: 99px;
  padding: 2px 9px;
  font-size: 12px;
  font-weight: 700;
}

/* Day tasks */
.day-task-list {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.day-task-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  transition: background 0.15s;
}
.day-task-item:last-child { border-bottom: none; }
.day-task-item:hover { background: var(--surface-hover); }
.day-task-item.completed { opacity: 0.55; }
.day-task-item.overdue { border-left: 3px solid var(--danger); }

.day-task-check { padding-top: 2px; }
.day-task-body { flex: 1; }
.day-task-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}
.day-task-item.completed .day-task-title {
  text-decoration: line-through;
  color: var(--text-muted);
}
.day-task-desc { font-size: 12px; color: var(--text-muted); margin-top: 2px; }

/* Day empty */
.day-empty {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 32px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: var(--text-muted);
  font-size: 14px;
}
.day-empty .pi { font-size: 28px; }
.btn.small { padding: 6px 14px; font-size: 13px; }

/* Overdue section */
.overdue-section {
  background: var(--surface);
  border: 1px solid var(--danger);
  border-radius: var(--radius);
  padding: 16px;
}
.overdue-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: var(--danger);
  margin-bottom: 12px;
}
.overdue-item {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 6px 0;
  border-bottom: 1px solid var(--border);
  font-size: 13px;
}
.overdue-item:last-of-type { border-bottom: none; }
.overdue-date { color: var(--danger); font-size: 11px; font-weight: 600; flex-shrink: 0; }
.overdue-title { color: var(--text); }
.see-more { display: block; font-size: 12px; color: var(--primary); margin-top: 8px; text-decoration: none; }

.icon-btn {
  background: none;
  border: none;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 14px;
  transition: all 0.15s;
}
.icon-btn:hover { background: var(--surface-hover); color: var(--text); }
</style>
