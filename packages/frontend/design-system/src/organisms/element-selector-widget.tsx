import { useElementSelector } from "@chara-codes/element-selector";
import type React from "react";
import { useEffect } from "react";

interface ElementSelectorWidgetProps {
  /** Whether to automatically start element selection when component mounts */
  autoStart?: boolean;
  /** Callback when an element is selected and context is added */
  onAddContext?: (contextItem: {
    name: string;
    type: string;
    data?: unknown;
  }) => void;
}

/**
 * ElementSelectorWidget component that provides element selection functionality
 * Uses the useElementSelector hook to enable DOM element selection and annotation
 */
export const ElementSelectorWidget: React.FC<ElementSelectorWidgetProps> = ({
  autoStart = true,
  onAddContext,
}) => {
  // Default callback that does nothing if no onAddContext provided
  const handleAddContext =
    onAddContext ||
    (() => {
      // Default empty callback
    });
  const { isSelectingElement, startElementSelection } =
    useElementSelector(handleAddContext);

  // Auto-start element selection when component mounts
  useEffect(() => {
    if (autoStart && !isSelectingElement) {
      startElementSelection();
    }
  }, [autoStart, isSelectingElement, startElementSelection]);

  return <></>;
};
