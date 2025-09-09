import { ComponentInfo, ComponentDetector } from '../../types';

/**
 * Abstract base class for component detectors
 * Provides common functionality for detecting components across different frameworks
 */
export abstract class BaseComponentDetector implements ComponentDetector {
  abstract framework: string;

  /**
   * Detect component information from an element
   * Should be implemented by each framework-specific detector
   */
  abstract detectComponent(element: HTMLElement): Partial<ComponentInfo>;

  /**
   * Check if this detector can handle the given element
   * Should be implemented by each framework-specific detector
   */
  abstract canDetect(element: HTMLElement): boolean;

  /**
   * Extract component information from data attributes
   * Common functionality that can be used by all detectors
   */
  protected extractFromDataAttributes(element: HTMLElement): Partial<ComponentInfo> {
    const result: Partial<ComponentInfo> = {};

    const dataComponent = element.getAttribute('data-component');
    const dataTestId = element.getAttribute('data-testid');
    const dataComponentId = element.getAttribute('data-component-id');
    const dataComponentName = element.getAttribute('data-component-name');

    if (dataComponentName) {
      result.componentName = dataComponentName;
    } else if (dataComponent) {
      result.componentName = dataComponent;
    } else if (dataTestId) {
      // Often test IDs follow patterns like "component-name-button"
      const testIdParts = dataTestId.split('-');
      if (testIdParts.length > 1) {
        // Convert kebab-case to PascalCase for component name
        result.componentName = testIdParts
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join('');
      } else {
        result.componentName = dataTestId;
      }
    } else if (dataComponentId) {
      result.componentName = dataComponentId;
    }

    return result;
  }

  /**
   * Extract component information from class names
   * Common functionality that can be used by all detectors
   */
  protected extractFromClassNames(element: HTMLElement): Partial<ComponentInfo> {
    const result: Partial<ComponentInfo> = {};

    if (!element.className || typeof element.className !== 'string') {
      return result;
    }

    const classNames = element.className.split(' ');

    // Look for class names that might indicate component structure
    const moduleClassRegex = /([A-Z][a-zA-Z0-9]+)_([a-zA-Z0-9]+)__[a-zA-Z0-9]+/;
    const materialClassRegex = /([A-Z][a-zA-Z0-9]+)-([a-z]+)-[0-9]+/;
    const styledComponentRegex = /sc-[a-zA-Z0-9]+-([a-zA-Z0-9]+)/;

    for (const className of classNames) {
      const moduleMatch = className.match(moduleClassRegex);
      const materialMatch = className.match(materialClassRegex);
      const styledMatch = className.match(styledComponentRegex);

      if (moduleMatch && moduleMatch[1]) {
        result.componentName = moduleMatch[1];
        result.componentPath = `components/${moduleMatch[1].toLowerCase()}/${moduleMatch[1]}.tsx`;
        break;
      } else if (materialMatch && materialMatch[1]) {
        result.componentName = materialMatch[1];
        result.componentPath = `components/${materialMatch[1].toLowerCase()}/${materialMatch[1]}.tsx`;
        break;
      } else if (styledMatch && styledMatch[1]) {
        // For styled-components, convert the hash to a readable name
        const cleanName = styledMatch[1].replace(/[0-9]/g, '');
        if (cleanName.length > 0) {
          // Convert to PascalCase if it's not already
          result.componentName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
          result.componentPath = `components/${result.componentName.toLowerCase()}/${result.componentName}.tsx`;
        }
        break;
      }
    }

    return result;
  }

  /**
   * Extract component information from element ID
   * Common functionality that can be used by all detectors
   */
  protected extractFromId(element: HTMLElement): Partial<ComponentInfo> {
    const result: Partial<ComponentInfo> = {};

    if (!element.id) {
      return result;
    }

    // Check for PascalCase or camelCase IDs that might indicate component names
    const idMatch = element.id.match(
      /([A-Z][a-zA-Z0-9]+)(Container|Wrapper|Component|Root|Inner)?$/
    );

    if (idMatch) {
      result.componentName = idMatch[1];
    }

    return result;
  }

  /**
   * Extract component information from parent elements
   * Common functionality that can be used by all detectors
   */
  protected extractFromParents(element: HTMLElement): Partial<ComponentInfo> {
    const result: Partial<ComponentInfo> = {};

    let parent = element.parentElement;
    let depth = 0;
    const maxDepth = 5; // Limit depth to prevent performance issues

    while (parent && depth < maxDepth) {
      // Check for section elements with IDs or classes that might indicate components
      if (parent.id && parent.id.includes('-') && parent.id.length > 3) {
        const idParts = parent.id.split('-');
        if (idParts.length > 1) {
          result.componentName = idParts
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join('');
          break;
        }
      }

      // Check for data attributes in parent
      const parentDataComponent = parent.getAttribute('data-component');
      const parentDataComponentName = parent.getAttribute('data-component-name');

      if (parentDataComponentName) {
        result.componentName = parentDataComponentName;
        break;
      } else if (parentDataComponent) {
        result.componentName = parentDataComponent;
        break;
      }

      // Check for role attribute that might indicate component type
      const role = parent.getAttribute('role');
      if (role) {
        result.componentName = role.charAt(0).toUpperCase() + role.slice(1);
        break;
      }

      parent = parent.parentElement;
      depth++;
    }

    return result;
  }

  /**
   * Generate a default component path based on component name
   */
  protected generateDefaultPath(componentName: string, extension = 'tsx'): string {
    if (!componentName || componentName === 'Unknown') {
      return '';
    }

    // Convert PascalCase to kebab-case for the file path
    const kebabCase = componentName
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase();

    return `components/${kebabCase}.${extension}`;
  }
}
