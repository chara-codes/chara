import type React from "react";
import type { ToolCall, ToolResult } from "@chara/core";

export const getPreviewContent = (item: {
  type: string;
  data?: unknown;
  name?: string;
}): React.ReactNode => {
  if (!item || !item.data) {
    return "No preview available";
  }

  const { type, data } = item;

  // Handle case where data might not be a Record
  const safeData =
    data && typeof data === "object" && data !== null
      ? (data as Record<string, unknown>)
      : {};

  switch (type.toLowerCase()) {
    case "element":
      return (
        <>
          <div style={{ marginBottom: "8px" }}>
            <strong>Comment:</strong> {String(safeData.comment) || "No comment"}
          </div>
          <div>
            <strong>Element:</strong>{" "}
            {safeData.tagName
              ? String(safeData.tagName).toLowerCase()
              : "unknown"}
            {safeData.id ? ` #${String(safeData.id)}` : ""}
            {safeData.className
              ? ` .${String(safeData.className).split(" ").join(".")}`
              : ""}
          </div>
          {safeData.component &&
            typeof safeData.component === "object" &&
            safeData.component !== null &&
            (safeData.component as Record<string, unknown>).name !==
              "Unknown" && (
              <div>
                <strong>Component:</strong>{" "}
                {String((safeData.component as Record<string, unknown>).name)} (
                {String((safeData.component as Record<string, unknown>).path)})
              </div>
            )}
          <div style={{ marginTop: "8px" }}>
            <strong>Content:</strong>{" "}
            {String(safeData.textContent) || "(empty)"}
          </div>
          <pre
            style={{
              marginTop: "8px",
              overflow: "auto",
              maxHeight: "150px",
              backgroundColor: "#f5f5f5",
              padding: "8px",
              borderRadius: "4px",
              fontSize: "12px",
            }}
          >
            {String(safeData.html || "")}
          </pre>
        </>
      );
    case "file":
      return (
        <>
          <strong>File:</strong>{" "}
          {String(safeData.name || item.name || "Unknown")}
          {safeData.size && (
            <div>
              <strong>Size:</strong> {formatFileSize(Number(safeData.size))}
            </div>
          )}
          {safeData.type && (
            <div>
              <strong>Type:</strong> {String(safeData.type)}
            </div>
          )}
        </>
      );
    default:
      return <pre>{JSON.stringify(data || {}, null, 2)}</pre>;
  }
};

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

// Tool call utility functions
export const createToolCall = (
  name: string,
  arguments_: Record<string, unknown>,
  status: ToolCall["status"] = "pending",
): ToolCall => ({
  id: `tool-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  name,
  arguments: arguments_,
  status,
  timestamp: new Date().toISOString(),
});

export const createToolResult = (
  content?: string,
  data?: unknown,
  error?: string,
): ToolResult => ({
  content,
  data,
  error,
});

export const formatToolCallArguments = (
  args: Record<string, unknown>,
): string => {
  try {
    return JSON.stringify(args, null, 2);
  } catch {
    return "Invalid arguments format";
  }
};

export const getToolCallStatusColor = (status: ToolCall["status"]) => {
  switch (status) {
    case "success":
      return { color: "#059669", backgroundColor: "#d1fae5" };
    case "error":
      return { color: "#dc2626", backgroundColor: "#fee2e2" };
    case "in-progress":
      return { color: "#d97706", backgroundColor: "#fef3c7" };
    default:
      return { color: "#6b7280", backgroundColor: "#f3f4f6" };
  }
};
