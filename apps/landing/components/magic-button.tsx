"use client"

import { useState } from "react"
import { SparklesIcon } from "lucide-react"

export function MagicButton() {
  const [isHovered, setIsHovered] = useState(false)

  const handleScrollToSubscribe = () => {
    const subscribeSection = document.getElementById('subscribe')
    if (subscribeSection) {
      subscribeSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      })
    }
  }

  return (
    <button
      className="relative px-5 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-amber-500 text-white font-medium overflow-hidden group cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleScrollToSubscribe}
      aria-label="Scroll to subscribe form"
    >
      <span className="relative z-10 flex items-center gap-1.5">
        <SparklesIcon className="w-4 h-4" />
        <span>Magic Demo</span>
      </span>

      {/* Particles */}
      {isHovered && (
        <div className="absolute inset-0">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full opacity-70"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `particle-rise ${Math.random() * 1 + 0.5}s ease-out forwards`,
              }}
            />
          ))}
        </div>
      )}

      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-amber-300 opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-500"></div>
    </button>
  )
}
