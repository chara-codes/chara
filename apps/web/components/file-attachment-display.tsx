import { Paperclip, File } from "lucide-react"
import type { FileAttachment } from "../types"

interface FileAttachmentDisplayProps {
  attachments: FileAttachment[]
}

export function FileAttachmentDisplay({ attachments }: FileAttachmentDisplayProps) {
  return (
    <div className="mt-3 border rounded-md overflow-hidden">
      <div className="bg-gray-100 px-4 py-2 border-b font-medium flex items-center">
        <Paperclip className="h-4 w-4 mr-2" />
        Attachments ({attachments.length})
      </div>
      <div className="divide-y">
        {attachments.map((attachment) => (
          <div key={attachment.id} className="px-4 py-3 flex items-center">
            <File className="h-5 w-5 text-blue-500 mr-3" />
            <div className="flex-1">
              <div className="font-medium text-sm">{attachment.name}</div>
              <div className="text-xs text-gray-500">
                {(attachment.size / 1024).toFixed(2)} KB • {attachment.type}
              </div>
            </div>
            <a
              href={attachment.url}
              download={attachment.name}
              className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
            >
              Download
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}

