import { ElementSelectorUIConfig, UIElementResult, ComponentInfo } from '../types';
import { createElement } from '../utils/dom-utils';
import { getTagDisplayStyles } from '../utils/style-utils';

/**
 * Tag display component that shows element information when hovering during selection
 */
export class TagDisplay {
  private element: HTMLElement | null = null;
  private config: ElementSelectorUIConfig;
  private isVisible = false;

  constructor(config: ElementSelectorUIConfig) {
    this.config = config;
  }

  /**
   * Create and initialize the tag display
   */
  create(): UIElementResult {
    if (this.element) {
      this.destroy();
    }

    this.element = createElement('div', {
      id: 'element-tag-display',
      className: 'element-tag element-selector-ui',
      styles: getTagDisplayStyles(this.config),
    });

    document.body.appendChild(this.element);

    return {
      element: this.element,
      cleanup: () => this.destroy(),
    };
  }

  /**
   * Update tag content based on element information
   */
  updateContent(element: HTMLElement, componentInfo?: ComponentInfo): void {
    if (!this.element) return;

    const tagName = element.tagName.toLowerCase();
    const idText = element.id ? `#${element.id}` : '';
    const classText = this.getClassText(element);
    const componentText = this.getComponentText(componentInfo);

    // Build the display text
    const displayText = tagName + idText + (idText ? '' : classText) + componentText;

    this.element.textContent = displayText;
  }

  /**
   * Get formatted class text for display
   */
  private getClassText(element: HTMLElement): string {
    if (!element.className || typeof element.className !== 'string') {
      return '';
    }

    const classes = element.className.trim().split(/\s+/);
    if (classes.length === 0) return '';

    // Show first 2-3 classes to avoid overcrowding
    const displayClasses = classes.slice(0, 3);
    return `.${displayClasses.join('.')}`;
  }

  /**
   * Get formatted component text for display
   */
  private getComponentText(componentInfo?: ComponentInfo): string {
    if (!componentInfo || !componentInfo.isReactComponent || componentInfo.componentName === 'Unknown') {
      return '';
    }

    return ` (${componentInfo.componentName})`;
  }

  /**
   * Position the tag relative to an element
   */
  positionRelativeTo(targetElement: HTMLElement, offset = 40): void {
    if (!this.element) return;

    const rect = targetElement.getBoundingClientRect();
    const tagRect = this.element.getBoundingClientRect();

    // Position above the element by default
    let top = Math.max(0, rect.top - offset);
    let left = rect.left + rect.width / 2 - tagRect.width / 2;

    // Ensure the tag stays within viewport bounds
    const maxLeft = window.innerWidth - tagRect.width;
    const maxTop = window.innerHeight - tagRect.height;

    left = Math.max(0, Math.min(left, maxLeft));
    top = Math.max(0, Math.min(top, maxTop));

    // If positioning above would put it off-screen, position below
    if (rect.top < offset + 10) {
      top = rect.bottom + 10;
    }

    this.element.style.top = `${top}px`;
    this.element.style.left = `${left}px`;
  }

  /**
   * Show the tag display
   */
  show(): void {
    if (this.element) {
      this.element.style.display = 'block';
      this.isVisible = true;
    }
  }

  /**
   * Hide the tag display
   */
  hide(): void {
    if (this.element) {
      this.element.style.display = 'none';
      this.isVisible = false;
    }
  }

  /**
   * Check if tag display is visible
   */
  getIsVisible(): boolean {
    return this.isVisible;
  }

  /**
   * Update tag position smoothly
   */
  updatePosition(x: number, y: number, smooth = true): void {
    if (!this.element) return;

    if (smooth) {
      this.element.style.transition = 'top 0.2s ease, left 0.2s ease';
    } else {
      this.element.style.transition = 'none';
    }

    this.element.style.top = `${y}px`;
    this.element.style.left = `${x}px`;
  }

  /**
   * Set custom content for the tag
   */
  setContent(content: string): void {
    if (this.element) {
      this.element.textContent = content;
    }
  }

  /**
   * Add a small delay before showing to prevent flickering
   */
  showWithDelay(delay = 100): void {
    setTimeout(() => {
      this.show();
    }, delay);
  }

  /**
   * Update the tag display configuration
   */
  updateConfig(config: ElementSelectorUIConfig): void {
    this.config = config;
    if (this.element) {
      Object.assign(this.element.style, getTagDisplayStyles(config));
    }
  }

  /**
   * Set the tag style variant
   */
  setVariant(variant: 'default' | 'component' | 'warning'): void {
    if (!this.element) return;

    // Reset to default styles
    Object.assign(this.element.style, getTagDisplayStyles(this.config));

    switch (variant) {
      case 'component':
        this.element.style.backgroundColor = '#4f46e5';
        this.element.style.borderColor = '#c7d2fe';
        break;
      case 'warning':
        this.element.style.backgroundColor = '#f59e0b';
        this.element.style.borderColor = '#fbbf24';
        break;
      default:
        // Keep default styles
        break;
    }
  }

  /**
   * Animate tag entrance
   */
  animateIn(): void {
    if (!this.element) return;

    this.element.style.opacity = '0';
    this.element.style.transform = 'translateY(-10px)';
    this.show();

    requestAnimationFrame(() => {
      if (this.element) {
        this.element.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
        this.element.style.opacity = '1';
        this.element.style.transform = 'translateY(-5px)';
      }
    });
  }

  /**
   * Animate tag exit
   */
  animateOut(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.element) {
        resolve();
        return;
      }

      this.element.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
      this.element.style.opacity = '0';
      this.element.style.transform = 'translateY(-15px)';

      setTimeout(() => {
        this.hide();
        resolve();
      }, 150);
    });
  }

  /**
   * Check if a point is within the tag bounds (for collision detection)
   */
  containsPoint(x: number, y: number): boolean {
    if (!this.element || !this.isVisible) return false;

    const rect = this.element.getBoundingClientRect();
    return (
      x >= rect.left &&
      x <= rect.right &&
      y >= rect.top &&
      y <= rect.bottom
    );
  }

  /**
   * Destroy the tag display
   */
  destroy(): void {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
      this.element = null;
      this.isVisible = false;
    }
  }

  /**
   * Get the tag display element
   */
  getElement(): HTMLElement | null {
    return this.element;
  }
}
