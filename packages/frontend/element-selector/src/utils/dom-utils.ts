/**
 * DOM utility functions for element manipulation and querying
 */

/**
 * Remove an element by ID if it exists
 */
export function removeElementById(id: string): void {
  const element = document.getElementById(id);
  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
  }
}

/**
 * Check if an element is a UI element that should be ignored during selection
 */
export function isUIElement(element: HTMLElement): boolean {
  const uiElementIds = [
    "element-selection-guide",
    "element-tag-display",
    "element-selector-cursor",
    "element-comment-modal",
    "element-comment-backdrop",
  ];

  const uiElementClasses = ["element-tag", "element-selector-ui"];

  // Check if the element itself is a UI element
  if (uiElementIds.includes(element.id)) {
    return true;
  }

  // Check if the element has UI classes
  if (element.className && typeof element.className === "string") {
    const classes = element.className.split(" ");
    if (classes.some((cls) => uiElementClasses.includes(cls))) {
      return true;
    }
  }

  // Check if the element is inside a UI element
  if (
    element.closest("#element-selection-guide") ||
    element.closest("#element-comment-modal")
  ) {
    return true;
  }

  return false;
}

/**
 * Get the element at a specific point, excluding UI elements
 */
export function getElementAtPoint(x: number, y: number): HTMLElement | null {
  const element = document.elementFromPoint(x, y) as HTMLElement;

  if (!element) {
    return null;
  }

  // Skip if this is our own UI element
  if (isUIElement(element)) {
    return null;
  }

  return element;
}

/**
 * Get element bounding rectangle with safety checks
 */
export function getElementBounds(element: HTMLElement): DOMRect {
  try {
    return element.getBoundingClientRect();
  } catch (error) {
    console.error("Error getting element bounds:", error);
    return {
      top: 0,
      left: 0,
      width: 0,
      height: 0,
      right: 0,
      bottom: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    };
  }
}

/**
 * Create a DOM element with styles and properties
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  options: {
    id?: string;
    className?: string;
    textContent?: string;
    innerHTML?: string;
    styles?: Partial<CSSStyleDeclaration>;
    attributes?: Record<string, string>;
    eventListeners?: Record<string, EventListener>;
  } = {}
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);

  if (options.id) {
    element.id = options.id;
  }

  if (options.className) {
    element.className = options.className;
  }

  if (options.textContent) {
    element.textContent = options.textContent;
  }

  if (options.innerHTML) {
    element.innerHTML = options.innerHTML;
  }

  if (options.styles) {
    Object.assign(element.style, options.styles);
  }

  if (options.attributes) {
    Object.entries(options.attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }

  if (options.eventListeners) {
    Object.entries(options.eventListeners).forEach(([event, listener]) => {
      element.addEventListener(event, listener);
    });
  }

  return element;
}

/**
 * Add multiple CSS classes to an element
 */
export function addClasses(element: HTMLElement, classes: string[]): void {
  classes.forEach((cls) => {
    if (cls && cls.trim()) {
      element.classList.add(cls.trim());
    }
  });
}

/**
 * Remove multiple CSS classes from an element
 */
export function removeClasses(element: HTMLElement, classes: string[]): void {
  classes.forEach((cls) => {
    if (cls && cls.trim()) {
      element.classList.remove(cls.trim());
    }
  });
}

/**
 * Check if an element has any of the specified classes
 */
export function hasAnyClass(element: HTMLElement, classes: string[]): boolean {
  return classes.some((cls) => element.classList.contains(cls));
}

/**
 * Get all elements with a specific class, excluding UI elements
 */
export function getElementsByClass(className: string): HTMLElement[] {
  const elements = Array.from(
    document.getElementsByClassName(className)
  ) as HTMLElement[];
  return elements.filter((element) => !isUIElement(element));
}

/**
 * Find the closest parent element matching a predicate
 */
export function findClosestParent(
  element: HTMLElement,
  predicate: (el: HTMLElement) => boolean,
  maxDepth = 10
): HTMLElement | null {
  let current = element.parentElement;
  let depth = 0;

  while (current && depth < maxDepth) {
    if (predicate(current)) {
      return current;
    }
    current = current.parentElement;
    depth++;
  }

  return null;
}

/**
 * Check if an element is visible in the viewport
 */
export function isElementVisible(element: HTMLElement): boolean {
  const rect = getElementBounds(element);
  const windowHeight =
    window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;

  return (
    rect.top < windowHeight &&
    rect.bottom > 0 &&
    rect.left < windowWidth &&
    rect.right > 0
  );
}

/**
 * Scroll an element into view if it's not visible
 */
export function scrollIntoViewIfNeeded(element: HTMLElement): void {
  if (!isElementVisible(element)) {
    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "center",
    });
  }
}

/**
 * Generate a unique selector for an element
 */
export function generateElementSelector(element: HTMLElement): string {
  const parts: string[] = [];

  // Add tag name
  parts.push(element.tagName.toLowerCase());

  // Add ID if present
  if (element.id) {
    parts.push(`#${element.id}`);
  }

  // Add first few classes if present
  if (element.className && typeof element.className === "string") {
    const classes = element.className.trim().split(/\s+/).slice(0, 3);
    if (classes.length > 0) {
      parts.push(`.${classes.join(".")}`);
    }
  }

  return parts.join("");
}

/**
 * Clean up all selection-related elements and classes
 */
export function cleanupSelectionUI(): void {
  // Remove UI elements
  const uiElementIds = [
    "element-selector-cursor",
    "element-selection-guide",
    "element-tag-display",
    "element-comment-modal",
    "element-comment-backdrop",
  ];

  uiElementIds.forEach((id) => removeElementById(id));

  // Remove highlight classes
  const highlightedElements = document.querySelectorAll(".element-highlight");
  highlightedElements.forEach((el) => el.classList.remove("element-highlight"));

  // Remove body classes
  document.body.classList.remove("element-selecting");

  // Remove style elements
  const styleElements = document.querySelectorAll(
    "style[data-element-selection]"
  );
  styleElements.forEach((style) => {
    if (style.parentNode) {
      style.parentNode.removeChild(style);
    }
  });
}

/**
 * Create a style element with the given CSS content
 */
export function createStyleElement(
  css: string,
  dataAttribute?: string
): HTMLStyleElement {
  const style = document.createElement("style");
  style.textContent = css;

  if (dataAttribute) {
    style.setAttribute(dataAttribute, "true");
  }

  return style;
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: unknown[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
