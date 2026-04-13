import { createRouter, createWebHashHistory } from 'vue-router'
import InputView from '@/views/InputView.vue'
import PreviewView from '@/views/PreviewView.vue'
import TasksView from '@/views/TasksView.vue'
import CalendarView from '@/views/CalendarView.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'input', component: InputView },
    { path: '/preview', name: 'preview', component: PreviewView },
    { path: '/tasks', name: 'tasks', component: TasksView },
    { path: '/calendar', name: 'calendar', component: CalendarView }
  ]
})
