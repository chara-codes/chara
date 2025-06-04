'use client';

import React from 'react';
import { WidgetContainer } from '@/components/widget-container';
import { WidgetConfigurator } from '@/components/widget-configurator';
import { WidgetScript } from '@/components/widget-script';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Demo header */}
      <header className="bg-primary text-primary-foreground p-6">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">Chat Widget Demo</h1>
          <p className="mt-2">Customize and embed this chat widget on your website</p>
        </div>
      </header>
      
      {/* Main content */}
      <div className="container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuration panel */}
          <div className="space-y-8">
            <WidgetConfigurator />
            <WidgetScript />
          </div>
          
          {/* Preview area */}
          <div className="bg-muted/30 rounded-lg p-8 min-h-[500px] relative">
            <h2 className="text-lg font-medium mb-4">Preview</h2>
            <p className="text-sm text-muted-foreground mb-8">
              This is how the widget will appear on your website. Click the button to open the chat.
            </p>
            
            {/* Widget container will render the widget in the corner */}
            <WidgetContainer />
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="mt-16 bg-muted p-6">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>Chat Widget Demo - Easily embed AI chat functionality on your website</p>
        </div>
      </footer>
    </main>
  );
}
