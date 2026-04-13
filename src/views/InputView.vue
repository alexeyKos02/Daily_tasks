<template>
  <div class="input-view">
    <div class="view-header">
      <div class="header-row">
        <div>
          <h1 class="view-title">Новые задачи</h1>
          <p class="view-subtitle">Вставьте любой текст — приложение разберёт его на задачи автоматически</p>
        </div>
        <button class="btn btn-ghost settings-btn" @click="settingsVisible = true">
          <i class="pi pi-cog" />
          <span class="ai-badge" :class="settings.useAI && settings.openaiKey ? 'active' : 'off'">
            {{ settings.useAI && settings.openaiKey ? 'AI' : 'Regex' }}
          </span>
        </button>
      </div>
    </div>

    <div class="input-card card">
      <div class="input-card-header">
        <i class="pi pi-align-left" />
        <span>Произвольный текст</span>
        <button v-if="text" class="clear-btn" @click="text = ''" title="Очистить">
          <i class="pi pi-times" />
        </button>
      </div>

      <Textarea
        v-model="text"
        :rows="14"
        placeholder="Вставьте сюда любой текст:
• Список задач в свободной форме
• Заметки из встречи или чата
• Письмо с задачами
• Хаотичные мысли и планы

Например:
- Срочно! Позвонить клиенту по проекту А до 15 апреля
- Подготовить отчёт на следующей неделе
- Проверить pull request Алексея (не срочно)
- Обновить зависимости в проекте завтра
- Встретиться с командой в пятницу"
        class="text-area"
        auto-resize
      />

      <div class="input-footer">
        <div class="char-count">
          <i class="pi pi-info-circle" />
          {{ text.length }} символов · примерно {{ estimatedTasks }} задач
        </div>
        <div class="input-actions">
          <button class="btn btn-ghost" @click="loadExample">
            <i class="pi pi-sparkles" />
            Пример
          </button>
          <button
            class="btn btn-primary"
            :disabled="!text.trim() || parsing"
            @click="handleParse"
          >
            <i :class="parsing ? 'pi pi-spin pi-spinner' : (isAiMode ? 'pi pi-sparkles' : 'pi pi-magic-wand')" />
            {{ parseLabel }}
          </button>
        </div>
      </div>
    </div>

    <!-- AI mode banner -->
    <div v-if="settings.useAI && settings.openaiKey" class="ai-banner">
      <i class="pi pi-sparkles" />
      <span>AI-парсер активен · <strong>{{ settings.aiModel }}</strong> · понимает свободный текст, контекст и сложные формулировки</span>
      <button class="link-btn" @click="settingsVisible = true">Настройки</button>
    </div>
    <div v-else-if="settings.useAI && !settings.openaiKey" class="ai-banner warn">
      <i class="pi pi-exclamation-triangle" />
      <span>AI включён, но API ключ не указан</span>
      <button class="link-btn" @click="settingsVisible = true">Добавить ключ</button>
    </div>

    <!-- Error -->
    <div v-if="errorMsg" class="error-banner">
      <i class="pi pi-times-circle" />
      <span>{{ errorMsg }}</span>
      <button class="link-btn" @click="errorMsg = ''">✕</button>
    </div>

    <!-- Hints -->
    <div class="hints">
      <div class="hint-title">
        <i class="pi pi-lightbulb" />
        Что умеет парсер
      </div>
      <div class="hints-grid">
        <div class="hint-item" v-for="hint in currentHints" :key="hint.title">
          <i :class="hint.icon" />
          <div>
            <strong>{{ hint.title }}</strong>
            <span>{{ hint.desc }}</span>
          </div>
        </div>
      </div>
    </div>

    <SettingsDialog v-model:visible="settingsVisible" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import Textarea from 'primevue/textarea'
import { useTaskStore } from '@/stores/taskStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { parseTextToTasks } from '@/utils/textParser'
import { parseTextWithAI } from '@/services/aiParser'
import SettingsDialog from '@/components/SettingsDialog.vue'

const router = useRouter()
const store = useTaskStore()
const settings = useSettingsStore()

const text = ref('')
const parsing = ref(false)
const settingsVisible = ref(false)
const errorMsg = ref('')

const isAiMode = computed(() => settings.useAI && !!settings.openaiKey)

const estimatedTasks = computed(() => {
  if (!text.value.trim()) return 0
  const lines = text.value.split('\n').filter(l => l.trim().length > 3)
  return Math.max(1, lines.length)
})

const parseLabel = computed(() => {
  if (parsing.value) return isAiMode.value ? 'Спрашиваю AI...' : 'Разбираю...'
  return isAiMode.value ? 'Разобрать через AI' : 'Разобрать задачи'
})

