<template>
  <div class="ahl-mermaid" role="img" aria-label="Diagram" v-html="svg"></div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'

const props = defineProps({
  graph: { type: String, required: true },
  id: { type: String, required: true },
  class: { type: String, default: 'mermaid' },
})

const svg = ref('')
let observer = null
let mermaid = null

const readTokens = () => {
  const cs = getComputedStyle(document.documentElement)
  const get = (name, fallback) => cs.getPropertyValue(name).trim() || fallback
  return {
    bg: get('--vp-c-bg', '#ffffff'),
    bgSoft: get('--vp-c-bg-soft', '#f6f6f7'),
    bgAlt: get('--vp-c-bg-alt', '#f6f6f7'),
    text: get('--vp-c-text-1', '#213547'),
    text2: get('--vp-c-text-2', '#3c3c43'),
    divider: get('--vp-c-divider', '#e2e2e3'),
    brand: get('--ahl-brand', '#3c8772'),
    brandSoft: get('--ahl-brand-soft', 'rgba(60, 135, 114, 0.16)'),
    font: get('--vp-font-family-base', 'system-ui, sans-serif'),
  }
}

const themeVariables = (t) => ({
  darkMode: false,
  background: t.bg,
  primaryColor: t.brandSoft,
  primaryTextColor: t.text,
  primaryBorderColor: t.brand,
  secondaryColor: t.bgSoft,
  tertiaryColor: t.bgAlt,
  lineColor: t.text2,
  textColor: t.text,
  mainBkg: t.brandSoft,
  nodeBorder: t.brand,
  nodeTextColor: t.text,
  clusterBkg: t.bgAlt,
  clusterBorder: t.divider,
  titleColor: t.text,
  edgeLabelBackground: t.bg,
  // sequence diagram tokens
  actorBkg: t.bgSoft,
  actorBorder: t.brand,
  actorTextColor: t.text,
  signalColor: t.text2,
  signalTextColor: t.text,
  labelBoxBkgColor: t.bgSoft,
  labelBoxBorderColor: t.brand,
  labelTextColor: t.text,
  loopTextColor: t.text,
  noteBkgColor: t.brandSoft,
  noteBorderColor: t.brand,
  noteTextColor: t.text,
  activationBkgColor: t.brandSoft,
  activationBorderColor: t.brand,
  sequenceNumberColor: t.bg,
  fontFamily: t.font,
  fontSize: '15px',
})

const renderChart = async () => {
  if (!mermaid) mermaid = (await import('mermaid')).default
  const tokens = readTokens()
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'loose',
    theme: 'base',
    themeVariables: themeVariables(tokens),
    flowchart: { curve: 'basis', htmlLabels: true, padding: 12, useMaxWidth: true },
    sequence: { useMaxWidth: true },
  })
  const uniqueId = `${props.id}-${Math.random().toString(36).slice(2, 8)}`
  try {
    const { svg: output } = await mermaid.render(uniqueId, decodeURIComponent(props.graph))
    svg.value = output
  } catch (error) {
    svg.value = `<pre class="ahl-mermaid__error">Diagram failed to render: ${String(error)}</pre>`
  }
}

onMounted(async () => {
  await renderChart()
  observer = new MutationObserver(() => renderChart())
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})
</script>
