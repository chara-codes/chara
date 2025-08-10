import type { ComponentDetector, ComponentInfo } from "../../types";
import { ReactComponentDetector } from "./react-detector";
import { VueComponentDetector } from "./vue-detector";

/**
 * Main component detection service that orchestrates multiple framework detectors
 * Automatically detects which framework is being used and applies the appropriate detector
 */
class ComponentDetectionService {
  private detectors: ComponentDetector[] = [];

  constructor() {
    // Register all available detectors
    this.registerDetector(new ReactComponentDetector());
    this.registerDetector(new VueComponentDetector());
  }

  /**
   * Register a new component detector
   */
  registerDetector(detector: ComponentDetector): void {
    this.detectors.push(detector);
  }

  /**
   * Remove a detector by framework name
   */
  unregisterDetector(framework: string): void {
    this.detectors = this.detectors.filter(
      (detector) => detector.framework !== framework
    );
  }

  /**
   * Get all registered detectors
   */
  getDetectors(): ComponentDetector[] {
    return [...this.detectors];
  }

  /**
   * Detect component information from a DOM element
   * Tries all registered detectors and returns the most complete result
   */
  detectComponent(element: HTMLElement): ComponentInfo {
    console.log(
      "ComponentDetectionService: Detecting component for element:",
      element.tagName,
      element.className
    );
    // Default component info
    const defaultInfo: ComponentInfo = {
      componentName: "Unknown",
      componentPath: "",
      isReactComponent: false,
      framework: "unknown",
    };

    try {
      // Try each detector that can handle this element
      const results: Partial<ComponentInfo>[] = [];
      console.log(
        `ComponentDetectionService: Trying ${this.detectors.length} detectors`
      );

      for (const detector of this.detectors) {
        console.log(
          `ComponentDetectionService: Checking ${detector.framework} detector...`
        );
        if (detector.canDetect(element)) {
          console.log(
            `ComponentDetectionService: ${detector.framework} detector can handle this element`
          );
          const result = detector.detectComponent(element);
          console.log(
            `ComponentDetectionService: ${detector.framework} detector result:`,
            result
          );
          if (result && Object.keys(result).length > 0) {
            results.push(result);
          }
        } else {
          console.log(
            `ComponentDetectionService: ${detector.framework} detector cannot handle this element`
          );
        }
      }

      // If no detector could handle the element, try basic detection
      if (results.length === 0) {
        console.log(
          "ComponentDetectionService: No detectors found, trying basic detection..."
        );
        const basicResult = this.basicDetection(element);
        console.log(
          "ComponentDetectionService: Basic detection result:",
          basicResult
        );
        if (basicResult && Object.keys(basicResult).length > 0) {
          results.push(basicResult);
        }
      }

      // Merge results, prioritizing more complete information
      const mergedResult = this.mergeResults(results);
      console.log("ComponentDetectionService: Merged result:", mergedResult);

      // Ensure all required fields are present
      const finalResult = {
        ...defaultInfo,
        ...mergedResult,
      };
      console.log("ComponentDetectionService: Final result:", finalResult);
      return finalResult;
    } catch (error) {
      console.error("Error in component detection:", error);
      return defaultInfo;
    }
  }

  /**
   * Basic component detection when no framework-specific detector can handle the element
   * Falls back to analyzing data attributes, class names, and element structure
   */
  private basicDetection(element: HTMLElement): Partial<ComponentInfo> {
    const result: Partial<ComponentInfo> = {
      framework: "unknown",
      isReactComponent: false,
    };

    // Check data attributes
    const dataComponent = element.getAttribute("data-component");
    const dataTestId = element.getAttribute("data-testid");
    const dataComponentName = element.getAttribute("data-component-name");

    if (dataComponentName) {
      result.componentName = dataComponentName;
    } else if (dataComponent) {
      result.componentName = dataComponent;
    } else if (dataTestId) {
      // Convert test ID to component name
      const testIdParts = dataTestId.split("-");
      if (testIdParts.length > 1) {
        result.componentName = testIdParts
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join("");
      } else {
        result.componentName = dataTestId;
      }
    }

    // Check class names for component patterns
    if (
      !result.componentName &&
      element.className &&
      typeof element.className === "string"
    ) {
      const classNames = element.className.split(" ");

      for (const className of classNames) {
        // Look for BEM-style class names that might indicate components
        const bemMatch = className.match(
          /^([A-Z][a-zA-Z0-9]+)(?:__[a-zA-Z0-9-]+)?(?:--[a-zA-Z0-9-]+)?$/
        );
        if (bemMatch) {
          result.componentName = bemMatch[1];
          break;
        }

        // Look for CSS modules pattern
        const moduleMatch = className.match(
          /^([A-Z][a-zA-Z0-9]+)_[a-zA-Z0-9]+$/
        );
        if (moduleMatch) {
          result.componentName = moduleMatch[1];
          break;
        }
      }
    }

    // Check element ID for component hints
    if (!result.componentName && element.id) {
      const idMatch = element.id.match(/^([A-Z][a-zA-Z0-9]+)/);
      if (idMatch) {
        result.componentName = idMatch[1];
      }
    }

    // Generate default path if we found a component name
    if (result.componentName && result.componentName !== "Unknown") {
      const kebabCase = result.componentName
        .replace(/([a-z])([A-Z])/g, "$1-$2")
        .toLowerCase();
      result.componentPath = `components/${kebabCase}.tsx`;
    }

    return result;
  }

