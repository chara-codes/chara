"use client";

import type React from "react";
import styled from "styled-components";
import type { ContextItem } from "../../../store/types";

export interface ContextPreviewProps {
  item: ContextItem;
}

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

const ContextPreview: React.FC<ContextPreviewProps> = ({ item }) => {
  if (!item.content) {
    return null;
  }

  const mimeType = item.mimeType;

  const formatSvgContent = (content: string): string => {
    const svgContent = content.trim();
    // Try to show the opening SVG tag with dimensions if available
    const svgMatch = svgContent.match(/<svg[^>]*>/);
    if (svgMatch) {
      const opening = svgMatch[0];
      return opening.length > 80
        ? `${opening.substring(0, 80)}...`
        : `${opening}...`;
    }
    return svgContent.length > 30
      ? `${svgContent.substring(0, 30)}...`
      : svgContent;
  };

  const formatTextContent = (content: string, mimeType: string): string => {
    const preview = content.trim();
    
    if (mimeType === "application/json") {
      try {
        const formatted = JSON.stringify(JSON.parse(preview), null, 2);
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
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.style.display = "none";
    const errorText = document.createElement("div");
    errorText.textContent = "Preview unavailable";
    errorText.style.fontSize = "10px";
    errorText.style.color = "#9ca3af";
    errorText.style.fontStyle = "italic";
    errorText.style.textAlign = "center";
    errorText.style.padding = "20px 10px";
    target.parentNode?.appendChild(errorText);
  };

  const isImageType = mimeType?.startsWith("image/");
  const isSvgType = mimeType === "image/svg+xml";
  const isTextType = mimeType && (
    mimeType.startsWith("text/") ||
    mimeType === "application/json" ||
    mimeType === "application/javascript" ||
    mimeType === "application/typescript" ||
    mimeType === "application/xml" ||
    mimeType === "application/yaml"
  );

  return (
    <PreviewContent>
      <PreviewLabel>Preview</PreviewLabel>
      
      {isImageType ? (
        isSvgType ? (
          <TextPreview>
            {formatSvgContent(item.content)}
          </TextPreview>
        ) : (
          <ImagePreview
            src={`data:${mimeType};base64,${item.content}`}
            alt={item.name}
            onError={handleImageError}
          />
        )
      ) : (
        isTextType && (
          <TextPreview>
            {formatTextContent(item.content, mimeType)}
          </TextPreview>
        )
      )}
    </PreviewContent>
  );
};

export default ContextPreview;