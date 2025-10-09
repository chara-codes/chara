/**
 * Debug utilities for development mode features
 */

/**
 * Check if debug mode is enabled via environment variable
 * In Vite, environment variables must be prefixed with VITE_ to be accessible in the browser
 */
export function isDebugMode(): boolean {
  // Check for VITE_DEBUG_PARTS environment variable
  const debugEnv = import.meta.env?.VITE_DEBUG_PARTS;

  // Consider debug mode enabled if the variable is set to truthy values
  return debugEnv === 'true' || debugEnv === '1' || debugEnv === 'yes';
}

/**
 * Get debug configuration from environment
 */
export function getDebugConfig() {
  return {
    debugMode: isDebugMode(),
    showPartSource: isDebugMode(),
    showAllParts: isDebugMode(),
  };
}
