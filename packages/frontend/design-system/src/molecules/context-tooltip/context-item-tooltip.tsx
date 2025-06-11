"use client";

import { formatFileSize, type ContextItem } from "@chara/core";
import type React from "react";
import styled from "styled-components";
import { ContextPreview } from "../context-preview";

export interface ContextItemTooltipProps {
  item: ContextItem;
  isVisible: boolean;
  className?: string;
}

const TooltipContainer = styled.div`
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

  &.visible {
    opacity: 1;
    visibility: visible;
  }

  &::after {
    content: "";
    position: absolute;
    top: 100%;
    left: 12px;
    border: 4px solid transparent;
    border-top-color: #1f2937;
  }
`;

const TooltipSection = styled.div`
  margin-bottom: 4px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const ContextItemTooltip: React.FC<ContextItemTooltipProps> = ({
  item,
  isVisible,
  className,
}) => {
  const isFile = item.type.toLowerCase() === "file";
  const file = item.data as File | undefined;
  const fileSize = file?.size;
  const mimeType = item.mimeType || file?.type;

  if (!isFile || (!mimeType && !fileSize && !item.content)) {
    return null;
  }

  return (
    <TooltipContainer
      className={`${className || ""} ${isVisible ? "visible" : ""}`}
    >
      <TooltipSection>
        <strong>File:</strong> {item.name}
      </TooltipSection>

      {mimeType && (
        <TooltipSection>
          <strong>Type:</strong> {mimeType}
        </TooltipSection>
      )}

      {fileSize && (
        <TooltipSection>
          <strong>Size:</strong> {formatFileSize(fileSize)}
        </TooltipSection>
      )}

      {item.content && (
        <TooltipSection>
          <strong>Content:</strong>{" "}
          {item.content.length > 50 ? "Loaded" : "Available"}
        </TooltipSection>
      )}

      <ContextPreview item={item} />
    </TooltipContainer>
  );
};

export default ContextItemTooltip;
