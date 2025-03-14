"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Terminal, Play, Copy, CheckCircle2, Loader2, PlayCircle } from "lucide-react"
import type { Command } from "../types"

interface CommandsListProps {
  commands: Command[]
}

export function CommandsList({ commands }: CommandsListProps) {
  const [copiedCommandId, setCopiedCommandId] = useState<string | null>(null)
  const [runningCommandId, setRunningCommandId] = useState<string | null>(null)
  const [commandResults, setCommandResults] = useState<Record<string, { success: boolean; output: string }>>({})
  const [isRunningAll, setIsRunningAll] = useState(false)
  const [currentCommandIndex, setCurrentCommandIndex] = useState<number | null>(null)

  const copyCommand = (command: string, id: string) => {
    navigator.clipboard.writeText(command)
    setCopiedCommandId(id)
    setTimeout(() => setCopiedCommandId(null), 2000)
  }

  const runCommand = async (command: string, id: string) => {
    setRunningCommandId(id)

    // Simulate command execution with a delay
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Simulate command output (in a real app, this would be the actual command execution)
      const success = Math.random() > 0.2 // 80% chance of success for demo
      const output = success
        ? `Command executed successfully: ${command}`
        : `Error executing command: ${command}\nPermission denied or command not found`

      setCommandResults((prev) => ({
        ...prev,
        [id]: { success, output },
      }))

      return success // Return success status for runAllCommands to check
    } catch (error) {
      setCommandResults((prev) => ({
        ...prev,
        [id]: { success: false, output: `Error: ${error}` },
      }))
      return false
    } finally {
      setRunningCommandId(null)
    }
  }

  const runAllCommands = async () => {
    setIsRunningAll(true)
    setCurrentCommandIndex(0)

    let allSuccess = true

    for (let i = 0; i < commands.length; i++) {
      setCurrentCommandIndex(i)
      const command = commands[i]
      const success = await runCommand(command.command, command.id)

      if (!success) {
        allSuccess = false
        break // Stop execution if a command fails
      }
    }

    setIsRunningAll(false)
    setCurrentCommandIndex(null)

    return allSuccess
  }

  return (
    <div className="mt-3 border rounded-md overflow-hidden">
      <div className="bg-gray-100 px-4 py-2 border-b font-medium flex items-center justify-between">
        <div className="flex items-center">
          <Terminal className="h-4 w-4 mr-2" />
          Commands to Execute
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={runAllCommands}
                disabled={isRunningAll}
              >
                {isRunningAll ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Running {currentCommandIndex !== null ? `(${currentCommandIndex + 1}/${commands.length})` : ""}
                  </>
                ) : (
                  <>
                    <PlayCircle className="h-3 w-3 mr-1" />
                    Run All
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Run all commands sequentially</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="bg-gray-900 text-gray-200 p-1">
        {commands.map((cmd, index) => (
          <div key={cmd.id} className="relative group">
            <div
              className={`flex items-start p-2 rounded ${currentCommandIndex === index && isRunningAll ? "bg-blue-900/30" : "hover:bg-gray-800"}`}
            >
              <div className="flex-1 font-mono text-sm overflow-x-auto whitespace-pre">$ {cmd.command}</div>
              <div className="flex items-center space-x-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => runCommand(cmd.command, cmd.id)}
                        disabled={runningCommandId === cmd.id || isRunningAll}
                      >
                        {runningCommandId === cmd.id || (isRunningAll && currentCommandIndex === index) ? (
                          <Loader2 className="h-3 w-3 text-blue-400 animate-spin" />
                        ) : (
                          <Play className="h-3 w-3 text-green-400" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>Run command</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip open={copiedCommandId === cmd.id}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => copyCommand(cmd.command, cmd.id)}
                      >
                        {copiedCommandId === cmd.id ? (
                          <CheckCircle2 className="h-3 w-3 text-green-400" />
                        ) : (
                          <Copy className="h-3 w-3 text-gray-400" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p>{copiedCommandId === cmd.id ? "Copied!" : "Copy"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            {cmd.description && <div className="text-xs text-gray-400 pl-2 pb-2">{cmd.description}</div>}
            {commandResults[cmd.id] && (
              <div
                className={`mt-1 mb-2 mx-2 p-2 text-xs font-mono rounded ${
                  commandResults[cmd.id].success ? "bg-green-900/50 text-green-300" : "bg-red-900/50 text-red-300"
                }`}
              >
                {commandResults[cmd.id].output}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

