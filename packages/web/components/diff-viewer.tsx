import type { FileDiff } from "../types"

interface DiffViewerProps {
  diff: FileDiff
}

export function DiffViewer({ diff }: DiffViewerProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-2 gap-4 h-full">
        <div className="rounded-md bg-gray-900 text-gray-50 p-4 overflow-auto">
          <div className="text-xs text-gray-400 mb-2">Previous Version</div>
          <pre className="font-mono text-sm whitespace-pre-wrap">
            {diff.oldContent.split("\n").map((line, i) => (
              <div key={i} className="py-0.5">
                {line || " "}
              </div>
            ))}
          </pre>
        </div>
        <div className="rounded-md bg-gray-900 text-gray-50 p-4 overflow-auto">
          <div className="text-xs text-gray-400 mb-2">New Version</div>
          <pre className="font-mono text-sm whitespace-pre-wrap">
            {diff.newContent.split("\n").map((line, i) => {
              const isAddition = line.startsWith("+")
              const isDeletion = line.startsWith("-")
              const displayLine = isAddition || isDeletion ? line.substring(1) : line

              return (
                <div
                  key={i}
                  className={`py-0.5 ${isAddition ? "bg-green-900/30 text-green-300" : isDeletion ? "bg-red-900/30 text-red-300" : ""}`}
                >
                  {displayLine || " "}
                </div>
              )
            })}
          </pre>
        </div>
      </div>
    </div>
  )
}

