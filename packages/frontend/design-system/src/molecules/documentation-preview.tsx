"use client";

import React from "react";
import styled from "styled-components";
import type { Theme } from "../theme";

interface DocSection {
  id: string;
  title: string;
  content: string;
  codeExample?: string;
}

interface DocumentationPreviewProps {
  sections?: DocSection[];
  isLoading?: boolean;
  title?: string;
}

const DocumentationPreviewContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
`;

const DocumentationHeader = styled.div`
  padding-bottom: 16px;
  border-bottom: 1px solid ${({ theme }) => (theme as Theme).colors?.border};
  margin-bottom: 24px;
`;

const DocumentationTitle = styled.h1`
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: ${({ theme }) => (theme as Theme).colors?.text};
`;

const DocsSection = styled.div`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h2`
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => (theme as Theme).colors?.text};
`;

const SectionContent = styled.div`
  margin: 0 0 16px 0;
  font-size: 14px;
  color: ${({ theme }) => (theme as Theme).colors?.textSecondary};
  line-height: 1.6;

  p {
    margin: 0 0 16px 0;
  }

  ul,
  ol {
    margin: 0 0 16px 0;
    padding-left: 20px;
  }

  li {
    margin-bottom: 4px;
  }
`;

const CodeExample = styled.pre`
  background-color: ${({ theme }) =>
    (theme as Theme).colors?.backgroundSecondary};
  padding: 16px;
  border-radius: 8px;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  font-size: 13px;
  color: ${({ theme }) => (theme as Theme).colors?.text};
  overflow-x: auto;
  margin: 16px 0;
  border: 1px solid ${({ theme }) => (theme as Theme).colors?.border};
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${({ theme }) => (theme as Theme).colors?.textSecondary};
  font-size: 14px;
`;

const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${({ theme }) => (theme as Theme).colors?.textSecondary};
  font-size: 14px;
  text-align: center;
`;

const defaultSections: DocSection[] = [
  {
    id: "1",
    title: "Getting Started",
    content:
      "This application uses Next.js with the App Router. To run the application locally, use the following command:",
    codeExample: "npm run dev",
  },
  {
    id: "2",
    title: "API Reference",
    content:
      "The API endpoints are available under /api. Authentication is required for most endpoints. Here's how to make authenticated requests:",
    codeExample: `fetch('/api/data', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  }
})`,
  },
  {
    id: "3",
    title: "Component Usage",
    content:
      "Import components from the UI library and use them in your application:",
    codeExample: `import { Button } from '@/components/ui/button';

export default function MyComponent() {
  return (
    <div>
      <Button variant="primary">Click me</Button>
    </div>
  );
}`,
  },
  {
    id: "4",
    title: "Configuration",
    content:
      "Configure your application settings in the config file. Environment variables can be used to override default values.",
    codeExample: `// config.js
export const config = {
  apiUrl: process.env.API_URL || 'http://localhost:3000',
  theme: process.env.THEME || 'light'
};`,
  },
];

const renderContent = (content: string) => {
  // Simple content rendering - could be extended with markdown support
  return content
    .split("\n")
    .map((line, index) => (
      <p key={`line-${index}-${line.slice(0, 10)}`}>{line}</p>
    ));
};

export const DocumentationPreview: React.FC<DocumentationPreviewProps> = ({
  sections = defaultSections,
  isLoading = false,
  title = "Documentation",
}) => {
  if (isLoading) {
    return (
      <DocumentationPreviewContainer>
        <LoadingContainer>Loading documentation...</LoadingContainer>
      </DocumentationPreviewContainer>
    );
  }

  if (!sections || sections.length === 0) {
    return (
      <DocumentationPreviewContainer>
        <EmptyState>No documentation available</EmptyState>
      </DocumentationPreviewContainer>
    );
  }

  return (
    <DocumentationPreviewContainer>
      <DocumentationHeader>
        <DocumentationTitle>{title}</DocumentationTitle>
      </DocumentationHeader>

      {sections.map((section) => (
        <DocsSection key={section.id}>
          <SectionTitle>{section.title}</SectionTitle>
          <SectionContent>{renderContent(section.content)}</SectionContent>
          {section.codeExample && (
            <CodeExample>{section.codeExample}</CodeExample>
          )}
        </DocsSection>
      ))}
    </DocumentationPreviewContainer>
  );
};
