import { ElementSelectorUIConfig } from "../types";

/**
 * Default UI configuration for the element selector
 */
export const DEFAULT_UI_CONFIG: ElementSelectorUIConfig = {
  primaryColor: "#2563eb", // Blue
  textColor: "white",
  borderColor: "white",
  backgroundColor: "rgba(37, 99, 235, 0.2)",
  zIndexBase: 2147483640, // High z-index to ensure visibility
};

/**
 * Generate CSS for element highlighting
 */
export function generateHighlightStyles(
  config: ElementSelectorUIConfig
): string {
  return `
    @keyframes fadeIn {
      from { opacity: 0; transform: translate(-50%, -10px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }

    @keyframes slideIn {
      from { transform: translate(-50%, -55%); opacity: 0; }
      to { transform: translate(-50%, -50%); opacity: 1; }
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
      box-shadow: 0 0 0 3px ${
        config.borderColor
      }, 0 0 15px 5px rgba(37, 99, 235, 0.8) !important;
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
}

/**
 * Common styles for UI elements
 */
export const UI_ELEMENT_STYLES = {
  modal: {
    position: "fixed" as const,
    backgroundColor: "white",
    padding: "16px",
    borderRadius: "8px",
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.15)",
    fontFamily: "system-ui, -apple-system, sans-serif",
    border: "1px solid rgba(0, 0, 0, 0.1)",
  },

  backdrop: {
    position: "fixed" as const,
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    backdropFilter: "blur(2px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    animation: "fadeIn 0.2s ease-out",
  },

  button: {
    padding: "6px 12px",
    border: "none",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },

  input: {
    width: "100%",
    padding: "10px 12px",
    fontSize: "13px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    boxSizing: "border-box" as const,
    height: "40px",
    fontFamily: "system-ui, -apple-system, sans-serif",
    transition: "border-color 0.2s ease",
  },

  badge: {
    position: "absolute" as const,
    top: "0",
    right: "0",
    padding: "1px 6px",
    fontSize: "9px",
    fontWeight: "600",
    textTransform: "uppercase" as const,
    borderBottomLeftRadius: "4px",
  },
};

/**
 * Generate styles for a primary button
 */
export function getPrimaryButtonStyles(
  config: ElementSelectorUIConfig
): Partial<CSSStyleDeclaration> {
  return {
    ...UI_ELEMENT_STYLES.button,
    backgroundColor: config.primaryColor,
    color: config.textColor,
  };
}

/**
 * Generate styles for a secondary button
 */
export function getSecondaryButtonStyles(): Partial<CSSStyleDeclaration> {
  return {
    ...UI_ELEMENT_STYLES.button,
    backgroundColor: "#f3f4f6",
    color: "#4b5563",
    border: "1px solid #d1d5db",
  };
}

/**
 * Generate styles for modal header
 */
export function getModalHeaderStyles(): Partial<CSSStyleDeclaration> {
  return {
    display: "flex",
    alignItems: "center",
    marginBottom: "12px",
    margin: "0",
    fontSize: "16px",
    fontWeight: "600",
    color: "#1f2937",
  };
}

/**
 * Generate styles for info sections
 */
export function getInfoSectionStyles(
  _config: ElementSelectorUIConfig,
  variant: "element" | "component" = "element"
): Partial<CSSStyleDeclaration> {
  const baseStyles = {
    padding: "8px 10px",
    borderRadius: "6px",
    marginBottom: "12px",
    fontSize: "12px",
    fontFamily: "monospace",
    border: "1px solid",
    position: "relative" as const,
    overflow: "hidden" as const,
    textOverflow: "ellipsis" as const,
    whiteSpace: "nowrap" as const,
  };

  if (variant === "component") {
    return {
      ...baseStyles,
      backgroundColor: "#eef2ff",
      color: "#4338ca",
      borderColor: "#c7d2fe",
    };
  }

  return {
    ...baseStyles,
    backgroundColor: "#f3f4f6",
    color: "#4b5563",
    borderColor: "#e5e7eb",
  };
}

/**
 * Generate styles for cursor follower
 */
export function getCursorFollowerStyles(
  config: ElementSelectorUIConfig
): Partial<CSSStyleDeclaration> {
  return {
    position: "fixed",
    width: "40px",
    height: "40px",
    pointerEvents: "none",
    zIndex: `${config.zIndexBase + 5}`,
    transform: "translate(-50%, -50%)",
  };
}

/**
 * Generate SVG content for cursor crosshair
 */
export function generateCrosshairSVG(config: ElementSelectorUIConfig): string {
  return `
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="3" fill="${config.primaryColor}" stroke="${config.borderColor}" stroke-width="2"/>
      <line x1="20" y1="0" x2="20" y2="15" stroke="${config.primaryColor}" stroke-width="3"/>
      <line x1="20" y1="25" x2="20" y2="40" stroke="${config.primaryColor}" stroke-width="3"/>
      <line x1="0" y1="20" x2="15" y2="20" stroke="${config.primaryColor}" stroke-width="3"/>
      <line x1="25" y1="20" x2="40" y2="20" stroke="${config.primaryColor}" stroke-width="3"/>
    </svg>
  `;
}

/**
 * Generate styles for selection guide
 */
export function getSelectionGuideStyles(
  config: ElementSelectorUIConfig
): Partial<CSSStyleDeclaration> {
  return {
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
  };
}

/**
 * Generate SVG content for selection guide icon
 */
export function generateSelectionGuideIconSVG(): string {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 14a8 8 0 0 1-8 8"></path>
      <path d="M18 11v-1a2 2 0 0 0-2-2a2 2 0 0 0-2 2"></path>
      <path d="M14 10V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1"></path>
      <path d="M10 9.5V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v10"></path>
      <path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"></path>
    </svg>
  `;
}

