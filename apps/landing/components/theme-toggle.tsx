"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { MoonIcon, SunIcon, SparklesIcon } from "lucide-react"

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const [isAnimating, setIsAnimating] = useState(false)

  // Ensure component is mounted before accessing theme
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  const toggleTheme = () => {
    setIsAnimating(true)

    // Add a class to the document for a brief moment during transition
    document.documentElement.classList.add("theme-transitioning")

    setTimeout(() => {
      setTheme(theme === "dark" ? "light" : "dark")
    }, 50)

    // Remove the class after transition completes
    setTimeout(() => {
      document.documentElement.classList.remove("theme-transitioning")
      setIsAnimating(false)
    }, 500)
  }

  return (
    <button
      onClick={toggleTheme}
      className="relative w-10 h-10 rounded-full flex items-center justify-center overflow-hidden group"
      aria-label="Toggle theme"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-amber-100 dark:from-navy-800 dark:to-purple-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>

      {/* Magic particles on click */}
      {isAnimating && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 bg-amber-300 rounded-full"
              style={{
                left: `${50 + (Math.random() * 30 - 15)}%`,
                top: `${50 + (Math.random() * 30 - 15)}%`,
                animation: `magic-particle-out ${Math.random() * 0.5 + 0.5}s ease-out forwards`,
              }}
            />
          ))}
        </div>
      )}

      {/* Icons with transition */}
      <div className="relative z-10 transition-all duration-500">
        {theme === "dark" ? (
          <div className="flex items-center justify-center">
            <MoonIcon className="w-5 h-5 text-amber-300" />
            <SparklesIcon className="w-3 h-3 text-amber-300 absolute -top-1 -right-1 animate-twinkle" />
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <SunIcon className="w-5 h-5 text-amber-500" />
            <SparklesIcon className="w-3 h-3 text-amber-400 absolute -top-1 -right-1 animate-twinkle" />
          </div>
        )}
      </div>
    </button>
  )
}
