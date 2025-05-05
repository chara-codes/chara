"use client"

import type React from "react"

import { useRef, useState } from "react"
import { motion } from "framer-motion"

interface GlowingCardProps {
  title: string
  description: string
  icon: React.ReactNode
  gradient: string
  delay?: number
}

export function GlowingCard({ title, description, icon, gradient, delay = 0 }: GlowingCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return

    const rect = cardRef.current.getBoundingClientRect()
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="relative rounded-xl overflow-hidden group"
      ref={cardRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
    >
      {/* Glow effect */}
      {isHovered && (
        <div
          className="absolute -inset-px bg-gradient-to-r from-purple-400 to-amber-300 opacity-70 blur-lg rounded-xl transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(139, 92, 246, 0.8), rgba(245, 158, 11, 0.6))`,
          }}
        />
      )}

      <div className="bg-white dark:bg-navy-800 rounded-xl p-6 border border-purple-100 dark:border-purple-900/50 shadow-lg relative z-10 h-full flex flex-col">
        <div className={`w-12 h-12 rounded-lg mb-4 flex items-center justify-center bg-gradient-to-br ${gradient}`}>
          {icon}
        </div>

        <h3 className="text-xl font-bold text-navy-900 dark:text-white mb-2">{title}</h3>
        <p className="text-navy-700 dark:text-purple-200 flex-grow">{description}</p>

        <div className="mt-4 flex justify-end">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-100 dark:bg-purple-900/50 group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-colors">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-purple-600 group-hover:translate-x-0.5 transition-transform"
            >
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
