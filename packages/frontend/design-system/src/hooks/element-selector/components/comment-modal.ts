import { ElementSelectorUIConfig, ModalOptions, UIElementResult, ComponentInfo } from '../types';
import { createElement } from '../utils/dom-utils';
import {
  UI_ELEMENT_STYLES,
  getPrimaryButtonStyles,
  getSecondaryButtonStyles,
  getModalHeaderStyles,
  getInfoSectionStyles,
  applyButtonHoverEffects,
  applyInputFocusEffects
} from '../utils/style-utils';

/**
 * Comment modal component for adding comments to selected elements
 */
export class CommentModal {
  private modalElement: HTMLElement | null = null;
  private backdropElement: HTMLElement | null = null;
  private inputElement: HTMLInputElement | null = null;
  private config: ElementSelectorUIConfig;
  private options: ModalOptions;

  constructor(options: ModalOptions) {
    this.config = options.config;
    this.options = options;
  }

  /**
   * Create and show the comment modal
   */
  create(): UIElementResult {
    if (this.modalElement || this.backdropElement) {
      this.destroy();
    }

    // Create backdrop
    this.backdropElement = this.createBackdrop();

    // Create modal
    this.modalElement = this.createModal();

    // Assemble the modal
    this.backdropElement.appendChild(this.modalElement);
    document.body.appendChild(this.backdropElement);

    // Focus the input after a short delay
    setTimeout(() => {
      if (this.inputElement) {
        this.inputElement.focus();
      }
    }, 100);

    return {
      element: this.modalElement,
      cleanup: () => this.destroy(),
    };
  }

  /**
   * Create the modal backdrop
   */
  private createBackdrop(): HTMLElement {
    const backdrop = createElement('div', {
      id: 'element-comment-backdrop',
      className: 'element-selector-ui',
      styles: {
        ...UI_ELEMENT_STYLES.backdrop,
        zIndex: `${this.config.zIndexBase + 6}`,
      },
      eventListeners: {
        click: (e) => {
          if (e.target === backdrop) {
            this.options.onCancel();
          }
        },
      },
    });

    return backdrop;
  }

  /**
   * Create the main modal container
   */
  private createModal(): HTMLElement {
    const modal = createElement('div', {
      id: 'element-comment-modal',
      className: 'element-selector-ui',
      styles: {
        ...UI_ELEMENT_STYLES.modal,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: `${this.config.zIndexBase + 7}`,
        width: '400px',
        maxWidth: '90vw',
        animation: 'slideIn 0.25s ease-out',
      },
      eventListeners: {
        click: (e) => e.stopPropagation(),
      },
    });

    // Add modal content
    modal.appendChild(this.createHeader());
    modal.appendChild(this.createElementInfo());

    if (this.options.componentInfo.componentName !== 'Unknown') {
      modal.appendChild(this.createComponentInfo());
    }

    modal.appendChild(this.createCommentInput());
    modal.appendChild(this.createButtons());

    return modal;
  }

  /**
   * Create modal header
   */
  private createHeader(): HTMLElement {
    const header = createElement('div', {
      styles: getModalHeaderStyles(),
    });

    const title = createElement('h3', {
      textContent: 'Add Comment to Element',
      styles: {
        margin: '0',
        fontSize: '16px',
        fontWeight: '600',
        color: '#1f2937',
      },
    });

    header.appendChild(title);
    return header;
  }

  /**
   * Create element information section
   */
  private createElementInfo(): HTMLElement {
    const elementInfo = createElement('div', {
      styles: getInfoSectionStyles(this.config, 'element'),
    });

    const tagName = this.options.element.tagName.toLowerCase();
    const idText = this.options.element.id ? `#${this.options.element.id}` : '';
    const classText = this.getClassText(this.options.element);

    // Add element type badge
    const elementBadge = createElement('div', {
      textContent: tagName,
      styles: {
        ...UI_ELEMENT_STYLES.badge,
        backgroundColor: this.config.primaryColor,
        color: this.config.textColor,
      },
    });

    // Create text container
    const textContainer = createElement('div', {
      textContent: `${tagName}${idText}${idText ? '' : classText}`,
      styles: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        paddingRight: '50px',
      },
    });

    elementInfo.appendChild(textContainer);
    elementInfo.appendChild(elementBadge);

