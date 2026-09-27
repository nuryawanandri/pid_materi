import { computed, reactive, ref } from 'vue'
import { defaultContent } from '../data/modules'

const CONTENT_KEY = 'misi-ai-bijak-content-v2'
const PROGRESS_KEY = 'misi-ai-bijak-progress-v2'

function clone(value) { return JSON.parse(JSON.stringify(value)) }

const savedContent = localStorage.getItem(CONTENT_KEY)
const savedProgress = localStorage.getItem(PROGRESS_KEY)
export const content = ref(savedContent ? JSON.parse(savedContent) : clone(defaultContent))
const progress = reactive(savedProgress ? JSON.parse(savedProgress) : { completed: [], freeNavigation: true })

export const modules = computed(() => content.value.modules)
export const principles = computed(() => content.value.principles)
export const completed = computed(() => progress.completed)
export const freeNavigation = computed({ get: () => progress.freeNavigation, set: (value) => { progress.freeNavigation = value; saveProgress() } })
export const completedCount = computed(() => progress.completed.length)
export const progressPercent = computed(() => Math.round((completedCount.value / modules.value.length) * 100))
export const allComplete = computed(() => completedCount.value === modules.value.length)

function saveProgress() { localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress)) }
export function saveContent(nextContent = content.value) {
  content.value = clone(nextContent)
  localStorage.setItem(CONTENT_KEY, JSON.stringify(content.value))
}
export function resetContent() { content.value = clone(defaultContent); localStorage.removeItem(CONTENT_KEY) }
export function completeModule(id) { if (!progress.completed.includes(id)) { progress.completed.push(id); saveProgress() } }
export function resetProgress() { progress.completed.splice(0); saveProgress() }
export function isLocked(index) { return !progress.freeNavigation && index > 0 && !progress.completed.includes(modules.value[index - 1].id) }
export function exportContent() {
  const blob = new Blob([JSON.stringify(content.value, null, 2)], { type: 'application/json' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = 'misi-ai-bijak-content.json'
  link.click()
  URL.revokeObjectURL(link.href)
}
export async function importContent(file) {
  const parsed = JSON.parse(await file.text())
  if (!Array.isArray(parsed.modules) || !Array.isArray(parsed.principles)) throw new Error('Struktur JSON tidak sesuai.')
  saveContent(parsed)
}
