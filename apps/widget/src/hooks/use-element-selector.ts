"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useUIStore } from "../store/ui-store";

/**
 * Information about a component detected from a DOM element
 */
interface ComponentInfo {
  /** The name of the component (e.g., "Button", "Header") */
  componentName: string;
  /** The file path where the component is likely defined */
  componentPath: string;
  /** Whether the element is part of a React component */
  isReactComponent: boolean;
}

/**
 * Configuration options for the element selector UI
 */
interface ElementSelectorUIConfig {
  /** Primary color used for highlighting and UI elements */
  primaryColor: string;
  /** Text color for UI elements */
  textColor: string;
  /** Border color for UI elements */
  borderColor: string;
  /** Background color for UI elements */
  backgroundColor: string;
  /** Z-index base for UI elements */
  zIndexBase: number;
}

/**
 * Return type for the useElementSelector hook
 */
interface UseElementSelectorReturn {
  /** Whether element selection mode is currently active */
  isSelectingElement: boolean;
  /** The currently selected DOM element, if any */
  selectedElement: HTMLElement | null;
  /** Whether the comment modal is currently shown */
  showCommentModal: boolean;
  /** The current comment text for the selected element */
  elementComment: string;
  /** Start element selection mode */
  startElementSelection: () => void;
  /** End element selection mode and clean up */
  endElementSelection: () => void;
  /** Set the comment text for the selected element */
  setElementComment: (comment: string) => void;
  /** Create and show a comment modal for the given element */
  createCommentModal: (element: HTMLElement) => HTMLButtonElement;
  /** Detect component information from a DOM element */
  detectComponentInfo: (element: HTMLElement) => ComponentInfo;
}

/**
 * Default UI configuration for the element selector
 */
const DEFAULT_UI_CONFIG: ElementSelectorUIConfig = {
  primaryColor: "#2563eb", // Blue
  textColor: "white",
  borderColor: "white",
  backgroundColor: "rgba(37, 99, 235, 0.2)",
  zIndexBase: 2147483640, // High z-index to ensure visibility
};

/**
 * Custom hook for selecting DOM elements and adding comments to them.
 * Provides functionality to highlight, select, and annotate elements on the page.
 *
 * @param onAddContext Function called when an element with comment is added to the context
 * @returns Object containing state and methods for element selection
 */
