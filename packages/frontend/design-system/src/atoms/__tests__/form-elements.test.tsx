import React from "react";
import { describe, it, expect } from "vitest";
import { ThemeProvider } from "styled-components";
import {
  InputBase,
  TextAreaBase,
  SelectBase,
  LabelBase,
  ErrorMessageBase,
  FormGroupBase,
  FormRowBase,
  FormSectionBase,
  SectionTitleBase,
  CheckboxBase,
  ButtonBase,
  IconSelectorBase,
  IconOptionBase,
} from "../form-elements";

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
  typography: {
    fontSize: {
      xs: "12px",
      sm: "14px",
      md: "16px",
      lg: "18px",
    },
    fontFamily: "Inter, system-ui, sans-serif",
    fontWeight: {
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
    },
    lineHeight: {
      normal: "1.5",
    },
  },
  borderRadius: {
    sm: "4px",
    md: "6px",
    lg: "8px",
    full: "9999px",
  },
  shadows: {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    focus: "0 0 0 2px",
  },
  transitions: {
    normal: "150ms",
  },
};

describe("Form Elements Components", () => {
  it("should be valid styled components", () => {
    expect(typeof InputBase).toBe("object");
    expect(typeof TextAreaBase).toBe("object");
    expect(typeof SelectBase).toBe("object");
    expect(typeof LabelBase).toBe("object");
    expect(typeof ErrorMessageBase).toBe("object");
    expect(typeof FormGroupBase).toBe("object");
    expect(typeof FormRowBase).toBe("object");
    expect(typeof FormSectionBase).toBe("object");
    expect(typeof SectionTitleBase).toBe("object");
    expect(typeof CheckboxBase).toBe("object");
    expect(typeof ButtonBase).toBe("object");
    expect(typeof IconSelectorBase).toBe("object");
    expect(typeof IconOptionBase).toBe("object");
  });

  describe("InputBase", () => {
    it("should create element with default props", () => {
      const element = React.createElement(
        ThemeProvider,
        { theme: mockTheme },
        React.createElement(InputBase, { placeholder: "Test input" }),
      );
      expect(element).toBeTruthy();
      expect(element.type).toBe(ThemeProvider);
    });

    it("should accept $hasError prop", () => {
      const element = React.createElement(
        ThemeProvider,
        { theme: mockTheme },
        React.createElement(InputBase, { $hasError: true }),
      );
      expect(element.props.children.props.$hasError).toBe(true);
    });

    it("should accept $disabled prop", () => {
      const element = React.createElement(
        ThemeProvider,
        { theme: mockTheme },
        React.createElement(InputBase, { $disabled: true }),
      );
      expect(element.props.children.props.$disabled).toBe(true);
    });

    it("should accept standard input attributes", () => {
      const element = React.createElement(
        ThemeProvider,
        { theme: mockTheme },
        React.createElement(InputBase, {
          type: "email",
          placeholder: "Enter email",
          "data-testid": "email-input",
        }),
      );
      expect(element.props.children.props.type).toBe("email");
      expect(element.props.children.props.placeholder).toBe("Enter email");
      expect(element.props.children.props["data-testid"]).toBe("email-input");
    });
  });

  describe("TextAreaBase", () => {
    it("should create element with default props", () => {
      const element = React.createElement(
        ThemeProvider,
        { theme: mockTheme },
        React.createElement(TextAreaBase, { placeholder: "Enter text" }),
      );
      expect(element).toBeTruthy();
      expect(element.type).toBe(ThemeProvider);
    });

    it("should accept rows prop", () => {
      const element = React.createElement(
        ThemeProvider,
        { theme: mockTheme },
        React.createElement(TextAreaBase, { rows: 5 }),
      );
      expect(element.props.children.props.rows).toBe(5);
    });

    it("should accept $hasError prop", () => {
      const element = React.createElement(
        ThemeProvider,
        { theme: mockTheme },
        React.createElement(TextAreaBase, { $hasError: true }),
      );
      expect(element.props.children.props.$hasError).toBe(true);
    });
  });

  describe("SelectBase", () => {
    it("should create element with default props", () => {
      const element = React.createElement(
        ThemeProvider,
        { theme: mockTheme },
        React.createElement(SelectBase, {}),
      );
      expect(element).toBeTruthy();
      expect(element.type).toBe(ThemeProvider);
    });

    it("should accept $hasError prop", () => {
      const element = React.createElement(
        ThemeProvider,
        { theme: mockTheme },
        React.createElement(SelectBase, { $hasError: true }),
      );
      expect(element.props.children.props.$hasError).toBe(true);
    });

    it("should accept $disabled prop", () => {
      const element = React.createElement(
        ThemeProvider,
        { theme: mockTheme },
        React.createElement(SelectBase, { $disabled: true }),
      );
      expect(element.props.children.props.$disabled).toBe(true);
    });
  });

  describe("LabelBase", () => {
    it("should create element with default props", () => {
      const element = React.createElement(
        ThemeProvider,
        { theme: mockTheme },
        React.createElement(LabelBase, {}, "Label text"),
      );
      expect(element).toBeTruthy();
      expect(element.type).toBe(ThemeProvider);
      expect(element.props.children.props.children).toBe("Label text");
    });

    it("should accept htmlFor prop", () => {
      const element = React.createElement(
        ThemeProvider,
        { theme: mockTheme },
        React.createElement(LabelBase, { htmlFor: "input-id" }, "Label"),
      );
      expect(element.props.children.props.htmlFor).toBe("input-id");
    });
  });

  describe("ErrorMessageBase", () => {
    it("should create element with error message", () => {
      const errorMessage = "This field is required";
      const element = React.createElement(
        ThemeProvider,
        { theme: mockTheme },
        React.createElement(ErrorMessageBase, {}, errorMessage),
      );
      expect(element).toBeTruthy();
      expect(element.props.children.props.children).toBe(errorMessage);
    });

    it("should accept role prop for accessibility", () => {
      const element = React.createElement(
        ThemeProvider,
        { theme: mockTheme },
        React.createElement(ErrorMessageBase, { role: "alert" }, "Error"),
      );
      expect(element.props.children.props.role).toBe("alert");
    });
  });

  describe("FormGroupBase", () => {
    it("should create element with default props", () => {
      const element = React.createElement(
        ThemeProvider,
        { theme: mockTheme },
        React.createElement(FormGroupBase, {}, "Form group content"),
      );
      expect(element).toBeTruthy();
      expect(element.type).toBe(ThemeProvider);
    });

    it("should accept $fullWidth prop", () => {
      const element = React.createElement(
        ThemeProvider,
        { theme: mockTheme },
        React.createElement(FormGroupBase, { $fullWidth: true }),
      );
      expect(element.props.children.props.$fullWidth).toBe(true);
    });

    it("should accept $fullWidth as false", () => {
      const element = React.createElement(
        ThemeProvider,
        { theme: mockTheme },
        React.createElement(FormGroupBase, { $fullWidth: false }),
      );
      expect(element.props.children.props.$fullWidth).toBe(false);
    });
  });

  describe("FormRowBase", () => {
    it("should create element with children", () => {
      const element = React.createElement(
        ThemeProvider,
        { theme: mockTheme },
        React.createElement(FormRowBase, {}, "Form row content"),
      );
      expect(element).toBeTruthy();
      expect(element.props.children.props.children).toBe("Form row content");
    });
  });

  describe("FormSectionBase", () => {
    it("should create element with section content", () => {
      const element = React.createElement(
        ThemeProvider,
        { theme: mockTheme },
        React.createElement(FormSectionBase, {}, "Section content"),
      );
      expect(element).toBeTruthy();
      expect(element.props.children.props.children).toBe("Section content");
    });
  });

  describe("SectionTitleBase", () => {
    it("should create element with title text", () => {
      const titleText = "Section Title";
      const element = React.createElement(
        ThemeProvider,
        { theme: mockTheme },
        React.createElement(SectionTitleBase, {}, titleText),
      );
      expect(element).toBeTruthy();
      expect(element.props.children.props.children).toBe(titleText);
    });
  });

  describe("CheckboxBase", () => {
    it("should create element with checkbox content", () => {
      const element = React.createElement(
        ThemeProvider,
        { theme: mockTheme },
        React.createElement(CheckboxBase, {}, "Checkbox wrapper"),
      );
      expect(element).toBeTruthy();
      expect(element.props.children.props.children).toBe("Checkbox wrapper");
    });
  });

  describe("ButtonBase", () => {
    it("should create element with default props", () => {
      const element = React.createElement(
        ThemeProvider,
        { theme: mockTheme },
        React.createElement(ButtonBase, {}, "Button text"),
      );
      expect(element).toBeTruthy();
      expect(element.props.children.props.children).toBe("Button text");
    });

    it("should accept $variant prop", () => {
      const variants = ["primary", "secondary", "destructive", "link"] as const;
      
      for (const variant of variants) {
        const element = React.createElement(
          ThemeProvider,
          { theme: mockTheme },
          React.createElement(ButtonBase, { $variant: variant }, "Button"),
        );
        expect(element.props.children.props.$variant).toBe(variant);
      }
    });

    it("should accept $size prop", () => {
      const sizes = ["small", "medium", "large"] as const;
      
      for (const size of sizes) {
        const element = React.createElement(
          ThemeProvider,
          { theme: mockTheme },
          React.createElement(ButtonBase, { $size: size }, "Button"),
        );
        expect(element.props.children.props.$size).toBe(size);
      }
    });

    it("should accept disabled prop", () => {
      const element = React.createElement(
        ThemeProvider,
        { theme: mockTheme },
        React.createElement(ButtonBase, { disabled: true }, "Disabled Button"),
      );
      expect(element.props.children.props.disabled).toBe(true);
    });

    it("should accept onClick handler", () => {
      const handleClick = () => {};
      const element = React.createElement(
        ThemeProvider,
        { theme: mockTheme },
        React.createElement(ButtonBase, { onClick: handleClick }, "Button"),
      );
      expect(element.props.children.props.onClick).toBe(handleClick);
    });
  });

  describe("IconSelectorBase", () => {
    it("should create element with icon selector content", () => {
      const element = React.createElement(
        ThemeProvider,
        { theme: mockTheme },
        React.createElement(IconSelectorBase, {}, "Icon selector"),
      );
      expect(element).toBeTruthy();
      expect(element.props.children.props.children).toBe("Icon selector");
    });
  });

  describe("IconOptionBase", () => {
    it("should create element with $selected prop", () => {
      const element = React.createElement(
        ThemeProvider,
        { theme: mockTheme },
        React.createElement(IconOptionBase, { $selected: true }, "Icon"),
      );
      expect(element).toBeTruthy();
      expect(element.props.children.props.$selected).toBe(true);
    });

    it("should accept $selected as false", () => {
      const element = React.createElement(
        ThemeProvider,
        { theme: mockTheme },
        React.createElement(IconOptionBase, { $selected: false }, "Icon"),
      );
      expect(element.props.children.props.$selected).toBe(false);
    });

    it("should accept onClick handler", () => {
      const handleClick = () => {};
      const element = React.createElement(
        ThemeProvider,
        { theme: mockTheme },
        React.createElement(IconOptionBase, { 
          $selected: false, 
          onClick: handleClick 
        }, "Icon"),
      );
      expect(element.props.children.props.onClick).toBe(handleClick);
    });
  });
});