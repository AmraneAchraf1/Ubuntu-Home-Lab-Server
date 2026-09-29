import DefaultTheme from 'vitepress/theme'
import './custom.css'
import ChapterMeta from './ChapterMeta.vue'

const CALLOUT_LABELS = {
  tip: 'Tip',
  info: 'Note',
  warning: 'Warning',
  danger: 'Danger',
  details: 'Details',
}

const enhanceCallouts = () => {
  if (typeof document === 'undefined') return
  document.querySelectorAll('.vp-doc .custom-block').forEach((block) => {
    if (block.getAttribute('role')) return
    const kind = Object.keys(CALLOUT_LABELS).find((name) => block.classList.contains(name))
    const title = block.querySelector('.custom-block-title')?.textContent?.trim()
    block.setAttribute('role', 'note')
    block.setAttribute('aria-label', title || (kind ? CALLOUT_LABELS[kind] : 'Note'))
  })
}

export default {
  extends: DefaultTheme,
  enhanceApp({ app, router }) {
    app.component('ChapterMeta', ChapterMeta)

    if (typeof window === 'undefined') return

    if (router?.onAfterRouteChange) router.onAfterRouteChange = enhanceCallouts

    const start = () => {
      enhanceCallouts()
      const target = document.querySelector('.vp-doc') || document.body
      if (target) new MutationObserver(enhanceCallouts).observe(target, {
        childList: true,
        subtree: true,
      })
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start)
    } else {
      start()
    }
  },
}
