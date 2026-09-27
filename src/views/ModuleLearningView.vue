<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { allComplete, completeModule, modules, recordAttempt } from '../store/learningStore'

const route = useRoute()
const router = useRouter()
const module = computed(() => modules.value.find(item => item.id === route.params.id))
const stage = ref('learn')
const answer = ref(null)
const feedback = ref(null)
const dragged = ref(null)
const sessionIndex = ref(0)
const detectiveCases = ref([])
const caseIndex = ref(0)
const caseScore = ref(0)
const selectedCaseAnswer = ref(null)
const trueFalseCases = ref([])
const trueFalseIndex = ref(0)
const trueFalseScore = ref(0)
const selectedTrueFalse = ref(null)

const currentSortSession = computed(() => module.value?.activity.sessions?.[sessionIndex.value])
const currentSortItems = computed(() => currentSortSession.value?.items || module.value?.activity.items || [])
const currentCase = computed(() => detectiveCases.value[caseIndex.value])
const currentTrueFalse = computed(() => trueFalseCases.value[trueFalseIndex.value])

function shuffle(items) { return [...items].sort(() => Math.random() - .5) }
function initializeSortAnswer() { answer.value = Object.fromEntries(currentSortItems.value.map(item => [item.id, ''])) }
function reset() {
  feedback.value = null
  const activity = module.value?.activity
  if (!activity) return
  if (activity.type === 'sort') { sessionIndex.value = 0; initializeSortAnswer() }
  if (activity.type === 'sequence') answer.value = []
  if (activity.type === 'permission') answer.value = Object.fromEntries(activity.scenarios.map(item => [item.id, '']))
  if (activity.type === 'detective') { detectiveCases.value = shuffle(activity.cases).slice(0, 5); caseIndex.value = 0; caseScore.value = 0; selectedCaseAnswer.value = null }
  if (activity.type === 'truefalse') { trueFalseCases.value = shuffle(activity.cases); trueFalseIndex.value = 0; trueFalseScore.value = 0; selectedTrueFalse.value = null }
}
watch(module, () => { stage.value = 'learn'; reset() }, { immediate: true })

function begin() { stage.value = 'activity'; reset() }
function ready() {
  const type = module.value.activity.type
  if (type === 'sort' || type === 'permission') return Object.values(answer.value || {}).every(Boolean)
  if (type === 'sequence') return answer.value?.length === module.value.activity.steps.length
  return false
}
function check() {
  const activity = module.value.activity
  let correct = 0
  let total = 1
  if (activity.type === 'sort') { total = currentSortItems.value.length; correct = currentSortItems.value.filter(item => answer.value[item.id] === item.answer).length }
  if (activity.type === 'sequence') { total = activity.steps.length; correct = activity.steps.filter((step, index) => answer.value[index] === step.id).length }
  if (activity.type === 'permission') { total = activity.scenarios.length; correct = activity.scenarios.filter(item => answer.value[item.id] === item.answer).length }
  const success = correct === total
  const completesMission = success && !(activity.type === 'sort' && activity.sessions && sessionIndex.value < activity.sessions.length - 1)
  recordAttempt(module.value.id, { correct, total, completed: completesMission, score: Math.round((correct / total) * 100) })
  feedback.value = success
    ? { success: true, title: activity.type === 'sort' && activity.sessions ? 'Sesi selesai!' : 'Misi selesai!', text: module.value.jedaLabel }
    : { success: false, title: 'Belum tepat', text: `${correct} dari ${total} jawaban sudah tepat. Periksa kembali pilihanmu.` }
  if (completesMission) completeModule(module.value.id)
}
function nextSortSession() { sessionIndex.value++; feedback.value = null; initializeSortAnswer() }
function retryCurrent() {
  feedback.value = null
  if (module.value.activity.type === 'sort') initializeSortAnswer()
  else reset()
}
function checkDetective() {
  const correct = selectedCaseAnswer.value === currentCase.value.answer
  if (correct) caseScore.value++
  recordAttempt(module.value.id, { correct: correct ? 1 : 0, total: 1 })
  feedback.value = { success: correct, title: correct ? 'Analisis tepat' : 'Perlu diperiksa lagi', text: currentCase.value.explanation, case: true }
}
function nextCase() {
  if (caseIndex.value < detectiveCases.value.length - 1) { caseIndex.value++; selectedCaseAnswer.value = null; feedback.value = null; return }
  const passed = caseScore.value >= 4
  feedback.value = { success: passed, title: passed ? 'Misi selesai!' : 'Coba satu putaran lagi', text: `Skor verifikasi: ${caseScore.value} dari ${detectiveCases.value.length}`, final: true }
  recordAttempt(module.value.id, { attempts: 0, correct: 0, total: 0, completed: passed, score: Math.round((caseScore.value / detectiveCases.value.length) * 100) })
  if (passed) completeModule(module.value.id)
}
function checkTrueFalse() {
  const correct = selectedTrueFalse.value === currentTrueFalse.value.answer
  if (correct) trueFalseScore.value++
  recordAttempt(module.value.id, { correct: correct ? 1 : 0, total: 1 })
  feedback.value = { success: correct, title: correct ? 'Tepat!' : 'Belum tepat', text: currentTrueFalse.value.explanation, case: true }
}
function nextTrueFalse() {
  if (trueFalseIndex.value < trueFalseCases.value.length - 1) { trueFalseIndex.value++; selectedTrueFalse.value = null; feedback.value = null; return }
  const passed = trueFalseScore.value >= 8
  feedback.value = { success: passed, title: passed ? 'Misi selesai!' : 'Pelajari lagi dampaknya', text: `Skor kamu: ${trueFalseScore.value} dari ${trueFalseCases.value.length}. Target kelulusan 8 jawaban benar.`, final: true }
  recordAttempt(module.value.id, { attempts: 0, correct: 0, total: 0, completed: passed, score: Math.round((trueFalseScore.value / trueFalseCases.value.length) * 100) })
  if (passed) completeModule(module.value.id)
}
function finish() { router.push(allComplete.value ? '/summary' : '/missions') }
function dragStart(id) { dragged.value = id }
function dropAt(index = answer.value.length) {
  if (!dragged.value) return
  const next = answer.value.filter(id => id !== dragged.value)
  next.splice(index, 0, dragged.value)
  answer.value = next
  dragged.value = null
}
function addStep(id) { if (!answer.value.includes(id)) answer.value.push(id) }
function removeStep(id) { answer.value = answer.value.filter(item => item !== id) }
function moveStep(index, direction) {
  const target = index + direction
  if (target < 0 || target >= answer.value.length) return
  const next = [...answer.value]
  ;[next[index], next[target]] = [next[target], next[index]]
  answer.value = next
}
</script>

