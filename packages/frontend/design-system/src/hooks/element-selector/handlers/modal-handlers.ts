import { ComponentInfo, ElementContextItem } from '../types';
import { CommentModal } from '../components/comment-modal';
import { getElementText, getElementHTML } from '../utils/dom-utils';

/**
 * Modal event handlers for managing comment modal interactions
 * Handles modal lifecycle, validation, and data processing
 */
export class ModalHandlers {
  private modal: CommentModal | null = null;
  private currentElement: HTMLElement | null = null;
  private currentComponentInfo: ComponentInfo | null = null;
  private onAddContext: (contextItem: ElementContextItem) => void;
  private onModalClosed: () => void;

  constructor(
    onAddContext: (contextItem: ElementContextItem) => void,
    onModalClosed: () => void
  ) {
    this.onAddContext = onAddContext;
    this.onModalClosed = onModalClosed;
  }

  /**
   * Show modal for the given element
   */
  showModal(
    element: HTMLElement,
    componentInfo: ComponentInfo,
    modal: CommentModal
  ): void {
    this.currentElement = element;
    this.currentComponentInfo = componentInfo;
    this.modal = modal;

    // Set up modal-specific event listeners
    this.attachModalEventListeners();
  }

  /**
   * Handle modal confirmation (add comment)
   */
  handleConfirm(comment: string): void {
    if (!this.currentElement || !this.currentComponentInfo) {
      console.error('No element or component info available for confirmation');
      return;
    }

    try {
      // Validate comment
      const trimmedComment = comment.trim();
      if (!trimmedComment) {
        this.showValidationError('Please enter a comment before adding the element.');
        return;
      }

      // Create element context item
      const elementInfo = this.createElementContextItem(
        this.currentElement,
        this.currentComponentInfo,
        trimmedComment
      );

      console.log('Adding element to context:', elementInfo);

      // Add to context
      this.onAddContext(elementInfo);

      // Close modal
      this.closeModal();
    } catch (error) {
      console.error('Error handling modal confirmation:', error);
      this.showValidationError('An error occurred while adding the element. Please try again.');
    }
  }

  /**
   * Handle modal cancellation
   */
  handleCancel(): void {
    console.log('Modal cancelled by user');
    this.closeModal();
  }

  /**
   * Close the modal and clean up
   */
  private closeModal(): void {
    this.removeModalEventListeners();
    this.currentElement = null;
    this.currentComponentInfo = null;
    this.modal = null;
    this.onModalClosed();
  }

  /**
   * Create element context item from element and component info
   */
  private createElementContextItem(
    element: HTMLElement,
    componentInfo: ComponentInfo,
    comment: string
  ): ElementContextItem {
    const elementName = this.generateElementName(element);

    return {
      name: elementName,
      type: 'Element',
      data: {
        tagName: element.tagName,
        id: element.id || '',
        className: element.className || '',
        textContent: getElementText(element, 100),
        html: getElementHTML(element, 500),
        comment: comment,
        component: componentInfo,
      },
    };
  }

  /**
   * Generate a descriptive name for the element
   */
  private generateElementName(element: HTMLElement): string {
    const tagName = element.tagName.toLowerCase();

    if (element.id) {
      return `${tagName}#${element.id}`;
    }

    if (element.className && typeof element.className === 'string') {
      const firstClass = element.className.trim().split(' ')[0];
      if (firstClass) {
        return `${tagName}.${firstClass}`;
      }
    }

    // Try to use component name if available
    if (this.currentComponentInfo?.componentName &&
        this.currentComponentInfo.componentName !== 'Unknown') {
      return `${tagName} (${this.currentComponentInfo.componentName})`;
    }

    return tagName;
  }

  /**
   * Show validation error to user
   */
  private showValidationError(message: string): void {
    if (this.modal) {
      // Focus the input to indicate where the error is
      this.modal.focusInput();

      // You could extend this to show actual error messages in the UI
      console.warn('Validation error:', message);

      // Simple alert for now - could be replaced with in-modal error display
      alert(message);
    }
  }

  /**
   * Attach modal-specific event listeners
   */
  private attachModalEventListeners(): void {
    // Listen for escape key to close modal
    document.addEventListener('keydown', this.handleModalKeyDown.bind(this));

    // Listen for clicks outside modal to close
    document.addEventListener('click', this.handleOutsideClick.bind(this));
  }

  /**
   * Remove modal-specific event listeners
   */
  private removeModalEventListeners(): void {
    document.removeEventListener('keydown', this.handleModalKeyDown.bind(this));
    document.removeEventListener('click', this.handleOutsideClick.bind(this));
  }

  /**
   * Handle keyboard events in modal
   */
  private handleModalKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.preventDefault();
      this.handleCancel();
    }
  }

  /**
   * Handle clicks outside modal backdrop
   */
  private handleOutsideClick(e: MouseEvent): void {
    if (!this.modal) return;

    const backdrop = this.modal.getBackdrop();
    if (backdrop && e.target === backdrop) {
      this.handleCancel();
    }
  }

  /**
   * Validate comment input
   */
  private validateComment(comment: string): { isValid: boolean; error?: string } {
    const trimmed = comment.trim();

    if (!trimmed) {
      return { isValid: false, error: 'Comment cannot be empty' };
    }

    if (trimmed.length < 2) {
      return { isValid: false, error: 'Comment must be at least 2 characters long' };
    }

    if (trimmed.length > 500) {
      return { isValid: false, error: 'Comment cannot exceed 500 characters' };
    }

    return { isValid: true };
  }

  /**
   * Handle modal form submission with validation
   */
  handleFormSubmit(comment: string): void {
    const validation = this.validateComment(comment);

    if (!validation.isValid) {
      this.showValidationError(validation.error || 'Invalid comment');
      return;
    }

    this.handleConfirm(comment);
  }

  /**
   * Get current modal state
   */
  getModalState(): {
    isOpen: boolean;
    element: HTMLElement | null;
    componentInfo: ComponentInfo | null;
  } {
    return {
      isOpen: this.modal !== null,
      element: this.currentElement,
      componentInfo: this.currentComponentInfo,
    };
  }

  /**
   * Force close modal (emergency cleanup)
   */
  forceClose(): void {
    try {
      this.removeModalEventListeners();

      if (this.modal) {
        this.modal.destroy();
      }

      this.currentElement = null;
      this.currentComponentInfo = null;
      this.modal = null;
    } catch (error) {
      console.error('Error during force close:', error);
    }
  }

  /**
   * Update modal content if element or component info changes
   */
  updateModalContent(element: HTMLElement, componentInfo: ComponentInfo): void {
    this.currentElement = element;
    this.currentComponentInfo = componentInfo;

    // If modal is open, you could update its content here
    // This would require extending the CommentModal class to support updates
  }

  /**
   * Set initial comment value in modal
   */
  setInitialComment(comment: string): void {
    if (this.modal) {
      this.modal.setInitialComment(comment);
    }
  }

  /**
   * Get current comment value from modal
   */
  getCurrentComment(): string {
    return this.modal ? this.modal.getCurrentComment() : '';
  }
}
