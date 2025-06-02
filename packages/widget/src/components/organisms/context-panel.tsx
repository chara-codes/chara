"use client";

import type React from "react";
import styled from "styled-components";
import {
  FileIcon,
  LinkIcon,
  TextIcon,
  DocumentationIcon,
  TerminalIcon,
  CloseIcon,
} from "../atoms/icons";

interface ContextItem {
  id: string;
  name: string;
  type: string;
  data?: unknown;
}

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

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${(props) => (props.children ? "8px" : "0")};
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

const EmptyMessage = styled.span`
  font-size: 11px;
  color: #9ca3af;
  font-style: italic;
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
            {contextItems.map((item) => (
              <ContextItemContainer key={item.id}>
                {getIcon(item.type)}
                {item.name}
                <RemoveButton onClick={() => onRemoveContext(item.id)}>
                  <CloseIcon />
                </RemoveButton>
              </ContextItemContainer>
            ))}
          </ContextList>
        </Container>
      )}
    </>
  );
};

export default ContextPanel;
