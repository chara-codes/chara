import { ThumbsUp, ThumbsDown, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"

export function MessageFeedback() {
  return (
    <div className="flex justify-end px-4 py-2 gap-2">
      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500">
        <ThumbsUp className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500">
        <ThumbsDown className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500">
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  )
}
