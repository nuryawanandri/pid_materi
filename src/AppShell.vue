<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { completedCount, modules, progressPercent } from './store/learningStore'

const route = useRoute()
const soundEnabled = ref(false)
const showProgress = computed(() => !['home', 'teacher'].includes(String(route.name)))
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <RouterLink class="brand" to="/" aria-label="Kembali ke beranda">
        <span class="brand-mark" aria-hidden="true"></span>
        <span><small>PID MATERI INTERAKTIF</small><strong>Misi AI Bijak</strong></span>
      </RouterLink>
      <div v-if="showProgress" class="header-progress" aria-label="Kemajuan belajar">
        <span>{{ completedCount }}/{{ modules.length }} misi selesai</span>
        <div><i :style="{ width: `${progressPercent}%` }"></i></div>
      </div>
      <div class="header-actions">
        <button class="sound-button" type="button" @click="soundEnabled = !soundEnabled">{{ soundEnabled ? 'Suara aktif' : 'Suara nonaktif' }}</button>
        <RouterLink class="teacher-button" to="/teacher">Dashboard Guru</RouterLink>
      </div>
    </header>
    <main><RouterView /></main>
    <footer><span class="footer-brand"><i></i>Misi AI Bijak</span><p>Belajar aman, jujur, kritis, dan bertanggung jawab.</p><small>Materi etika penggunaan AI</small></footer>
  </div>
</template>
