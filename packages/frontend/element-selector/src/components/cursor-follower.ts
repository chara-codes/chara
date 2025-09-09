import { ElementSelectorUIConfig, UIElementResult } from '../types';
import { createElement } from '../utils/dom-utils';
import { getCursorFollowerStyles, generateCrosshairSVG } from '../utils/style-utils';

/**
 * Cursor follower component that displays a crosshair cursor during element selection
 */
export class CursorFollower {
  private element: HTMLElement | null = null;
  private config: ElementSelectorUIConfig;

  constructor(config: ElementSelectorUIConfig) {
    this.config = config;
  }

  /**
   * Create and show the cursor follower
   */
  create(): UIElementResult {
    if (this.element) {
      this.destroy();
    }

    this.element = createElement('div', {
      id: 'element-selector-cursor',
      className: 'element-selector-ui',
      styles: getCursorFollowerStyles(this.config),
      innerHTML: generateCrosshairSVG(this.config),
    });

    document.body.appendChild(this.element);

    return {
      element: this.element,
      cleanup: () => this.destroy(),
    };
  }

  /**
   * Update cursor position
   */
  updatePosition(x: number, y: number): void {
    if (this.element) {
      this.element.style.top = `${y}px`;
      this.element.style.left = `${x}px`;
    }
  }

  /**
   * Show the cursor follower
   */
  show(): void {
    if (this.element) {
      this.element.style.display = 'block';
    }
  }

  /**
   * Hide the cursor follower
   */
  hide(): void {
    if (this.element) {
      this.element.style.display = 'none';
    }
  }

  /**
   * Check if cursor follower is visible
   */
  isVisible(): boolean {
    return this.element ? this.element.style.display !== 'none' : false;
  }

  /**
   * Update the cursor follower configuration
   */
  updateConfig(config: ElementSelectorUIConfig): void {
    this.config = config;
    if (this.element) {
      // Update styles
      Object.assign(this.element.style, getCursorFollowerStyles(config));
      // Update SVG content
      this.element.innerHTML = generateCrosshairSVG(config);
    }
  }

  /**
   * Destroy the cursor follower
   */
  destroy(): void {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
      this.element = null;
    }
  }

  /**
   * Get the cursor follower element
   */
  getElement(): HTMLElement | null {
    return this.element;
  }
}
