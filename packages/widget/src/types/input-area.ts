import type React from "react";
import type { FC } from "react";

export interface InputAreaProps {
  onSendMessage: (message: string) => void;
  onAddContext: (item: ContextItem) => void;
  isResponding?: boolean;
  onStopResponse?: () => void;
  isLoading?: boolean;
  buttonConfig?: ButtonConfig[];
}

export interface ContextItem {
  name: string;
  type: string;
  data?: unknown;
}

export interface ElementComment {
  element: HTMLElement;
  comment: string;
  componentInfo?: {
    name: string;
    path: string;
    isReactComponent: boolean;
  };
}

export interface DropdownItem {
  id: string;
  label: string;
  type: string;
  section: string;
  icon?: React.ReactNode;
  action?: () => void;
}

export interface ButtonConfig {
  enabled?: boolean;
  id?: string;
  icon?: FC;
  tooltip?: string;
}
