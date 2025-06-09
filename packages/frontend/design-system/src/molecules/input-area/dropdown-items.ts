import type { DropdownItem } from "../../../../../frontend/core/src/types/input-area.ts"

// Function to create dropdown items
export const createDropdownItems = (
  startElementSelection: () => void,
  triggerFileUpload: () => void,
): DropdownItem[] => {
  return [
    // File items
    { id: "file-1", label: "package.json", type: "File", section: "Files" },
    { id: "file-2", label: "README.md", type: "File", section: "Files" },
    { id: "file-3", label: "index.js", type: "File", section: "Files" },
    { id: "file-4", label: "tsconfig.json", type: "File", section: "Files" },
    { id: "file-5", label: ".env.example", type: "File", section: "Files" },

    // Documentation items
    { id: "doc-1", label: "API Reference", type: "Documentation", section: "Documentation" },
    { id: "doc-2", label: "Getting Started", type: "Documentation", section: "Documentation" },
    { id: "doc-3", label: "Tutorials", type: "Documentation", section: "Documentation" },
    { id: "doc-4", label: "Best Practices", type: "Documentation", section: "Documentation" },
    { id: "doc-5", label: "Troubleshooting", type: "Documentation", section: "Documentation" },

    // Terminal items
    { id: "terminal-1", label: "Terminal Output", type: "Terminal", section: "Terminal" },
    { id: "terminal-2", label: "Error Logs", type: "Terminal", section: "Terminal" },
    { id: "terminal-3", label: "Debug Console", type: "Terminal", section: "Terminal" },
    { id: "terminal-4", label: "Build Output", type: "Terminal", section: "Terminal" },

    // Actions section
    {
      id: "select-element",
      label: "Select Element",
      type: "Actions",
      section: "Actions",
      action: startElementSelection,
    },
    { id: "upload", label: "Upload File...", type: "Actions", section: "Actions", action: triggerFileUpload },
  ]
}