    return elementInfo;
  }

  /**
   * Create component information section
   */
  private createComponentInfo(): HTMLElement {
    const componentInfo = createElement('div', {
      styles: getInfoSectionStyles(this.config, 'component'),
    });

    const componentBadge = createElement('div', {
      textContent: this.options.componentInfo.isReactComponent ? 'React Component' : 'Component',
      styles: {
        ...UI_ELEMENT_STYLES.badge,
        backgroundColor: '#4f46e5',
        color: 'white',
      },
    });

    const nameContainer = createElement('div', {
      textContent: `${this.options.componentInfo.componentName} (${this.options.componentInfo.componentPath})`,
      styles: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        paddingRight: '100px',
      },
    });

    componentInfo.appendChild(nameContainer);
    componentInfo.appendChild(componentBadge);

    return componentInfo;
  }

  /**
   * Create comment input section
   */
  private createCommentInput(): HTMLElement {
    const inputContainer = createElement('div', {
      styles: {
        marginBottom: '12px',
      },
    });

    const label = createElement('label', {
      textContent: 'Comment',
      attributes: {
        for: 'element-comment-input',
      },
      styles: {
        display: 'block',
        marginBottom: '6px',
        fontSize: '13px',
        fontWeight: '500',
        color: '#374151',
      },
    });

    this.inputElement = createElement('input', {
      id: 'element-comment-input',
      attributes: {
        type: 'text',
        placeholder: 'Add your comment about this element...',
      },
      styles: UI_ELEMENT_STYLES.input,
      eventListeners: {
        keydown: (e) => {
          if ((e as KeyboardEvent).key === 'Enter') {
            e.preventDefault();
            this.handleConfirm();
          }
        },
      },
    }) as HTMLInputElement;

    // Apply focus effects
    applyInputFocusEffects(this.inputElement, this.config);

    inputContainer.appendChild(label);
    inputContainer.appendChild(this.inputElement);

    return inputContainer;
  }

  /**
   * Create buttons section
   */
  private createButtons(): HTMLElement {
    const buttonsContainer = createElement('div', {
      styles: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '8px',
      },
    });

    // Cancel button
    const cancelButton = createElement('button', {
      textContent: 'Cancel',
      styles: getSecondaryButtonStyles(),
      eventListeners: {
        click: () => this.options.onCancel(),
      },
    });

    applyButtonHoverEffects(cancelButton, 'secondary', this.config);

    // Confirm button
    const confirmButton = createElement('button', {
      textContent: 'Add',
      id: 'element-comment-confirm',
      styles: getPrimaryButtonStyles(this.config),
      eventListeners: {
        click: () => this.handleConfirm(),
      },
    });

    applyButtonHoverEffects(confirmButton, 'primary', this.config);

    buttonsContainer.appendChild(cancelButton);
    buttonsContainer.appendChild(confirmButton);

    return buttonsContainer;
  }

  /**
   * Handle confirm action
   */
  private handleConfirm(): void {
    const comment = this.inputElement?.value.trim() || '';
    this.options.onConfirm(comment);
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

    const displayClasses = classes.slice(0, 2);
    return `.${displayClasses.join('.')}`;
  }

  /**
   * Set initial comment value
   */
  setInitialComment(comment: string): void {
    if (this.inputElement) {
      this.inputElement.value = comment;
    }
  }

  /**
   * Get current comment value
   */
  getCurrentComment(): string {
    return this.inputElement?.value.trim() || '';
  }

  /**
   * Show the modal
   */
  show(): void {
    if (this.backdropElement) {
      this.backdropElement.style.display = 'flex';
    }
  }

  /**
   * Hide the modal
   */
  hide(): void {
    if (this.backdropElement) {
      this.backdropElement.style.display = 'none';
    }
  }

  /**
   * Focus the input
   */
  focusInput(): void {
    if (this.inputElement) {
      this.inputElement.focus();
    }
  }

  /**
   * Update modal configuration
   */
  updateConfig(config: ElementSelectorUIConfig): void {
    this.config = config;

    if (this.backdropElement) {
      this.backdropElement.style.zIndex = `${config.zIndexBase + 6}`;
    }

    if (this.modalElement) {
      this.modalElement.style.zIndex = `${config.zIndexBase + 7}`;
    }

    // Update button styles
    const confirmButton = this.modalElement?.querySelector('#element-comment-confirm') as HTMLElement;
    if (confirmButton) {
      Object.assign(confirmButton.style, getPrimaryButtonStyles(config));
    }
  }

  /**
   * Animate modal entrance
   */
  animateIn(): void {
    if (!this.modalElement || !this.backdropElement) return;

    this.backdropElement.style.opacity = '0';
    this.modalElement.style.opacity = '0';
    this.modalElement.style.transform = 'translate(-50%, -55%)';

    requestAnimationFrame(() => {
      if (this.backdropElement && this.modalElement) {
        this.backdropElement.style.transition = 'opacity 0.2s ease';
        this.modalElement.style.transition = 'opacity 0.25s ease, transform 0.25s ease';

        this.backdropElement.style.opacity = '1';
        this.modalElement.style.opacity = '1';
        this.modalElement.style.transform = 'translate(-50%, -50%)';
      }
    });
  }

  /**
   * Animate modal exit
   */
  animateOut(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.modalElement || !this.backdropElement) {
        resolve();
        return;
      }

      this.backdropElement.style.transition = 'opacity 0.15s ease';
      this.modalElement.style.transition = 'opacity 0.2s ease, transform 0.2s ease';

      this.backdropElement.style.opacity = '0';
      this.modalElement.style.opacity = '0';
      this.modalElement.style.transform = 'translate(-50%, -55%)';

      setTimeout(() => {
        this.destroy();
        resolve();
      }, 200);
    });
  }

  /**
   * Destroy the modal
   */
  destroy(): void {
    if (this.backdropElement && this.backdropElement.parentNode) {
      this.backdropElement.parentNode.removeChild(this.backdropElement);
    }

    this.modalElement = null;
    this.backdropElement = null;
    this.inputElement = null;
  }

  /**
   * Get the modal element
   */
  getElement(): HTMLElement | null {
    return this.modalElement;
  }

  /**
   * Get the backdrop element
   */
  getBackdrop(): HTMLElement | null {
    return this.backdropElement;
  }
}
