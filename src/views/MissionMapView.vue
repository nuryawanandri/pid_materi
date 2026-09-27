<script setup>
import { allComplete, completed, isLocked, modules, principles } from '../store/learningStore'
</script>
<template>
  <section class="map-screen content-screen">
    <div class="section-heading"><div><p class="eyebrow"><span></span>PETA PETUALANGAN</p><h1>Pilih Misi Belajarmu</h1><p>Lima pengalaman berbeda, satu tujuan: menggunakan AI dengan lebih bijak.</p></div><RouterLink v-if="allComplete" class="secondary-button" to="/summary">Ringkasan JEDA</RouterLink></div>
    <div class="mission-grid colorful-missions"><RouterLink v-for="(module,index) in modules" :key="module.id" :to="isLocked(index) ? '' : `/missions/${module.id}`" class="mission-card" :class="{completed:completed.includes(module.id),locked:isLocked(index)}" :style="{'--card-accent':module.accent,'--card-tint':`${module.accent}16`}"><div class="mission-top"><span>MISI {{ module.number }}</span><span>{{ completed.includes(module.id) ? 'Selesai' : module.duration }}</span></div><div class="mission-icon"><img :src="module.image" alt=""></div><h2>{{ module.shortTitle }}</h2><p>{{ module.title }}</p><div class="mission-footer"><span>{{ completed.includes(module.id) ? 'Pelajari lagi' : 'Mulai misi' }}</span><b>→</b></div></RouterLink></div>
    <div class="jeda-banner"><div><small>BEKAL UTAMA</small><h2>Gunakan pola <em>JEDA</em></h2><p>Empat langkah sederhana sebelum menggunakan atau membagikan hasil AI.</p></div><div class="jeda-mini"><span v-for="item in principles" :key="item.letter"><b :style="{color:item.color}">{{ item.letter }}</b>{{ item.title }}</span></div></div>
  </section>
</template>
