"use client"

import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"

export function FileAttachmentButton() {
  const addContext = useStore((state) => state.addContext)

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 text-gray-500"
      title="Attach file"
      onClick={() => {
        // Create a hidden file input element
        const input = document.createElement("input")
        input.type = "file"
        input.multiple = true

        // Handle file selection
        input.onchange = (e) => {
          const files = (e.target as HTMLInputElement).files
          if (files) {
            // Add each selected file as a context
            Array.from(files).forEach((file) => {
              addContext({ type: "Files", name: file.name })
            })
          }
        }

        // Trigger the file dialog
        input.click()
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-3 w-3"
      >
        <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
      </svg>
    </Button>
  )
}
