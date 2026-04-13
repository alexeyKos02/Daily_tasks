import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  const openaiKey = ref<string>(localStorage.getItem('openai-key') || '')
  const useAI = ref<boolean>(localStorage.getItem('use-ai') === 'true')
  const aiModel = ref<string>(localStorage.getItem('ai-model') || 'gpt-4o-mini')

  watch(openaiKey, v => localStorage.setItem('openai-key', v))
  watch(useAI, v => localStorage.setItem('use-ai', String(v)))
  watch(aiModel, v => localStorage.setItem('ai-model', v))

  return { openaiKey, useAI, aiModel }
})
