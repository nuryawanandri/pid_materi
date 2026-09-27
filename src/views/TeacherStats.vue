<script setup>
import { computed } from 'vue'
import { accuracyPercent, analytics, completedCount, modules, totalAnswers, totalAttempts } from '../store/learningStore'

const rows = computed(() => modules.value.map(module => {
  const data = analytics.value[module.id] || {}
  const accuracy = data.totalAnswers ? Math.round((data.correctAnswers / data.totalAnswers) * 100) : 0
  return { ...module, attempts: data.attempts || 0, answered: data.totalAnswers || 0, accuracy, bestScore: data.bestScore || 0 }
}))
</script>

<template>
  <section class="teacher-stats">
    <div class="stats-heading"><div><small>STATISTIK PERANGKAT INI</small><h2>Hasil Belajar Siswa</h2></div><p>Data tercatat dari pengerjaan yang dilakukan pada browser ini.</p></div>
    <div class="stats-summary">
      <article><span>Misi selesai</span><strong>{{ completedCount }}/{{ modules.length }}</strong></article>
      <article><span>Total pemeriksaan</span><strong>{{ totalAttempts }}</strong></article>
      <article><span>Jawaban dinilai</span><strong>{{ totalAnswers }}</strong></article>
      <article><span>Ketepatan</span><strong>{{ accuracyPercent }}%</strong></article>
    </div>
    <div class="stats-table-wrap">
      <table>
        <thead><tr><th>Misi</th><th>Percobaan</th><th>Jawaban</th><th>Ketepatan</th><th>Skor terbaik</th></tr></thead>
        <tbody><tr v-for="row in rows" :key="row.id"><td><span class="stats-dot" :style="{background:row.accent}"></span><b>{{ row.shortTitle }}</b></td><td>{{ row.attempts }}</td><td>{{ row.answered }}</td><td><div class="accuracy-cell"><i><span :style="{width:`${row.accuracy}%`,background:row.accent}"></span></i>{{ row.accuracy }}%</div></td><td>{{ row.bestScore }}%</td></tr></tbody>
      </table>
    </div>
  </section>
</template>
