import DefaultTheme from 'vitepress/theme'
import './custom.css'

// Add copy code button functionality
if (typeof window !== 'undefined') {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.copy-code-btn')
    if (!btn) return

    const code = btn.dataset.code
    if (!code) return

    navigator.clipboard.writeText(decodeURIComponent(code)).then(() => {
      btn.classList.add('copied')
      const originalTitle = btn.title
      btn.title = 'Copied!'
      btn.setAttribute('aria-label', 'Copied to clipboard')
      
      setTimeout(() => {
        btn.classList.remove('copied')
        btn.title = originalTitle
        btn.setAttribute('aria-label', 'Copy to clipboard')
      }, 2000)
    }).catch(() => {
      btn.title = 'Failed to copy'
      setTimeout(() => {
        btn.title = 'Copy to clipboard'
      }, 2000)
    })
  })
}

export default {
  extends: DefaultTheme,
}