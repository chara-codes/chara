"use client";

import React from "react";
import styled from "styled-components";
import type { Theme } from "../theme";

interface CodePreviewProps {
  code?: string;
  language?: string;
  isLoading?: boolean;
}

const CodePreviewContainer = styled.div`
  width: 100%;
  height: 100%;
  background-color: ${({ theme }) => (theme as Theme).colors?.background};
  border-radius: 8px;
  padding: 16px;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  color: ${({ theme }) => (theme as Theme).colors.text};
  overflow: auto;
  position: relative;
`;

const CodeBlock = styled.pre`
  margin: 0;
  white-space: pre;
  font-size: 13px;
  line-height: 1.5;
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${({ theme }) => (theme as Theme).colors?.textSecondary};
  font-size: 14px;
`;

const defaultCode = `// Example generated code
import React from 'react';
import { Button } from './components/ui/button';

export default function HomePage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Welcome to the App</h1>
      <Button>Get Started</Button>
    </div>
  );
}`;

export const CodePreview: React.FC<CodePreviewProps> = ({
  code = defaultCode,
  language: _language = "typescript",
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <CodePreviewContainer>
        <LoadingContainer>Loading code preview...</LoadingContainer>
      </CodePreviewContainer>
    );
  }

  return (
    <CodePreviewContainer>
      <CodeBlock>{code}</CodeBlock>
    </CodePreviewContainer>
  );
};