const regexHints = [
  { icon: 'pi pi-list', title: 'Списки', desc: 'Маркированные и нумерованные' },
  { icon: 'pi pi-calendar', title: 'Даты', desc: '«завтра», «в пятницу», «15 апреля»' },
  { icon: 'pi pi-flag', title: 'Приоритеты', desc: '«срочно», «важно», «при случае»' },
  { icon: 'pi pi-file-edit', title: 'Структурированный текст', desc: 'Работает лучше со списками' }
]

const aiHints = [
  { icon: 'pi pi-sparkles', title: 'Свободный текст', desc: 'Понимает любые формулировки' },
  { icon: 'pi pi-calendar', title: 'Умные даты', desc: 'Интерпретирует контекст и сроки' },
  { icon: 'pi pi-brain', title: 'Контекст', desc: 'Вычленяет задачи из повествования' },
  { icon: 'pi pi-flag', title: 'Приоритеты', desc: 'Определяет важность по смыслу' }
]

const currentHints = computed(() => isAiMode.value ? aiHints : regexHints)

const EXAMPLE_TEXT = `Планы на эту неделю:

- Срочно! Позвонить клиенту Петрову по поводу договора — до 15 апреля
- Подготовить презентацию для совещания в пятницу
- Проверить pull request от Алексея (не срочно, когда будет время)
- Обновить зависимости в проекте завтра утром
- Написать отчёт за квартал к 20 апреля
- Встретиться с командой дизайна на следующей неделе
- Оплатить счёт за хостинг сегодня
- Задеплоить новую версию бэкенда послезавтра`

function loadExample() {
  text.value = EXAMPLE_TEXT
}

async function handleParse() {
  if (!text.value.trim()) return
  errorMsg.value = ''
  parsing.value = true

  try {
    let parsed

    if (isAiMode.value) {
      parsed = await parseTextWithAI(text.value, settings.openaiKey)
    } else {
      await new Promise(r => setTimeout(r, 400))
      parsed = parseTextToTasks(text.value)
    }

    store.setPendingParsed(parsed)
    router.push('/preview')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Неизвестная ошибка'
    errorMsg.value = `Ошибка AI: ${msg}`
  } finally {
    parsing.value = false
  }
}
</script>

<style scoped>
.input-view { max-width: 800px; }

.header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.settings-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.ai-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 99px;
}
.ai-badge.active { background: #f0fdf4; color: #15803d; }
.ai-badge.off { background: var(--surface-hover); color: var(--text-muted); }

.input-card {
  padding: 0;
  overflow: hidden;
}

.input-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
}
.input-card-header .pi:first-child { color: var(--primary); }

.clear-btn {
  margin-left: auto;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 6px;
  font-size: 13px;
  transition: all 0.15s;
}
.clear-btn:hover { background: var(--surface-hover); color: var(--danger); }

.text-area {
  width: 100% !important;
  border: none !important;
  border-radius: 0 !important;
  padding: 20px !important;
  font-size: 14px !important;
  line-height: 1.65 !important;
  resize: none !important;
  min-height: 320px;
  box-shadow: none !important;
}
.text-area:focus { box-shadow: none !important; border: none !important; }

.input-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-top: 1px solid var(--border);
  gap: 16px;
}

.char-count {
  font-size: 12px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 6px;
}

.input-actions { display: flex; gap: 10px; }
.btn:disabled { opacity: 0.45; cursor: not-allowed; }

/* AI/Error banners */
.ai-banner, .error-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 16px;
  border-radius: var(--radius);
  font-size: 13px;
  margin-top: 12px;
}
.ai-banner {
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #bbf7d0;
}
.ai-banner.warn {
  background: #fffbeb;
  color: #b45309;
  border: 1px solid #fde68a;
}
.error-banner {
  background: #fef2f2;
  color: var(--danger);
  border: 1px solid #fecaca;
}
.link-btn {
  margin-left: auto;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: inherit;
  text-decoration: underline;
  padding: 0;
  flex-shrink: 0;
}

/* Hints */
.hints { margin-top: 28px; }

.hint-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 14px;
}
.hint-title .pi { color: var(--warning); }

.hints-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.hint-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 13px;
}
.hint-item .pi {
  color: var(--primary);
  font-size: 16px;
  margin-top: 2px;
  flex-shrink: 0;
}
.hint-item div { display: flex; flex-direction: column; gap: 2px; }
.hint-item strong { color: var(--text); font-weight: 600; }
.hint-item span { color: var(--text-muted); }
</style>
