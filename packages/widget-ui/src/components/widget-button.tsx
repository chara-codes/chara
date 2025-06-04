'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, HelpCircle, Bot, MessageCircle, X } from 'lucide-react';
import { useWidgetStore } from '@/store/widget-store';
import { cn } from '@/lib/utils';

interface WidgetButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export function WidgetButton({ isOpen, onClick }: WidgetButtonProps) {
  const { config } = useWidgetStore();
  
  // Get the appropriate icon based on configuration
  const getIcon = () => {
    if (isOpen) return <X size={24} />;
    
    switch (config.buttonIcon) {
      case 'chat':
        return <MessageCircle size={24} />;
      case 'help':
        return <HelpCircle size={24} />;
      case 'bot':
        return <Bot size={24} />;
      case 'message':
      default:
        return <MessageSquare size={24} />;
    }
  };
  
  // Generate position styles based on configuration
  const getPositionStyle = () => {
    const { position, offset } = config;
    
    switch (position) {
      case 'bottom-left':
        return { bottom: offset, left: offset };
      case 'top-right':
        return { top: offset, right: offset };
      case 'top-left':
        return { top: offset, left: offset };
      case 'bottom-right':
      default:
        return { bottom: offset, right: offset };
    }
  };
  
  // Generate button style with primary color
  const getButtonStyle = () => {
    const { primaryColor, primaryTextColor, roundedDesign } = config;
    
    return {
      backgroundColor: primaryColor,
      color: primaryTextColor,
      borderRadius: roundedDesign ? '9999px' : '8px',
    };
  };
  
  return (
    <motion.button
      className={cn(
        "fixed z-50 p-4 focus:outline-none widget-shadow",
        "flex items-center justify-center"
      )}
      style={{
        ...getPositionStyle(),
        ...getButtonStyle()
      }}
      onClick={onClick}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.3, type: 'spring' }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={isOpen ? "Close chat" : "Open chat"}
    >
      {getIcon()}
    </motion.button>
  );
}
