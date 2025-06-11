"use client";

import type React from "react";
import { useState } from "react";
import styled from "styled-components";
import type { ContextItem as ContextItemType } from "../../../store/types";
import { formatFileSize } from "../../../utils/file-utils";
import { ContextItemTooltip } from "../context-tooltip";
import {
  FileIcon,
  LinkIcon,
  TextIcon,
  DocumentationIcon,
  TerminalIcon,
  CloseIcon,
} from "../../atoms/icons";

export interface ContextItemProps {
  item: ContextItemType;
  onRemove: (id: string) => void;
}

const ItemContainer = styled.div`
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

const ContextItem: React.FC<ContextItemProps> = ({ item, onRemove }) => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

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

  const isFile = item.type.toLowerCase() === "file";
  const file = item.data as File | undefined;
  const fileSize = file?.size;
  const mimeType = item.mimeType || file?.type;
  const hasTooltipContent = isFile && (mimeType || fileSize || item.content);

  const handleMouseEnter = () => {
    if (hasTooltipContent) {
      setIsTooltipVisible(true);
    }
  };

  const handleMouseLeave = () => {
    setIsTooltipVisible(false);
  };

  return (
    <ItemContainer
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {getIcon(item.type)}
      {item.name}
      
      {isFile && fileSize && (
        <FileInfo>({formatFileSize(fileSize)})</FileInfo>
      )}
      
      {hasTooltipContent && (
        <ContextItemTooltip
          item={item}
          isVisible={isTooltipVisible}
          className="context-tooltip"
        />
      )}
      
      <RemoveButton onClick={() => onRemove(item.id)}>
        <CloseIcon />
      </RemoveButton>
    </ItemContainer>
  );
};

export default ContextItem;