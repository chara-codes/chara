"use client";

/**
 * Re-export the refactored useElementSelector hook from the new modular structure
 * This file maintains backward compatibility while delegating to the new implementation
 */

export {
  useElementSelector,
  componentDetectionService,
  DEFAULT_UI_CONFIG,
  type ComponentInfo,
  type ElementSelectorUIConfig,
  type UseElementSelectorReturn,
  type ElementContextItem,
} from "./element-selector";

// Re-export configuration presets for convenience
export { UI_CONFIG_PRESETS } from "./element-selector";

// Re-export framework detection utilities
export { FRAMEWORK_DETECTION } from "./element-selector";
