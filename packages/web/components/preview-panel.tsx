import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { URLBar } from "./url-bar"
import { CodePreview } from "./code-preview"

interface PreviewPanelProps {
  previewUrl: string
  onReload: () => void
  onToggleFullScreen: () => void
  isFullScreen: boolean
}

export function PreviewPanel({ previewUrl, onReload, onToggleFullScreen, isFullScreen }: PreviewPanelProps) {
  return (
    <div className="flex-1 p-6 overflow-auto">
      <URLBar
        url={previewUrl}
        onReload={onReload}
        onToggleFullScreen={onToggleFullScreen}
        isFullScreen={isFullScreen}
      />
      <Card className="w-full h-full">
        <CardHeader>
          <CardTitle>Content Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="code" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="code">Code</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            <TabsContent value="code" className="mt-0 h-[calc(100vh-12rem)]">
              <CodePreview />
            </TabsContent>
            <TabsContent value="preview" className="mt-0">
              <div className="space-y-4">
                <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Preview content will appear here</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="h-32 bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Section 1</p>
                  </div>
                  <div className="h-32 bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Section 2</p>
                  </div>
                </div>
                <div className="h-48 bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Additional content</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

