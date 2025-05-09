"use client"
import { Pencil, ExternalLink, ChevronRight, ChevronDown } from "lucide-react"
import { useStore } from "@/lib/store"
import type { CodeBlock as CodeBlockType } from "@/types"

interface CodeBlockProps {
  codeBlock: CodeBlockType
}

export function CodeBlock({ codeBlock }: CodeBlockProps) {
  const foldedCodeBlocks = useStore((state) => state.foldedCodeBlocks)
  const toggleCodeBlockFold = useStore((state) => state.toggleCodeBlockFold)
  const isFolded = foldedCodeBlocks.has(codeBlock.id)

  return (
    <div className="mt-4 border border-gray-200 rounded-md overflow-hidden">
      <div
        className="flex items-center justify-between bg-gray-50 px-3 py-2 border-b cursor-pointer hover:bg-gray-100"
        onClick={() => toggleCodeBlockFold(codeBlock.id)}
      >
        <div className="flex items-center gap-2">
          <Pencil className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-700">{codeBlock.filename}</span>
          <ExternalLink className="h-3 w-3 text-gray-500" />
        </div>
        {isFolded ? (
          <ChevronRight className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </div>
      {!isFolded && (
        <div className="bg-white p-4 overflow-x-auto">
          <pre className="text-sm font-mono">
            <code>
              <span className="text-purple-600">import</span> <span className="text-green-600">"picocolors"</span>;
              <br />
              <br />
              <span className="text-gray-500">// Map LogLevel to severity</span>
              <br />
              <span className="text-gray-500">// Define LogLevel enum</span>
              <br />
              <br />
              <span className="text-green-600">/**</span>
              <br />
              <span className="text-green-600"> * Log levels supported by the logger</span>
              <br />
              <span className="text-green-600"> */</span>
              <br />
              <span className="text-purple-600">export enum</span> <span className="text-blue-600">LogLevel</span> {"{"}
              <br />
              <span className="text-gray-400"> TRACE</span> = <span className="text-green-600">"TRACE"</span>,
              <br />
              <span className="text-gray-400"> DEBUG</span> = <span className="text-green-600">"DEBUG"</span>,
            </code>
          </pre>
        </div>
      )}
      {!isFolded && (
        <div className="flex justify-center items-center py-2 border-t bg-gray-50">
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </div>
      )}
    </div>
  )
}
