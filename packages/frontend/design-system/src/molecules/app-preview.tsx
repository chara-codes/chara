"use client";

import React from "react";
import styled from "styled-components";
import type { Theme } from "../theme";

interface AppPreviewProps {
  // Future props for customization
  placeholder?: string;
  isLoading?: boolean;
}

const AppPreviewContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => (theme as Theme).colors?.background};
  border-radius: 8px;
  border: 1px dashed ${({ theme }) => (theme as Theme).colors?.border};
  color: ${({ theme }) => (theme as Theme).colors?.textSecondary};
  font-size: 14px;
  text-align: center;
`;

const PlaceholderText = styled.p`
  margin: 0;
  padding: 20px;
`;

export const AppPreview: React.FC<AppPreviewProps> = ({
  placeholder = "App preview will be displayed here",
  isLoading = false,
}) => {
  return (
    <AppPreviewContainer>
      <PlaceholderText>
        {isLoading ? "Loading app preview..." : placeholder}
      </PlaceholderText>
    </AppPreviewContainer>
  );
};
