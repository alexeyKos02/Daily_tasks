<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    modal
    header="Настройки AI"
    :style="{ width: '480px' }"
  >
    <div class="settings-body">
      <!-- Toggle -->
      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-label">Использовать AI-парсер</span>
          <span class="setting-desc">GPT разбирает текст умнее, понимает контекст и сложные формулировки</span>
        </div>
        <ToggleSwitch v-model="settings.useAI" />
      </div>

      <Divider />

      <!-- API Key -->
      <div class="field">
        <label>OpenAI API Key</label>
        <div class="key-input-row">
          <InputText
            v-model="settings.openaiKey"
            :type="showKey ? 'text' : 'password'"
            placeholder="sk-..."
            class="flex-1"
          />
          <button class="icon-btn" @click="showKey = !showKey" :title="showKey ? 'Скрыть' : 'Показать'">
            <i :class="showKey ? 'pi pi-eye-slash' : 'pi pi-eye'" />
          </button>
        </div>
        <span class="field-hint">
          <i class="pi pi-lock" />
          Ключ хранится только в вашем браузере (localStorage), никуда не отправляется
        </span>
      </div>

      <!-- Model -->
      <div class="field">
        <label>Модель</label>
        <Select
          v-model="settings.aiModel"
          :options="models"
          option-label="label"
          option-value="value"
          class="w-full"
        />
        <span class="field-hint">gpt-4o-mini — быстрая и дешёвая, gpt-4o — точнее для сложных текстов</span>
      </div>

      <!-- Status -->
      <div v-if="settings.useAI" class="status-banner" :class="settings.openaiKey ? 'ok' : 'warn'">
        <i :class="settings.openaiKey ? 'pi pi-check-circle' : 'pi pi-exclamation-triangle'" />
        <span v-if="settings.openaiKey">AI-парсер активен — модель {{ settings.aiModel }}</span>
        <span v-else>Введите API ключ, чтобы активировать AI-парсер</span>
      </div>
      <div v-else class="status-banner info">
        <i class="pi pi-info-circle" />
        <span>Используется встроенный regex-парсер (без AI)</span>
      </div>
    </div>

    <template #footer>
      <button class="btn btn-primary" @click="$emit('update:visible', false)">
        <i class="pi pi-check" /> Готово
      </button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import ToggleSwitch from 'primevue/toggleswitch'
import Divider from 'primevue/divider'
import { useSettingsStore } from '@/stores/settingsStore'

defineProps<{ visible: boolean }>()
defineEmits<{ 'update:visible': [v: boolean] }>()

const settings = useSettingsStore()
const showKey = ref(false)

const models = [
  { label: 'gpt-4o-mini (быстрый, дешёвый)', value: 'gpt-4o-mini' },
  { label: 'gpt-4o (точнее)', value: 'gpt-4o' },
  { label: 'gpt-3.5-turbo (экономный)', value: 'gpt-3.5-turbo' }
]
</script>

<style scoped>
.settings-body { display: flex; flex-direction: column; gap: 18px; }

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.setting-info { display: flex; flex-direction: column; gap: 3px; }
.setting-label { font-size: 14px; font-weight: 600; color: var(--text); }
.setting-desc { font-size: 12px; color: var(--text-muted); line-height: 1.4; }

.field { display: flex; flex-direction: column; gap: 7px; }
.field label { font-size: 12px; font-weight: 600; color: var(--text-muted); }
.field-hint {
  font-size: 11px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 5px;
}

.key-input-row { display: flex; gap: 8px; }
.flex-1 { flex: 1; }

.icon-btn {
  background: none;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 10px;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 14px;
  transition: all 0.15s;
}
.icon-btn:hover { background: var(--surface-hover); color: var(--text); }

.status-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
}
.status-banner.ok { background: #f0fdf4; color: #15803d; }
.status-banner.warn { background: #fffbeb; color: #b45309; }
.status-banner.info { background: var(--surface-hover); color: var(--text-muted); }

.w-full { width: 100%; }
</style>
