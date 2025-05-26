export const typography = {
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
  fontSize: {
    xs: "12px",
    sm: "13px",
    md: "14px",
    lg: "16px",
    xl: "18px",
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
}

// Colors
export const colors = {
  primary: {
    default: "#3B82F6",
    hover: "#2563EB",
    active: "#1D4ED8",
    disabled: "#93C5FD",
    light: "rgba(59, 130, 246, 0.2)",
  },
  secondary: {
    default: "#6B7280",
    hover: "#4B5563",
    active: "#374151",
    disabled: "#D1D5DB",
  },
  destructive: {
    default: "#EF4444",
    hover: "#DC2626",
    active: "#B91C1C",
    disabled: "#FCA5A5",
    light: "rgba(239, 68, 68, 0.2)",
  },
  success: {
    default: "#10B981",
    hover: "#059669",
    light: "rgba(16, 185, 129, 0.2)",
  },
  warning: {
    default: "#F59E0B",
    hover: "#D97706",
    light: "rgba(245, 158, 11, 0.2)",
  },
  text: {
    primary: "#111827",
    secondary: "#374151",
    tertiary: "#6B7280",
    disabled: "#9CA3AF",
  },
  background: {
    primary: "#FFFFFF",
    secondary: "#F9FAFB",
    tertiary: "#F3F4F6",
  },
  border: {
    default: "#E5E7EB",
    hover: "#D1D5DB",
    focus: "#3B82F6",
  },
}

// Spacing
export const spacing = {
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "20px",
  xxl: "24px",
}

// Border radius
export const borderRadius = {
  xs: "2px",
  sm: "4px",
  md: "6px",
  lg: "8px",
  xl: "12px",
  full: "9999px",
}

// Shadows
export const shadows = {
  sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px rgba(0, 0, 0, 0.1)",
  lg: "0 10px 15px rgba(0, 0, 0, 0.1)",
  focus: "0 0 0 2px",
}

// Breakpoints
export const breakpoints = {
  xs: "480px",
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
}

// Transitions
export const transitions = {
  fast: "150ms",
  normal: "200ms",
  slow: "300ms",
}

// Z-index
export const zIndex = {
  base: 1,
  dropdown: 10,
  modal: 100,
  tooltip: 200,
}
