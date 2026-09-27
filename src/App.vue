<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { jedaPrinciples, learningModules } from './data/modules'

const STORAGE_KEY = 'misi-ai-bijak-progress-v1'
const screen = ref('home')
const activeModuleId = ref(null)
const lessonStep = ref('learn')
const completed = ref([])
const teacherOpen = ref(false)
const freeNavigation = ref(true)
const soundEnabled = ref(false)
const feedback = ref(null)
const answers = reactive({})
const evaluationUrl = import.meta.env.VITE_EVALUATION_URL || ''

const activeModule = computed(() => learningModules.find((module) => module.id === activeModuleId.value))
const completedCount = computed(() => completed.value.length)
const progressPercent = computed(() => Math.round((completedCount.value / learningModules.length) * 100))
const allComplete = computed(() => completedCount.value === learningModules.length)

onMounted(() => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (Array.isArray(saved?.completed)) completed.value = saved.completed.filter((id) => learningModules.some((module) => module.id === id))
    if (typeof saved?.freeNavigation === 'boolean') freeNavigation.value = saved.freeNavigation
  } catch {
    localStorage.removeItem(STORAGE_KEY)
  }
})

watch([completed, freeNavigation], () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ completed: completed.value, freeNavigation: freeNavigation.value }))
}, { deep: true })

function goHome() {
  screen.value = 'home'
  activeModuleId.value = null
  feedback.value = null
}

function openMap() {
  screen.value = 'map'
  activeModuleId.value = null
  feedback.value = null
}

function moduleLocked(index) {
  return !freeNavigation.value && index > 0 && !completed.value.includes(learningModules[index - 1].id)
}

