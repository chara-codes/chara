import { ElementSelectorUI } from "../components/element-selector-ui";
import { componentDetectionService } from "../services/component-detection";
import type { ComponentInfo, SelectionEventHandlers } from "../types";
import { getElementAtPoint, isUIElement } from "../utils/dom-utils";

/**
 * Selection event handlers for element selection functionality
 * Manages mouse and keyboard events during element selection mode
 */
export class SelectionHandlers {
  private ui: ElementSelectorUI;
  private handlers: SelectionEventHandlers = {};
  private currentHighlightedElement: HTMLElement | null = null;
  private isActive = false;
  private onElementSelected: (
    element: HTMLElement,
    componentInfo: ComponentInfo
  ) => void;
  private onSelectionCanceled: () => void;

  // Event handlers
  private boundMouseMove: (e: MouseEvent) => void;
  private boundHighlight: (element: HTMLElement) => void;

  constructor(
    ui: ElementSelectorUI,
    onElementSelected: (
      element: HTMLElement,
      componentInfo: ComponentInfo
    ) => void,
    onSelectionCanceled: () => void
  ) {
    this.ui = ui;
    this.onElementSelected = onElementSelected;
    this.onSelectionCanceled = onSelectionCanceled;

    // Create bound handlers for consistent reference
    this.boundMouseMove = this.handleMouseMove.bind(this);
    this.boundHighlight = this.highlightElement.bind(this);
  }

  /**
   * Start selection mode and attach event listeners
   */
  startSelection(): void {
    if (this.isActive) {
      return;
    }

    this.isActive = true;

    // Create event handlers
    this.handlers = {
      handleElementClick: this.handleElementClick.bind(this),
      handleKeyDownEscape: this.handleKeyDownEscape.bind(this),
      handleMouseMove: this.boundMouseMove,
    };

    // Attach event listeners
    this.attachEventListeners();

    console.log("Selection handlers activated");
    console.log("Event handlers created:", Object.keys(this.handlers));
  }

  /**
   * Stop selection mode and remove event listeners
   */
  stopSelection(): void {
    if (!this.isActive) {
      return;
    }

    this.isActive = false;

    // Remove event listeners
    this.removeEventListeners();

    // Clear current highlight
    this.clearHighlight();

    // Clear handler references
    this.handlers = {};

    console.log("Selection handlers deactivated");
  }

  /**
   * Attach event listeners to document
   */
  private attachEventListeners(): void {
    console.log("Attaching event listeners...");

    if (this.handlers.handleMouseMove) {
      document.addEventListener("mousemove", this.handlers.handleMouseMove);
      console.log("✓ Mouse move listener attached");
    }
    if (this.handlers.handleElementClick) {
      document.addEventListener(
        "click",
        this.handlers.handleElementClick,
        true
      );
      console.log("✓ Click listener attached with capture=true");
    }
    if (this.handlers.handleKeyDownEscape) {
      document.addEventListener("keydown", this.handlers.handleKeyDownEscape);
      console.log("✓ Keydown listener attached");
    }
  }

  /**
   * Remove event listeners from document
   */
  private removeEventListeners(): void {
    console.log("Removing event listeners...");

    if (this.handlers.handleMouseMove) {
      document.removeEventListener("mousemove", this.handlers.handleMouseMove);
      console.log("✓ Mouse move listener removed");
    }
    if (this.handlers.handleElementClick) {
      document.removeEventListener(
        "click",
        this.handlers.handleElementClick,
        true
      );
      console.log("✓ Click listener removed");
    }
    if (this.handlers.handleKeyDownEscape) {
      document.removeEventListener(
        "keydown",
        this.handlers.handleKeyDownEscape
      );
      console.log("✓ Keydown listener removed");
    }
  }

  /**
   * Handle mouse move events during selection
   */
  private handleMouseMove(e: MouseEvent): void {
    if (!this.isActive) return;

    // Update cursor position
    this.ui.updateCursorPosition(e.clientX, e.clientY);

    // Get element at cursor position
    const element = getElementAtPoint(e.clientX, e.clientY);

    if (!element || isUIElement(element)) {
      this.clearHighlight();
      this.ui.hideTagDisplay();
      return;
    }

    // Only update if element changed to avoid unnecessary work
    if (element !== this.currentHighlightedElement) {
      this.highlightElement(element);
    }
  }