/**
 * Generate styles for tag display
 */
export function getTagDisplayStyles(
  config: ElementSelectorUIConfig
): Partial<CSSStyleDeclaration> {
  return {
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
  };
}

/**
 * Apply hover effects to button
 */
export function applyButtonHoverEffects(
  button: HTMLElement,
  variant: "primary" | "secondary",
  config: ElementSelectorUIConfig
): void {
  const originalColor = variant === "primary" ? config.primaryColor : "#f3f4f6";
  const hoverColor = variant === "primary" ? "#1d4ed8" : "#e5e7eb";

  button.addEventListener("mouseover", () => {
    button.style.backgroundColor = hoverColor;
  });

  button.addEventListener("mouseout", () => {
    button.style.backgroundColor = originalColor;
  });
}

/**
 * Apply focus effects to input
 */
export function applyInputFocusEffects(
  input: HTMLInputElement,
  config: ElementSelectorUIConfig
): void {
  input.addEventListener("focus", () => {
    input.style.borderColor = config.primaryColor;
    input.style.outline = "none";
    input.style.boxShadow = `0 0 0 2px rgba(37, 99, 235, 0.2)`;
  });

  input.addEventListener("blur", () => {
    input.style.borderColor = "#d1d5db";
    input.style.boxShadow = "none";
  });
}

/**
 * Create CSS animation keyframes
 */
export function createAnimationKeyframes(): string {
  return `
    @keyframes elementSelectorFadeIn {
      from { opacity: 0; transform: translate(-50%, -10px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }

    @keyframes elementSelectorSlideIn {
      from { transform: translate(-50%, -55%); opacity: 0; }
      to { transform: translate(-50%, -50%); opacity: 1; }
    }

    @keyframes elementSelectorPulse {
      0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7); }
      70% { box-shadow: 0 0 0 10px rgba(37, 99, 235, 0); }
      100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
    }
  `;
}

/**
 * Position element relative to another element
 */
export function positionRelativeTo(
  element: HTMLElement,
  target: HTMLElement,
  position: "above" | "below" | "left" | "right" = "above",
  offset = 10
): void {
  const targetRect = target.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();

  let top = 0;
  let left = 0;

  switch (position) {
    case "above":
      top = targetRect.top - elementRect.height - offset;
      left = targetRect.left + (targetRect.width - elementRect.width) / 2;
      break;
    case "below":
      top = targetRect.bottom + offset;
      left = targetRect.left + (targetRect.width - elementRect.width) / 2;
      break;
    case "left":
      top = targetRect.top + (targetRect.height - elementRect.height) / 2;
      left = targetRect.left - elementRect.width - offset;
      break;
    case "right":
      top = targetRect.top + (targetRect.height - elementRect.height) / 2;
      left = targetRect.right + offset;
      break;
  }

  // Ensure the element stays within viewport bounds
  const maxTop = window.innerHeight - elementRect.height;
  const maxLeft = window.innerWidth - elementRect.width;

  top = Math.max(0, Math.min(top, maxTop));
  left = Math.max(0, Math.min(left, maxLeft));

  element.style.top = `${top}px`;
  element.style.left = `${left}px`;
}
