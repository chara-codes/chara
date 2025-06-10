"use client";

import type React from "react";
import styled from "styled-components";
import { ArrowLeftIcon, ExternalLinkIcon } from "../atoms/icons";
import Button from "../atoms/button";
import type { Theme } from "../../styles/theme";

// Extended TechStack interface with additional details
export interface TechStackDetail {
  id: string;
  name: string;
  category: string;
  description: string;
  longDescription?: string;
  icon: React.ReactNode;
  popularity?: number; // 1-10 scale
  isNew?: boolean;
  version?: string;
  releaseDate?: string;
  documentationLinks?: {
    name: string;
    url: string;
    description?: string;
  }[];
  /** Management Control Panel server configurations */
  mcpServers?: {
    name: string;
    configuration: {
      command: string;
      args: string[];
      [key: string]: string | string[] | number | boolean | Record<string, unknown>;
    };
  }[];
}

const DetailContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background-color: #f9fafb;
`;

const DetailHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  background-color: white;
`;

const BackButton = styled(Button)`
  padding: 6px;
  margin-right: 12px;
  background-color: transparent;
  color: #6b7280;

  &:hover {
    background-color: #f3f4f6;
  }
`;

const HeaderContent = styled.div`
  flex: 1;
`;

const HeaderTitle = styled.h2`
  font-size: 16px;
  font-weight: 500;
  color: #111827;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CategoryBadge = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  background-color: #f3f4f6;
  padding: 2px 8px;
  border-radius: 12px;
`;

const VersionBadge = styled.span`
  font-size: 11px;
  font-weight: 500;
  color: #1f2937;
  background-color: #e5e7eb;
  padding: 1px 6px;
  border-radius: 10px;
  margin-left: 8px;
`;

const NewBadge = styled.span`
  font-size: 10px;
  font-weight: 600;
  color: white;
  background-color: #ec4899;
  padding: 1px 6px;
  border-radius: 10px;
  margin-left: 8px;
`;

const DetailContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
`;

const DetailSection = styled.section`
  margin-bottom: 24px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  overflow: hidden;
`;

const SectionHeader = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid #f3f4f6;
  background-color: #f9fafb;
`;

const SectionTitle = styled.h3`
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin: 0;
`;

const SectionContent = styled.div`
  padding: 16px;
`;

const Description = styled.p`
  font-size: 14px;
  line-height: 1.5;
  color: #4b5563;
  margin: 0;
`;

const LinksList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const LinkItem = styled.li`
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const LinkTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 2px;
  display: flex;
  align-items: center;
`;

const LinkDescription = styled.p`
  font-size: 12px;
  color: #6b7280;
  margin: 4px 0 0 0;
`;

const ExternalLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: ${({ theme }) => (theme as Theme).colors.primary};
  text-decoration: none;
  font-size: 14px;

  &:hover {
    text-decoration: underline;
  }
`;

const ServerList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ServerItem = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
`;

const ServerHeader = styled.div`
  padding: 12px 16px;
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
`;

const ServerName = styled.h4`
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
  margin: 0;
`;

const ServerContent = styled.div`
  padding: 16px;
`;

const JsonConfig = styled.pre`
  font-family:
    "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New",
    monospace;
  font-size: 13px;
  background-color: #1e293b;
  color: #e2e8f0;
  padding: 16px;
  border-radius: 6px;
  margin: 0;
  overflow-x: auto;
  white-space: pre;
  line-height: 1.5;

  /* Syntax highlighting */
  .json-key {
    color: #7dd3fc;
  }

  .json-string {
    color: #a5f3fc;
  }

  .json-number {
    color: #fbbf24;
  }

  .json-boolean {
    color: #f472b6;
  }

  .json-null {
    color: #94a3b8;
  }
`;

interface TechStackDetailViewProps {
  techStack: TechStackDetail;
  onBack: () => void;
}

// Helper function to add syntax highlighting to JSON
const highlightJson = (json: string): string => {
  return json
    .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
    .replace(/: "([^"]+)"/g, ': <span class="json-string">"$1"</span>')
    .replace(/: (\d+)/g, ': <span class="json-number">$1</span>')
    .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
    .replace(/: null/g, ': <span class="json-null">null</span>');
};

const TechStackDetailView: React.FC<TechStackDetailViewProps> = ({
  techStack,
  onBack,
}) => {
  return (
    <DetailContainer>
      <DetailHeader>
        <BackButton variant="text" onClick={onBack}>
          <ArrowLeftIcon width={18} height={18} />
        </BackButton>
        <HeaderContent>
          <HeaderTitle>
            {techStack.icon}
            {techStack.name}
            {techStack.version && (
              <VersionBadge>v{techStack.version}</VersionBadge>
            )}
            {techStack.isNew && <NewBadge>NEW</NewBadge>}
          </HeaderTitle>
        </HeaderContent>
        <CategoryBadge>{techStack.category}</CategoryBadge>
      </DetailHeader>

      <DetailContent>
        {/* Description Section */}
        <DetailSection>
          <SectionHeader>
            <SectionTitle>Description</SectionTitle>
          </SectionHeader>
          <SectionContent>
            <Description>
              {techStack.longDescription || techStack.description}
            </Description>
          </SectionContent>
        </DetailSection>

        {/* Documentation Links Section */}
        {techStack.documentationLinks &&
          techStack.documentationLinks.length > 0 && (
            <DetailSection>
              <SectionHeader>
                <SectionTitle>Documentation Links</SectionTitle>
              </SectionHeader>
              <SectionContent>
                <LinksList>
                  {techStack.documentationLinks.map((link, index) => (
                    <LinkItem key={`link-${link.url}-${index}`}>
                      <LinkTitle>
                        <ExternalLink
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {link.name}
                          <ExternalLinkIcon width={14} height={14} />
                        </ExternalLink>
                      </LinkTitle>
                      {link.description && (
                        <LinkDescription>{link.description}</LinkDescription>
                      )}
                    </LinkItem>
                  ))}
                </LinksList>
              </SectionContent>
            </DetailSection>
          )}

        {/* MCP Server List Section */}
        {techStack.mcpServers && techStack.mcpServers.length > 0 && (
          <DetailSection>
            <SectionHeader>
              <SectionTitle>MCP Server List</SectionTitle>
            </SectionHeader>
            <SectionContent>
              <ServerList>
                {techStack.mcpServers.map((server) => (
                  <ServerItem key={server.name}>
                    <ServerHeader>
                      <ServerName>{server.name}</ServerName>
                    </ServerHeader>
                    <ServerContent>
                      <JsonConfig
                        // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
                        dangerouslySetInnerHTML={{
                          __html: highlightJson(
                            JSON.stringify(server.configuration, null, 2),
                          ),
                        }}
                      />
                    </ServerContent>
                  </ServerItem>
                ))}
              </ServerList>
            </SectionContent>
          </DetailSection>
        )}
      </DetailContent>
    </DetailContainer>
  );
};

export default TechStackDetailView;
