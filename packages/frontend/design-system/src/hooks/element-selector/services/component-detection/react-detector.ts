import { ComponentInfo } from '../../types';
import { BaseComponentDetector } from './base-detector';

/**
 * React-specific component detector
 * Detects React components by analyzing React internals and fiber nodes
 */
export class ReactComponentDetector extends BaseComponentDetector {
  framework = 'react';

  /**
   * Check if this detector can handle the given element
   * Looks for React-specific properties on the element
   */
  canDetect(element: HTMLElement): boolean {
    return this.findReactInternalKey(element) !== undefined;
  }

  /**
   * Detect React component information from an element
   */
  detectComponent(element: HTMLElement): Partial<ComponentInfo> {
    const result: Partial<ComponentInfo> = {
      framework: 'react' as const,
      isReactComponent: true,
    };

    try {
      // Try to extract from React internals first
      const reactKey = this.findReactInternalKey(element);
      if (reactKey) {
        const fiberInfo = this.extractFromReactFiber(element, reactKey);
        Object.assign(result, fiberInfo);
      }

      // Fall back to common detection methods if React internals don't provide enough info
      if (!result.componentName || result.componentName === 'Unknown') {
        const dataInfo = this.extractFromDataAttributes(element);
        Object.assign(result, dataInfo);
      }

      if (!result.componentName || result.componentName === 'Unknown') {
        const classInfo = this.extractFromClassNames(element);
        Object.assign(result, classInfo);
      }

      if (!result.componentName || result.componentName === 'Unknown') {
        const idInfo = this.extractFromId(element);
        Object.assign(result, idInfo);
      }

      if (!result.componentName || result.componentName === 'Unknown') {
        const parentInfo = this.extractFromParents(element);
        Object.assign(result, parentInfo);
      }

      // Generate default path if we have a component name but no path
      if (result.componentName && result.componentName !== 'Unknown' && !result.componentPath) {
        result.componentPath = this.generateDefaultPath(result.componentName);
      }

      // Set default values
      if (!result.componentName) {
        result.componentName = 'Unknown';
      }
    } catch (error) {
      console.error('Error detecting React component information:', error);
      result.componentName = 'Unknown';
      result.componentPath = '';
    }

    return result;
  }

  /**
   * Find a React internal key in the element's properties
   */
  private findReactInternalKey(element: HTMLElement): string | undefined {
    return Object.keys(element).find(
      (key) =>
        key.startsWith('__reactFiber$') ||
        key.startsWith('__reactInternalInstance$') ||
        key.startsWith('__reactProps$') ||
        key.startsWith('_reactInternals')
    );
  }

  /**
   * Extract component information from React fiber node
   */
  private extractFromReactFiber(element: HTMLElement, reactKey: string): Partial<ComponentInfo> {
    const result: Partial<ComponentInfo> = {};

    try {
      // @ts-expect-error - accessing dynamic properties
      const fiberNode = element[reactKey];
      if (!fiberNode) return result;

      // Navigate up the fiber tree to find component names
      let fiber = fiberNode;
      let foundName = false;
      let depth = 0;
      const maxDepth = 10; // Limit depth to prevent infinite loops

      // Try to find a named component in the fiber tree
      while (fiber && !foundName && depth < maxDepth) {
        if (fiber.type) {
          // Check for function components
          if (typeof fiber.type === 'function') {
            result.componentName = fiber.type.displayName || fiber.type.name || 'UnnamedComponent';
            foundName = true;
          }
          // Check for forwardRef and memo components
          else if (typeof fiber.type === 'object' && fiber.type !== null) {
            // ForwardRef components
            if (fiber.type.render && typeof fiber.type.render === 'function') {
              result.componentName =
                fiber.type.render.name ||
                fiber.type.displayName ||
                'ForwardRefComponent';
              foundName = true;
            }
            // Memo components
            else if (
              fiber.type.$$typeof &&
              fiber.type.type &&
              typeof fiber.type.type === 'function'
            ) {
              result.componentName =
                fiber.type.type.displayName ||
                fiber.type.type.name ||
                'MemoComponent';
              foundName = true;
            }
            // Components with displayName
            else if (fiber.type.displayName) {
              result.componentName = fiber.type.displayName;
              foundName = true;
            }
          }
        }

        // Check for component name in stateNode
        if (!foundName && fiber.stateNode && fiber.stateNode.constructor) {
          if (
            fiber.stateNode.constructor.name &&
            fiber.stateNode.constructor.name !== 'HTMLDivElement' &&
            !fiber.stateNode.constructor.name.startsWith('HTML')
          ) {
            result.componentName = fiber.stateNode.constructor.name;
            foundName = true;
          }
        }

        // Move up the fiber tree
        fiber = fiber.return;
        depth++;
      }
    } catch (error) {
      console.error('Error extracting from React fiber:', error);
    }

    return result;
  }

  /**
   * Check if an element has React DevTools data
   */
  private hasReactDevToolsData(element: HTMLElement): boolean {
    // Check for React DevTools specific data attributes
    return !!(
      element.getAttribute('data-reactroot') ||
      element.getAttribute('data-reactid') ||
      Object.keys(element).some(key => key.startsWith('__reactContainer'))
    );
  }

  /**
   * Extract component props if available (for debugging purposes)
   */
  private extractComponentProps(element: HTMLElement): Record<string, unknown> | undefined {
    try {
      const reactKey = this.findReactInternalKey(element);
      if (!reactKey) return undefined;

      // @ts-expect-error - accessing dynamic properties
      const fiberNode = element[reactKey];
      if (!fiberNode) return undefined;

      // Try to get props from the fiber node
      let fiber = fiberNode;
      let depth = 0;
      const maxDepth = 5;

      while (fiber && depth < maxDepth) {
        if (fiber.memoizedProps && typeof fiber.memoizedProps === 'object') {
          return fiber.memoizedProps;
        }
        if (fiber.pendingProps && typeof fiber.pendingProps === 'object') {
          return fiber.pendingProps;
        }
        fiber = fiber.return;
        depth++;
      }
    } catch (error) {
      console.error('Error extracting component props:', error);
    }

    return undefined;
  }
}
