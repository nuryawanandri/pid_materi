<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { allComplete, completeModule, modules } from '../store/learningStore'

const route = useRoute(); const router = useRouter()
const module = computed(() => modules.value.find(item => item.id === route.params.id))
const stage = ref('learn'); const answer = ref(null); const feedback = ref(null); const dragged = ref(null)
const detectiveCases = ref([]); const caseIndex = ref(0); const caseScore = ref(0); const selectedCaseAnswer = ref(null)
const currentCase = computed(() => detectiveCases.value[caseIndex.value])
const embedUrl = computed(() => {
  const url = module.value?.activity.videoUrl?.trim(); if (!url) return ''
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/)
  return match ? `https://www.youtube.com/embed/${match[1]}` : url
})

function shuffle(items) { return [...items].sort(() => Math.random() - .5) }
function reset() {
  feedback.value = null; const activity = module.value?.activity; if (!activity) return
  if (activity.type === 'sort') answer.value = Object.fromEntries(activity.items.map(item => [item.id, '']))
  if (activity.type === 'sequence') answer.value = []
  if (activity.type === 'permission') answer.value = Object.fromEntries(activity.scenarios.map(item => [item.id, '']))
  if (activity.type === 'impact') answer.value = ''
  if (activity.type === 'detective') { detectiveCases.value = shuffle(activity.cases).slice(0, 5); caseIndex.value = 0; caseScore.value = 0; selectedCaseAnswer.value = null }
}
watch(module, () => { stage.value = 'learn'; reset() }, { immediate: true })

function begin() { stage.value = 'activity'; reset() }
function ready() { const type = module.value.activity.type; if (type === 'sort' || type === 'permission') return Object.values(answer.value || {}).every(Boolean); if (type === 'sequence') return answer.value?.length === module.value.activity.steps.length; if (type === 'impact') return Boolean(answer.value); return false }
function check() {
  const activity = module.value.activity; let success = false
  if (activity.type === 'sort') success = activity.items.every(item => answer.value[item.id] === item.answer)
  if (activity.type === 'sequence') success = activity.steps.every((step,index) => answer.value[index] === step.id)
  if (activity.type === 'permission') success = activity.scenarios.every(item => answer.value[item.id] === item.answer)
  if (activity.type === 'impact') success = activity.options.find(item => item.id === answer.value)?.correct
  feedback.value = success ? { success:true,title:'Misi selesai!',text:module.value.jedaLabel } : { success:false,title:'Belum tepat',text:'Periksa kembali pilihanmu dan coba lagi.' }
  if (success) completeModule(module.value.id)
}
function checkDetective() {
  const correct = selectedCaseAnswer.value === currentCase.value.answer
  if (correct) caseScore.value++
  feedback.value = { success:correct,title:correct?'Analisis tepat':'Perlu diperiksa lagi',text:currentCase.value.explanation,case:true }
}
function nextCase() {
  if (caseIndex.value < detectiveCases.value.length - 1) { caseIndex.value++; selectedCaseAnswer.value = null; feedback.value = null; return }
  const passed = caseScore.value >= 4
  feedback.value = { success:passed,title:passed?'Misi selesai!':'Coba satu putaran lagi',text:`Skor verifikasi: ${caseScore.value} dari ${detectiveCases.value.length}`,final:true }
  if (passed) completeModule(module.value.id)
}
function finish() { router.push(allComplete.value ? '/summary' : '/missions') }
function dragStart(id) { dragged.value = id }
function dropAt(index = answer.value.length) {
  if (!dragged.value) return
  const next = answer.value.filter(id => id !== dragged.value); next.splice(index,0,dragged.value); answer.value = next; dragged.value = null
}
function addStep(id) { if (!answer.value.includes(id)) answer.value.push(id) }
function removeStep(id) { answer.value = answer.value.filter(item => item !== id) }
</script>

