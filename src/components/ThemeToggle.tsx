"use client"

import { useState, useEffect } from "react"
import { Sun, Moon } from "lucide-react"

export default function ThemeToggle({ collapsed }: { collapsed?: boolean }) {
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem("theme")
    if (saved === "light") {
      setIsDark(false)
      document.documentElement.classList.add("light")
    }
  }, [])

  const toggle = () => {
    const next = !isDark
    setIsDark(next)
    if (next) {
      document.documentElement.classList.remove("light")
      localStorage.setItem("theme", "dark")
    } else {
      document.documentElement.classList.add("light")
      localStorage.setItem("theme", "light")
    }
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all text-gray-400 hover:text-white hover:bg-white/5"
      title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      {isDark ? (
        <Sun className="w-4 h-4 flex-shrink-0" />
      ) : (
        <Moon className="w-4 h-4 flex-shrink-0" />
      )}
      {!collapsed && (
        <span className="text-xs">{isDark ? "Modo claro" : "Modo oscuro"}</span>
      )}
    </button>
  )
}
