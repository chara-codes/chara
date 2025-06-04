"use client";

import React from "react";
import { Layout } from "@/components/layout";
import { useAppStore } from "@/store/app-store";
import { usePreviewStore } from "@/store/preview-store";
import { useChatStore } from "@frontend/core";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const { syncWithChat, toggleSyncWithChat } = useAppStore();
  const { reset: resetPreview } = usePreviewStore();
  const { model, setModel } = useChatStore();
  
  // Reset preview data
  const handleResetPreview = () => {
    if (window.confirm("Are you sure you want to reset all preview files? This action cannot be undone.")) {
      resetPreview();
    }
  };
  
  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        
        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Chat Settings</h2>
            
            <div className="p-4 border rounded-lg space-y-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="model" className="text-sm font-medium">AI Model</label>
                <select
                  id="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="p-2 border rounded-md bg-background"
                >
                  <option value="claude-3.7-sonnet">Claude 3.7 Sonnet</option>
                  <option value="claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                  <option value="claude-3-opus">Claude 3 Opus</option>
                  <option value="gpt-4o">GPT-4o</option>
                </select>
              </div>
            </div>
          </section>
          
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Preview Settings</h2>
            
            <div className="p-4 border rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Sync with Chat</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically update preview files when AI suggests changes
                  </p>
                </div>
                <Button
                  onClick={toggleSyncWithChat}
                  variant={syncWithChat ? "default" : "outline"}
                  className="min-w-24"
                >
                  {syncWithChat ? "Enabled" : "Disabled"}
                </Button>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <p className="font-medium">Reset Preview Data</p>
                  <p className="text-sm text-muted-foreground">
                    Clear all files and folders in the preview
                  </p>
                </div>
                <Button
                  onClick={handleResetPreview}
                  variant="destructive"
                >
                  Reset Data
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
