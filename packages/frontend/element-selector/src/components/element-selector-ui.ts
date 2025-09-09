import { ComponentInfo, ElementSelectorUIConfig } from "../types";
import { cleanupSelectionUI, createStyleElement } from "../utils/dom-utils";
import {
  DEFAULT_UI_CONFIG,
  generateHighlightStyles,
} from "../utils/style-utils";
import { CommentModal } from "./comment-modal";
import { CursorFollower } from "./cursor-follower";
import { SelectionGuide } from "./selection-guide";
import { TagDisplay } from "./tag-display";

/**
 * Main UI manager for element selector components
 * Orchestrates all UI components during element selection
 */
export class ElementSelectorUI {
  private config: ElementSelectorUIConfig;
  private cursorFollower: CursorFollower | null = null;
  private selectionGuide: SelectionGuide | null = null;
  private tagDisplay: TagDisplay | null = null;
  private commentModal: CommentModal | null = null;
  private styleElement: HTMLStyleElement | null = null;
  private isInitialized = false;

  constructor(config: ElementSelectorUIConfig = DEFAULT_UI_CONFIG) {
    this.config = config;
  }

  /**
   * Initialize all UI components for element selection
   */
  initialize(): void {
    if (this.isInitialized) {
      this.cleanup();
    }

    // Create highlight styles
    this.createStyles();

    // Initialize components
    this.cursorFollower = new CursorFollower(this.config);
    this.selectionGuide = new SelectionGuide(this.config);
    this.tagDisplay = new TagDisplay(this.config);

    // Create UI elements
    console.log("ElementSelectorUI: Creating cursor follower...");
    this.cursorFollower.create();
    console.log("ElementSelectorUI: Creating selection guide...");
    this.selectionGuide.create();
    console.log("ElementSelectorUI: Creating tag display...");
    this.tagDisplay.create();

    // Add body class for cursor style
    document.body.classList.add("element-selecting");

    this.isInitialized = true;
    console.log("ElementSelectorUI: Initialization complete");
  }

  /**
   * Create and inject CSS styles for highlighting
   */
  private createStyles(): void {
    if (this.styleElement) {
      this.removeStyles();
    }

    const css = generateHighlightStyles(this.config);
    this.styleElement = createStyleElement(css, "data-element-selection");
    document.head.appendChild(this.styleElement);
    console.log("ElementSelectorUI: Styles injected");
  }

  /**
   * Remove injected CSS styles
   */
  private removeStyles(): void {
    if (this.styleElement && this.styleElement.parentNode) {
      this.styleElement.parentNode.removeChild(this.styleElement);
      this.styleElement = null;
    }
  }

  /**
   * Update cursor position
   */
  updateCursorPosition(x: number, y: number): void {
    if (this.cursorFollower) {
      this.cursorFollower.updatePosition(x, y);
    }
  }

  /**
   * Update tag display with element information
   */
  updateTagDisplay(element: HTMLElement, componentInfo?: ComponentInfo): void {
    if (this.tagDisplay) {
      this.tagDisplay.updateContent(element, componentInfo);
      this.tagDisplay.positionRelativeTo(element);
      this.tagDisplay.show();
    }
  }

  /**
   * Hide tag display
   */
  hideTagDisplay(): void {
    if (this.tagDisplay) {
      this.tagDisplay.hide();
    }
  }

  /**
   * Add highlight to an element
   */
  highlightElement(element: HTMLElement): void {
    // Remove highlight from any previously highlighted element
    this.removeHighlights();

    // Add highlight to the current element
    element.classList.add("element-highlight");
    console.log(
      "ElementSelectorUI: Element highlighted:",
      element.tagName,
      element.className
    );
  }

  /**
   * Remove highlights from all elements
   */
  removeHighlights(): void {
    const highlightedElements = document.querySelectorAll(".element-highlight");
    highlightedElements.forEach((el) =>
      el.classList.remove("element-highlight")
    );
  }