  /**
   * Handle element click during selection
   */
  private handleElementClick(e: MouseEvent): void {
    console.log("Click event received:", e.target);

    if (!this.isActive) {
      console.log("Selection handlers not active, ignoring click");
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const element = e.target as HTMLElement;
    console.log(
      "Processing click on element:",
      element.tagName,
      element.className,
      element.id
    );

    // Skip if this is a UI element
    if (isUIElement(element)) {
      console.log("Skipping UI element:", element);
      return;
    }

    console.log("Element clicked, processing:", element);

    // Detect component information
    const componentInfo = componentDetectionService.detectComponent(element);

    console.log("Component info detected:", componentInfo);

    // Trigger element selection
    this.onElementSelected(element, componentInfo);
  }

  /**
   * Handle escape key press
   */
  private handleKeyDownEscape(e: KeyboardEvent): void {
    if (!this.isActive) return;

    if (e.key === "Escape") {
      e.preventDefault();
      this.onSelectionCanceled();
    }
  }

  /**
   * Highlight an element and update tag display
   */
  private highlightElement(element: HTMLElement): void {
    if (!this.isActive) return;

    // Clear previous highlight
    this.clearHighlight();

    // Set new highlighted element
    this.currentHighlightedElement = element;

    // Add highlight
    this.ui.highlightElement(element);

    // Detect component information for tag display
    const componentInfo = componentDetectionService.detectComponent(element);

    // Update tag display
    this.ui.updateTagDisplay(element, componentInfo);
  }

  /**
   * Clear current element highlight
   */
  private clearHighlight(): void {
    if (this.currentHighlightedElement) {
      this.ui.removeHighlights();
      this.currentHighlightedElement = null;
    }
  }

  /**
   * Check if selection is currently active
   */
  isSelectionActive(): boolean {
    return this.isActive;
  }

  /**
   * Get currently highlighted element
   */
  getCurrentHighlightedElement(): HTMLElement | null {
    return this.currentHighlightedElement;
  }

  /**
   * Force clear all highlights and UI state
   */
  forceReset(): void {
    this.clearHighlight();
    this.ui.hideTagDisplay();
    this.ui.removeHighlights();
  }

  /**
   * Update selection message in the guide
   */
  updateSelectionMessage(message: string): void {
    this.ui.updateSelectionGuideMessage(message);
  }

  /**
   * Set loading state for selection
   */
  setLoadingState(isLoading: boolean): void {
    this.ui.setSelectionGuideLoading(isLoading);
  }

  /**
   * Temporarily pause selection (useful during modal display)
   */
  pauseSelection(): void {
    if (!this.isActive) return;

    this.removeEventListeners();
    this.ui.hideSelectionUI();
  }

  /**
   * Resume selection after pause
   */
  resumeSelection(): void {
    if (!this.isActive) return;

    this.attachEventListeners();
    this.ui.showSelectionUI();
  }

  /**
   * Get event handlers for external access (useful for cleanup)
   */
  getHandlers(): SelectionEventHandlers {
    return { ...this.handlers };
  }

  /**
   * Handle special key combinations during selection
   */
  private handleSpecialKeys(e: KeyboardEvent): void {
    if (!this.isActive) return;

    switch (e.key) {
      case "h":
      case "H":
        // Toggle help message
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this.toggleHelpMessage();
        }
        break;
      case "c":
      case "C":
        // Clear current selection
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this.forceReset();
        }
        break;
    }
  }

  /**
   * Toggle help message in selection guide
   */
  private toggleHelpMessage(): void {
    const helpMessage =
      "Use mouse to hover and click elements. Press ESC to cancel, Ctrl+C to clear.";
    const defaultMessage =
      "Click on any element to select it. Press ESC to cancel.";

    // This would need to be implemented based on current message state
    this.updateSelectionMessage(helpMessage);

    // Reset to default message after a delay
    setTimeout(() => {
      this.updateSelectionMessage(defaultMessage);
    }, 3000);
  }

  /**
   * Handle window resize during selection
   */
  private handleWindowResize(): void {
    if (!this.isActive) return;

    // Clear current highlight as positions may have changed
    this.clearHighlight();
    this.ui.hideTagDisplay();
  }

  /**
   * Handle window blur (user switches away from window)
   */
  private handleWindowBlur(): void {
    if (!this.isActive) return;

    // Pause selection to prevent issues when window is not focused
    this.pauseSelection();
  }

  /**
   * Handle window focus (user returns to window)
   */
  private handleWindowFocus(): void {
    if (!this.isActive) return;

    // Resume selection when window regains focus
    this.resumeSelection();
  }
}
