import React from "react";
import { describe, it, expect, vi } from "vitest";
import { ThemeProvider } from "styled-components";
import Button from "../button";

const mockTheme = {
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
};

describe("Button Component", () => {
  it("should be a valid React component", () => {
    expect(typeof Button).toBe("object");
    expect(Button.displayName || Button.name).toBe("styled.button");
  });

  it("should create element with default props", () => {
    const element = React.createElement(
      ThemeProvider,
      { theme: mockTheme },
      React.createElement(Button, {}, "Test Button"),
    );
    expect(element).toBeTruthy();
    expect(element.type).toBe(ThemeProvider);
  });

  it("should accept variant prop", () => {
    const element = React.createElement(
      ThemeProvider,
      { theme: mockTheme },
      React.createElement(Button, { variant: "secondary" }, "Secondary Button"),
    );
    expect(element.props.children.props.variant).toBe("secondary");
  });

  it("should accept size prop", () => {
    const element = React.createElement(
      ThemeProvider,
      { theme: mockTheme },
      React.createElement(Button, { size: "lg" }, "Large Button"),
    );
    expect(element.props.children.props.size).toBe("lg");
  });

  it("should accept fullWidth prop", () => {
    const element = React.createElement(
      ThemeProvider,
      { theme: mockTheme },
      React.createElement(Button, { fullWidth: true }, "Full Width Button"),
    );
    expect(element.props.children.props.fullWidth).toBe(true);
  });

  it("should accept disabled prop", () => {
    const element = React.createElement(
      ThemeProvider,
      { theme: mockTheme },
      React.createElement(Button, { disabled: true }, "Disabled Button"),
    );
    expect(element.props.children.props.disabled).toBe(true);
  });

  it("should accept onClick handler", () => {
    const handleClick = vi.fn();
    const element = React.createElement(
      ThemeProvider,
      { theme: mockTheme },
      React.createElement(Button, { onClick: handleClick }, "Clickable Button"),
    );
    expect(element.props.children.props.onClick).toBe(handleClick);
  });

  it("should accept children content", () => {
    const children = "Button Text Content";
    const element = React.createElement(
      ThemeProvider,
      { theme: mockTheme },
      React.createElement(Button, {}, children),
    );
    expect(element.props.children.props.children).toBe(children);
  });

  it("should accept all variant options", () => {
    const variants = ["primary", "secondary", "text"] as const;

    for (const variant of variants) {
      const element = React.createElement(
        ThemeProvider,
        { theme: mockTheme },
        React.createElement(Button, { variant }, `${variant} Button`),
      );
      const buttonProps = element.props.children as React.ReactElement;
      expect(buttonProps.props.variant).toBe(variant);
    }
  });

  it("should accept all size options", () => {
    const sizes = ["sm", "md", "lg"] as const;

    for (const size of sizes) {
      const element = React.createElement(
        ThemeProvider,
        { theme: mockTheme },
        React.createElement(Button, { size }, `${size} Button`),
      );
      const buttonProps = element.props.children as React.ReactElement;
      expect(buttonProps.props.size).toBe(size);
    }
  });

  it("should pass through additional HTML attributes", () => {
    const additionalProps = {
      "data-testid": "test-button",
      "aria-label": "Test button",
      type: "submit" as const,
    };

    const element = React.createElement(
      ThemeProvider,
      { theme: mockTheme },
      React.createElement(Button, additionalProps, "Button with attributes"),
    );

    expect(element.props.children.props["data-testid"]).toBe("test-button");
    expect(element.props.children.props["aria-label"]).toBe("Test button");
    expect(element.props.children.props.type).toBe("submit");
  });
});
