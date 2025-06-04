'use client';

import React from 'react';
import { useWidgetStore } from '@/store/widget-store';
import type { WidgetConfig } from '@/types/widget';

export function WidgetConfigurator() {
  const { config, updateConfig } = useWidgetStore();
  
  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    // Handle different input types
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      updateConfig({ [name]: checked } as unknown as Partial<WidgetConfig>);
    } else if (type === 'number') {
      updateConfig({ [name]: Number(value) } as unknown as Partial<WidgetConfig>);
    } else {
      updateConfig({ [name]: value } as unknown as Partial<WidgetConfig>);
    }
  };
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Configure Widget</h3>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={config.title}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="position" className="text-sm font-medium">
              Position
            </label>
            <select
              id="position"
              name="position"
              value={config.position}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="bottom-right">Bottom Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="top-right">Top Right</option>
              <option value="top-left">Top Left</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label htmlFor="primaryColor" className="text-sm font-medium">
              Primary Color
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                id="primaryColor"
                name="primaryColor"
                value={config.primaryColor}
                onChange={handleChange}
                className="w-10 h-10 rounded-md border p-0"
              />
              <input
                type="text"
                value={config.primaryColor}
                onChange={handleChange}
                name="primaryColor"
                className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="primaryTextColor" className="text-sm font-medium">
              Primary Text Color
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                id="primaryTextColor"
                name="primaryTextColor"
                value={config.primaryTextColor}
                onChange={handleChange}
                className="w-10 h-10 rounded-md border p-0"
              />
              <input
                type="text"
                value={config.primaryTextColor}
                onChange={handleChange}
                name="primaryTextColor"
                className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="buttonIcon" className="text-sm font-medium">
              Button Icon
            </label>
            <select
              id="buttonIcon"
              name="buttonIcon"
              value={config.buttonIcon}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="message">Message Square</option>
              <option value="chat">Message Circle</option>
              <option value="help">Help Circle</option>
              <option value="bot">Bot</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="width" className="text-sm font-medium">
              Width (px)
            </label>
            <input
              type="number"
              id="width"
              name="width"
              value={config.width}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              min="250"
              max="500"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="height" className="text-sm font-medium">
              Height (px)
            </label>
            <input
              type="number"
              id="height"
              name="height"
              value={config.height}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              min="300"
              max="800"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="welcomeMessage" className="text-sm font-medium">
            Welcome Message
          </label>
          <textarea
            id="welcomeMessage"
            name="welcomeMessage"
            value={config.welcomeMessage}
            onChange={handleChange}
            rows={3}
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="roundedDesign"
              name="roundedDesign"
              checked={config.roundedDesign}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="roundedDesign" className="text-sm font-medium">
              Rounded Design
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="autoOpen"
              name="autoOpen"
              checked={config.autoOpen}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="autoOpen" className="text-sm font-medium">
              Auto-open Widget
            </label>
          </div>
        </div>
        
        {config.autoOpen && (
          <div className="space-y-2">
            <label htmlFor="autoOpenDelay" className="text-sm font-medium">
              Auto-open Delay (ms)
            </label>
            <input
              type="number"
              id="autoOpenDelay"
              name="autoOpenDelay"
              value={config.autoOpenDelay}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              min="1000"
              step="1000"
            />
          </div>
        )}
      </div>
    </div>
  );
}