  /**
   * Merge multiple detection results, prioritizing more complete and specific information
   */
  private mergeResults(
    results: Partial<ComponentInfo>[]
  ): Partial<ComponentInfo> {
    if (results.length === 0) {
      return {};
    }

    if (results.length === 1) {
      return results[0];
    }

    // Sort results by completeness (more properties = higher priority)
    const sortedResults = results.sort((a, b) => {
      const aScore = this.calculateCompletenessScore(a);
      const bScore = this.calculateCompletenessScore(b);
      return bScore - aScore;
    });

    // Start with the most complete result and fill in missing properties from others
    const merged = { ...sortedResults[0] };

    for (let i = 1; i < sortedResults.length; i++) {
      const current = sortedResults[i];

      // Fill in missing properties
      if (!merged.componentName || merged.componentName === "Unknown") {
        merged.componentName = current.componentName;
      }

      if (!merged.componentPath) {
        merged.componentPath = current.componentPath;
      }

      if (
        merged.framework === "unknown" &&
        current.framework &&
        current.framework !== "unknown"
      ) {
        merged.framework = current.framework;
        merged.isReactComponent = current.isReactComponent;
      }
    }

    return merged;
  }

  /**
   * Calculate a completeness score for a detection result
   * Higher score means more complete information
   */
  private calculateCompletenessScore(result: Partial<ComponentInfo>): number {
    let score = 0;

    if (result.componentName && result.componentName !== "Unknown") {
      score += 3; // Component name is most important
    }

    if (result.componentPath) {
      score += 2; // Component path is valuable
    }

    if (result.framework && result.framework !== "unknown") {
      score += 2; // Framework detection is important
    }

    if (result.isReactComponent !== undefined) {
      score += 1; // React component flag
    }

    return score;
  }

  /**
   * Check if any detector can handle the given element
   */
  canDetectAny(element: HTMLElement): boolean {
    return this.detectors.some((detector) => detector.canDetect(element));
  }

  /**
   * Get the best detector for the given element
   */
  getBestDetector(element: HTMLElement): ComponentDetector | null {
    // Return the first detector that can handle the element
    // In the future, this could be enhanced with scoring
    return (
      this.detectors.find((detector) => detector.canDetect(element)) || null
    );
  }

  /**
   * Detect which frameworks are present in the current page
   */
  detectFrameworks(): string[] {
    const frameworks: string[] = [];

    // Check for React
    if (
      // @ts-expect-error - checking global variables
      (typeof window !== "undefined" && window.React) ||
      // @ts-expect-error - checking global variables
      (typeof window !== "undefined" &&
        window.__REACT_DEVTOOLS_GLOBAL_HOOK__) ||
      document.querySelector("[data-reactroot], [data-reactid]")
    ) {
      frameworks.push("react");
    }

    // Check for Vue
    if (
      // @ts-expect-error - checking global variables
      (typeof window !== "undefined" && window.Vue) ||
      // @ts-expect-error - checking global variables
      (typeof window !== "undefined" && window.__VUE__) ||
      // @ts-expect-error - checking global variables
      (typeof window !== "undefined" && window.__VUE_DEVTOOLS_GLOBAL_HOOK__) ||
      document.querySelector("[data-v-], [v-]")
    ) {
      frameworks.push("vue");
    }

    // Check for Angular
    if (
      // @ts-expect-error - checking global variables
      (typeof window !== "undefined" && window.ng) ||
      // @ts-expect-error - checking global variables
      (typeof window !== "undefined" && window.angular) ||
      document.querySelector("[ng-app], [ng-controller], [data-ng-app]")
    ) {
      frameworks.push("angular");
    }

    return frameworks;
  }
}

// Create and export a singleton instance
export const componentDetectionService = new ComponentDetectionService();

// Export the class and individual detectors for direct use if needed
export { ComponentDetectionService };
export { ReactComponentDetector } from "./react-detector";
export { VueComponentDetector } from "./vue-detector";
export { BaseComponentDetector } from "./base-detector";
