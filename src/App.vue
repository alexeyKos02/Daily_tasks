<template>
  <div class="app-layout" :class="{ dark: isDark }">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-logo">
        <i class="pi pi-bolt" />
        <span>Daily Tasks</span>
      </div>

      <nav class="sidebar-nav">
        <RouterLink to="/" class="nav-item" :class="{ active: route.name === 'input' }">
          <i class="pi pi-plus-circle" />
          <span>Новые задачи</span>
        </RouterLink>
        <RouterLink to="/tasks" class="nav-item" :class="{ active: route.name === 'tasks' }">
          <i class="pi pi-list-check" />
          <span>Все задачи</span>
          <Badge v-if="store.counts.active > 0" :value="store.counts.active" severity="primary" />
        </RouterLink>
        <RouterLink to="/calendar" class="nav-item" :class="{ active: route.name === 'calendar' }">
          <i class="pi pi-calendar" />
          <span>Календарь</span>
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <button class="theme-btn" @click="toggleDark" :title="isDark ? 'Светлая тема' : 'Тёмная тема'">
          <i :class="isDark ? 'pi pi-sun' : 'pi pi-moon'" />
        </button>
        <button class="theme-btn" @click="settingsVisible = true" title="Настройки AI">
          <i class="pi pi-cog" />
        </button>
        <div class="stats">
          <span>{{ store.counts.completed }}/{{ store.counts.all }} выполнено</span>
        </div>
      </div>

      <SettingsDialog v-model:visible="settingsVisible" />
    </aside>

    <!-- Main content -->
    <main class="main-content">
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>

    <Toast position="bottom-right" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, RouterLink, RouterView } from 'vue-router'
import { useTaskStore } from '@/stores/taskStore'
import Badge from 'primevue/badge'
import Toast from 'primevue/toast'
import SettingsDialog from '@/components/SettingsDialog.vue'

const route = useRoute()
const store = useTaskStore()
const isDark = ref(false)
const settingsVisible = ref(false)

function toggleDark() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
}
</script>

<style>
/* ─── Reset & Base ─────────────────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #f4f5f7;
  --surface: #ffffff;
  --surface-hover: #f8f9fa;
  --border: #e2e5ea;
  --text: #1a1d23;
  --text-muted: #6b7280;
  --primary: #6366f1;
  --primary-soft: #eef2ff;
  --danger: #ef4444;
  --success: #22c55e;
  --warning: #f59e0b;
  --sidebar-w: 220px;
  --radius: 10px;
  --shadow: 0 1px 4px rgba(0,0,0,.08);
}

.dark {
  --bg: #0f1117;
  --surface: #1a1d23;
  --surface-hover: #22252e;
  --border: #2d3141;
  --text: #e8eaf0;
  --text-muted: #8b95a8;
  --primary-soft: #1e2040;
}

html, body { height: 100%; font-family: 'Inter', system-ui, sans-serif; }
#app { height: 100%; }

/* ─── Layout ───────────────────────────────────────────────────────────────── */
.app-layout {
  display: flex;
  height: 100vh;
  background: var(--bg);
  color: var(--text);
  transition: background 0.2s, color 0.2s;
}

/* ─── Sidebar ──────────────────────────────────────────────────────────────── */
.sidebar {
  width: var(--sidebar-w);
  background: var(--surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: 20px 12px;
  flex-shrink: 0;
  transition: background 0.2s, border-color 0.2s;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 8px 20px;
  font-size: 17px;
  font-weight: 700;
  color: var(--primary);
}
.sidebar-logo .pi { font-size: 20px; }

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius);
  color: var(--text-muted);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.15s;
  cursor: pointer;
}
.nav-item:hover { background: var(--surface-hover); color: var(--text); }
.nav-item.active { background: var(--primary-soft); color: var(--primary); font-weight: 600; }
.nav-item .pi { font-size: 16px; }
.nav-item .p-badge { margin-left: auto; }

.sidebar-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}

.theme-btn {
  background: none;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 7px 9px;
  cursor: pointer;
  color: var(--text-muted);
  transition: all 0.15s;
  font-size: 14px;
}
.theme-btn:hover { background: var(--surface-hover); color: var(--text); }

.stats {
  font-size: 12px;
  color: var(--text-muted);
}

/* ─── Main ─────────────────────────────────────────────────────────────────── */
.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
}

/* ─── Transition ───────────────────────────────────────────────────────────── */
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ─── Shared utility classes ───────────────────────────────────────────────── */
.view-header {
  margin-bottom: 28px;
}
.view-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 4px;
}
.view-subtitle {
  font-size: 14px;
  color: var(--text-muted);
}

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
  transition: background 0.2s, border-color 0.2s;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 10px 18px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  text-decoration: none;
}
.btn-primary {
  background: var(--primary);
  color: #fff;
}
.btn-primary:hover { opacity: 0.88; }
.btn-ghost {
  background: transparent;
  color: var(--text-muted);
  border: 1px solid var(--border);
}
.btn-ghost:hover { background: var(--surface-hover); color: var(--text); }
.btn-danger {
  background: transparent;
  color: var(--danger);
  border: 1px solid transparent;
}
.btn-danger:hover { background: #fef2f2; }

/* Priority indicators */
.priority-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.priority-dot.high { background: var(--danger); }
.priority-dot.medium { background: var(--warning); }
.priority-dot.low { background: var(--success); }

/* PrimeVue overrides */
.p-inputtext, .p-textarea {
  background: var(--surface) !important;
  color: var(--text) !important;
  border-color: var(--border) !important;
  border-radius: 8px !important;
}
.p-inputtext:focus, .p-textarea:focus {
  border-color: var(--primary) !important;
  box-shadow: 0 0 0 3px rgba(99,102,241,.15) !important;
}

/* Scrollbar */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }
</style>