  /**
   * Show comment modal for selected element
   */
  showCommentModal(
    element: HTMLElement,
    componentInfo: ComponentInfo,
    onConfirm: (comment: string) => void,
    onCancel: () => void
  ): CommentModal {
    // Clean up existing modal
    if (this.commentModal) {
      this.commentModal.destroy();
    }

    // Hide other UI elements during modal display
    this.hideSelectionUI();

    this.commentModal = new CommentModal({
      element,
      componentInfo,
      config: this.config,
      onConfirm: (comment: string) => {
        onConfirm(comment);
        this.hideCommentModal();
      },
      onCancel: () => {
        onCancel();
        this.hideCommentModal();
      },
    });

    this.commentModal.create();
    this.commentModal.animateIn();

    return this.commentModal;
  }

  /**
   * Hide comment modal
   */
  hideCommentModal(): void {
    if (this.commentModal) {
      this.commentModal.animateOut().then(() => {
        if (this.commentModal) {
          this.commentModal.destroy();
          this.commentModal = null;
        }
      });
    }
  }

  /**
   * Hide selection UI elements (but keep them initialized)
   */
  hideSelectionUI(): void {
    if (this.cursorFollower) {
      this.cursorFollower.hide();
    }
    if (this.selectionGuide) {
      this.selectionGuide.hide();
    }
    if (this.tagDisplay) {
      this.tagDisplay.hide();
    }
  }

  /**
   * Show selection UI elements
   */
  showSelectionUI(): void {
    if (this.cursorFollower) {
      this.cursorFollower.show();
    }
    if (this.selectionGuide) {
      this.selectionGuide.show();
    }
  }

  /**
   * Update selection guide message
   */
  updateSelectionGuideMessage(message: string): void {
    if (this.selectionGuide) {
      this.selectionGuide.updateMessage(message);
    }
  }

  /**
   * Set selection guide loading state
   */
  setSelectionGuideLoading(isLoading: boolean): void {
    if (this.selectionGuide) {
      this.selectionGuide.setLoading(isLoading);
    }
  }

  /**
   * Update configuration for all components
   */
  updateConfig(config: ElementSelectorUIConfig): void {
    this.config = config;

    if (this.cursorFollower) {
      this.cursorFollower.updateConfig(config);
    }
    if (this.selectionGuide) {
      this.selectionGuide.updateConfig(config);
    }
    if (this.tagDisplay) {
      this.tagDisplay.updateConfig(config);
    }
    if (this.commentModal) {
      this.commentModal.updateConfig(config);
    }

    // Update styles
    this.createStyles();
  }

  /**
   * Check if UI is initialized
   */
  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Check if comment modal is currently shown
   */
  isCommentModalVisible(): boolean {
    return this.commentModal !== null;
  }

  /**
   * Get current configuration
   */
  getConfig(): ElementSelectorUIConfig {
    return { ...this.config };
  }

  /**
   * Animate UI entrance
   */
  animateIn(): void {
    if (this.selectionGuide) {
      this.selectionGuide.animateIn();
    }
  }

  /**
   * Animate UI exit
   */
  async animateOut(): Promise<void> {
    const promises: Promise<void>[] = [];

    if (this.selectionGuide) {
      promises.push(this.selectionGuide.animateOut());
    }
    if (this.tagDisplay) {
      promises.push(this.tagDisplay.animateOut());
    }
    if (this.commentModal) {
      promises.push(this.commentModal.animateOut());
    }

    await Promise.all(promises);
  }

  /**
   * Cleanup all UI components and remove from DOM
   */
  cleanup(): void {
    // Destroy individual components
    if (this.cursorFollower) {
      this.cursorFollower.destroy();
      this.cursorFollower = null;
    }
    if (this.selectionGuide) {
      this.selectionGuide.destroy();
      this.selectionGuide = null;
    }
    if (this.tagDisplay) {
      this.tagDisplay.destroy();
      this.tagDisplay = null;
    }
    if (this.commentModal) {
      this.commentModal.destroy();
      this.commentModal = null;
    }

    // Remove styles
    this.removeStyles();

    // Clean up DOM
    cleanupSelectionUI();

    this.isInitialized = false;
  }

  /**
   * Emergency cleanup - force remove all UI elements
   */
  forceCleanup(): void {
    try {
      cleanupSelectionUI();
      this.removeStyles();
      this.isInitialized = false;

      // Reset component references
      this.cursorFollower = null;
      this.selectionGuide = null;
      this.tagDisplay = null;
      this.commentModal = null;
    } catch (error) {
      console.error("Error during force cleanup:", error);
    }
  }
}
