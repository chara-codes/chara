"use client";

export interface Theme {
  colors: {
    primary: string;
    primaryLight: string;
    primaryHover: string;
    primaryActive: string;
    secondary: string;
    secondaryHover: string;
    secondaryActive: string;
    background: string;
    backgroundSecondary: string;
    text: string;
    textSecondary: string;
    border: string;
    borderHover: string;
    error: string;
    errorHover: string;
    errorLight: string;
    success: string;
    warning: string;
    info: string;
    highlight: string;
    sourceBadge: {
      unified: {
        background: string;
        text: string;
      };
      native: {
        background: string;
        text: string;
      };
      local: {
        background: string;
        text: string;
      };
    };
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    focus: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    fontWeight: {
      regular: number;
      medium: number;
      semibold: number;
      bold: number;
    };
    lineHeight: {
      tight: number;
      normal: number;
      relaxed: number;
    };
  };
  zIndices: {
    base: number;
    dropdown: number;
    modal: number;
    tooltip: number;
    widget: number;
  };
  breakpoints: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  transitions: {
    fast: string;
    normal: string;
    slow: string;
  };
}

export const theme: Theme = {
  colors: {
    primary: "#2563eb",
    primaryLight: "rgba(59, 130, 246, 0.2)",
    primaryHover: "#1d4ed8",
    primaryActive: "#1e40af",
    secondary: "#6b7280",
    secondaryHover: "#4b5563",
    secondaryActive: "#374151",
    background: "#ffffff",
    backgroundSecondary: "#f9fafb",
    text: "#111827",
    textSecondary: "#6b7280",
    border: "#e5e7eb",
    borderHover: "#D1D5DB",
    error: "#ef4444",
    errorHover: "#DC2626",
    errorLight: "rgba(239, 68, 68, 0.2)",
    success: "#10b981",
    warning: "#f59e0b",
    info: "#3b82f6",
    highlight: "#f3f4f6",
    sourceBadge: {
      unified: {
        background: "#e0e7ff",
        text: "#5b21b6",
      },
      native: {
        background: "#dbeafe",
        text: "#1d4ed8",
      },
      local: {
        background: "#dcfce7",
        text: "#166534",
      },
    },
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
  },
  borderRadius: {
    sm: "4px",
    md: "6px",
    lg: "8px",
    full: "9999px",
  },
  shadows: {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    focus: "0 0 0 2px",
  },
  typography: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
    fontSize: {
      xs: "12px",
      sm: "14px",
      md: "16px",
      lg: "18px",
      xl: "20px",
    },
    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  zIndices: {
    base: 1,
    dropdown: 10,
    modal: 100,
    tooltip: 200,
    widget: 1000,
  },
  breakpoints: {
    xs: "480px",
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
  },
  transitions: {
    fast: "150ms",
    normal: "300ms",
    slow: "500ms",
  },
};

export default theme;
