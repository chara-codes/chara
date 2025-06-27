"use client";

import React, { useState } from "react";
import styled from "styled-components";
import type { ContextItem } from "@chara/core";
import type { Theme } from "../../theme/theme";

export interface ContextPreviewProps {
  item: ContextItem;
}

const PreviewContent = styled.div<{ theme: Theme }>`
  margin-top: ${({ theme }) => theme.spacing.sm};
  padding-top: ${({ theme }) => theme.spacing.sm};
`;

const ImagePreview = styled.img<{ theme: Theme }>`
  max-width: 100%;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  object-fit: cover;
`;

const TextPreview = styled.div<{ theme: Theme }>`
  font-family: monospace;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  background: ${({ theme }) => theme.colors.secondaryActive};
  padding: ${({ theme }) => `6px ${theme.spacing.sm}`};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  word-break: break-word;
  white-space: pre-wrap;
  line-height: ${({ theme }) => theme.typography.lineHeight.tight};
  max-height: 60px;
  overflow: hidden;
`;

const ErrorText = styled.div<{ theme: Theme }>`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-style: italic;
  text-align: center;
  padding: ${({ theme }) => `${theme.spacing.lg} ${theme.spacing.sm}`};
`;

const ContextPreview: React.FC<ContextPreviewProps> = ({ item }) => {
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
        return preview.length > 30 ? `${preview.substring(0, 30)}...` : preview;
      }
    }

    return preview.length > 30 ? `${preview.substring(0, 30)}...` : preview;
  };

  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const isImageType = mimeType?.startsWith("image/");
  const isSvgType = mimeType === "image/svg+xml";
  const isTextType =
    mimeType &&
    (mimeType.startsWith("text/") ||
      mimeType === "application/json" ||
      mimeType === "application/javascript" ||
      mimeType === "application/typescript" ||
      mimeType === "application/xml" ||
      mimeType === "application/yaml");

  return (
    <PreviewContent>
      {isImageType ? (
        isSvgType ? (
          <TextPreview>{formatSvgContent(item.data as string)}</TextPreview>
        ) : imageError ? (
          <ErrorText>Preview unavailable</ErrorText>
        ) : (
          <ImagePreview
            src={`data:${mimeType};base64,${item.data}`}
            alt={item.name}
            onError={handleImageError}
          />
        )
      ) : (
        isTextType && (
          <TextPreview>
            {formatTextContent(item.data as string, mimeType)}
          </TextPreview>
        )
      )}
    </PreviewContent>
  );
};

export default ContextPreview;