export const useElementSelector = (
  onAddContext: (contextItem: {
    name: string;
    type: string;
    data?: unknown;
  }) => void,
): UseElementSelectorReturn => {
  // State for tracking element selection
  const [isSelectingElement, setIsSelectingElement] = useState<boolean>(false);
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(
    null,
  );
  const [showCommentModal, setShowCommentModal] = useState<boolean>(false);
  const [elementComment, setElementComment] = useState<string>("");

  // Reference to store UI configuration
  const uiConfigRef = useRef<ElementSelectorUIConfig>(DEFAULT_UI_CONFIG);

  // Reference to store cleanup functions
  const cleanupRef = useRef<{
    handleElementClick?: (e: MouseEvent) => void;
    handleKeyDownEscape?: (e: KeyboardEvent) => void;
    handleMouseMove?: (e: MouseEvent) => void;
  }>({});

  // Reference to store the input element for direct access
  const commentInputRef = useRef<HTMLInputElement | null>(null);

  /**
   * Detects component information from a DOM element by analyzing
   * React internals, data attributes, class names, and other properties.
   *
   * @param element The DOM element to analyze
   * @returns Object containing component name, path, and whether it's a React component
   */
  const detectComponentInfo = useCallback(
    (element: HTMLElement): ComponentInfo => {
      // Default return value
      const componentInfo: ComponentInfo = {
        componentName: "Unknown",
        componentPath: "",
        isReactComponent: false,
      };

      try {
        // Step 1: Check for React internal properties
        const reactKey = findReactInternalKey(element);

        if (reactKey) {
          componentInfo.isReactComponent = true;
          extractComponentInfoFromReactFiber(element, reactKey, componentInfo);
        }

        // Step 2: Check for data attributes that might indicate component information
        extractComponentInfoFromDataAttributes(element, componentInfo);

        // Step 3: Try to determine component path based on class names
        if (element.className && typeof element.className === "string") {
          extractComponentInfoFromClassNames(element, componentInfo);
        }

        // Step 4: Check for component naming patterns in the element's ID
        if (componentInfo.componentName === "Unknown" && element.id) {
          extractComponentInfoFromId(element, componentInfo);
        }

        // Step 5: If we still don't have a component name, try to infer from parent elements
        if (componentInfo.componentName === "Unknown") {
          extractComponentInfoFromParents(element, componentInfo);
        }

        // Step 6: If we have a component name but no path, create a default path
        if (
          componentInfo.componentName !== "Unknown" &&
          !componentInfo.componentPath
        ) {
          // Convert PascalCase to kebab-case for the file path
          const kebabCase = componentInfo.componentName
            .replace(/([a-z])([A-Z])/g, "$1-$2")
            .toLowerCase();
          componentInfo.componentPath = `components/${kebabCase}.tsx`;
        }
      } catch (error) {
        console.error("Error detecting component information:", error);
      }

      return componentInfo;
    },
    [],
  );

  /**
   * Finds a React internal key in the element's properties
   */
  const findReactInternalKey = (element: HTMLElement): string | undefined => {
    return Object.keys(element).find(
      (key) =>
        key.startsWith("__reactFiber$") ||
        key.startsWith("__reactInternalInstance$") ||
        key.startsWith("__reactProps$") ||
        key.startsWith("_reactInternals"),
    );
  };

  /**
   * Extracts component information from React fiber node
   */
  const extractComponentInfoFromReactFiber = (
    element: HTMLElement,
    reactKey: string,
    componentInfo: ComponentInfo,
  ): void => {
    // @ts-expect-error - accessing dynamic properties
    const fiberNode = element[reactKey];
    if (!fiberNode) return;

    // Navigate up the fiber tree to find component names
    let fiber = fiberNode;
    let foundName = false;
    let depth = 0;
    const maxDepth = 10; // Limit depth to prevent infinite loops

    // Try to find a named component in the fiber tree
    while (fiber && !foundName && depth < maxDepth) {
      if (fiber.type) {
        // Check for function components
        if (typeof fiber.type === "function") {
          componentInfo.componentName =
            fiber.type.displayName || fiber.type.name || "UnnamedComponent";
          foundName = true;
        }
        // Check for forwardRef and memo components
        else if (typeof fiber.type === "object" && fiber.type !== null) {
          // ForwardRef components
          if (fiber.type.render && typeof fiber.type.render === "function") {
            componentInfo.componentName =
              fiber.type.render.name ||
              fiber.type.displayName ||
              "ForwardRefComponent";
            foundName = true;
          }
          // Memo components
          else if (
            fiber.type.$$typeof &&
            fiber.type.type &&
            typeof fiber.type.type === "function"
          ) {
            componentInfo.componentName =
              fiber.type.type.displayName ||
              fiber.type.type.name ||
              "MemoComponent";
            foundName = true;
          }
          // Components with displayName
          else if (fiber.type.displayName) {
            componentInfo.componentName = fiber.type.displayName;
            foundName = true;
          }
        }
      }

      // Check for component name in stateNode
      if (!foundName && fiber.stateNode && fiber.stateNode.constructor) {
        if (
          fiber.stateNode.constructor.name &&
          fiber.stateNode.constructor.name !== "HTMLDivElement"
        ) {
          componentInfo.componentName = fiber.stateNode.constructor.name;
          foundName = true;
        }
      }

      // Move up the fiber tree
      fiber = fiber.return;
      depth++;
    }
  };

  /**
   * Extracts component information from data attributes
   */
  const extractComponentInfoFromDataAttributes = (
    element: HTMLElement,
    componentInfo: ComponentInfo,
  ): void => {
    const dataComponent = element.getAttribute("data-component");
    const dataTestId = element.getAttribute("data-testid");
    const dataComponentId = element.getAttribute("data-component-id");
    const dataComponentName = element.getAttribute("data-component-name");

    if (dataComponentName) {
      componentInfo.componentName = dataComponentName;
    } else if (dataComponent && componentInfo.componentName === "Unknown") {
      componentInfo.componentName = dataComponent;
    } else if (dataTestId && componentInfo.componentName === "Unknown") {
      // Often test IDs follow patterns like "component-name-button"
      const testIdParts = dataTestId.split("-");
      if (testIdParts.length > 1) {
        // Convert kebab-case to PascalCase for component name
        componentInfo.componentName = testIdParts
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join("");
      } else {
        componentInfo.componentName = dataTestId;
      }
    } else if (dataComponentId && componentInfo.componentName === "Unknown") {
      componentInfo.componentName = dataComponentId;
    }
  };

  /**
   * Extracts component information from class names
   */
  const extractComponentInfoFromClassNames = (
    element: HTMLElement,
    componentInfo: ComponentInfo,
  ): void => {
    const classNames = element.className.split(" ");

    // Look for class names that might indicate component structure
    const moduleClassRegex = /([A-Z][a-zA-Z0-9]+)_([a-zA-Z0-9]+)__[a-zA-Z0-9]+/;
    const materialClassRegex = /([A-Z][a-zA-Z0-9]+)-([a-z]+)-[0-9]+/;
    const styledComponentRegex = /sc-[a-zA-Z0-9]+-([a-zA-Z0-9]+)/;

    for (const className of classNames) {
      const moduleMatch = className.match(moduleClassRegex);
      const materialMatch = className.match(materialClassRegex);
      const styledMatch = className.match(styledComponentRegex);

      if (moduleMatch && moduleMatch[1]) {
        if (componentInfo.componentName === "Unknown") {
          componentInfo.componentName = moduleMatch[1];
        }
        componentInfo.componentPath = `components/${moduleMatch[1].toLowerCase()}/${moduleMatch[1]}.tsx`;
        break;
      } else if (materialMatch && materialMatch[1]) {
        if (componentInfo.componentName === "Unknown") {
          componentInfo.componentName = materialMatch[1];
        }
        componentInfo.componentPath = `components/${materialMatch[1].toLowerCase()}/${materialMatch[1]}.tsx`;
        break;
      } else if (
        styledMatch &&
        styledMatch[1] &&
        componentInfo.componentName === "Unknown"
      ) {
        // For styled-components, convert the hash to a readable name
        componentInfo.componentName = styledMatch[1].replace(/[0-9]/g, "");
        if (componentInfo.componentName.length > 0) {
          // Convert to PascalCase if it's not already
          componentInfo.componentName =
            componentInfo.componentName.charAt(0).toUpperCase() +
            componentInfo.componentName.slice(1);
          componentInfo.componentPath = `components/${componentInfo.componentName.toLowerCase()}/${componentInfo.componentName}.tsx`;
        }
      }
    }
  };

  /**
   * Extracts component information from element ID
   */
  const extractComponentInfoFromId = (
    element: HTMLElement,
    componentInfo: ComponentInfo,
  ): void => {
    // Check for PascalCase or camelCase IDs that might indicate component names
    const idMatch = element.id.match(
      /([A-Z][a-zA-Z0-9]+)(Container|Wrapper|Component|Root|Inner)?$/,
    );
    if (idMatch) {
      componentInfo.componentName = idMatch[1];
    }
  };

  /**
   * Extracts component information from parent elements
   */
  const extractComponentInfoFromParents = (
    element: HTMLElement,
    componentInfo: ComponentInfo,
  ): void => {
    // Check for common component patterns in parent elements
    let parent = element.parentElement;
    let depth = 0;
    const maxDepth = 5; // Limit depth to prevent performance issues

    while (
      parent &&
      depth < maxDepth &&
      componentInfo.componentName === "Unknown"
    ) {
      // Check for section elements with IDs or classes that might indicate components
      if (parent.id && parent.id.includes("-") && parent.id.length > 3) {
        const idParts = parent.id.split("-");
        if (idParts.length > 1) {
          componentInfo.componentName = idParts
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join("");
        }
      }

      // Check for data attributes in parent
      const parentDataComponent = parent.getAttribute("data-component");
      const parentDataComponentName = parent.getAttribute(
        "data-component-name",
      );

      if (parentDataComponentName) {
        componentInfo.componentName = parentDataComponentName;
      } else if (parentDataComponent) {
        componentInfo.componentName = parentDataComponent;
      }

      // Check for role attribute that might indicate component type
      const role = parent.getAttribute("role");
      if (role && componentInfo.componentName === "Unknown") {
        componentInfo.componentName =
          role.charAt(0).toUpperCase() + role.slice(1);
      }

      parent = parent.parentElement;
      depth++;
    }
  };

  /**
   * Cleans up UI elements created for element selection
   */
  const cleanupElementSelectionUI = useCallback(() => {
    // Remove the cursor follower
    removeElementById("element-selector-cursor");

    // Remove the selection guide
    removeElementById("element-selection-guide");

    // Remove the tag display
    removeElementById("element-tag-display");

    // Remove highlight class from all elements
    document.querySelectorAll(".element-highlight").forEach((el) => {
      el.classList.remove("element-highlight");
    });

    // Remove cursor style
    document.body.classList.remove("element-selecting");

    // Remove event listeners for mouse movement
    if (cleanupRef.current.handleMouseMove) {
      document.removeEventListener(
        "mousemove",
        cleanupRef.current.handleMouseMove,
      );
    }
  }, []);

  /**
   * Helper function to remove an element by ID
   */
  const removeElementById = (id: string): void => {
    const element = document.getElementById(id);
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
  };

  /**
   * Ends element selection mode and cleans up all UI elements and event listeners
   */
  const endElementSelection = useCallback(() => {
    console.log("Ending element selection mode");

    // Show the chat panel using the store
    const openChatOverlay = useUIStore.getState().openChatOverlay;
    openChatOverlay();

    // Remove comment modal if exists
    removeElementById("element-comment-modal");

    // Remove comment backdrop if exists
    removeElementById("element-comment-backdrop");

    // Show the chat panel and trigger again
    const chatPanel = document.getElementById("chat-overlay-panel");
    const chatTrigger = document.querySelector(
      '[aria-label="Open chat panel"], [aria-label="Close chat panel"]',
    );

    if (chatPanel) (chatPanel as HTMLElement).style.display = "";
    if (chatTrigger) (chatTrigger as HTMLElement).style.display = "";

    // Clean up UI elements
    cleanupElementSelectionUI();

    // Remove the style element
    const styleElement = document.querySelector(
      "style[data-element-selection]",
    );
    if (styleElement && styleElement.parentNode) {
      styleElement.parentNode.removeChild(styleElement);
    }

    // Remove element-selecting class
    document.body.classList.remove("element-selecting");

    // Remove event listeners
    if (cleanupRef.current) {
      if (cleanupRef.current.handleElementClick) {
        document.removeEventListener(
          "click",
          cleanupRef.current.handleElementClick,
          true,
        );
      }
      if (cleanupRef.current.handleKeyDownEscape) {
        document.removeEventListener(
          "keydown",
          cleanupRef.current.handleKeyDownEscape,
        );
      }
      if (cleanupRef.current.handleMouseMove) {
        document.removeEventListener(
          "mousemove",
          cleanupRef.current.handleMouseMove,
        );
      }
      cleanupRef.current = {};
    }

    // Reset state
    setIsSelectingElement(false);
    setSelectedElement(null);
    setShowCommentModal(false);
    setElementComment("");

    // Clear input ref
    commentInputRef.current = null;
  }, [cleanupElementSelectionUI]);

  // Fix the useCallback dependencies
  const startElementSelection = useCallback(() => {
    console.log("DEBUG: Starting element selection mode");
    const config = uiConfigRef.current;

    // Hide the chat panel using the store
    const closeChatOverlay = useUIStore.getState().closeChatOverlay;
    closeChatOverlay();

    // Set selecting mode
    setIsSelectingElement(true);

    // Make sure body has the element-selecting class to disable shortcuts
    document.body.classList.add("element-selecting");

    // Create UI elements for selection mode
    createSelectionUI(config);

    // Set up event handlers
    setupSelectionEventHandlers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Creates the UI elements for selection mode
   */
  const createSelectionUI = (config: ElementSelectorUIConfig) => {
    // Create cursor follower
    const cursorFollower = createCursorFollower(config);
    document.body.appendChild(cursorFollower);

    // Create selection guide
    const selectionGuide = createSelectionGuide(config);
    document.body.appendChild(selectionGuide);

    // Create tag element
    const tagElement = createTagElement(config);
    document.body.appendChild(tagElement);

    // Create styles for highlighting
    const styleElement = createHighlightStyles(config);
    document.head.appendChild(styleElement);

    // Add selecting class to body
    document.body.classList.add("element-selecting");
  };

  /**
   * Creates the cursor follower element
   */
  const createCursorFollower = (config: ElementSelectorUIConfig) => {
    const cursorFollower = document.createElement("div");
    cursorFollower.id = "element-selector-cursor";
    Object.assign(cursorFollower.style, {
      position: "fixed",
      width: "40px",
      height: "40px",
      pointerEvents: "none",
      zIndex: `${config.zIndexBase + 5}`,
      transform: "translate(-50%, -50%)",
    });

    // Create crosshair design
    cursorFollower.innerHTML = `
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="3" fill="${config.primaryColor}" stroke="${config.borderColor}" strokeWidth="2"/>
        <line x1="20" y1="0" x2="20" y2="15" stroke="${config.primaryColor}" strokeWidth="3"/>
        <line x1="20" y1="25" x2="20" y2="40" stroke="${config.primaryColor}" strokeWidth="3"/>
        <line x1="0" y1="20" x2="15" y2="20" stroke="${config.primaryColor}" strokeWidth="3"/>
        <line x1="25" y1="20" x2="40" y2="20" stroke="${config.primaryColor}" strokeWidth="3"/>
      </svg>
    `;

    return cursorFollower;
  };

  /**
   * Creates the selection guide element
   */
  const createSelectionGuide = (config: ElementSelectorUIConfig) => {
    const selectionGuide = document.createElement("div");
    selectionGuide.id = "element-selection-guide";
    Object.assign(selectionGuide.style, {
      position: "fixed",
      top: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      padding: "16px 24px",
      backgroundColor: config.primaryColor,
      color: config.textColor,
      borderRadius: "8px",
      zIndex: `${config.zIndexBase + 5}`,
      boxShadow:
        "0 4px 20px rgba(0, 0, 0, 0.5), 0 0 0 3px rgba(255, 255, 255, 0.8)",
      fontWeight: "600",
      fontSize: "18px",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      animation: "fadeIn 0.3s ease-out",
      fontFamily: "system-ui, -apple-system, sans-serif",
      border: `3px solid ${config.borderColor}`,
      letterSpacing: "0.5px",
    });

    // Add an icon to the guide
    const iconSpan = document.createElement("span");
    iconSpan.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 14a8 8 0 0 1-8 8"></path>
        <path d="M18 11v-1a2 2 0 0 0-2-2a2 2 0 0 0-2 2"></path>
        <path d="M14 10V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1"></path>
        <path d="M10 9.5V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v10"></path>
        <path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"></path>
      </svg>
    `;
    selectionGuide.appendChild(iconSpan);

    // Add the text content
    const textSpan = document.createElement("span");
    textSpan.textContent =
      "Click on any element to select it. Press ESC to cancel.";
    selectionGuide.appendChild(textSpan);

    return selectionGuide;
  };

  /**
   * Creates the tag element that follows the mouse
   */
  const createTagElement = (config: ElementSelectorUIConfig) => {
    const tagElement = document.createElement("div");
    tagElement.id = "element-tag-display";
    tagElement.className = "element-tag";
    Object.assign(tagElement.style, {
      display: "none",
      transition: "top 0.2s ease, left 0.2s ease",
      position: "fixed",
      backgroundColor: config.primaryColor,
      color: config.textColor,
      padding: "8px 12px",
      borderRadius: "6px",
      fontSize: "14px",
      fontWeight: "bold",
      pointerEvents: "none",
      zIndex: `${config.zIndexBase + 5}`,
      boxShadow: "0 2px 10px rgba(0, 0, 0, 0.4)",
      fontFamily: "system-ui, -apple-system, sans-serif",
      border: `2px solid ${config.borderColor}`,
      transform: "translateY(-5px)",
    });

    return tagElement;
  };

  /**
   * Creates the styles for highlighting elements
   */
  const createHighlightStyles = (config: ElementSelectorUIConfig) => {
    const styleElement = document.createElement("style");
    styleElement.setAttribute("data-element-selection", "true");
    styleElement.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translate(-50%, -10px); }
        to { opacity: 1; transform: translate(-50%, 0); }
      }

      @keyframes pulse {
        0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7); }
        70% { box-shadow: 0 0 0 10px rgba(37, 99, 235, 0); }
        100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
      }

      body.element-selecting {
        cursor: crosshair !important;
      }

      .element-highlight {
        cursor: crosshair !important;
        outline: 6px solid ${config.primaryColor} !important;
        outline-offset: 3px !important;
        box-shadow: 0 0 0 3px ${config.borderColor}, 0 0 15px 5px rgba(37, 99, 235, 0.8) !important;
        background-color: ${config.backgroundColor} !important;
        position: relative !important;
        z-index: ${config.zIndexBase + 4} !important;
        transition: all 0.2s ease !important;
        animation: pulse 1.5s infinite !important;
      }

      .element-highlight:hover {
        outline-color: #1d4ed8 !important;
        background-color: rgba(37, 99, 235, 0.3) !important;
      }
    `;

    return styleElement;
  };

  /**
   * Sets up event handlers for element selection
   */
  const setupSelectionEventHandlers = () => {
    // Track the currently highlighted element
    let currentHighlightedElement: HTMLElement | null = null;

    // Add click event listener to the document
    const handleElementClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Get the clicked element
      const element = e.target as HTMLElement;

      // Store the selected element and show comment modal
      setSelectedElement(element);
      setShowCommentModal(true);

      // Create comment modal
      createCommentModal(element);

      return false;
    };

    // Add escape key listener
    const handleKeyDownEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        endElementSelection();
        document.removeEventListener("keydown", handleKeyDownEscape);
      }
    };

    // Add mouse move listener
    const handleMouseMove = (e: MouseEvent) => {
      // Update cursor follower position
      const cursorFollower = document.getElementById("element-selector-cursor");
      if (cursorFollower) {
        cursorFollower.style.top = `${e.clientY}px`;
        cursorFollower.style.left = `${e.clientX}px`;
      }

      // Get the element directly under the cursor
      const element = document.elementFromPoint(
        e.clientX,
        e.clientY,
      ) as HTMLElement;

      if (!element) return;

      // Skip if this is our own UI element
      if (
        element.id === "element-selection-guide" ||
        element.id === "element-tag-display" ||
        element.id === "element-selector-cursor" ||
        element.closest("#element-selection-guide")
      ) {
        return;
      }

      // Remove highlight from previous element
      if (currentHighlightedElement && currentHighlightedElement !== element) {
        currentHighlightedElement.classList.remove("element-highlight");
      }

      // Add highlight to current element
      element.classList.add("element-highlight");
      currentHighlightedElement = element;

      // Update tag display
      updateTagDisplay(element);
    };

    // Store the listeners in refs for cleanup
    cleanupRef.current = {
      handleElementClick,
      handleKeyDownEscape,
      handleMouseMove,
    };

    // Add event listeners
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("click", handleElementClick, true);
    document.addEventListener("keydown", handleKeyDownEscape);

    console.log("DEBUG: Element selection mode initialized");
    console.log(
      "DEBUG: Event listeners attached:",
      cleanupRef.current ? Object.keys(cleanupRef.current) : "None",
    );
  };

  /**
   * Updates the tag display that shows element information
   */
  const updateTagDisplay = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const tagDisplay = document.getElementById("element-tag-display");

    if (tagDisplay) {
      const tagName = element.tagName.toLowerCase();
      const idText = element.id ? `#${element.id}` : "";
      const classText =
        element.className &&
        typeof element.className === "string" &&
        element.className.trim()
          ? `.${element.className.trim().replace(/\s+/g, ".")}`
          : "";

      // Detect component information
      const componentInfo = detectComponentInfo(element);
      const componentText =
        componentInfo.isReactComponent &&
        componentInfo.componentName !== "Unknown"
          ? ` (${componentInfo.componentName})`
          : "";

      tagDisplay.textContent =
        tagName + idText + (idText ? "" : classText) + componentText;
      tagDisplay.style.display = "block";

      // Position the tag above the element
      const top = Math.max(0, rect.top - 40);
      const left = rect.left + rect.width / 2;

      tagDisplay.style.top = `${top}px`;
      tagDisplay.style.left = `${left}px`;
    }
  };

  /**
   * Creates the modal DOM elements
   */
  const createModalElements = (
    element: HTMLElement,
    componentInfo: ComponentInfo,
  ) => {
    const config = uiConfigRef.current;

    // Create modal backdrop
    const backdrop = document.createElement("div");
    backdrop.id = "element-comment-backdrop";
    Object.assign(backdrop.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      backdropFilter: "blur(2px)",
      zIndex: `${config.zIndexBase + 6}`,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      animation: "fadeIn 0.2s ease-out",
    });

    // Add animation styles
    const styleElement = document.createElement("style");
    styleElement.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideIn {
        from { transform: translate(-50%, -55%); opacity: 0; }
        to { transform: translate(-50%, -50%); opacity: 1; }
      }
    `;
    document.head.appendChild(styleElement);

    // Create modal container
    const modal = document.createElement("div");
    modal.id = "element-comment-modal";
    Object.assign(modal.style, {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      backgroundColor: "white",
      padding: "16px",
      borderRadius: "8px",
      boxShadow: "0 4px 15px rgba(0, 0, 0, 0.15)",
      zIndex: `${config.zIndexBase + 7}`,
      width: "400px",
      maxWidth: "90vw",
      fontFamily: "system-ui, -apple-system, sans-serif",
      animation: "slideIn 0.25s ease-out",
      border: "1px solid rgba(0, 0, 0, 0.1)",
    });

    // Prevent event propagation from modal
    modal.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    // Create header
    const header = createModalHeader();
    modal.appendChild(header);

    // Create element info
    const elementInfo = createElementInfoSection(element);
    modal.appendChild(elementInfo);

    // Add component information if available
    if (componentInfo.componentName !== "Unknown") {
      const componentInfoElement = createComponentInfoSection(componentInfo);
      modal.appendChild(componentInfoElement);
    }

    // Create comment input
    const input = createCommentInput();
    modal.appendChild(input);

    // Create buttons container and buttons
    const { buttonsContainer, confirmButton } = createModalButtons();
    modal.appendChild(buttonsContainer);

    // Assemble the modal
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    // Focus the input
    setTimeout(() => {
      if (commentInputRef.current) {
        commentInputRef.current.focus();
      }
    }, 100);

    return { backdrop, modal, confirmButton, styleElement };
  };

  /**
   * Creates the modal header
   */
  const createModalHeader = () => {
    const header = document.createElement("div");
    Object.assign(header.style, {
      display: "flex",
      alignItems: "center",
      marginBottom: "12px",
    });

    const title = document.createElement("h3");
    title.textContent = "Add Comment to Element";
    Object.assign(title.style, {
      margin: "0",
      fontSize: "16px",
      fontWeight: "600",
      color: "#1f2937",
    });

    header.appendChild(title);
    return header;
  };

  /**
   * Creates the element info section
   */
  const createElementInfoSection = (element: HTMLElement) => {
    const elementInfo = document.createElement("div");
    Object.assign(elementInfo.style, {
      padding: "8px 10px",
      backgroundColor: "#f3f4f6",
      borderRadius: "6px",
      marginBottom: "12px",
      fontSize: "12px",
      color: "#4b5563",
      fontFamily: "monospace",
      border: "1px solid #e5e7eb",
      position: "relative",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    });

    const tagName = element.tagName.toLowerCase();
    const idText = element.id ? `#${element.id}` : "";
    const classText =
      element.className &&
      typeof element.className === "string" &&
      element.className.trim()
        ? `.${element.className.trim().replace(/\s+/g, ".")}`
        : "";

    // Add element type badge
    const elementBadge = document.createElement("div");
    Object.assign(elementBadge.style, {
      position: "absolute",
      top: "0",
      right: "0",
      backgroundColor: uiConfigRef.current.primaryColor,
      color: uiConfigRef.current.textColor,
      padding: "1px 6px",
      fontSize: "9px",
      fontWeight: "600",
      textTransform: "uppercase",
      borderBottomLeftRadius: "4px",
    });
    elementBadge.textContent = tagName;

    elementInfo.textContent = `${tagName}${idText}${idText ? "" : classText}`;
    elementInfo.appendChild(elementBadge);

    return elementInfo;
  };

  /**
   * Creates the component info section
   */
  const createComponentInfoSection = (componentInfo: ComponentInfo) => {
    const componentInfoElement = document.createElement("div");
    Object.assign(componentInfoElement.style, {
      padding: "8px 10px",
      backgroundColor: "#eef2ff", // Light indigo background
      borderRadius: "6px",
      marginBottom: "12px",
      fontSize: "12px",
      color: "#4338ca", // Indigo text
      fontFamily: "monospace",
      border: "1px solid #c7d2fe", // Light indigo border
      position: "relative",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    });

    // Add component badge
    const componentBadge = document.createElement("div");
    Object.assign(componentBadge.style, {
      position: "absolute",
      top: "0",
      right: "0",
      backgroundColor: "#4f46e5", // Indigo background
      color: "white",
      padding: "1px 6px",
      fontSize: "9px",
      fontWeight: "600",
      textTransform: "uppercase",
      borderBottomLeftRadius: "4px",
    });
    componentBadge.textContent = componentInfo.isReactComponent
      ? "React Component"
      : "Component";

    // Create a container for the component name to handle overflow
    const nameContainer = document.createElement("div");
    Object.assign(nameContainer.style, {
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      paddingRight: "100px", // Make room for the badge
    });
    nameContainer.textContent = `${componentInfo.componentName} (${componentInfo.componentPath})`;

    componentInfoElement.appendChild(nameContainer);
    componentInfoElement.appendChild(componentBadge);

    return componentInfoElement;
  };

  /**
   * Creates the comment input field
   */
  const createCommentInput = () => {
    const inputContainer = document.createElement("div");
    Object.assign(inputContainer.style, {
      marginBottom: "12px",
    });

    const label = document.createElement("label");
    label.textContent = "Comment";
    label.htmlFor = "element-comment-input";
    Object.assign(label.style, {
      display: "block",
      marginBottom: "6px",
      fontSize: "13px",
      fontWeight: "500",
      color: "#374151",
    });

    inputContainer.appendChild(label);

    const input = document.createElement("input");
    input.type = "text";
    input.id = "element-comment-input";
    input.placeholder = "Add your comment about this element...";
    Object.assign(input.style, {
      width: "100%",
      padding: "10px 12px",
      fontSize: "13px",
      border: "1px solid #d1d5db",
      borderRadius: "6px",
      boxSizing: "border-box",
      height: "40px",
      fontFamily: "system-ui, -apple-system, sans-serif",
      transition: "border-color 0.2s ease",
    });

    // Store the input element in the ref for direct access
    commentInputRef.current = input;

    // Set initial value from state if available
    if (elementComment) {
      input.value = elementComment;
    }

    // Update state when input changes
    input.addEventListener("input", (e) => {
      const newComment = (e.target as HTMLInputElement).value;
      console.log("Input changed, new comment:", newComment);
      setElementComment(newComment);
    });

    input.addEventListener("focus", () => {
      input.style.borderColor = uiConfigRef.current.primaryColor;
      input.style.outline = "none";
      input.style.boxShadow = `0 0 0 2px rgba(37, 99, 235, 0.2)`;
    });

    input.addEventListener("blur", () => {
      input.style.borderColor = "#d1d5db";
      input.style.boxShadow = "none";
    });

    // Add Enter key support
    input.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        // Find and click the confirm button
        const confirmButton = document.querySelector(
          "#element-comment-modal button:last-child",
        ) as HTMLElement;
        if (confirmButton) {
          confirmButton.click();
        }
      }
    });

    inputContainer.appendChild(input);
    return inputContainer;
  };

  /**
   * Creates the modal buttons
   */
  const createModalButtons = () => {
    const buttonsContainer = document.createElement("div");
    Object.assign(buttonsContainer.style, {
      display: "flex",
      justifyContent: "flex-end",
      gap: "8px",
    });

    // Create cancel button
    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Cancel";
    Object.assign(cancelButton.style, {
      padding: "6px 12px",
      backgroundColor: "#f3f4f6",
      color: "#4b5563",
      border: "1px solid #d1d5db",
      borderRadius: "6px",
      fontSize: "13px",
      fontWeight: "500",
      cursor: "pointer",
      transition: "all 0.2s ease",
    });

    cancelButton.addEventListener("mouseover", () => {
      cancelButton.style.backgroundColor = "#e5e7eb";
    });

    cancelButton.addEventListener("mouseout", () => {
      cancelButton.style.backgroundColor = "#f3f4f6";
    });

    cancelButton.addEventListener("click", () => {
      endElementSelection();
    });

    buttonsContainer.appendChild(cancelButton);

    // Create confirm button
    const confirmButton = document.createElement("button");
    confirmButton.textContent = "Add";
    confirmButton.id = "element-comment-confirm";
    Object.assign(confirmButton.style, {
      padding: "6px 14px",
      backgroundColor: uiConfigRef.current.primaryColor,
      color: uiConfigRef.current.textColor,
      border: "none",
      borderRadius: "6px",
      fontSize: "13px",
      fontWeight: "500",
      cursor: "pointer",
      transition: "all 0.2s ease",
    });

    confirmButton.addEventListener("mouseover", () => {
      confirmButton.style.backgroundColor = "#1d4ed8"; // Darker blue
    });

    confirmButton.addEventListener("mouseout", () => {
      confirmButton.style.backgroundColor = uiConfigRef.current.primaryColor;
    });

    buttonsContainer.appendChild(confirmButton);

    return { buttonsContainer, cancelButton, confirmButton };
  };

  /**
   * Sets up event listeners for the modal
   */
  const setupModalEventListeners = (
    backdrop: HTMLDivElement,
    confirmButton: HTMLButtonElement,
    element: HTMLElement,
    componentInfo: ComponentInfo,
  ) => {
    // Add click event to backdrop to close modal
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) {
        endElementSelection();
      }
    });

    // Add escape key listener to close modal
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        endElementSelection();
        document.removeEventListener("keydown", handleEscapeKey);
      }
    };
    document.addEventListener("keydown", handleEscapeKey);

    // Add click handler to confirm button
    confirmButton.addEventListener("click", () => {
      console.log("Add button clicked, element:", element);

      // Get the comment directly from the input element to ensure we have the latest value
      let comment = "";
      if (commentInputRef.current) {
        comment = commentInputRef.current.value.trim();
        console.log("Comment from input element:", comment);
      } else {
        // Fallback to state if input element is not available
        comment = elementComment.trim();
        console.log("Comment from state:", comment);
      }

      // Add the element to context with comment and component information
      const elementInfo = {
        name:
          element.tagName.toLowerCase() + (element.id ? `#${element.id}` : ""),
        type: "Element",
        data: {
          tagName: element.tagName,
          id: element.id || "",
          className: element.className || "",
          textContent: element.textContent?.trim().substring(0, 100) || "",
          html: element.outerHTML.substring(0, 500),
          comment: comment, // Use the comment from the input
          component: {
            name: componentInfo.componentName,
            path: componentInfo.componentPath,
            isReactComponent: componentInfo.isReactComponent,
          },
        },
      };

      console.log("Adding element to context:", elementInfo);

      // Call the onAddContext function with the element info
      onAddContext(elementInfo);

      // Clean up
      endElementSelection();
    });
  };

  /**
   * Creates and shows a comment modal for the given element
   */
  const createCommentModal = useCallback(
    (element: HTMLElement): HTMLButtonElement => {
      // Remove any existing modals
      removeElementById("element-comment-modal");
      removeElementById("element-comment-backdrop");

      // Disable element selection mode when opening modal
      cleanupElementSelectionUI();

      // Remove click handler to prevent selecting new elements
      if (cleanupRef.current.handleElementClick) {
        document.removeEventListener(
          "click",
          cleanupRef.current.handleElementClick,
          true,
        );
      }

      // Detect component information
      const componentInfo = detectComponentInfo(element);

      // Create modal elements
      const { backdrop, confirmButton } = createModalElements(
        element,
        componentInfo,
      );

      // Add event listeners
      setupModalEventListeners(backdrop, confirmButton, element, componentInfo);

      return confirmButton;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cleanupElementSelectionUI, detectComponentInfo],
  );

  // Clean up element selection if component unmounts while selecting
  useEffect(() => {
    return () => {
      if (isSelectingElement) {
        endElementSelection();
      }
    };
  }, [isSelectingElement, endElementSelection]);

  return {
    isSelectingElement,
    selectedElement,
    showCommentModal,
    elementComment,
    startElementSelection,
    endElementSelection,
    setElementComment,
    createCommentModal,
    detectComponentInfo,
  };
};
