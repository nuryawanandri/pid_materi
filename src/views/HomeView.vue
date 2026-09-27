<script setup>
import { completedCount, content, principles } from '../store/learningStore'
</script>
<template>
  <section class="home-screen">
    <div class="hero-copy"><div class="eyebrow"><span></span>PETUALANGAN ETIKA DIGITAL</div><h1>Berpikir sejenak.<br><em>Bertindak lebih bijak.</em></h1><p>{{ content.heroDescription }}</p><div class="hero-actions"><RouterLink class="primary-button" to="/missions">Mulai petualangan <span>→</span></RouterLink><RouterLink v-if="completedCount" class="text-button" to="/missions">Lanjutkan {{ completedCount }}/5 misi</RouterLink></div><div class="home-notes"><span><i></i>Tanpa akun</span><span><i></i>Dapat digunakan offline</span><span><i></i>Progres tersimpan</span></div></div>
    <div class="hero-visual"><div class="flat-board-title"><span>4 LANGKAH SEDERHANA</span><b>Bekal memakai AI</b></div><div class="hero-asset-frame"><img class="hero-asset" src="/assets-preview/hero-ai-bijak-preview.png" alt="Pelajar mempertimbangkan penggunaan AI secara bijak"></div><div class="flat-principle-grid"><div v-for="principle in principles" :key="principle.letter" class="orbit-card"><b :style="{ background: principle.color }">{{ principle.letter }}</b><span>{{ principle.title }}</span></div></div></div>
    <div class="journey-strip"><span><b>1</b> Siapkan diri</span><i></i><span class="active"><b>2</b> Pelajari materi</span><i></i><span><b>3</b> Uji pemahaman</span></div>
  </section>
</template>
