"use client";

import type React from "react";
import styled from "styled-components";
import type { ContextItem } from "../../store/types";
import { formatFileSize } from "../../utils/file-utils";
import {
  FileIcon,
  LinkIcon,
  TextIcon,
  DocumentationIcon,
  TerminalIcon,
  CloseIcon,
} from "../atoms/icons";

interface ContextPanelProps {
  contextItems: ContextItem[];
  onRemoveContext: (id: string) => void;
}

// Make the context panel always visible
const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 6px 12px;
  border-top: 1px solid #e5e7eb;
  background-color: #f9fafb;
  min-height: 36px;
`;

const ContextList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const ContextItemContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 6px;
  background-color: #e5e7eb;
  border-radius: 4px;
  font-size: 11px;
  color: #4b5563;
  position: relative;
  cursor: pointer;

  &:hover .context-tooltip {
    opacity: 1;
    visibility: visible;
  }
`;

const ContextTooltip = styled.div`
  position: absolute;
  bottom: 100%;
  left: 0;
  background: #1f2937;
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.2s,
    visibility 0.2s;
  z-index: 1000;
  margin-bottom: 4px;
  max-width: 300px;
  white-space: normal;

  &::after {
    content: "";
    position: absolute;
    top: 100%;
    left: 12px;
    border: 4px solid transparent;
    border-top-color: #1f2937;
  }
`;

const PreviewContent = styled.div`
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #374151;
`;

const PreviewLabel = styled.div`
  font-size: 10px;
  color: #9ca3af;
  margin-bottom: 4px;
  text-transform: uppercase;
  font-weight: 500;
`;

const ImagePreview = styled.img`
  max-width: 120px;
  max-height: 80px;
  border-radius: 4px;
  object-fit: cover;
`;

const TextPreview = styled.div`
  font-family: monospace;
  font-size: 11px;
  background: #374151;
  padding: 6px 8px;
  border-radius: 4px;
  color: #d1d5db;
  word-break: break-word;
  white-space: pre-wrap;
  line-height: 1.3;
  max-height: 60px;
  overflow: hidden;
`;

const FileInfo = styled.div`
  margin-left: 4px;
  color: #9ca3af;
  font-size: 10px;
`;

const RemoveButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: none;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  padding: 0;

  &:hover {
    color: #ef4444;
  }
`;

const ContextPanel: React.FC<ContextPanelProps> = ({
  contextItems,
  onRemoveContext,
}) => {
  const getIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    switch (lowerType) {
      case "file":
        return <FileIcon />;
      case "link":
        return <LinkIcon />;
      case "text":
        return <TextIcon />;
      case "documentation":
        return <DocumentationIcon />;
      case "terminal":
        return <TerminalIcon />;
      default:
        return null;
    }
  };

  return (
    <>
      {contextItems.length > 0 && (
        <Container>
          <ContextList>
            {contextItems.map((item) => {
              const isFile = item.type.toLowerCase() === "file";
              const file = item.data as File | undefined;
              const fileSize = file?.size;
              const mimeType = item.mimeType || file?.type;

              return (
                <ContextItemContainer key={item.id}>
                  {getIcon(item.type)}
                  {item.name}
                  {isFile && fileSize && (
                    <FileInfo>({formatFileSize(fileSize)})</FileInfo>
                  )}
                  {isFile && (mimeType || fileSize || item.content) && (
                    <ContextTooltip className="context-tooltip">
                      <div>
                        <strong>File:</strong> {item.name}
                      </div>
                      {mimeType && (
                        <div>
                          <strong>Type:</strong> {mimeType}
                        </div>
                      )}
                      {fileSize && (
                        <div>
                          <strong>Size:</strong> {formatFileSize(fileSize)}
                        </div>
                      )}
                      {item.content && (
                        <div>
                          <strong>Content:</strong>
                          {item.content.length > 50 ? "Loaded" : "Available"}
                        </div>
                      )}
                      {item.content && (
                        <PreviewContent>
                          <PreviewLabel>Preview</PreviewLabel>
                          {mimeType?.startsWith("image/") ? (
                            mimeType === "image/svg+xml" ? (
                              <TextPreview>
                                {(() => {
                                  const svgContent = item.content.trim();
                                  // Try to show the opening SVG tag with dimensions if available
                                  const svgMatch =
                                    svgContent.match(/<svg[^>]*>/);
                                  if (svgMatch) {
                                    const opening = svgMatch[0];
                                    return opening.length > 80
                                      ? `${opening.substring(0, 80)}...`
                                      : `${opening}...`;
                                  }
                                  return svgContent.length > 30
                                    ? `${svgContent.substring(0, 30)}...`
                                    : svgContent;
                                })()}
                              </TextPreview>
                            ) : (
                              <ImagePreview
                                src={`data:${mimeType};base64,${item.content}`}
                                alt={item.name}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = "none";
                                  const errorText =
                                    document.createElement("div");
                                  errorText.textContent = "Preview unavailable";
                                  errorText.style.fontSize = "10px";
                                  errorText.style.color = "#9ca3af";
                                  errorText.style.fontStyle = "italic";
                                  errorText.style.textAlign = "center";
                                  errorText.style.padding = "20px 10px";
                                  target.parentNode?.appendChild(errorText);
                                }}
                              />
                            )
                          ) : (
                            mimeType &&
                            (mimeType.startsWith("text/") ||
                              mimeType === "application/json" ||
                              mimeType === "application/javascript" ||
                              mimeType === "application/typescript" ||
                              mimeType === "application/xml" ||
                              mimeType === "application/yaml") && (
                              <TextPreview>
                                {(() => {
                                  const preview = item.content.trim();
                                  if (mimeType === "application/json") {
                                    try {
                                      const formatted = JSON.stringify(
                                        JSON.parse(preview),
                                        null,
                                        2,
                                      );
                                      return formatted.length > 100
                                        ? `${formatted.substring(0, 100)}...`
                                        : formatted;
                                    } catch {
                                      return preview.length > 30
                                        ? `${preview.substring(0, 30)}...`
                                        : preview;
                                    }
                                  }
                                  return preview.length > 30
                                    ? `${preview.substring(0, 30)}...`
                                    : preview;
                                })()}
                              </TextPreview>
                            )
                          )}
                        </PreviewContent>
                      )}
                    </ContextTooltip>
                  )}
                  <RemoveButton onClick={() => onRemoveContext(item.id)}>
                    <CloseIcon />
                  </RemoveButton>
                </ContextItemContainer>
              );
            })}
          </ContextList>
        </Container>
      )}
    </>
  );
};

export default ContextPanel;
