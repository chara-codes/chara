"use client";

import { useUIStore } from "@chara-codes/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { ElementSelectorUI } from "./components/element-selector-ui";
import { ModalHandlers } from "./handlers/modal-handlers";
import { SelectionHandlers } from "./handlers/selection-handlers";
import { componentDetectionService } from "./services/component-detection";
import type {
  ComponentInfo,
  ElementContextItem,
  ElementSelectorUIConfig,
  UseElementSelectorReturn,
} from "./types";
import { DEFAULT_UI_CONFIG } from "./utils/style-utils";

/**
 * Custom hook for selecting DOM elements and adding comments to them.
 * Provides functionality to highlight, select, and annotate elements on the page.
 *
 * This is a refactored version that separates concerns into multiple services and components:
 * - UI management via ElementSelectorUI
 * - Event handling via SelectionHandlers and ModalHandlers
 * - Component detection via ComponentDetectionService
 * - Framework-specific detectors for React, Vue, etc.
 *
 * @param onAddContext Function called when an element with comment is added to the context
 * @returns Object containing state and methods for element selection
 */
export const useElementSelector = (
  onAddContext: (contextItem: ElementContextItem) => void
): UseElementSelectorReturn => {
  // State for tracking element selection
  const [isSelectingElement, setIsSelectingElement] = useState<boolean>(false);
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(
    null
  );
  const [showCommentModal, setShowCommentModal] = useState<boolean>(false);
  const [elementComment, setElementComment] = useState<string>("");

  // Refs for service instances
  const uiRef = useRef<ElementSelectorUI | null>(null);
  const selectionHandlersRef = useRef<SelectionHandlers | null>(null);
  const modalHandlersRef = useRef<ModalHandlers | null>(null);
  const configRef = useRef<ElementSelectorUIConfig>(DEFAULT_UI_CONFIG);

  /**
   * Initialize services if not already initialized
   */
  /**
   * Force cleanup in case of errors
   */
  const forceCleanup = useCallback(() => {
    try {
      if (uiRef.current) {
        uiRef.current.forceCleanup();
      }
      if (selectionHandlersRef.current) {
        selectionHandlersRef.current.stopSelection();
      }
      if (modalHandlersRef.current) {
        modalHandlersRef.current.forceClose();
      }

      setIsSelectingElement(false);
      setSelectedElement(null);
      setShowCommentModal(false);
      setElementComment("");
    } catch (error) {
      console.error("Error during force cleanup:", error);
    }
  }, []);

  /**
   * End element selection mode and clean up
   */
  const endElementSelection = useCallback(() => {
    console.log("Ending element selection mode");

    try {
      // Show the chat panel using the store
      const openChatOverlay = useUIStore.getState().openChatOverlay;
      openChatOverlay();

      // Stop selection handlers
      if (selectionHandlersRef.current) {
        selectionHandlersRef.current.stopSelection();
      }

      // Close modal if open
      if (modalHandlersRef.current) {
        modalHandlersRef.current.forceClose();
      }

      // Animate out and cleanup UI
      if (uiRef.current) {
        uiRef.current.animateOut().then(() => {
          if (uiRef.current) {
            uiRef.current.cleanup();
          }
        });
      }

      // Reset state
      setIsSelectingElement(false);
      setSelectedElement(null);
      setShowCommentModal(false);
      setElementComment("");
    } catch (error) {
      console.error("Error ending element selection:", error);
      // Force cleanup
      forceCleanup();
    }
  }, [forceCleanup]);

  /**
   * Handle when modal is closed
   */
  const handleModalClosed = useCallback(() => {
    console.log("Modal closed");
    setShowCommentModal(false);
    setSelectedElement(null);
    setElementComment("");
    endElementSelection();
  }, [endElementSelection]);

  /**
   * Handle when selection is canceled
   */
  const handleSelectionCanceled = useCallback(() => {
    console.log("Selection canceled");
    endElementSelection();
  }, [endElementSelection]);

  /**
   * Handle when an element is selected during selection mode
   */
  const handleElementSelected = useCallback(
    (element: HTMLElement, componentInfo: ComponentInfo) => {
      console.log("🎯 ELEMENT SELECTED:", {
        element: element,
        tagName: element.tagName,
        id: element.id,
        className: element.className,
        componentInfo: componentInfo,
      });

      // Update state
      setSelectedElement(element);
      setShowCommentModal(true);

      // Pause selection handlers while modal is open
      if (selectionHandlersRef.current) {
        console.log("⏸️ Pausing selection handlers for modal");
        selectionHandlersRef.current.pauseSelection();
      }

      // Show comment modal
      if (uiRef.current && modalHandlersRef.current) {
        console.log("📝 Creating comment modal");
        const modal = uiRef.current.showCommentModal(
          element,
          componentInfo,
          (comment: string) => {
            console.log("✅ Modal confirmed with comment:", comment);
            modalHandlersRef.current?.handleConfirm(comment);
          },
          () => {
            console.log("❌ Modal cancelled");
            modalHandlersRef.current?.handleCancel();
          }
        );

        modalHandlersRef.current.showModal(element, componentInfo, modal);
        modalHandlersRef.current.setInitialComment(elementComment);
      } else {
        console.error("❌ Missing UI or modal handlers:", {
          ui: !!uiRef.current,
          modal: !!modalHandlersRef.current,
        });
      }
    },
    [elementComment]
  );

  /**
   * Initialize services if not already initialized
   */
  const initializeServices = useCallback(() => {
    console.log("🔧 Initializing services...");

    if (!uiRef.current) {
      console.log("🎨 Creating ElementSelectorUI...");
      uiRef.current = new ElementSelectorUI(configRef.current);
      console.log("✅ ElementSelectorUI created");
    }

    if (!selectionHandlersRef.current) {
      console.log("🖱️ Creating SelectionHandlers...");
      console.log("📋 Callbacks available:", {
        handleElementSelected: typeof handleElementSelected,
        handleSelectionCanceled: typeof handleSelectionCanceled,
        uiAvailable: !!uiRef.current,
      });

      selectionHandlersRef.current = new SelectionHandlers(
        uiRef.current,
        handleElementSelected,
        handleSelectionCanceled
      );
      console.log("✅ SelectionHandlers created and ready");
    }

    if (!modalHandlersRef.current) {
      console.log("📝 Creating ModalHandlers...");
      modalHandlersRef.current = new ModalHandlers(
        onAddContext,
        handleModalClosed
      );
      console.log("✅ ModalHandlers created");
    }

    console.log("🎉 All services initialized successfully!");
  }, [
    onAddContext,
    handleElementSelected,
    handleSelectionCanceled,
    handleModalClosed,
  ]);

  /**
   * Start element selection mode
   */
  const startElementSelection = useCallback(() => {
    console.log("🚀 Starting element selection mode");

    try {
      // Initialize services
      console.log("🔧 Initializing services...");
      initializeServices();

      const serviceStatus = {
        ui: !!uiRef.current,
        selectionHandlers: !!selectionHandlersRef.current,
        modalHandlers: !!modalHandlersRef.current,
      };
      console.log("📊 Services status:", serviceStatus);

      if (!serviceStatus.ui || !serviceStatus.selectionHandlers) {
        throw new Error("Critical services failed to initialize");
      }

      // Hide the chat panel using the store
      console.log("🙈 Hiding chat overlay");
      const closeChatOverlay = useUIStore.getState().closeChatOverlay;
      closeChatOverlay();

      // Set selecting state
      console.log("⚡ Setting selection state to true");
      setIsSelectingElement(true);

      // Initialize UI
      if (uiRef.current) {
        console.log("🎨 Initializing UI components...");
        uiRef.current.initialize();
        uiRef.current.animateIn();
        console.log("✅ UI initialized and animated in");
      }

      // Start selection handlers
      if (selectionHandlersRef.current) {
        console.log("🖱️ Starting selection handlers...");
        selectionHandlersRef.current.startSelection();
        console.log("✅ Selection handlers started - ready for clicks!");
      }

      console.log("🎉 Element selection mode is now ACTIVE");
    } catch (error) {
      console.error("❌ Error starting element selection:", error);
      // Fallback cleanup
      setIsSelectingElement(false);
    }
  }, [initializeServices]);

  /**
   * Create and show a comment modal for the given element
   * (Legacy method for backward compatibility)
   */
  const createCommentModal = useCallback(
    (element: HTMLElement): HTMLButtonElement => {
      console.log("createCommentModal called (legacy method)");

      // Detect component information
      const componentInfo = componentDetectionService.detectComponent(element);

      // Use the new method
      handleElementSelected(element, componentInfo);

      // Return a dummy button for compatibility
      const dummyButton = document.createElement("button");
      dummyButton.style.display = "none";
      return dummyButton;
    },
    [handleElementSelected]
  );

  /**
   * Detect component information from a DOM element
   */
  const detectComponentInfo = useCallback(
    (element: HTMLElement): ComponentInfo => {
      return componentDetectionService.detectComponent(element);
    },
    []
  );

  /**
   * Update UI configuration
   */
  const updateConfig = useCallback(
    (config: Partial<ElementSelectorUIConfig>) => {
      configRef.current = { ...configRef.current, ...config };

      if (uiRef.current) {
        uiRef.current.updateConfig(configRef.current);
      }
    },
    []
  );

  /**
   * Get current configuration
   */
  const getConfig = useCallback((): ElementSelectorUIConfig => {
    return { ...configRef.current };
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (isSelectingElement) {
        forceCleanup();
      }
    };
  }, [isSelectingElement, forceCleanup]);

  // Cleanup if component unmounts while selecting
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isSelectingElement) {
        forceCleanup();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isSelectingElement, forceCleanup]);

  return {
    // State
    isSelectingElement,
    selectedElement,
    showCommentModal,
    elementComment,

    // Actions
    startElementSelection,
    endElementSelection,
    setElementComment,

    // Legacy methods (for backward compatibility)
    createCommentModal,
    detectComponentInfo,

    // Extended functionality
    updateConfig,
    getConfig,
    forceCleanup,
  } as UseElementSelectorReturn & {
    updateConfig: (config: Partial<ElementSelectorUIConfig>) => void;
    getConfig: () => ElementSelectorUIConfig;
    forceCleanup: () => void;
  };
};

// Export additional utilities for advanced usage
export { componentDetectionService } from "./services/component-detection";
export { DEFAULT_UI_CONFIG } from "./utils/style-utils";
export type {
  ComponentInfo,
  ElementSelectorUIConfig,
  UseElementSelectorReturn,
  ElementContextItem,
} from "./types";
