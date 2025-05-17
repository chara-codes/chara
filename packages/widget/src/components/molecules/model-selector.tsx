"use client"

import { Check, ChevronDown, Search, X, Bot, Sparkles, Brain, Cpu, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useStore } from "@/lib/store"
import { useRef, useEffect } from "react"
import { modelGroups } from "@/mocks/data"

export function ModelSelector() {
  const selectedModel = useStore((state) => state.selectedModel)
  const setSelectedModel = useStore((state) => state.setSelectedModel)
  const modelSearchQuery = useStore((state) => state.modelSearchQuery)
  const setModelSearchQuery = useStore((state) => state.setModelSearchQuery)

  const modelSearchInputRef = useRef<HTMLInputElement>(null)

  // Get filtered model groups for display
  const getFilteredModelGroups = () => {
    if (!modelSearchQuery) return modelGroups

    return modelGroups
      .map((group) => ({
        ...group,
        models: group.models.filter(
          (model) =>
            model.name.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
            model.provider.toLowerCase().includes(modelSearchQuery.toLowerCase()),
        ),
      }))
      .filter((group) => group.models.length > 0)
  }

  useEffect(() => {
    if (modelSearchInputRef.current) {
      setTimeout(() => {
        modelSearchInputRef.current?.focus()
      }, 100)
    }
  }, [modelSearchQuery])

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case "anthropic":
        return <Bot className="h-4 w-4 text-purple-500" />
      case "openai":
        return <Sparkles className="h-4 w-4 text-green-500" />
      case "meta":
        return <Brain className="h-4 w-4 text-blue-500" />
      case "mistral":
        return <Cpu className="h-4 w-4 text-amber-500" />
      case "ollama":
        return <Layers className="h-4 w-4 text-gray-500" />
      default:
        return <Bot className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 p-0 text-xs font-normal flex items-center gap-1 hover:bg-gray-100"
        >
          {getProviderIcon(selectedModel.provider)}
          {selectedModel.name}
          <ChevronDown className="h-3 w-3 ml-1 text-gray-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="p-2 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2 px-2 py-1 bg-gray-50 rounded-md">
            <Search className="h-3 w-3 text-gray-500" />
            <input
              ref={modelSearchInputRef}
              type="text"
              placeholder="Search models..."
              className="bg-transparent border-none text-xs w-full focus-visible:ring-0 focus-visible:ring-offset-0"
              value={modelSearchQuery}
              onChange={(e) => setModelSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
            {modelSearchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  setModelSearchQuery("")
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {getFilteredModelGroups().length > 0 ? (
            getFilteredModelGroups().map((group) => (
              <div key={group.provider}>
                <DropdownMenuLabel className="px-2 py-1.5 text-xs font-medium text-gray-500">
                  {group.provider}
                </DropdownMenuLabel>
                {group.models.map((model) => (
                  <DropdownMenuItem
                    key={model.name}
                    onClick={() => {
                      setSelectedModel(model)
                      setModelSearchQuery("")
                    }}
                    className="flex items-center gap-2 py-1.5"
                  >
                    {getProviderIcon(model.provider)}
                    <span className="text-xs">{model.name}</span>
                    {selectedModel.name === model.name && <Check className="h-3 w-3 ml-auto" />}
                  </DropdownMenuItem>
                ))}
                {group !== getFilteredModelGroups()[getFilteredModelGroups().length - 1] && <DropdownMenuSeparator />}
              </div>
            ))
          ) : (
            <div className="p-3 text-center text-gray-500 text-xs">No models found for "{modelSearchQuery}"</div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