function openModule(module, index = learningModules.indexOf(module)) {
  if (moduleLocked(index)) return
  activeModuleId.value = module.id
  lessonStep.value = 'learn'
  feedback.value = null
  resetActivity(module)
  screen.value = 'module'
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function resetActivity(module = activeModule.value) {
  feedback.value = null
  if (!module) return
  const activity = module.activity
  if (activity.type === 'sort') answers[module.id] = Object.fromEntries(activity.items.map((item) => [item.id, '']))
  if (activity.type === 'sequence') answers[module.id] = []
  if (activity.type === 'detective') answers[module.id] = { claims: [], source: '' }
  if (activity.type === 'permission') answers[module.id] = Object.fromEntries(activity.scenarios.map((item) => [item.id, '']))
  if (activity.type === 'impact') answers[module.id] = ''
}

function beginActivity() {
  lessonStep.value = 'activity'
  feedback.value = null
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function setSort(itemId, value) {
  if (feedback.value?.success) return
  answers[activeModuleId.value][itemId] = value
}

function addSequenceStep(stepId) {
  if (feedback.value?.success) return
  if (!answers[activeModuleId.value].includes(stepId)) answers[activeModuleId.value].push(stepId)
}

function removeSequenceStep(stepId) {
  if (feedback.value?.success) return
  answers[activeModuleId.value] = answers[activeModuleId.value].filter((id) => id !== stepId)
}

function toggleClaim(claimId) {
  if (feedback.value?.success) return
  const selected = answers[activeModuleId.value].claims
  answers[activeModuleId.value].claims = selected.includes(claimId)
    ? selected.filter((id) => id !== claimId)
    : [...selected, claimId]
}

function activityReady(module = activeModule.value) {
  const answer = answers[module.id]
  if (!answer) return false
  if (module.activity.type === 'sort') return Object.values(answer).every(Boolean)
  if (module.activity.type === 'sequence') return answer.length === module.activity.steps.length
  if (module.activity.type === 'detective') return answer.claims.length > 0 && Boolean(answer.source)
  if (module.activity.type === 'permission') return Object.values(answer).every(Boolean)
  if (module.activity.type === 'impact') return Boolean(answer)
  return false
}

function checkActivity() {
  const module = activeModule.value
  const activity = module.activity
  const answer = answers[module.id]
  let success = false

  if (activity.type === 'sort') success = activity.items.every((item) => answer[item.id] === item.answer)
  if (activity.type === 'sequence') success = activity.steps.every((step, index) => answer[index] === step.id)
  if (activity.type === 'detective') {
    const correctClaims = activity.claims.filter((claim) => claim.correct).map((claim) => claim.id).sort()
    success = JSON.stringify([...answer.claims].sort()) === JSON.stringify(correctClaims)
      && activity.sources.find((source) => source.id === answer.source)?.correct
  }
  if (activity.type === 'permission') success = activity.scenarios.every((scenario) => answer[scenario.id] === scenario.answer)
  if (activity.type === 'impact') success = activity.options.find((option) => option.id === answer)?.correct

  feedback.value = success
    ? { success: true, title: 'Misi selesai!', text: `${module.jedaLabel} adalah bekal penting saat menggunakan AI.` }
    : { success: false, title: 'Hampir tepat', text: 'Perhatikan kembali akibat setiap pilihan. Kamu boleh memperbaikinya dan mencoba lagi.' }

  if (success && !completed.value.includes(module.id)) completed.value = [...completed.value, module.id]
}

function finishModule() {
  const currentIndex = learningModules.findIndex((module) => module.id === activeModuleId.value)
  if (completed.value.length === learningModules.length) {
    screen.value = 'summary'
    activeModuleId.value = null
  } else if (!freeNavigation.value && learningModules[currentIndex + 1]) {
    openModule(learningModules[currentIndex + 1], currentIndex + 1)
  } else {
    openMap()
  }
}

function resetProgress() {
  if (!window.confirm('Hapus seluruh kemajuan belajar pada perangkat ini?')) return
  completed.value = []
  teacherOpen.value = false
  goHome()
}

function showSummary() {
  screen.value = 'summary'
  activeModuleId.value = null
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function explainEvaluationLink() {
  window.alert('Alamat Arena Cerdas Cermat belum diatur. Tambahkan VITE_EVALUATION_URL pada pengaturan proyek Vercel.')
}
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <button class="brand" type="button" @click="goHome" aria-label="Kembali ke beranda">
        <span class="brand-mark" aria-hidden="true"></span>
        <span><small>PID MATERI INTERAKTIF</small><strong>Misi AI Bijak</strong></span>
      </button>

      <div v-if="screen !== 'home'" class="header-progress" aria-label="Kemajuan belajar">
        <span>{{ completedCount }}/{{ learningModules.length }} misi selesai</span>
        <div><i :style="{ width: `${progressPercent}%` }"></i></div>
      </div>

      <div class="header-actions">
        <button class="sound-button" type="button" :aria-label="soundEnabled ? 'Matikan suara' : 'Aktifkan suara'" @click="soundEnabled = !soundEnabled">
          {{ soundEnabled ? 'Suara aktif' : 'Suara nonaktif' }}
        </button>
        <button class="teacher-button" type="button" @click="teacherOpen = true">Mode Guru</button>
      </div>
    </header>

    <main>
      <section v-if="screen === 'home'" class="home-screen">
        <div class="hero-copy">
          <div class="eyebrow"><span></span> PETUALANGAN ETIKA DIGITAL</div>
          <h1>Berpikir sejenak.<br><em>Bertindak lebih bijak.</em></h1>
          <p>Jelajahi lima misi interaktif untuk belajar menggunakan AI dengan aman, jujur, kritis, dan bertanggung jawab.</p>
          <div class="hero-actions">
            <button class="primary-button" type="button" @click="openMap">Mulai petualangan <span>→</span></button>
            <button v-if="completedCount" class="text-button" type="button" @click="openMap">Lanjutkan {{ completedCount }}/5 misi</button>
          </div>
          <div class="home-notes">
            <span><i></i>Tanpa akun</span><span><i></i>Dapat digunakan offline setelah dimuat</span><span><i></i>Progres tersimpan di perangkat</span>
          </div>
        </div>

        <div class="hero-visual" aria-label="Ilustrasi penggunaan AI secara bijak">
          <div class="flat-board-title"><span>4 LANGKAH SEDERHANA</span><b>Bekal memakai AI</b></div>
          <div class="hero-asset-frame"><img class="hero-asset" src="/assets-preview/hero-ai-bijak-preview.png" alt="Pelajar mempertimbangkan privasi, verifikasi, izin, dan dampak sebelum menggunakan AI"></div>
          <div class="flat-principle-grid">
            <div v-for="(principle, index) in jedaPrinciples" :key="principle.letter" class="orbit-card" :class="`orbit-card-${index + 1}`">
              <b :style="{ background: principle.color }">{{ principle.letter }}</b><span>{{ principle.title }}</span>
            </div>
          </div>
        </div>

        <div class="journey-strip">
          <span><b>1</b> Siapkan diri</span><i></i><span class="active"><b>2</b> Pelajari materi</span><i></i><span><b>3</b> Uji pemahaman</span>
        </div>
      </section>

      <section v-else-if="screen === 'map'" class="map-screen content-screen">
        <div class="section-heading">
          <div><p class="eyebrow"><span></span> PETA PETUALANGAN</p><h1>Pilih misi belajarmu</h1><p>Setiap misi menghadirkan kasus yang dekat dengan kehidupan sehari-hari.</p></div>
          <button v-if="allComplete" class="secondary-button" type="button" @click="showSummary">Lihat ringkasan JEDA</button>
        </div>

        <div class="mission-grid">
          <button v-for="(module, index) in learningModules" :key="module.id" class="mission-card" :class="{ completed: completed.includes(module.id), locked: moduleLocked(index) }" type="button" @click="openModule(module, index)">
            <div class="mission-top"><span class="mission-number">MISI {{ module.number }}</span><span>{{ completed.includes(module.id) ? 'Selesai' : moduleLocked(index) ? 'Terkunci' : module.duration }}</span></div>
            <div class="mission-icon" :style="{ background: `${module.accent}12` }"><img :src="module.image" alt="" aria-hidden="true"></div>
            <h2>{{ module.shortTitle }}</h2><p>{{ module.title }}</p>
            <div class="mission-footer"><span :style="{ color: module.accent }">{{ completed.includes(module.id) ? 'Pelajari lagi' : 'Mulai misi' }}</span><b>→</b></div>
          </button>
        </div>

        <div class="jeda-banner">
          <div><small>BEKAL UTAMA</small><h2>Gunakan pola <em>JEDA</em></h2><p>Empat langkah sederhana sebelum menggunakan atau membagikan hasil AI.</p></div>
          <div class="jeda-mini"><span v-for="item in jedaPrinciples" :key="item.letter"><b :style="{ color: item.color }">{{ item.letter }}</b>{{ item.title }}</span></div>
        </div>
      </section>

      <section v-else-if="screen === 'module' && activeModule" class="module-screen content-screen">
        <button class="back-button" type="button" @click="openMap">← Kembali ke peta misi</button>
        <div class="module-heading" :style="{ '--module-accent': activeModule.accent }">
          <div class="module-big-icon"><img :src="activeModule.image" alt="" aria-hidden="true"></div>
          <div><p>MISI {{ activeModule.number }} · {{ activeModule.duration }}</p><h1>{{ activeModule.shortTitle }}</h1><h2>{{ activeModule.title }}</h2></div>
          <div class="module-jeda"><small>BEKAL JEDA</small><b>{{ activeModule.jeda }}</b><span>{{ activeModule.jedaLabel }}</span></div>
        </div>

        <template v-if="lessonStep === 'learn'">
          <div class="lesson-intro"><img :src="activeModule.image" alt="" aria-hidden="true"><p>{{ activeModule.intro }}</p></div>
          <div class="principle-grid">
            <article v-for="(principle, index) in activeModule.principles" :key="principle.title">
              <span>{{ String(index + 1).padStart(2, '0') }}</span><small>PRINSIP {{ index + 1 }}</small><h3>{{ principle.title }}</h3><p>{{ principle.text }}</p>
            </article>
          </div>
          <div class="lesson-cta"><div><small>SUDAH SIAP?</small><h2>Saatnya mencoba sebuah kasus</h2><p>Kamu boleh mengulang pilihan. Yang penting adalah memahami alasannya.</p></div><button class="primary-button" type="button" @click="beginActivity">Mulai aktivitas <span>→</span></button></div>
        </template>

        <template v-else>
          <div class="activity-card">
            <div class="activity-heading"><span>AKTIVITAS INTERAKTIF</span><h2>{{ activeModule.activity.title }}</h2><p>{{ activeModule.activity.instruction }}</p></div>

            <div v-if="activeModule.activity.type === 'sort'" class="sort-activity">
              <div class="sort-items">
                <article v-for="(item, index) in activeModule.activity.items" :key="item.id" :class="{ answered: answers[activeModule.id][item.id] }">
                  <span class="item-icon">{{ index + 1 }}</span><strong>{{ item.label }}</strong>
                  <div><button type="button" :class="{ selected: answers[activeModule.id][item.id] === 'safe' }" @click="setSort(item.id, 'safe')">Aman dibagikan</button><button type="button" :class="{ selected: answers[activeModule.id][item.id] === 'private' }" @click="setSort(item.id, 'private')">Rahasiakan</button></div>
                  <p v-if="feedback?.success">{{ item.reason }}</p>
                </article>
              </div>
            </div>

            <div v-else-if="activeModule.activity.type === 'sequence'" class="sequence-activity">
              <div class="sequence-built">
                <button v-for="(stepId, index) in answers[activeModule.id]" :key="stepId" type="button" @click="removeSequenceStep(stepId)"><b>{{ index + 1 }}</b>{{ activeModule.activity.steps.find(step => step.id === stepId).label }}<span>×</span></button>
                <p v-if="!answers[activeModule.id].length">Pilih langkah pertama di bawah ini</p>
              </div>
              <div class="sequence-pool"><button v-for="step in activeModule.activity.steps.filter(step => !answers[activeModule.id].includes(step.id))" :key="step.id" type="button" @click="addSequenceStep(step.id)">+ {{ step.label }}</button></div>
            </div>

            <div v-else-if="activeModule.activity.type === 'detective'" class="detective-activity">
              <blockquote>{{ activeModule.activity.quote }}</blockquote>
              <h3>Bagian mana yang harus diperiksa?</h3>
              <div class="check-grid"><button v-for="(claim, index) in activeModule.activity.claims" :key="claim.id" type="button" :class="{ selected: answers[activeModule.id].claims.includes(claim.id) }" @click="toggleClaim(claim.id)"><span>{{ index + 1 }}</span>{{ claim.label }}</button></div>
              <h3>Sumber pembanding terbaik:</h3>
              <label v-for="source in activeModule.activity.sources" :key="source.id" class="radio-card"><input v-model="answers[activeModule.id].source" type="radio" :value="source.id"><span></span>{{ source.label }}</label>
            </div>

            <div v-else-if="activeModule.activity.type === 'permission'" class="permission-activity">
              <article v-for="(scenario, index) in activeModule.activity.scenarios" :key="scenario.id"><span>{{ index + 1 }}</span><p>{{ scenario.text }}</p><div><button v-for="category in activeModule.activity.categories" :key="category.id" type="button" :class="{ selected: answers[activeModule.id][scenario.id] === category.id }" @click="answers[activeModule.id][scenario.id] = category.id">{{ category.label }}</button></div><small v-if="feedback?.success">{{ scenario.reason }}</small></article>
            </div>

            <div v-else-if="activeModule.activity.type === 'impact'" class="impact-activity">
              <div class="chat-scenario"><div class="avatar">AI</div><div><small>GRUP KELAS · BARU SAJA</small><p>“Lihat video ini! Sepertinya teman kita mengatakan sesuatu yang memalukan...”</p><span>▶ Video mungkin telah dimanipulasi</span></div></div>
              <div class="impact-options"><button v-for="(option, index) in activeModule.activity.options" :key="option.id" type="button" :class="{ selected: answers[activeModule.id] === option.id }" @click="answers[activeModule.id] = option.id"><span>{{ index + 1 }}</span>{{ option.label }}</button></div>
              <div v-if="answers[activeModule.id]" class="impact-wave"><b>Gelombang dampak</b><p>{{ activeModule.activity.options.find(option => option.id === answers[activeModule.id]).impact }}</p></div>
            </div>

            <div v-if="feedback" class="feedback-panel" :class="{ success: feedback.success, retry: !feedback.success }"><span>{{ feedback.success ? 'OK' : 'ULANG' }}</span><div><h3>{{ feedback.title }}</h3><p>{{ feedback.text }}</p></div></div>
            <div class="activity-actions"><button v-if="!feedback?.success" class="secondary-button" type="button" @click="resetActivity()">Ulangi pilihan</button><button v-if="!feedback?.success" class="primary-button" type="button" :disabled="!activityReady()" @click="checkActivity">Periksa jawaban</button><button v-else class="primary-button" type="button" @click="finishModule">{{ allComplete ? 'Lihat ringkasan' : 'Simpan bekal & lanjut' }} <span>→</span></button></div>
          </div>
        </template>
      </section>

      <section v-else-if="screen === 'summary'" class="summary-screen content-screen">
        <div class="celebration" aria-hidden="true"></div><p class="eyebrow centered"><span></span> SEMUA MISI SELESAI <span></span></p><h1>Kamu siap menggunakan AI<br><em>dengan lebih bijak.</em></h1><p class="summary-lead">Bawa empat bekal JEDA ini setiap kali menggunakan atau membagikan hasil AI.</p>
        <div class="jeda-summary"><article v-for="principle in jedaPrinciples" :key="principle.letter" :style="{ '--color': principle.color }"><b>{{ principle.letter }}</b><div><h2>{{ principle.title }}</h2><p>{{ principle.text }}</p></div></article></div>
        <div class="pledge"><span aria-hidden="true"></span><div><small>REFLEKSI</small><h2>“Sebelum menggunakan AI, saya akan berhenti sejenak dan melakukan JEDA.”</h2></div></div>
        <div class="summary-actions"><button class="secondary-button" type="button" @click="openMap">Pelajari kembali</button><a v-if="evaluationUrl" class="primary-button" :href="evaluationUrl">Siap ke Arena Cerdas Cermat <span>→</span></a><button v-else class="primary-button" type="button" @click="explainEvaluationLink">Siap ke Arena Cerdas Cermat <span>→</span></button></div>
      </section>
    </main>

    <footer><span class="footer-brand"><i aria-hidden="true"></i>Misi AI Bijak</span><p>Belajar aman, jujur, kritis, dan bertanggung jawab.</p><small>Materi etika penggunaan AI</small></footer>

    <div v-if="teacherOpen" class="modal-backdrop" @click.self="teacherOpen = false">
      <section class="teacher-modal" role="dialog" aria-modal="true" aria-labelledby="teacher-title">
        <button class="modal-close" type="button" aria-label="Tutup" @click="teacherOpen = false">×</button>
        <p class="eyebrow"><span></span> PENGATURAN FASILITATOR</p><h2 id="teacher-title">Mode Guru</h2><p>Atur alur belajar pada perangkat ini.</p>
        <label class="toggle-row"><div><strong>Modul dapat dipilih bebas</strong><span>Nonaktifkan untuk membuka modul secara berurutan.</span></div><input v-model="freeNavigation" type="checkbox"><i></i></label>
        <div class="teacher-progress"><div><span>Kemajuan kelas</span><strong>{{ completedCount }}/5 misi</strong></div><div class="progress-track"><i :style="{ width: `${progressPercent}%` }"></i></div></div>
        <h3>Lompat ke modul</h3><div class="teacher-modules"><button v-for="(module, index) in learningModules" :key="module.id" type="button" @click="teacherOpen = false; openModule(module, index)"><img :src="module.image" alt="" aria-hidden="true"><div><strong>{{ module.shortTitle }}</strong><small>{{ completed.includes(module.id) ? 'Selesai' : 'Belum selesai' }}</small></div></button></div>
        <button class="danger-button" type="button" @click="resetProgress">Hapus seluruh kemajuan</button>
      </section>
    </div>
  </div>
</template>
