<script setup>
import { computed, ref, watch } from 'vue'
import { content, exportContent, freeNavigation, importContent, modules, resetContent, resetProgress, saveContent } from '../store/learningStore'

const draft = ref(JSON.parse(JSON.stringify(content.value)))
const activeId = ref(draft.value.modules[0]?.id)
const message = ref('')
const fileInput = ref(null)
const activeModule = computed(() => draft.value.modules.find(item => item.id === activeId.value))
const activityJson = ref('')
watch(activeModule, value => { activityJson.value = JSON.stringify(value?.activity || {}, null, 2) }, { immediate:true })

function save() {
  try {
    const videoUrl = activeModule.value.activity.videoUrl
    const parsedActivity = JSON.parse(activityJson.value)
    if (parsedActivity.type === 'impact') parsedActivity.videoUrl = videoUrl
    activeModule.value.activity = parsedActivity
    activityJson.value = JSON.stringify(parsedActivity, null, 2)
    saveContent(draft.value)
    message.value = 'Konten berhasil disimpan di browser.'
  }
  catch (error) { message.value = `JSON aktivitas tidak valid: ${error.message}` }
}
async function loadFile(event) { try { await importContent(event.target.files[0]); draft.value = JSON.parse(JSON.stringify(content.value)); activeId.value = draft.value.modules[0]?.id; message.value = 'Konten JSON berhasil diimpor.' } catch(error) { message.value = error.message } }
function restore() { if (!confirm('Kembalikan seluruh konten ke versi bawaan?')) return; resetContent(); draft.value = JSON.parse(JSON.stringify(content.value)); activeId.value = draft.value.modules[0]?.id; message.value = 'Konten bawaan dipulihkan.' }
</script>
<template><section class="teacher-dashboard content-screen"><div class="dashboard-heading"><div><p class="eyebrow"><span></span>PUSAT KONTEN</p><h1>Dashboard Guru</h1><p>Ubah materi, aktivitas, dan tautan video tanpa menyentuh komponen tampilan.</p></div><RouterLink class="secondary-button" to="/missions">Lihat aplikasi</RouterLink></div><div class="dashboard-toolbar"><label class="toggle-row"><div><strong>Modul dapat dipilih bebas</strong><span>Matikan untuk alur berurutan.</span></div><input v-model="freeNavigation" type="checkbox"><i></i></label><button class="secondary-button" @click="exportContent">Ekspor JSON</button><button class="secondary-button" @click="fileInput.click()">Impor JSON</button><input ref="fileInput" hidden type="file" accept="application/json" @change="loadFile"><button class="danger-button compact" @click="resetProgress">Hapus progres</button></div><div class="dashboard-layout"><aside><button v-for="item in modules" :key="item.id" :class="{active:activeId===item.id}" @click="activeId=item.id"><img :src="item.image" alt=""><span><b>{{ item.shortTitle }}</b><small>{{ item.title }}</small></span></button></aside><form v-if="activeModule" class="content-editor" @submit.prevent="save"><h2>{{ activeModule.shortTitle }}</h2><div class="editor-grid"><label>Nama singkat<input v-model="activeModule.shortTitle"></label><label>Judul materi<input v-model="activeModule.title"></label><label>Durasi<input v-model="activeModule.duration"></label><label>Warna aksen<input v-model="activeModule.accent" type="color"></label><label class="wide">Pengantar<textarea v-model="activeModule.intro" rows="3"></textarea></label><label v-if="activeModule.activity.type==='impact'" class="wide">URL video studi kasus<input v-model="activeModule.activity.videoUrl" placeholder="https://youtube.com/watch?v=..."></label><label class="wide">Aktivitas dalam JSON<textarea v-model="activityJson" rows="18" spellcheck="false"></textarea><small>Di sini guru dapat menambah soal, studi kasus, pilihan, jawaban, dan penjelasan.</small></label></div><div class="editor-actions"><button type="button" class="secondary-button" @click="restore">Pulihkan bawaan</button><button class="primary-button" type="submit">Simpan perubahan</button></div><p class="dashboard-message">{{ message }}</p></form></div></section></template>