<template>
  <section v-if="module" class="module-screen content-screen" :style="{'--module-accent':module.accent}">
    <RouterLink class="back-button" to="/missions">← Kembali ke peta misi</RouterLink>
    <div class="module-heading"><div class="module-big-icon"><img :src="module.image" alt=""></div><div><p>MISI {{ module.number }} · {{ module.duration }}</p><h1>{{ module.shortTitle }}</h1><h2>{{ module.title }}</h2></div><div class="module-jeda"><small>BEKAL JEDA</small><b>{{ module.jeda }}</b><span>{{ module.jedaLabel }}</span></div></div>
    <template v-if="stage==='learn'">
      <div class="lesson-intro colorful-intro"><img :src="module.image" alt=""><p>{{ module.intro }}</p></div>
      <div class="principle-grid colorful-principles"><article v-for="(principle,index) in module.principles" :key="principle.title" :style="{'--principle-index':index}"><span>{{ String(index+1).padStart(2,'0') }}</span><small>PRINSIP {{ index+1 }}</small><h3>{{ principle.title }}</h3><p>{{ principle.text }}</p></article></div>
      <div class="lesson-cta"><div><small>SUDAH SIAP?</small><h2>Saatnya mencoba aktivitas</h2><p>Temukan alasan di balik setiap pilihan.</p></div><button class="primary-button" @click="begin">Mulai aktivitas →</button></div>
    </template>
    <div v-else class="activity-card enhanced-activity">
      <div class="activity-heading"><span>AKTIVITAS INTERAKTIF</span><h2>{{ module.activity.title }}</h2><p>{{ module.activity.instruction }}</p></div>

      <template v-if="module.activity.type==='sort'">
        <div v-if="module.activity.sessions" class="session-progress"><span v-for="(_,index) in module.activity.sessions" :key="index" :class="{active:index===sessionIndex,done:index<sessionIndex}">{{ index+1 }}</span><b>{{ currentSortSession.title }}</b></div>
        <div class="sort-items vibrant-sort"><article v-for="(item,index) in currentSortItems" :key="item.id"><span class="item-icon">{{ index+1 }}</span><strong>{{ item.label }}</strong><div><button class="safe-choice" :class="{selected:answer[item.id]==='safe'}" @click="answer[item.id]='safe'">Aman dibagikan</button><button class="private-choice" :class="{selected:answer[item.id]==='private'}" @click="answer[item.id]='private'">Rahasiakan</button></div><p v-if="feedback?.success">{{ item.reason }}</p></article></div>
      </template>

      <div v-else-if="module.activity.type==='sequence'" class="drag-activity"><div class="drag-help">Seret kartu atau ketuk untuk menambahkan. Pada layar sentuh, gunakan tombol naik dan turun untuk mengubah urutan.</div><div class="sequence-built drop-zone" @dragover.prevent @drop="dropAt()"><div v-if="!answer.length" class="drop-placeholder">Letakkan langkah pertama di sini</div><div v-for="(id,index) in answer" :key="id" class="sequence-row" draggable="true" @dragstart="dragStart(id)" @dragover.prevent @drop.stop="dropAt(index)"><b>{{ index+1 }}</b><span>{{ module.activity.steps.find(step=>step.id===id).label }}</span><div class="sequence-controls"><button :disabled="index===0" aria-label="Naikkan langkah" @click="moveStep(index,-1)">↑</button><button :disabled="index===answer.length-1" aria-label="Turunkan langkah" @click="moveStep(index,1)">↓</button><button aria-label="Hapus langkah" @click="removeStep(id)">×</button></div></div></div><div class="sequence-pool colorful-pool"><button v-for="step in module.activity.steps.filter(step=>!answer.includes(step.id))" :key="step.id" draggable="true" @dragstart="dragStart(step.id)" @click="addStep(step.id)">{{ step.label }}<span>Tarik / ketuk</span></button></div></div>

      <div v-else-if="module.activity.type==='detective' && currentCase" class="detective-quiz"><div class="quiz-progress"><span>Kasus {{ caseIndex+1 }} dari {{ detectiveCases.length }}</span><b>{{ caseScore }} poin</b></div><blockquote>{{ currentCase.prompt }}</blockquote><div class="case-options"><button v-for="(option,index) in currentCase.options" :key="option" :class="{selected:selectedCaseAnswer===index}" :disabled="feedback?.case" @click="selectedCaseAnswer=index"><b>{{ String.fromCharCode(65+index) }}</b>{{ option }}</button></div><div v-if="feedback" class="feedback-panel" :class="feedback.success?'success':'retry'"><span>{{ feedback.success?'OK':'ULANG' }}</span><div><h3>{{ feedback.title }}</h3><p>{{ feedback.text }}</p></div></div><div class="activity-actions"><button v-if="!feedback" class="primary-button check-answer-button" :disabled="selectedCaseAnswer===null" @click="checkDetective">Periksa jawaban</button><button v-else-if="feedback.case" class="primary-button" @click="nextCase">{{ caseIndex<detectiveCases.length-1?'Kasus berikutnya':'Lihat hasil' }}</button><button v-else-if="feedback.success" class="primary-button" @click="finish">Simpan bekal & lanjut</button><button v-else class="primary-button" @click="reset">Ulangi putaran</button></div></div>

      <div v-else-if="module.activity.type==='permission'" class="permission-activity colorful-cases"><article v-for="(scenario,index) in module.activity.scenarios" :key="scenario.id"><span>{{ index+1 }}</span><p>{{ scenario.text }}</p><div><button v-for="category in module.activity.categories" :key="category.id" :class="{selected:answer[scenario.id]===category.id}" @click="answer[scenario.id]=category.id">{{ category.label }}</button></div><small v-if="feedback?.success">{{ scenario.reason }}</small></article></div>

      <div v-else-if="module.activity.type==='truefalse' && currentTrueFalse" class="true-false-activity"><div class="quiz-progress"><span>Pernyataan {{ trueFalseIndex+1 }} dari {{ trueFalseCases.length }}</span><b>{{ trueFalseScore }} poin</b></div><div class="statement-card"><small>BENAR ATAU SALAH?</small><p>{{ currentTrueFalse.statement }}</p></div><div class="true-false-options"><button :class="{selected:selectedTrueFalse===true}" :disabled="feedback?.case" @click="selectedTrueFalse=true"><b>B</b><span>Benar</span></button><button :class="{selected:selectedTrueFalse===false}" :disabled="feedback?.case" @click="selectedTrueFalse=false"><b>S</b><span>Salah</span></button></div><div v-if="feedback" class="feedback-panel" :class="feedback.success?'success':'retry'"><span>{{ feedback.success?'OK':'CEK' }}</span><div><h3>{{ feedback.title }}</h3><p>{{ feedback.text }}</p></div></div><div class="activity-actions"><button v-if="!feedback" class="primary-button check-answer-button" :disabled="selectedTrueFalse===null" @click="checkTrueFalse">Periksa jawaban</button><button v-else-if="feedback.case" class="primary-button" @click="nextTrueFalse">{{ trueFalseIndex<trueFalseCases.length-1?'Pernyataan berikutnya':'Lihat hasil' }}</button><button v-else-if="feedback.success" class="primary-button" @click="finish">Simpan bekal & lanjut</button><button v-else class="primary-button" @click="reset">Ulangi latihan</button></div></div>

      <template v-if="!['detective','truefalse'].includes(module.activity.type)"><div v-if="feedback" class="feedback-panel" :class="feedback.success?'success':'retry'"><span>{{ feedback.success?'OK':'ULANG' }}</span><div><h3>{{ feedback.title }}</h3><p>{{ feedback.text }}</p></div></div><div class="activity-actions"><button v-if="!feedback?.success" class="secondary-button" @click="retryCurrent">Ulangi</button><button v-if="!feedback?.success" class="primary-button check-answer-button" :disabled="!ready()" @click="check">Periksa jawaban</button><button v-else-if="module.activity.type==='sort' && module.activity.sessions && sessionIndex<module.activity.sessions.length-1" class="primary-button" @click="nextSortSession">Lanjut ke sesi {{ sessionIndex+2 }}</button><button v-else class="primary-button" @click="finish">Simpan bekal & lanjut</button></div></template>
    </div>
  </section>
  <section v-else class="content-screen"><h1>Misi tidak ditemukan</h1><RouterLink to="/missions">Kembali ke daftar misi</RouterLink></section>
</template>
