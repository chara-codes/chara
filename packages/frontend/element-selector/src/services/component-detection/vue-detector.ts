import { ComponentInfo } from "../../types";
import { BaseComponentDetector } from "./base-detector";

/**
 * Vue-specific component detector
 * Detects Vue components by analyzing Vue internals and component instances
 */
export class VueComponentDetector extends BaseComponentDetector {
  framework = "vue";

  /**
   * Check if this detector can handle the given element
   * Looks for Vue-specific properties on the element
   */
  canDetect(element: HTMLElement): boolean {
    return (
      this.findVueInternalKey(element) !== undefined || this.hasVueData(element)
    );
  }

  /**
   * Detect Vue component information from an element
   */
  detectComponent(element: HTMLElement): Partial<ComponentInfo> {
    const result: Partial<ComponentInfo> = {
      framework: "vue" as const,
      isReactComponent: false, // Vue components are not React components
    };

    try {
      // Try to extract from Vue internals first
      const vueKey = this.findVueInternalKey(element);
      if (vueKey) {
        const vueInfo = this.extractFromVueInstance(element, vueKey);
        Object.assign(result, vueInfo);
      }

      // Try Vue 3 specific detection
      if (!result.componentName || result.componentName === "Unknown") {
        const vue3Info = this.extractFromVue3Instance(element);
        Object.assign(result, vue3Info);
      }

      // Fall back to common detection methods if Vue internals don't provide enough info
      if (!result.componentName || result.componentName === "Unknown") {
        const dataInfo = this.extractFromDataAttributes(element);
        Object.assign(result, dataInfo);
      }

      if (!result.componentName || result.componentName === "Unknown") {
        const classInfo = this.extractFromClassNames(element);
        Object.assign(result, classInfo);
      }

      if (!result.componentName || result.componentName === "Unknown") {
        const idInfo = this.extractFromId(element);
        Object.assign(result, idInfo);
      }

      if (!result.componentName || result.componentName === "Unknown") {
        const parentInfo = this.extractFromParents(element);
        Object.assign(result, parentInfo);
      }

      // Generate default path if we have a component name but no path
      if (
        result.componentName &&
        result.componentName !== "Unknown" &&
        !result.componentPath
      ) {
        result.componentPath = this.generateDefaultPath(
          result.componentName,
          "vue"
        );
      }

      // Set default values
      if (!result.componentName) {
        result.componentName = "Unknown";
      }
    } catch (error) {
      console.error("Error detecting Vue component information:", error);
      result.componentName = "Unknown";
      result.componentPath = "";
    }

    return result;
  }

  /**
   * Find a Vue internal key in the element's properties
   */
  private findVueInternalKey(element: HTMLElement): string | undefined {
    return Object.keys(element).find(
      (key) =>
        key.startsWith("__vue__") ||
        key.startsWith("__vueParentComponent") ||
        key.startsWith("_vnode") ||
        key.startsWith("__VUE__")
    );
  }

  /**
   * Check if element has Vue-specific data
   */
  private hasVueData(element: HTMLElement): boolean {
    // Check for Vue-specific data attributes
    return !!(
      element.getAttribute("data-v-") ||
      element.getAttribute("v-") ||
      Array.from(element.attributes).some(
        (attr) => attr.name.startsWith("data-v-") || attr.name.startsWith("v-")
      )
    );
  }

  /**
   * Extract component information from Vue 2 instance
   */
  private extractFromVueInstance(
    element: HTMLElement,
    vueKey: string
  ): Partial<ComponentInfo> {
    const result: Partial<ComponentInfo> = {};

    try {
      // @ts-expect-error - accessing dynamic properties
      const vueInstance = element[vueKey];
      if (!vueInstance) return result;

      // Try to get component name from various Vue 2 properties
      if (vueInstance.$options) {
        // Component name from options
        if (vueInstance.$options.name) {
          result.componentName = vueInstance.$options.name;
        }
        // Component name from constructor
        else if (vueInstance.$options._componentTag) {
          result.componentName = vueInstance.$options._componentTag;
        }
        // Component name from file path (if available)
        else if (vueInstance.$options.__file) {
          const fileName = vueInstance.$options.__file
            .split("/")
            .pop()
            ?.replace(".vue", "");
          if (fileName) {
            result.componentName =
              fileName.charAt(0).toUpperCase() + fileName.slice(1);
          }
        }
      }

      // Try to get component name from constructor
      if (!result.componentName && vueInstance.constructor) {
        if (
          vueInstance.constructor.name &&
          vueInstance.constructor.name !== "Vue"
        ) {
          result.componentName = vueInstance.constructor.name;
        }
      }

      // Try to get file path
      if (vueInstance.$options && vueInstance.$options.__file) {
        result.componentPath = vueInstance.$options.__file;
      }
    } catch (error) {
      console.error("Error extracting from Vue instance:", error);
    }

    return result;
  }

  /**
   * Extract component information from Vue 3 instance
   */
  private extractFromVue3Instance(
    element: HTMLElement
  ): Partial<ComponentInfo> {
    const result: Partial<ComponentInfo> = {};

    try {
      // Vue 3 uses different internal properties
      // @ts-expect-error - accessing dynamic properties
      const vueApp = element.__vueParentComponent || element._vnode;

      if (vueApp) {
        // Try to get component name from Vue 3 structure
        if (vueApp.type) {
          if (vueApp.type.name) {
            result.componentName = vueApp.type.name;
          } else if (vueApp.type.__name) {
            result.componentName = vueApp.type.__name;
          } else if (vueApp.type.displayName) {
            result.componentName = vueApp.type.displayName;
          }
        }

        // Try to get file path from Vue 3
        if (vueApp.type && vueApp.type.__file) {
          result.componentPath = vueApp.type.__file;
        }
      }

      // Check for Vue 3 scoped CSS attributes
      const scopedAttributes = Array.from(element.attributes).filter((attr) =>
        attr.name.startsWith("data-v-")
      );

      if (scopedAttributes.length > 0 && !result.componentName) {
        // Extract potential component name from scoped CSS hash
        const scopedId = scopedAttributes[0].name.replace("data-v-", "");
        result.componentName = `ScopedComponent_${scopedId}`;
      }
    } catch (error) {
      console.error("Error extracting from Vue 3 instance:", error);
    }

    return result;
  }

  /**
   * Override path generation for Vue components
   */
  protected generateDefaultPath(
    componentName: string,
    extension = "vue"
  ): string {
    if (!componentName || componentName === "Unknown") {
      return "";
    }

    // Convert PascalCase to kebab-case for the file path
    const kebabCase = componentName
      .replace(/([a-z])([A-Z])/g, "$1-$2")
      .toLowerCase();

    return `components/${kebabCase}.${extension}`;
  }
}
