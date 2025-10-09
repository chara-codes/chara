import { ElementSelectorUIConfig, UIElementResult } from '../types';
import { createElement } from '../utils/dom-utils';
import { getSelectionGuideStyles, generateSelectionGuideIconSVG } from '../utils/style-utils';

/**
 * Selection guide component that displays instructions during element selection
 */
export class SelectionGuide {
  private element: HTMLElement | null = null;
  private config: ElementSelectorUIConfig;
  private message: string;

  constructor(config: ElementSelectorUIConfig, message = 'Click on any element to select it. Press ESC to cancel.') {
    this.config = config;
    this.message = message;
  }

  /**
   * Create and show the selection guide
   */
  create(): UIElementResult {
    if (this.element) {
      this.destroy();
    }

    this.element = createElement('div', {
      id: 'element-selection-guide',
      className: 'element-selector-ui',
      styles: getSelectionGuideStyles(this.config),
    });

    // Add icon
    const iconSpan = createElement('span', {
      innerHTML: generateSelectionGuideIconSVG(),
    });
    this.element.appendChild(iconSpan);

    // Add text content
    const textSpan = createElement('span', {
      textContent: this.message,
    });
    this.element.appendChild(textSpan);

    document.body.appendChild(this.element);

    return {
      element: this.element,
      cleanup: () => this.destroy(),
    };
  }

  /**
   * Update the guide message
   */
  updateMessage(message: string): void {
    this.message = message;
    if (this.element) {
      const textSpan = this.element.querySelector('span:last-child');
      if (textSpan) {
        textSpan.textContent = message;
      }
    }
  }

  /**
   * Show the selection guide
   */
  show(): void {
    if (this.element) {
      this.element.style.display = 'flex';
    }
  }

  /**
   * Hide the selection guide
   */
  hide(): void {
    if (this.element) {
      this.element.style.display = 'none';
    }
  }

  /**
   * Check if selection guide is visible
   */
  isVisible(): boolean {
    return this.element ? this.element.style.display !== 'none' : false;
  }

  /**
   * Update position of the guide
   */
  updatePosition(position: 'top' | 'bottom' | 'center' = 'top'): void {
    if (!this.element) return;

    switch (position) {
      case 'top':
        this.element.style.top = '20px';
        this.element.style.bottom = 'auto';
        break;
      case 'bottom':
        this.element.style.top = 'auto';
        this.element.style.bottom = '20px';
        break;
      case 'center':
        this.element.style.top = '50%';
        this.element.style.bottom = 'auto';
        this.element.style.transform = 'translate(-50%, -50%)';
        break;
    }
  }

  /**
   * Update the selection guide configuration
   */
  updateConfig(config: ElementSelectorUIConfig): void {
    this.config = config;
    if (this.element) {
      Object.assign(this.element.style, getSelectionGuideStyles(config));
    }
  }

  /**
   * Set the guide as loading state
   */
  setLoading(isLoading: boolean): void {
    if (!this.element) return;

    if (isLoading) {
      this.updateMessage('Processing selection...');
      this.element.style.opacity = '0.7';
    } else {
      this.updateMessage(this.message);
      this.element.style.opacity = '1';
    }
  }

  /**
   * Animate the guide entrance
   */
  animateIn(): void {
    if (!this.element) return;

    this.element.style.opacity = '0';
    this.element.style.transform = 'translate(-50%, -20px)';

    // Trigger animation
    requestAnimationFrame(() => {
      if (this.element) {
        this.element.style.transition = 'all 0.3s ease-out';
        this.element.style.opacity = '1';
        this.element.style.transform = 'translate(-50%, 0)';
      }
    });
  }

  /**
   * Animate the guide exit
   */
  animateOut(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.element) {
        resolve();
        return;
      }

      this.element.style.transition = 'all 0.2s ease-in';
      this.element.style.opacity = '0';
      this.element.style.transform = 'translate(-50%, -20px)';

      setTimeout(() => {
        this.destroy();
        resolve();
      }, 200);
    });
  }

  /**
   * Add a close button to the guide
   */
  addCloseButton(onClose: () => void): void {
    if (!this.element) return;

    const closeButton = createElement('button', {
      innerHTML: '×',
      styles: {
        background: 'none',
        border: 'none',
        color: 'inherit',
        fontSize: '18px',
        fontWeight: 'bold',
        cursor: 'pointer',
        marginLeft: '8px',
        padding: '0',
        width: '20px',
        height: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        transition: 'background-color 0.2s ease',
      },
      eventListeners: {
        click: onClose,
        mouseover: (e) => {
          (e.target as HTMLElement).style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        },
        mouseout: (e) => {
          (e.target as HTMLElement).style.backgroundColor = 'transparent';
        },
      },
    });

    this.element.appendChild(closeButton);
  }

  /**
   * Destroy the selection guide
   */
  destroy(): void {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
      this.element = null;
    }
  }

  /**
   * Get the selection guide element
   */
  getElement(): HTMLElement | null {
    return this.element;
  }
}
