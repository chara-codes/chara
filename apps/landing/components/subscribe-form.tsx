"use client"

import type React from "react"

import { useState } from "react"
import { subscribeToUpdates } from "@/actions/subscribe"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, SparklesIcon } from "lucide-react"

export function SubscribeForm() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) return

    setStatus("loading")

    try {
      const result = await subscribeToUpdates(email)

      if (result.success) {
        setStatus("success")
        setMessage("✨ Magic is coming your way! Thank you for subscribing.")
        setEmail("")
      } else {
        setStatus("error")
        setMessage(result.message || "The magic fizzled. Please try again.")
      }
    } catch (error) {
      setStatus("error")
      setMessage("The magic fizzled. Please try again.")
    }
  }

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="relative z-10">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-amber-500/20 rounded-xl blur opacity-50 -z-10"></div>
            <Input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white/10 border-white/20 text-white placeholder:text-purple-200/70 h-14 px-5 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent dark:bg-navy-800/50 dark:border-purple-800/30 relative z-10"
              disabled={status === "loading" || status === "success"}
            />
          </div>
          <Button
            type="submit"
            className={`h-14 px-8 rounded-xl font-bold text-lg relative overflow-hidden ${
              status === "success"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
            }`}
            disabled={status === "loading" || status === "success"}
          >
            {status === "loading" ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Casting...
              </>
            ) : status === "success" ? (
              <>
                <SparklesIcon className="mr-2 h-5 w-5" />
                Subscribed!
              </>
            ) : (
              "Join Waitlist"
            )}
            <span className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-amber-300/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity"></span>
          </Button>
        </div>
      </form>

      {status === "success" && (
        <div className="mt-4 p-4 bg-green-500/20 backdrop-blur-sm text-green-100 rounded-xl text-center border border-green-500/30 animate-fade-in">
          {message}
        </div>
      )}

      {status === "error" && (
        <div className="mt-4 p-4 bg-red-500/20 backdrop-blur-sm text-red-100 rounded-xl text-center border border-red-500/30 animate-fade-in">
          {message}
        </div>
      )}
    </div>
  )
}
