/**
 * Information about a component detected from a DOM element
 */
export interface ComponentInfo {
  /** The name of the component (e.g., "Button", "Header") */
  componentName: string;
  /** The file path where the component is likely defined */
  componentPath: string;
  /** Whether the element is part of a React component */
  isReactComponent: boolean;
  /** The framework the component belongs to */
  framework?: "react" | "vue" | "angular" | "unknown";
}

/**
 * Configuration options for the element selector UI
 */
export interface ElementSelectorUIConfig {
  /** Primary color used for highlighting and UI elements */
  primaryColor: string;
  /** Text color for UI elements */
  textColor: string;
  /** Border color for UI elements */
  borderColor: string;
  /** Background color for UI elements */
  backgroundColor: string;
  /** Z-index base for UI elements */
  zIndexBase: number;
}

/**
 * Return type for the useElementSelector hook
 */
export interface UseElementSelectorReturn {
  /** Whether element selection mode is currently active */
  isSelectingElement: boolean;
  /** The currently selected DOM element, if any */
  selectedElement: HTMLElement | null;
  /** Whether the comment modal is currently shown */
  showCommentModal: boolean;
  /** The current comment text for the selected element */
  elementComment: string;
  /** Start element selection mode */
  startElementSelection: () => void;
  /** End element selection mode and clean up */
  endElementSelection: () => void;
  /** Set the comment text for the selected element */
  setElementComment: (comment: string) => void;
  /** Create and show a comment modal for the given element */
  createCommentModal: (element: HTMLElement) => HTMLButtonElement;
  /** Detect component information from a DOM element */
  detectComponentInfo: (element: HTMLElement) => ComponentInfo;
}

/**
 * Context item data structure for adding elements to context
 */
export interface ElementContextItem {
  name: string;
  type: string;
  data?: {
    tagName: string;
    id: string;
    className: string;
    content: string;
    html: string;
    styles: string;
    url?: string;
    comment: string;
    component: ComponentInfo;
  };
}

/**
 * Event handlers for element selection
 */
export interface SelectionEventHandlers {
  handleElementClick?: (e: MouseEvent) => void;
  handleKeyDownEscape?: (e: KeyboardEvent) => void;
  handleMouseMove?: (e: MouseEvent) => void;
}

/**
 * Base interface for component detectors
 */
export interface ComponentDetector {
  /** The framework this detector handles */
  framework: string;
  /** Detect component information from an element */
  detectComponent(element: HTMLElement): Partial<ComponentInfo>;
  /** Check if this detector can handle the given element */
  canDetect(element: HTMLElement): boolean;
}

/**
 * Modal creation options
 */
export interface ModalOptions {
  element: HTMLElement;
  componentInfo: ComponentInfo;
  config: ElementSelectorUIConfig;
  onConfirm: (comment: string) => void;
  onCancel: () => void;
}

/**
 * UI element creation result
 */
export interface UIElementResult {
  element: HTMLElement;
  cleanup?: () => void;
}

/**
 * Selection state
 */
export interface SelectionState {
  isSelecting: boolean;
  selectedElement: HTMLElement | null;
  currentHighlightedElement: HTMLElement | null;
  showCommentModal: boolean;
  comment: string;
}
