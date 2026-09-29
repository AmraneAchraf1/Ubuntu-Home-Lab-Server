<template>
  <div class="ahl-chapter-meta">
    <nav class="ahl-breadcrumb" aria-label="Breadcrumb">
      <a href="/">Home</a>
      <span class="ahl-breadcrumb__sep" aria-hidden="true">/</span>
      <a href="/chapters/01-understanding-linux-as-a-server-os">Chapters</a>
      <span class="ahl-breadcrumb__sep" aria-hidden="true">/</span>
      <span aria-current="page">{{ title }}</span>
    </nav>
    <div class="ahl-badges">
      <span v-if="difficulty" class="ahl-badge" :class="difficultyClass">{{ difficulty }}</span>
      <span v-if="estimatedTime" class="ahl-badge ahl-badge--time">
        <span aria-hidden="true">⏱</span> {{ estimatedTime }}
      </span>
    </div>
    <ul v-if="prerequisites.length" class="ahl-chips" aria-label="Prerequisites">
      <li v-for="(item, index) in prerequisites" :key="index" class="ahl-chip">{{ item }}</li>
    </ul>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useData } from 'vitepress'

const { frontmatter, page } = useData()

const title = computed(() => frontmatter.value.title || page.value.title || '')
const difficulty = computed(() => frontmatter.value.difficulty || '')
const estimatedTime = computed(() => frontmatter.value.estimatedTime || '')
const prerequisites = computed(() => frontmatter.value.prerequisites || [])

const difficultyClass = computed(() => {
  const value = String(difficulty.value).toLowerCase()
  if (value.startsWith('beg')) return 'ahl-badge--beginner'
  if (value.startsWith('adv')) return 'ahl-badge--advanced'
  return 'ahl-badge--intermediate'
})
</script>
