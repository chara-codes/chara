'use client';

import React from 'react';
import { WidgetContainer } from '@/components/widget-container';

/**
 * Standalone widget page for iframe embedding
 */
export default function WidgetPage() {
  return (
    <div className="w-full h-screen">
      <WidgetContainer />
    </div>
  );
}
