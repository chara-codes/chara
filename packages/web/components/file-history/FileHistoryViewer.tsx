import React, { useState, useEffect, useMemo } from 'react';
import { useFileHistory } from '../../hooks/useFileHistory';
import { FileHistoryItem, GitDiff } from '../../lib/git/gitService';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ScrollArea } from '../ui/scroll-area';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { ChevronLeft, ChevronRight, GitCommit, History, GitCompare } from 'lucide-react';
import { Separator } from '../ui/separator';

interface FileHistoryViewerProps {
  repoUrl: string;
  filePath: string;
  initialBranch?: string;
  corsProxy?: string;
}

export const FileHistoryViewer: React.FC<FileHistoryViewerProps> = ({
  repoUrl,
  filePath,
  initialBranch = 'main',
  corsProxy,
}) => {
  const {
    isLoading,
    error,
    fileHistory,
    currentBranch,
    availableBranches,
    initRepo,
    getFileHistory,
    compareVersions,
    changeBranch,
    isInitialized,
  } = useFileHistory(repoUrl, {
    autoInit: true,
    defaultBranch: initialBranch,
    corsProxy,
  });

  const [selectedCommitIndex, setSelectedCommitIndex] = useState<number>(0);
  const [compareCommitIndex, setCompareCommitIndex] = useState<number | null>(null);
  const [diffResult, setDiffResult] = useState<GitDiff | null>(null);
  const [activeTab, setActiveTab] = useState<string>('content');
  const [isLoadingDiff, setIsLoadingDiff] = useState<boolean>(false);

  // Load file history when component mounts or branch changes
  useEffect(() => {
    if (isInitialized && filePath) {
      getFileHistory(filePath);
    }
  }, [isInitialized, filePath, getFileHistory, currentBranch]);

  // Reset selected commit when history changes
  useEffect(() => {
    if (fileHistory && fileHistory.length > 0) {
      setSelectedCommitIndex(0);
      setCompareCommitIndex(null);
      setDiffResult(null);
      setActiveTab('content');
    }
  }, [fileHistory]);

  // Handle branch change
  const handleBranchChange = async (branch: string) => {
    await changeBranch(branch);
    if (filePath) {
      await getFileHistory(filePath);
    }
  };

  // Compare selected commit with another commit
  const handleCompare = async () => {
    if (!fileHistory || compareCommitIndex === null || selectedCommitIndex === compareCommitIndex) {
      return;
    }

    setIsLoadingDiff(true);
    try {
      const oldCommit = fileHistory[compareCommitIndex];
      const newCommit = fileHistory[selectedCommitIndex];
      
      const diff = await compareVersions(
        filePath,
        oldCommit.commit.oid,
        newCommit.commit.oid
      );
      
      setDiffResult(diff);
      setActiveTab('diff');
    } catch (error) {
      console.error('Failed to compare versions:', error);
    } finally {
      setIsLoadingDiff(false);
    }
  };

  // Get selected commit content
  const selectedCommit = useMemo(() => {
    if (!fileHistory || fileHistory.length === 0) return null;
    return fileHistory[selectedCommitIndex];
  }, [fileHistory, selectedCommitIndex]);

  // Get compare commit content
  const compareCommit = useMemo(() => {
    if (!fileHistory || compareCommitIndex === null) return null;
    return fileHistory[compareCommitIndex];
  }, [fileHistory, compareCommitIndex]);

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-red-500">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error.message}</p>
        </CardContent>
        <CardFooter>
          <Button onClick={() => initRepo(initialBranch)}>Retry</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <History className="mr-2" size={20} />
              File History
            </CardTitle>
            <CardDescription>{filePath}</CardDescription>
          </div>
          
          {availableBranches && availableBranches.length > 0 && (
            <Select
              value={currentBranch || initialBranch}
              onValueChange={handleBranchChange}
              disabled={isLoading}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                {availableBranches.map((branch) => (
                  <SelectItem key={branch} value={branch}>
                    {branch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {isLoading && !fileHistory ? (
          <div className="flex items-center justify-center p-8">
            <p>Loading repository history...</p>
          </div>
        ) : fileHistory && fileHistory.length > 0 ? (
          <div className="grid grid-cols-12 h-[600px]">
            {/* Commit history sidebar */}
            <div className="col-span-4 border-r">
              <ScrollArea className="h-[600px]">
                {fileHistory.map((item, index) => {
                  const { commit } = item;
                  const isSelected = index === selectedCommitIndex;
                  const isCompareSelected = index === compareCommitIndex;
                  const commitDate = new Date(commit.commit.author.timestamp * 1000);
                  
                  return (
                    <div
                      key={commit.oid}
                      className={`
                        p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors
                        ${isSelected ? 'bg-muted' : ''}
                        ${isCompareSelected ? 'bg-blue-100 dark:bg-blue-900/30' : ''}
                      `}
                      onClick={() => setSelectedCommitIndex(index)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center">
                          <GitCommit size={16} className="mr-2" />
                          <span className="text-sm font-medium truncate">
                            {commit.oid.substring(0, 7)}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-6 w-6 p-0 ${isCompareSelected ? 'text-blue-600' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCompareCommitIndex(isCompareSelected ? null : index);
                          }}
                        >
                          <GitCompare size={14} />
                        </Button>
                      </div>
                      <div className="mb-1">
                        <p className="text-sm font-medium line-clamp-1">
                          {commit.commit.message}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{commit.commit.author.name}</span>
                        <span>{format(commitDate, 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  );
                })}
              </ScrollArea>
            </div>
            
            {/* Content/Diff view */}
            <div className="col-span-8">
              <div className="h-[600px] flex flex-col">
                {/* Navigation */}
                <div className="flex items-center justify-between p-3 border-b">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={selectedCommitIndex === 0}
                      onClick={() => setSelectedCommitIndex(prev => Math.max(0, prev - 1))}
                    >
                      <ChevronLeft size={16} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!fileHistory || selectedCommitIndex === fileHistory.length - 1}
                      onClick={() => setSelectedCommitIndex(prev => fileHistory ? Math.min(fileHistory.length - 1, prev + 1) : prev)}
                    >
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                  
                  {compareCommitIndex !== null && (
                    <div className="flex items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCompare}
                        disabled={isLoadingDiff}
                      >
                        Compare Versions
                      </Button>
                    </div>
                  )}
                  
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                    <TabsList>
                      <TabsTrigger value="content">Content</TabsTrigger>
                      <TabsTrigger value="diff" disabled={!diffResult}>Diff</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                
                {/* Content view */}
                <ScrollArea className="flex-grow">
                  <TabsContent value="content" className="m-0 p-0 h-full">
                    {selectedCommit && (
                      <div className="p-4">
                        <div className="mb-4">
                          <p className="text-sm mb-1">
                            <span className="font-medium">Commit:</span> {selectedCommit.commit.oid}
                          </p>
                          <p className="text-sm mb-1">
                            <span className="font-medium">Author:</span> {selectedCommit.commit.commit.author.name}
                          </p>
                          <p className="text-sm mb-1">
                            <span className="font-medium">Date:</span> {
                              format(new Date(selectedCommit.commit.commit.author.timestamp * 1000), 'PPpp')
                            }
                          </p>
                          <p className="text-sm mb-1">
                            <span className="font-medium">Message:</span> {selectedCommit.commit.commit.message}
                          </p>
                        </div>
                        
                        <Separator className="my-4" />
                        
                        <pre className="p-4 bg-muted rounded-md overflow-auto text-sm">
                          {selectedCommit.content}
                        </pre>
                      </div>
                    )}
                  </TabsContent>
                  
                  {/* Diff view */}
                  <TabsContent value="diff" className="m-0 p-0 h-full">
                    {isLoadingDiff ? (
                      <div className="flex items-center justify-center h-full">
                        <p>Loading diff...</p>
                      </div>
                    ) : diffResult && compareCommit ? (
                      <div className="p-4">
                        <div className="mb-4">
                          <h3 className="text-lg font-medium mb-2">Comparing Changes</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm">
                                <span className="font-medium">From:</span> {compareCommit.commit.oid.substring(0, 7)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(compareCommit.commit.commit.author.timestamp * 1000), 'MMM d, yyyy')}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm">
                                <span className="font-medium">To:</span> {selectedCommit?.commit.oid.substring(0, 7)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {selectedCommit && format(new Date(selectedCommit.commit.commit.author.timestamp * 1000), 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <Separator className="my-4" />
                        
                        <div className="bg-muted rounded-md p-0 overflow-hidden">
                          {diffResult.changes.map((change, i) => (
                            <div 
                              key={i}
                              className={`
                                text-sm font-mono py-1 px-2 flex
                                ${change.type === 'added' ? 'bg-green-100 dark:bg-green-900/30' : ''}
                                ${change.type === 'removed' ? 'bg-red-100 dark:bg-red-900/30' : ''}
                              `}
                            >
                              <span className="w-8 text-muted-foreground tabular-nums text-right pr-2">
                                {change.lineNumber}
                              </span>
                              <span className="w-5 px-1">
                                {change.type === 'added' ? '+' : change.type === 'removed' ? '-' : ' '}
                              </span>
                              <span className="flex-1 overflow-x-auto">
                                {change.content}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p>Select two different commits to compare</p>
                      </div>
                    )}
                  </TabsContent>
                </ScrollArea>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center p-8">
            <p>No history available for this file.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FileHistoryViewer;