import { computed, reactive, ref } from 'vue'
import { defaultContent } from '../data/modules'

const CONTENT_KEY = 'misi-ai-bijak-content-v3'
const PROGRESS_KEY = 'misi-ai-bijak-progress-v2'

function clone(value) { return JSON.parse(JSON.stringify(value)) }

const savedContent = localStorage.getItem(CONTENT_KEY)
const savedProgress = localStorage.getItem(PROGRESS_KEY)
export const content = ref(savedContent ? JSON.parse(savedContent) : clone(defaultContent))
const progress = reactive(savedProgress ? JSON.parse(savedProgress) : { completed: [], freeNavigation: true, analytics: {} })
if (!progress.analytics) progress.analytics = {}

export const modules = computed(() => content.value.modules)
export const principles = computed(() => content.value.principles)
export const completed = computed(() => progress.completed)
export const freeNavigation = computed({ get: () => progress.freeNavigation, set: (value) => { progress.freeNavigation = value; saveProgress() } })
export const completedCount = computed(() => progress.completed.length)
export const progressPercent = computed(() => Math.round((completedCount.value / modules.value.length) * 100))
export const allComplete = computed(() => completedCount.value === modules.value.length)
export const analytics = computed(() => progress.analytics)
export const totalAttempts = computed(() => Object.values(progress.analytics).reduce((sum, item) => sum + (item.attempts || 0), 0))
export const totalAnswers = computed(() => Object.values(progress.analytics).reduce((sum, item) => sum + (item.totalAnswers || 0), 0))
export const totalCorrectAnswers = computed(() => Object.values(progress.analytics).reduce((sum, item) => sum + (item.correctAnswers || 0), 0))
export const accuracyPercent = computed(() => totalAnswers.value ? Math.round((totalCorrectAnswers.value / totalAnswers.value) * 100) : 0)

function saveProgress() { localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress)) }
export function saveContent(nextContent = content.value) {
  content.value = clone(nextContent)
  localStorage.setItem(CONTENT_KEY, JSON.stringify(content.value))
}
export function resetContent() { content.value = clone(defaultContent); localStorage.removeItem(CONTENT_KEY) }
export function completeModule(id) { if (!progress.completed.includes(id)) { progress.completed.push(id); saveProgress() } }
export function recordAttempt(moduleId, result = {}) {
  const current = progress.analytics[moduleId] || { attempts: 0, correctAnswers: 0, totalAnswers: 0, completions: 0, lastScore: 0, bestScore: 0, lastPlayedAt: null }
  current.attempts += result.attempts ?? 1
  current.correctAnswers += result.correct ?? 0
  current.totalAnswers += result.total ?? 1
  if (result.completed) current.completions += 1
  const score = Number.isFinite(result.score) ? result.score : (result.total > 1 ? Math.round(((result.correct ?? 0) / result.total) * 100) : null)
  if (score !== null) {
    current.lastScore = score
    current.bestScore = Math.max(current.bestScore || 0, score)
  }
  current.lastPlayedAt = new Date().toISOString()
  progress.analytics[moduleId] = current
  saveProgress()
}
export function resetProgress() { progress.completed.splice(0); progress.analytics = {}; saveProgress() }
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
