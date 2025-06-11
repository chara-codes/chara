import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { URLBar } from "./url-bar";
import { CodePreview } from "./code-preview";
import { useProject } from "@/contexts/project-context";
import { trpc } from "@/utils";
import { useEffect, useState } from "react";
import { myLogger } from "@chara/server/src/utils/logger";

interface PreviewPanelProps {
  previewUrl: string;
  onReload: () => void;
  onToggleFullScreen: () => void;
  isFullScreen: boolean;
}

export function PreviewPanel({
  onReload,
  onToggleFullScreen,
  isFullScreen,
}: PreviewPanelProps) {
  const [previewUrl, setPreviewUrl] = useState("null");
  const { selectedProject } = useProject();
  const {
    data,
    error,
    mutate: startPreviewMutation,
  } = trpc.preview.start.useMutation();

  useEffect(() => {
    if (selectedProject) {
      startPreviewMutation({ projectName: selectedProject.name });
    }
  }, []);

  useEffect(() => {
    if (selectedProject) {
      startPreviewMutation({ projectName: selectedProject.name });
    }
  }, [selectedProject]);

  useEffect(() => {
    myLogger.info("Setting preview url:", data?.url || "");
    if (data?.url) {
      setPreviewUrl(data?.url);
    }
    if (error) {
      myLogger.error(error.message);
    }
  }, [data, error]);

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
            <TabsContent value="preview" className="mt-0 h-[calc(100vh-12rem)]">
              <div className="border rounded-lg h-full w-full overflow-hidden">
                {previewUrl ? (
                  <iframe
                    src={previewUrl}
                    className="w-full h-full"
                    sandbox="allow-scripts allow-same-origin allow-forms"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Waiting for preview URL...
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
