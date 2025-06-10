import type { ContextItem } from "@chara/core";
import type React from "react";

/**
 * Generates preview content for a context item based on its type and data
 */
export const getPreviewContent = (item: ContextItem): React.ReactNode => {
  const lowerType = item.type.toLowerCase();

  // If the item has data, use it for the preview
  if (item.data) {
    // Special handling for Element type with comment
    if (lowerType === "element" && typeof item.data === "object") {
      const elementData = item.data as Record<string, unknown>;
      const comment = (elementData.comment as string) || "";

      // Format the element data with the comment prominently displayed
      return (
        <>
          {comment && (
            <div
              style={{
                marginBottom: "12px",
                padding: "8px 12px",
                backgroundColor: "#f0f9ff",
                borderLeft: "3px solid #2563eb",
                borderRadius: "4px",
                fontStyle: "italic",
              }}
            >
              <strong>Comment:</strong> {comment}
            </div>
          )}
          <div>
            <strong>Element:</strong>{" "}
            {(elementData.tagName as string)?.toLowerCase() || "unknown"}
            {typeof elementData.id === "string" && elementData.id && (
              <span>
                {" "}
                #<code>{elementData.id}</code>
              </span>
            )}
            {typeof elementData.className === "string" &&
              elementData.className && (
                <span>
                  {" "}
                  .<code>{elementData.className.split(" ").join(".")}</code>
                </span>
              )}
          </div>
          {elementData.component &&
            typeof elementData.component === "object" &&
            (elementData.component as { name?: string; path?: string })
              .name && (
              <div style={{ marginTop: "8px" }}>
                <strong>Component:</strong>{" "}
                {(elementData.component as { name: string }).name}
                {(elementData.component as { path?: string }).path && (
                  <div>
                    <small>
                      Path: {(elementData.component as { path: string }).path}
                    </small>
                  </div>
                )}
              </div>
            )}
          {typeof elementData.textContent === "string" &&
            elementData.textContent && (
              <div style={{ marginTop: "8px", opacity: 0.8 }}>
                <strong>Content:</strong>{" "}
                {elementData.textContent.substring(0, 100)}
                {elementData.textContent.length > 100 ? "..." : ""}
              </div>
            )}
        </>
      );
    }

    if (typeof item.data === "string") {
      return item.data;
    }

    try {
      // Try to stringify the data for display
      return JSON.stringify(item.data, null, 2);
    } catch {
      // Fallback if data can't be stringified
      return "[Complex data structure]";
    }
  }

  // Otherwise generate mock preview based on type
  switch (lowerType) {
    case "file":
      if (item.name.endsWith(".json")) {
        return `{
    "name": "project-name",
    "version": "1.0.0",
    "description": "Project description",
    "main": "index.js",
    "scripts": {
      "start": "node index.js",
      "test": "jest"
    }
  }`;
      }

      if (item.name.endsWith(".md")) {
        return `# ${item.name}

  ## Introduction
  This is a sample markdown file.

  ## Features
  - Feature 1
  - Feature 2
  - Feature 3`;
      }

      return `// Sample code
  function example() {
    console.log("This is a preview of ${item.name}");
    return true;
  }`;

    case "documentation":
      return `# ${item.name}

  This documentation explains how to use the API.

  ## Getting Started
  1. Install dependencies
  2. Configure settings
  3. Run the application`;
    case "terminal":
      return `$ npm install
  + react@18.2.0
  + react-dom@18.2.0
  + styled-components@6.1.1
  added 1298 packages in 32s`;
    case "link":
      return `URL: ${item.name}

  This link points to an external resource that provides additional context for the conversation.`;
    case "text":
      return item.name;
    default:
      return `Content preview for ${item.name}`;
  }
};
