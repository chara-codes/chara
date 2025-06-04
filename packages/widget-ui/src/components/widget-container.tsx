'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWidgetStore } from '@/store/widget-store';
import { WidgetButton } from './widget-button';
import { WidgetChat } from './widget-chat';

export function WidgetContainer() {
  const { 
    isOpen, 
    isInitialized,
    config, 
    toggleWidget,
    openWidget,
    initialize
  } = useWidgetStore();
  
  // Initialize widget on first render
  useEffect(() => {
    if (!isInitialized) {
      initialize();
      
      // Auto-open if configured
      if (config.autoOpen) {
        const timer = setTimeout(() => {
          openWidget();
        }, config.autoOpenDelay);
        
        return () => clearTimeout(timer);
      }
    }
  }, [isInitialized, initialize, config.autoOpen, config.autoOpenDelay, openWidget]);
  
  // Generate position styles for the widget container
  const getPositionStyle = () => {
    const { position, offset, width, height } = config;
    
    switch (position) {
      case 'bottom-left':
        return { bottom: offset + 70, left: offset };
      case 'top-right':
        return { top: offset + 70, right: offset };
      case 'top-left':
        return { top: offset + 70, left: offset };
      case 'bottom-right':
      default:
        return { bottom: offset + 70, right: offset };
    }
  };
  
  return (
    <>
      <WidgetButton isOpen={isOpen} onClick={toggleWidget} />
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed z-40 widget-shadow bg-background border rounded-lg overflow-hidden"
            style={{
              ...getPositionStyle(),
              width: config.width,
              height: config.height,
              borderRadius: config.roundedDesign ? '16px' : '8px',
            }}
            initial={{ 
              opacity: 0,
              scale: 0.9,
              y: 20
            }}
            animate={{ 
              opacity: 1,
              scale: 1,
              y: 0
            }}
            exit={{ 
              opacity: 0,
              scale: 0.9,
              y: 20
            }}
            transition={{ duration: 0.2 }}
          >
            <WidgetChat />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
