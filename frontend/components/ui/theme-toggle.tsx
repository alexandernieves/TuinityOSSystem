"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = theme === "dark"

  const toggleTheme = React.useCallback(() => {
    const newTheme = isDark ? "light" : "dark"
    setTheme(newTheme)
  }, [isDark, setTheme])

  if (!mounted) {
    return (
      <button
        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-[#2a2a2a] hover:text-white"
        aria-label="Cambiar tema"
      >
        <Sun className="h-4 w-4" />
      </button>
    )
  }

  return (
    <button
      onClick={toggleTheme}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-[#2a2a2a] hover:text-white"
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      {isDark ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  )
}
