"use client";

import type React from "react";
import styled from "styled-components";
import { ContextItem as ContextItemComponent } from "../molecules/context-item";
import type { ContextItem } from "@chara-codes/core";

interface ContextPanelProps {
  contextItems: ContextItem[];
  onRemoveContext: (id: string) => void;
}

// Make the context panel always visible
const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 6px 12px;
  border-top: 1px solid ${props => props.theme.colors.border};
  background-color: ${props => props.theme.colors.background};
  min-height: 36px;
  transition: background-color ${props => props.theme.transitions.theme},
              border-color ${props => props.theme.transitions.theme};
`;

const ContextList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const ContextPanel: React.FC<ContextPanelProps> = ({
  contextItems,
  onRemoveContext,
}) => {
  return (
    <>
      {contextItems.length > 0 && (
        <Container>
          <ContextList>
            {contextItems.map((item) => (
              <ContextItemComponent
                key={item.id}
                item={item}
                onRemove={onRemoveContext}
              />
            ))}
          </ContextList>
        </Container>
      )}
    </>
  );
};

export default ContextPanel;
