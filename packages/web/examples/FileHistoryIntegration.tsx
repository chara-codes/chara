import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { FileHistoryButton } from '@/components/file-history';
import { useFileHistory } from '@/hooks/useFileHistory';
import GitUtils from '@/lib/git/gitUtils';
import { History, GitCommit, GitBranch, Eye, Code, FileCode } from 'lucide-react';

/**
 * FileHistoryIntegration - Example component showing how to integrate file history
 * with a code editor or file viewer in Chara
 * 
 * This demonstrates:
 * 1. How to initialize file history
 * 2. How to track file changes with git
 * 3. How to display file history alongside code
 */
export const FileHistoryIntegration = ({
  repoUrl = "https://github.com/vercel/next.js",
  filePath = "packages/next/src/client/components/app-router.tsx",
  initialBranch = "canary"
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('code');
  const [fileContent, setFileContent] = useState('');
  
  // Initialize file history hook
  const {
    isLoading,
    error,
    fileHistory,
    currentBranch,
    getFileHistory,
    initRepo,
    isInitialized
  } = useFileHistory(repoUrl, {
    autoInit: false, // We'll initialize manually for better control
    defaultBranch: initialBranch,
    corsProxy: GitUtils.getCorsProxyForRepo(repoUrl)
  });

  // Load file history when component mounts
  useEffect(() => {
    const loadHistory = async () => {
      try {
        // Initialize repository if needed
        if (!isInitialized) {
          await initRepo(initialBranch);
          toast({
            title: "Repository initialized",
            description: `Connected to ${repoUrl}`,
          });
        }
        
        // Load file history
        if (filePath) {
          const history = await getFileHistory(filePath);
          
          // Set current file content from the latest version
          if (history && history.length > 0) {
            setFileContent(history[0].content);
          }
        }
      } catch (err) {
        toast({
          title: "Error loading file history",
          description: err.message,
          variant: "destructive",
        });
      }
    };
    
    loadHistory();
  }, [filePath, repoUrl, initRepo, getFileHistory, isInitialized, toast, initialBranch]);

  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <FileCode size={20} />
              <span className="truncate max-w-[300px]">
                {filePath.split('/').pop()}
              </span>
            </CardTitle>
            <CardDescription className="truncate max-w-[450px]">
              {filePath}
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            {currentBranch && (
              <Button variant="outline" size="sm" className="h-8">
                <GitBranch className="mr-2 h-4 w-4" />
                {currentBranch}
              </Button>
            )}
            
            {/* File History Button - Opens history in a dialog */}
            <FileHistoryButton
              repoUrl={repoUrl}
              filePath={filePath}
              initialBranch={initialBranch}
              buttonText="History"
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b px-4">
            <TabsList className="h-10">
              <TabsTrigger value="code" className="flex items-center">
                <Code className="mr-2 h-4 w-4" />
                Code
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center">
                <History className="mr-2 h-4 w-4" />
                Recent Changes
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center">
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="code" className="p-0 m-0">
            <div className="p-4 h-[500px] overflow-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <p>Loading file content...</p>
                </div>
              ) : error ? (
                <div className="text-red-500 p-4">
                  <p>Error: {error.message}</p>
                  <Button 
                    onClick={() => initRepo(initialBranch)}
                    className="mt-2"
                    variant="outline"
                  >
                    Retry
                  </Button>
                </div>
              ) : (
                <pre className="p-4 bg-muted rounded-md overflow-auto text-sm h-full">
                  {fileContent}
                </pre>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="history" className="p-0 m-0">
            <div className="p-4 h-[500px] overflow-auto">
              <h3 className="text-lg font-medium mb-4">Recent Changes</h3>
              
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <p>Loading history...</p>
                </div>
              ) : fileHistory && fileHistory.length > 0 ? (
                <div className="space-y-3">
                  {fileHistory.slice(0, 5).map((item, index) => {
                    const { commit } = item;
                    const commitDate = new Date(commit.commit.author.timestamp * 1000);
                    
                    return (
                      <div 
                        key={commit.oid}
                        className="p-3 border rounded-md hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center">
                            <GitCommit size={16} className="mr-2" />
                            <span className="text-sm font-medium">
                              {commit.oid.substring(0, 7)}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {commitDate.toLocaleDateString()} {commitDate.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm font-medium">
                          {commit.commit.message}
                        </p>
                        <div className="text-xs text-muted-foreground mt-1">
                          {commit.commit.author.name} ({commit.commit.author.email})
                        </div>
                      </div>
                    );
                  })}
                  
                  {fileHistory.length > 5 && (
                    <Button 
                      variant="outline" 
                      className="w-full mt-2"
                      onClick={() => {
                        const dialogButton = document.querySelector('[data-file-history-button]') as HTMLButtonElement;
                        if (dialogButton) dialogButton.click();
                      }}
                    >
                      View All {fileHistory.length} Commits
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  <p>No history available for this file.</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="preview" className="p-0 m-0">
            <div className="p-4 h-[500px] overflow-auto bg-gray-50 dark:bg-gray-900">
              <div className="prose dark:prose-invert max-w-none">
                <p>Preview would render here based on file content.</p>
                <p>In a real implementation, this would show the rendered output of the code.</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default FileHistoryIntegration;