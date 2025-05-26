import type React from "react";
export const getPreviewContent = (item: any): React.ReactNode => {
  if (!item || !item.data) {
    return "No preview available";
  }

  const { type, data } = item;

  switch (type.toLowerCase()) {
    case "element":
      return (
        <>
          <div style={{ marginBottom: "8px" }}>
            <strong>Comment:</strong> {data.comment || "No comment"}
          </div>
          <div>
            <strong>Element:</strong> {data.tagName.toLowerCase()}
            {data.id ? ` #${data.id}` : ""}
            {data.className ? ` .${data.className.split(" ").join(".")}` : ""}
          </div>
          {data.component && data.component.name !== "Unknown" && (
            <div>
              <strong>Component:</strong> {data.component.name} (
              {data.component.path})
            </div>
          )}
          <div style={{ marginTop: "8px" }}>
            <strong>Content:</strong> {data.textContent || "(empty)"}
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
            {data.html}
          </pre>
        </>
      );
    case "file":
      return (
        <>
          <strong>File:</strong> {data.name || item.name}
          {data.size && (
            <div>
              <strong>Size:</strong> {formatFileSize(data.size)}
            </div>
          )}
          {data.type && (
            <div>
              <strong>Type:</strong> {data.type}
            </div>
          )}
        </>
      );
    case "text":
    case "link":
    case "documentation":
    case "terminal":
    default:
      return JSON.stringify(data, null, 2);
  }
};

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " B";
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  else return (bytes / 1048576).toFixed(1) + " MB";
};
