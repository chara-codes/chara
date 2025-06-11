"use client";

import type React from "react";
import styled from "styled-components";
import { ContextItem as ContextItemComponent } from "../molecules/context-item";
import type { ContextItem } from "@chara/core";

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
