// Import ComponentDetectionService separately for type annotations
import { ComponentDetectionService } from "./services/component-detection";

/**
 * Element Selector Module
 *
 * A comprehensive, modular element selection system for web applications.
 * This module provides functionality to highlight, select, and annotate DOM elements
 * with support for multiple frontend frameworks (React, Vue, Angular).
 *
 * The module is organized into several key areas:
 * - Types: TypeScript interfaces and type definitions
 * - Services: Framework detection and component analysis
 * - Components: UI elements for selection interface
 * - Handlers: Event management and user interactions
 * - Utils: Utility functions for DOM manipulation and styling
 *
 * @example
 * ```ts
 * import { useElementSelector } from './hooks/element-selector';
 *
 * function MyComponent() {
 *   const { startElementSelection, isSelectingElement } = useElementSelector(
 *     (contextItem) => {
 *       console.log('Element added to context:', contextItem);
 *     }
 *   );
 *
 *   return (
 *     <button onClick={startElementSelection}>
 *       {isSelectingElement ? 'Selecting...' : 'Select Element'}
 *     </button>
 *   );
 * }
 * ```
 */

// Main hook export
export { useElementSelector } from "./use-element-selector";

// Type definitions
export type {
  ComponentInfo,
  ElementSelectorUIConfig,
  UseElementSelectorReturn,
  ElementContextItem,
  ComponentDetector,
  ModalOptions,
  UIElementResult,
  SelectionState,
  SelectionEventHandlers,
} from "./types";

// Services
export {
  componentDetectionService,
  ComponentDetectionService,
  ReactComponentDetector,
  VueComponentDetector,
  BaseComponentDetector,
} from "./services/component-detection";

// UI Components (for advanced usage)
export { ElementSelectorUI } from "./components/element-selector-ui";
export { CursorFollower } from "./components/cursor-follower";
export { SelectionGuide } from "./components/selection-guide";
export { TagDisplay } from "./components/tag-display";
export { CommentModal } from "./components/comment-modal";

// Event Handlers (for advanced usage)
export { SelectionHandlers } from "./handlers/selection-handlers";
export { ModalHandlers } from "./handlers/modal-handlers";

// Utilities
export {
  // DOM utilities
  removeElementById,
  isUIElement,
  getElementAtPoint,
  getElementBounds,
  createElement,
  addClasses,
  removeClasses,
  hasAnyClass,
  getElementsByClass,
  findClosestParent,
  getElementText,
  getElementHTML,
  isElementVisible,
  scrollIntoViewIfNeeded,
  generateElementSelector,
  cleanupSelectionUI,
  createStyleElement,
  debounce,
  throttle,
} from "./utils/dom-utils";

export {
  // Style utilities
  DEFAULT_UI_CONFIG,
  generateHighlightStyles,
  UI_ELEMENT_STYLES,
  getPrimaryButtonStyles,
  getSecondaryButtonStyles,
  getModalHeaderStyles,
  getInfoSectionStyles,
  getCursorFollowerStyles,
  generateCrosshairSVG,
  getSelectionGuideStyles,
  generateSelectionGuideIconSVG,
  getTagDisplayStyles,
  applyButtonHoverEffects,
  applyInputFocusEffects,
  createAnimationKeyframes,
  positionRelativeTo,
} from "./utils/style-utils";

// Constants
export const ELEMENT_SELECTOR_VERSION = "2.0.0";

// Configuration presets
export const UI_CONFIG_PRESETS = {
  DEFAULT: {
    primaryColor: "#2563eb",
    textColor: "white",
    borderColor: "white",
    backgroundColor: "rgba(37, 99, 235, 0.2)",
    zIndexBase: 2147483640,
  },
  DARK: {
    primaryColor: "#1f2937",
    textColor: "white",
    borderColor: "#9ca3af",
    backgroundColor: "rgba(31, 41, 55, 0.3)",
    zIndexBase: 2147483640,
  },
  LIGHT: {
    primaryColor: "#f3f4f6",
    textColor: "#1f2937",
    borderColor: "#d1d5db",
    backgroundColor: "rgba(243, 244, 246, 0.3)",
    zIndexBase: 2147483640,
  },
  SUCCESS: {
    primaryColor: "#10b981",
    textColor: "white",
    borderColor: "white",
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    zIndexBase: 2147483640,
  },
  WARNING: {
    primaryColor: "#f59e0b",
    textColor: "white",
    borderColor: "white",
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    zIndexBase: 2147483640,
  },
  ERROR: {
    primaryColor: "#ef4444",
    textColor: "white",
    borderColor: "white",
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    zIndexBase: 2147483640,
  },
} as const;

// Framework detection utilities
export const FRAMEWORK_DETECTION = {
  /**
   * Detect which frontend frameworks are present on the current page
   */
  detectFrameworks: () => componentDetectionService.detectFrameworks(),

  /**
   * Check if a specific framework is detected
   */
  hasFramework: (framework: string) =>
    componentDetectionService.detectFrameworks().includes(framework),

  /**
   * Register a custom component detector
   */
  registerDetector: (detector: import("./types").ComponentDetector) =>
    componentDetectionService.registerDetector(detector),

  /**
   * Unregister a component detector
   */
  unregisterDetector: (framework: string) =>
    componentDetectionService.unregisterDetector(framework),
} as const;

// Advanced usage patterns and utilities
export const ADVANCED_USAGE = {
  /**
   * Create a custom element selector with specific configuration
   */
  createCustomSelector: (config: import("./types").ElementSelectorUIConfig) => {
    return new ElementSelectorUI(config);
  },

  /**
   * Create standalone component detector service
   */
  createDetectionService: () => {
    return new ComponentDetectionService();
  },

  /**
   * Utility to batch process multiple elements
   */
  batchProcessElements: (
    elements: HTMLElement[],
    processor: (
      element: HTMLElement,
      info: import("./types").ComponentInfo
    ) => void
  ) => {
    elements.forEach((element) => {
      const componentInfo = componentDetectionService.detectComponent(element);
      processor(element, componentInfo);
    });
  },
} as const;
