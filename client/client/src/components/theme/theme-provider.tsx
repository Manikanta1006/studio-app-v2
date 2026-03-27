import { useEffect, type ReactNode } from 'react'

type ResolvedTheme = 'light' | 'dark'
const MEDIA_QUERY = '(prefers-color-scheme: dark)'

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia(MEDIA_QUERY).matches ? 'dark' : 'light'
}

function applyResolvedTheme(theme: ResolvedTheme) {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.style.colorScheme = theme
  root.dataset.theme = theme
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const mediaQuery = window.matchMedia(MEDIA_QUERY)

    const syncTheme = () => applyResolvedTheme(getSystemTheme())
    const handleChange = () => syncTheme()

    syncTheme()

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }

    mediaQuery.addListener(handleChange)
    return () => mediaQuery.removeListener(handleChange)
  }, [])

  return <>{children}</>
}