<template>
  <section v-if="module" class="module-screen content-screen" :style="{'--module-accent':module.accent}">
    <RouterLink class="back-button" to="/missions">← Kembali ke peta misi</RouterLink>
    <div class="module-heading"><div class="module-big-icon"><img :src="module.image" alt=""></div><div><p>MISI {{ module.number }} · {{ module.duration }}</p><h1>{{ module.shortTitle }}</h1><h2>{{ module.title }}</h2></div><div class="module-jeda"><small>BEKAL JEDA</small><b>{{ module.jeda }}</b><span>{{ module.jedaLabel }}</span></div></div>
    <template v-if="stage==='learn'">
      <div class="lesson-intro colorful-intro"><img :src="module.image" alt=""><p>{{ module.intro }}</p></div>
      <div class="principle-grid colorful-principles"><article v-for="(principle,index) in module.principles" :key="principle.title" :style="{'--principle-index':index}"><span>{{ String(index+1).padStart(2,'0') }}</span><small>PRINSIP {{ index+1 }}</small><h3>{{ principle.title }}</h3><p>{{ principle.text }}</p></article></div>
      <div class="lesson-cta"><div><small>SUDAH SIAP?</small><h2>Saatnya mencoba sebuah kasus</h2><p>Temukan alasan di balik setiap pilihan.</p></div><button class="primary-button" @click="begin">Mulai aktivitas →</button></div>
    </template>
    <div v-else class="activity-card enhanced-activity">
      <div class="activity-heading"><span>AKTIVITAS INTERAKTIF</span><h2>{{ module.activity.title }}</h2><p>{{ module.activity.instruction }}</p></div>

      <div v-if="module.activity.type==='sort'" class="sort-items vibrant-sort"><article v-for="(item,index) in module.activity.items" :key="item.id"><span class="item-icon">{{ index+1 }}</span><strong>{{ item.label }}</strong><div><button class="safe-choice" :class="{selected:answer[item.id]==='safe'}" @click="answer[item.id]='safe'">Aman dibagikan</button><button class="private-choice" :class="{selected:answer[item.id]==='private'}" @click="answer[item.id]='private'">Rahasiakan</button></div><p v-if="feedback?.success">{{ item.reason }}</p></article></div>

      <div v-else-if="module.activity.type==='sequence'" class="drag-activity"><div class="drag-help">Seret kartu ke area urutan. Kartu yang sudah masuk dapat diseret ulang.</div><div class="sequence-built drop-zone" @dragover.prevent @drop="dropAt()"><div v-if="!answer.length" class="drop-placeholder">Letakkan langkah pertama di sini</div><button v-for="(id,index) in answer" :key="id" draggable="true" @dragstart="dragStart(id)" @dragover.prevent @drop.stop="dropAt(index)"><b>{{ index+1 }}</b><span>{{ module.activity.steps.find(step=>step.id===id).label }}</span><i @click.stop="removeStep(id)">×</i></button></div><div class="sequence-pool colorful-pool"><button v-for="step in module.activity.steps.filter(step=>!answer.includes(step.id))" :key="step.id" draggable="true" @dragstart="dragStart(step.id)" @click="addStep(step.id)">{{ step.label }}<span>Tarik</span></button></div></div>

      <div v-else-if="module.activity.type==='detective' && currentCase" class="detective-quiz"><div class="quiz-progress"><span>Kasus {{ caseIndex+1 }} dari {{ detectiveCases.length }}</span><b>{{ caseScore }} poin</b></div><blockquote>{{ currentCase.prompt }}</blockquote><div class="case-options"><button v-for="(option,index) in currentCase.options" :key="option" :class="{selected:selectedCaseAnswer===index}" :disabled="feedback?.case" @click="selectedCaseAnswer=index"><b>{{ String.fromCharCode(65+index) }}</b>{{ option }}</button></div><div v-if="feedback" class="feedback-panel" :class="feedback.success?'success':'retry'"><span>{{ feedback.success?'OK':'ULANG' }}</span><div><h3>{{ feedback.title }}</h3><p>{{ feedback.text }}</p></div></div><div class="activity-actions"><button v-if="!feedback" class="primary-button" :disabled="selectedCaseAnswer===null" @click="checkDetective">Periksa jawaban</button><button v-else-if="feedback.case" class="primary-button" @click="nextCase">{{ caseIndex<detectiveCases.length-1?'Kasus berikutnya':'Lihat hasil' }}</button><button v-else-if="feedback.success" class="primary-button" @click="finish">Simpan bekal & lanjut</button><button v-else class="primary-button" @click="reset">Ulangi putaran</button></div></div>

      <div v-else-if="module.activity.type==='permission'" class="permission-activity colorful-cases"><article v-for="(scenario,index) in module.activity.scenarios" :key="scenario.id"><span>{{ index+1 }}</span><p>{{ scenario.text }}</p><div><button v-for="category in module.activity.categories" :key="category.id" :class="{selected:answer[scenario.id]===category.id}" @click="answer[scenario.id]=category.id">{{ category.label }}</button></div><small v-if="feedback?.success">{{ scenario.reason }}</small></article></div>

      <div v-else-if="module.activity.type==='impact'" class="impact-activity"><div v-if="embedUrl" class="video-frame"><iframe :src="embedUrl" title="Video studi kasus" allowfullscreen></iframe></div><div v-else class="video-placeholder"><strong>Video studi kasus belum ditambahkan</strong><span>Guru dapat menambahkan URL melalui Dashboard Guru.</span></div><div class="chat-scenario"><div class="avatar">AI</div><div><small>STUDI KASUS</small><p>{{ module.activity.instruction }}</p></div></div><div class="impact-options"><button v-for="(option,index) in module.activity.options" :key="option.id" :class="{selected:answer===option.id}" @click="answer=option.id"><span>{{ index+1 }}</span>{{ option.label }}</button></div><div v-if="answer" class="impact-wave"><b>Gelombang dampak</b><p>{{ module.activity.options.find(item=>item.id===answer).impact }}</p></div></div>

      <template v-if="module.activity.type!=='detective'"><div v-if="feedback" class="feedback-panel" :class="feedback.success?'success':'retry'"><span>{{ feedback.success?'OK':'ULANG' }}</span><div><h3>{{ feedback.title }}</h3><p>{{ feedback.text }}</p></div></div><div class="activity-actions"><button v-if="!feedback?.success" class="secondary-button" @click="reset">Ulangi</button><button v-if="!feedback?.success" class="primary-button check-answer-button" :disabled="!ready()" @click="check">Periksa jawaban</button><button v-else class="primary-button" @click="finish">Simpan bekal & lanjut</button></div></template>
    </div>
  </section>
  <section v-else class="content-screen"><h1>Misi tidak ditemukan</h1><RouterLink to="/missions">Kembali ke daftar misi</RouterLink></section>
</template>
