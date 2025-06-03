'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FileHistoryViewer, FileHistoryButton } from '@/components/file-history';
import GitUtils from '@/lib/git/gitUtils';
import { useToast } from "@/components/ui/use-toast";
import { Github, History, GitBranch } from 'lucide-react';

export default function FileHistoryDemo() {
  const { toast } = useToast();
  const [repoUrl, setRepoUrl] = useState<string>('https://github.com/vercel/next.js');
  const [filePath, setFilePath] = useState<string>('packages/next/src/client/components/app-router.tsx');
  const [branch, setBranch] = useState<string>('canary');
  const [showHistory, setShowHistory] = useState<boolean>(false);

  const handleShowHistory = () => {
    if (!repoUrl || !filePath) {
      toast({
        title: "Missing information",
        description: "Please provide both repository URL and file path",
        variant: "destructive",
      });
      return;
    }

    if (!GitUtils.isValidRepoUrl(repoUrl)) {
      toast({
        title: "Invalid repository URL",
        description: "Please provide a valid Git repository URL",
        variant: "destructive",
      });
      return;
    }

    setShowHistory(true);
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">File History Demo</h1>
      
      <div className="grid gap-8 grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Github className="mr-2" size={20} />
              Repository Information
            </CardTitle>
            <CardDescription>
              Enter the repository URL and file path to view its history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="repoUrl">Repository URL</Label>
                <Input
                  id="repoUrl"
                  placeholder="https://github.com/username/repo"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Example: https://github.com/vercel/next.js
                </p>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="filePath">File Path</Label>
                <Input
                  id="filePath"
                  placeholder="path/to/file.js"
                  value={filePath}
                  onChange={(e) => setFilePath(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Path to the file relative to repository root
                </p>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="branch">Branch (optional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="branch"
                    placeholder="main"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                  />
                  <Button variant="outline" className="flex items-center gap-2">
                    <GitBranch size={16} />
                    <span>{branch || 'main'}</span>
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-between mt-4">
                <Button 
                  onClick={handleShowHistory}
                  className="flex items-center gap-2"
                >
                  <History size={16} />
                  View File History
                </Button>
                
                <FileHistoryButton
                  repoUrl={repoUrl}
                  filePath={filePath}
                  initialBranch={branch || 'main'}
                  buttonText="Open in Dialog"
                  variant="secondary"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {showHistory && (
          <Card>
            <CardHeader>
              <CardTitle>File History</CardTitle>
              <CardDescription>
                Viewing history for {filePath} in {repoUrl}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <FileHistoryViewer
                repoUrl={repoUrl}
                filePath={filePath}
                initialBranch={branch || 'main'}
                corsProxy={GitUtils.getCorsProxyForRepo(repoUrl)}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}