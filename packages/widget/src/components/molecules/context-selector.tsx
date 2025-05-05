"use client"

import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import { Plus, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import { useStore } from "@/lib/store"
import { useRef, useEffect } from "react"
import { contextCategories } from "@/mocks/data"

export function ContextSelector() {
  const activeCategory = useStore((state) => state.activeCategory)
  const searchQueries = useStore((state) => state.searchQueries)
  const setActiveCategory = useStore((state) => state.setActiveCategory)
  const setSearchQuery = useStore((state) => state.setSearchQuery)
  const addContext = useStore((state) => state.addContext)

  const searchInputRef = useRef<HTMLInputElement>(null)

  // Focus search input when category changes
  useEffect(() => {
    if (activeCategory && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }
  }, [activeCategory])

  const handleCategoryOpen = (category: string) => {
    setActiveCategory(category)
  }

  const handleCategoryClose = () => {
    setActiveCategory(null)
  }

  const handleSearchChange = (category: string, query: string) => {
    setSearchQuery(category, query)
  }

  const handleAddContextItem = (category: string, option: string) => {
    addContext({ type: category, name: option })
    // Reset search query for this category
    setSearchQuery(category, "")
  }

  const getFilteredOptions = (category: string) => {
    const query = searchQueries[category] || ""
    const categoryData = contextCategories.find((c) => c.name === category)

    if (!categoryData) return []
    if (!query) return categoryData.options

    return categoryData.options.filter(
      (option) =>
        option.name.toLowerCase().includes(query.toLowerCase()) ||
        (option.description && option.description.toLowerCase().includes(query.toLowerCase())),
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500">
          <Plus className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 z-[9999]" sideOffset={5} side="top">
        {contextCategories.map((category) => (
          <DropdownMenuSub
            key={category.name}
            onOpenChange={(open) => {
              if (open) handleCategoryOpen(category.name)
              else handleCategoryClose()
            }}
          >
            <DropdownMenuSubTrigger className="flex items-center gap-2">
              <category.icon className="h-4 w-4" />
              <span>{category.name}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent className="w-64 max-h-[300px] overflow-hidden flex flex-col z-[100]">
                <div className="p-2 border-b sticky top-0 bg-white z-10">
                  <div className="flex items-center gap-2 px-2 py-1 bg-gray-50 rounded-md">
                    <Search className="h-3 w-3 text-gray-500" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder={`Search ${category.name.toLowerCase()}...`}
                      className="bg-transparent border-none text-sm w-full focus-visible:ring-0 focus-visible:ring-offset-0"
                      value={searchQueries[category.name] || ""}
                      onChange={(e) => handleSearchChange(category.name, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    {searchQueries[category.name] && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSearchChange(category.name, "")
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="overflow-y-auto flex-1">
                  {getFilteredOptions(category.name).length > 0 ? (
                    getFilteredOptions(category.name).map((option) => (
                      <DropdownMenuItem
                        key={option.name}
                        className="flex flex-col items-start py-2"
                        onClick={() => handleAddContextItem(category.name, option.name)}
                      >
                        <span className="font-medium">{option.name}</span>
                        {option.description && <span className="text-xs text-gray-500">{option.description}</span>}
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <div className="p-3 text-center text-gray-500 text-sm">
                      No results found for "{searchQueries[category.name]}"
                    </div>
                  )}
                </div>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
