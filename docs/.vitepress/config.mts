import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Ubuntu Home Lab Server',
  description: 'Complete setup guide for Ubuntu-based home server with Node.js, NestJS, Docker, PostgreSQL, NVIDIA GPU, and more',
  lang: 'en-US',
  dir: 'ltr',
  head: [
    ['meta', { name: 'theme-color', content: '#3c8772' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'Ubuntu Home Lab Server' }],
    ['meta', { property: 'og:description', content: 'Complete setup guide for Ubuntu-based home server with Node.js, NestJS, Docker, PostgreSQL, NVIDIA GPU, and more' }],
    ['meta', { property: 'og:image', content: '/og-image.svg' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', { href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap', rel: 'stylesheet' }],
  ],
  
  sitemap: {
    hostname: 'https://ubuntu-homelab.dev',
  },

  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark',
    },
    lineNumbers: true,
    toc: { level: [2, 3] },
    config: (md) => {
      // Add copy button to code blocks
      md.use((md) => {
        const fence = md.renderer.rules.fence
        md.renderer.rules.fence = (...args) => {
          const [tokens, idx] = args
          const token = tokens[idx]
          const rawCode = token.content
          const lang = token.info.trim().split(/\s+/)[0]
          const encoded = encodeURIComponent(rawCode)
          const copyButton = `<button class="copy-code-btn" data-code="${encoded}" aria-label="Copy code" title="Copy to clipboard">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          </button>`
          const html = fence?.(...args) || ''
          return html.replace('<pre class="language-', `<pre class="language-${lang} has-copy-btn language-`)
        }
      })
    },
  },

  vite: {
    css: {
      postcss: {},
    },
  },

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'Ubuntu Home Lab',

    nav: [
      { text: 'Getting Started', link: '/chapters/01-understanding-linux-as-a-server-os', activeMatch: '^/chapters/0[1-9]' },
      {
        text: 'Core Setup',
        items: [
          { text: 'Installation & Partitioning', link: '/chapters/02-installation-disk-partitioning' },
          { text: 'First Boot & Setup', link: '/chapters/03-first-boot-essential-setup' },
          { text: 'Filesystem & Permissions', link: '/chapters/04-understanding-the-linux-filesystem' },
          { text: 'SSH Remote Access', link: '/chapters/05-ssh-remote-access-from-macbook' },
          { text: 'Networking & Static IP', link: '/chapters/06-networking-static-ip' },
          { text: 'Disk Management (HDD)', link: '/chapters/07-disk-management-hdd-setup' },
        ],
      },
      {
        text: 'Security',
        items: [
          { text: 'Users & Permissions', link: '/chapters/08-users-permissions-security-basics' },
          { text: 'Firewall & Network Security', link: '/chapters/09-firewall-network-security' },
          { text: 'Advanced Hardening', link: '/chapters/19-advanced-security-hardening' },
        ],
      },
      {
        text: 'Services & Apps',
        items: [
          { text: 'Docker & Containers', link: '/chapters/10-docker-containers-explained' },
          { text: 'Nginx Reverse Proxy & SSL', link: '/chapters/11-nginx-reverse-proxy-ssl' },
          { text: 'Node.js & NestJS Deployment', link: '/chapters/13-nodejs-nestjs-deployment' },
          { text: 'PostgreSQL Management', link: '/chapters/14-postgresql-database-management' },
          { text: 'NVIDIA GPU for AI', link: '/chapters/12-nvidia-gpu-setup-for-ai-workloads' },
        ],
      },
      {
        text: 'Operations',
        items: [
          { text: 'Process Management (PM2)', link: '/chapters/16-process-management-with-pm2' },
          { text: 'Monitoring & Observability', link: '/chapters/17-monitoring-observability' },
          { text: 'Backup & Disaster Recovery', link: '/chapters/18-backup-strategy-disaster-recovery' },
          { text: 'Automation & Cron', link: '/chapters/20-automation-cron-jobs' },
          { text: 'Log Management', link: '/chapters/24-log-management' },
          { text: 'Performance Tuning', link: '/chapters/25-performance-tuning' },
        ],
      },
      {
        text: 'Developer Tools',
        items: [
          { text: 'Tmux Terminal Multiplexer', link: '/chapters/21-tmux-terminal-multiplexer' },
          { text: 'Git Workflow on Server', link: '/chapters/22-git-workflow-on-the-server' },
          { text: 'Environment & Secrets', link: '/chapters/23-environment-variables-secrets-management' },
        ],
      },
      { text: 'Troubleshooting', link: '/chapters/26-troubleshooting-guide' },
      { text: 'Cheatsheet', link: '/chapters/27-cheatsheet-quick-reference' },
    ],

    sidebar: {
      '/chapters/': [
        {
          text: '🚀 Getting Started',
          collapsible: true,
          collapsed: false,
          items: [
            { text: '1. Understanding Linux as a Server OS', link: '/chapters/01-understanding-linux-as-a-server-os' },
            { text: '2. Installation & Disk Partitioning', link: '/chapters/02-installation-disk-partitioning' },
            { text: '3. First Boot & Essential Setup', link: '/chapters/03-first-boot-essential-setup' },
          ],
        },
        {
          text: '📁 System Fundamentals',
          collapsible: true,
          collapsed: false,
          items: [
            { text: '4. Understanding the Linux Filesystem', link: '/chapters/04-understanding-the-linux-filesystem' },
            { text: '5. SSH — Remote Access from MacBook', link: '/chapters/05-ssh-remote-access-from-macbook' },
            { text: '6. Networking & Static IP', link: '/chapters/06-networking-static-ip' },
            { text: '7. Disk Management — HDD Setup', link: '/chapters/07-disk-management-hdd-setup' },
            { text: '8. Users, Permissions & Security Basics', link: '/chapters/08-users-permissions-security-basics' },
          ],
        },
        {
          text: '🔒 Security',
          collapsible: true,
          collapsed: true,
          items: [
            { text: '9. Firewall & Network Security', link: '/chapters/09-firewall-network-security' },
            { text: '19. Advanced Security Hardening', link: '/chapters/19-advanced-security-hardening' },
          ],
        },
        {
          text: '🐳 Containerization & Services',
          collapsible: true,
          collapsed: false,
          items: [
            { text: '10. Docker — Containers Explained', link: '/chapters/10-docker-containers-explained' },
            { text: '11. Nginx — Reverse Proxy & SSL', link: '/chapters/11-nginx-reverse-proxy-ssl' },
            { text: '13. Node.js & NestJS Deployment', link: '/chapters/13-nodejs-nestjs-deployment' },
            { text: '14. PostgreSQL & Database Management', link: '/chapters/14-postgresql-database-management' },
            { text: '12. NVIDIA GPU Setup for AI Workloads', link: '/chapters/12-nvidia-gpu-setup-for-ai-workloads' },
          ],
        },
        {
          text: '⚙️ Operations & Maintenance',
          collapsible: true,
          collapsed: true,
          items: [
            { text: '16. Process Management with PM2', link: '/chapters/16-process-management-with-pm2' },
            { text: '17. Monitoring & Observability', link: '/chapters/17-monitoring-observability' },
            { text: '18. Backup Strategy & Disaster Recovery', link: '/chapters/18-backup-strategy-disaster-recovery' },
            { text: '20. Automation & Cron Jobs', link: '/chapters/20-automation-cron-jobs' },
            { text: '24. Log Management', link: '/chapters/24-log-management' },
            { text: '25. Performance Tuning', link: '/chapters/25-performance-tuning' },
          ],
        },
        {
          text: '🛠️ Developer Tools',
          collapsible: true,
          collapsed: true,
          items: [
            { text: '21. Tmux — Terminal Multiplexer', link: '/chapters/21-tmux-terminal-multiplexer' },
            { text: '22. Git Workflow on the Server', link: '/chapters/22-git-workflow-on-the-server' },
            { text: '23. Environment Variables & Secrets Management', link: '/chapters/23-environment-variables-secrets-management' },
          ],
        },
        {
          text: '📋 Reference',
          collapsible: true,
          collapsed: false,
          items: [
            { text: '26. Troubleshooting Guide', link: '/chapters/26-troubleshooting-guide' },
            { text: '27. Cheatsheet & Quick Reference', link: '/chapters/27-cheatsheet-quick-reference' },
          ],
        },
      ],
    },

    sidebarMenuLabel: 'Chapters',
    returnToTopLabel: 'Back to top',
    darkModeSwitchLabel: 'Toggle dark mode',
    lightModeSwitchTitle: 'Switch to light mode',
    darkModeSwitchTitle: 'Switch to dark mode',
    outlineTitle: 'On this page',
    outline: [2, 3],

    docFooter: {
      prev: 'Previous chapter',
      next: 'Next chapter',
    },

    editLink: {
      pattern: 'https://github.com/Ubuntu-HL/Ubuntu-Home-Lab-Server/edit/main/docs/chapters/:path',
      text: 'Edit this page on GitHub',
    },

    lastUpdated: {
      text: 'Last updated',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'short',
      },
    },

    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: {
                buttonText: 'Search (Ctrl+K)',
                buttonAriaLabel: 'Search documentation',
              },
              modal: {
                noResultsText: 'No results found',
                resetButtonTitle: 'Clear search',
                footer: {
                  selectText: 'Select',
                  navigateText: 'Navigate',
                  closeText: 'Close',
                },
              },
            },
          },
        },
        miniSearch: {
          searchOptions: {
            fuzzy: 0.2,
            prefix: true,
            boost: { title: 4, text: 2, titles: 1 },
          },
        },
      },
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Ubuntu-HL/Ubuntu-Home-Lab-Server' },
      { icon: 'twitter', link: 'https://twitter.com/ubuntuserver' },
    ],

    footer: {
      message: 'Released under the <a href="https://github.com/Ubuntu-HL/Ubuntu-Home-Lab-Server/blob/main/LICENSE">MIT License</a>.',
      copyright: 'Copyright © 2026-present <a href="https://github.com/AmraneAchraf1">Achraf Amrane</a>',
    },

    carbonAds: {
      code: '',
      placement: '',
      format: 'classic',
    },
  },

  transformPageData(pageData) {
    const title = pageData.frontmatter.layout === 'home'
      ? 'Ubuntu Home Lab Server'
      : `${pageData.title} | Ubuntu Home Lab Server`

    pageData.frontmatter.head ??= []
    pageData.frontmatter.head.push([
      'meta',
      { name: 'og:title', content: title },
    ])
    pageData.frontmatter.head.push([
      'meta',
      { property: 'og:description', content: pageData.description || 'Ubuntu Home Lab Server Guide' },
    ])
  },
})