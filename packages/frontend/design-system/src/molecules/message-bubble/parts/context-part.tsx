"use client";

import React, { useState } from "react";
import styled from "styled-components";
import {
  DocumentationIcon,
  FileIcon,
  LinkIcon,
  TextIcon,
} from "../../../atoms/icons";
import { ExpandableChevronIcon } from "../../../atoms/icons/expandable-chevron-icon";

const ContextContainer = styled.div`
  background: rgba(59, 130, 246, 0.05);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 8px;
  margin: 8px 0;
  overflow: hidden;
`;

const ContextHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(59, 130, 246, 0.08);
  cursor: pointer;
  user-select: none;

  &:hover {
    background: rgba(59, 130, 246, 0.12);
  }
`;

const ContextInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ContextIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: rgba(59, 130, 246, 0.2);
  border-radius: 4px;

  svg {
    width: 12px;
    height: 12px;
    color: #2563eb;
  }
`;

const ContextLabel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const ContextTitle = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: #2563eb;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ContextType = styled.span`
  font-size: 11px;
  color: #64748b;
  text-transform: capitalize;
`;

const ToggleButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  transition: background-color 0.2s ease;

  &:hover {
    background: rgba(59, 130, 246, 0.15);
  }
`;

const ContextDetails = styled.div<{ isExpanded: boolean }>`
  max-height: ${({ isExpanded }) => (isExpanded ? "400px" : "0")};
  overflow-y: auto;
  transition: max-height 0.3s ease;
  background: rgba(59, 130, 246, 0.02);
`;

const DetailsSection = styled.div`
  border-top: 1px solid rgba(59, 130, 246, 0.1);
`;

const SectionTitle = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: #2563eb;
  padding: 8px 12px 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const SectionContent = styled.div`
  padding: 0 12px 8px;
`;

const PropertyGrid = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 4px 12px;
  font-size: 12px;
`;

const PropertyKey = styled.span`
  color: #64748b;
  font-weight: 500;
`;

const PropertyValue = styled.span`
  color: #374151;
  word-break: break-word;
`;

const LinkButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #2563eb;
  text-decoration: none;
  font-size: 12px;
  padding: 4px 8px;
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 4px;
  background: rgba(59, 130, 246, 0.05);
  transition: all 0.2s ease;

  &:hover {
    background: rgba(59, 130, 246, 0.1);
    text-decoration: none;
  }

  svg {
    width: 12px;
    height: 12px;
  }
`;

const PreviewContent = styled.div`
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 8px;
  font-size: 12px;
  font-family: "Monaco", "Menlo", "Consolas", monospace;
  color: #374151;
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 200px;
  overflow-y: auto;
`;

const ImagePreview = styled.img`
  max-width: 100%;
  max-height: 200px;
  border-radius: 4px;
  object-fit: contain;
  display: block;
  margin: 0 auto;
`;

export interface ContextPartProps {
  type: "source-url" | "source-document" | "file" | "data";
  title?: string;
  filename?: string;
  url?: string;
  mediaType?: string;
  sourceId?: string;
  content?: string;
  size?: number;
  lastModified?: string;
}

const ContextPart: React.FC<ContextPartProps> = ({
  type,
  title,
  filename,
  url,
  mediaType,
  sourceId,
  content,
  size,
  lastModified,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    setIsExpanded((prev) => !prev);
  };

  const getIcon = () => {
    switch (type) {
      case "source-url":
        return <LinkIcon />;
      case "source-document":
        return <DocumentationIcon />;
      case "file":
        return <FileIcon />;
      case "data":
        return <TextIcon />;
      default:
        return <TextIcon />;
    }
  };

  const getDisplayTitle = () => {
    return title || filename || url || "Unknown Source";
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return "";

    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "";

    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <ContextContainer>
      <ContextHeader onClick={handleToggle}>
        <ContextInfo>
          <ContextIcon>{getIcon()}</ContextIcon>
          <ContextLabel>
            <ContextTitle title={getDisplayTitle()}>
              {getDisplayTitle()}
            </ContextTitle>
            <ContextType>{type.replace("-", " ")}</ContextType>
          </ContextLabel>
        </ContextInfo>
        <ToggleButton>
          <ExpandableChevronIcon
            isExpanded={isExpanded}
            ariaLabel={
              isExpanded ? "Collapse context details" : "Expand context details"
            }
          />
        </ToggleButton>
      </ContextHeader>

      <ContextDetails isExpanded={isExpanded}>
        <DetailsSection>
          <SectionTitle>Properties</SectionTitle>
          <SectionContent>
            <PropertyGrid>
              {type === "source-url" && url && (
                <>
                  <PropertyKey>URL:</PropertyKey>
                  <PropertyValue>
                    <LinkButton
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <LinkIcon />
                      Open Link
                    </LinkButton>
                  </PropertyValue>
                </>
              )}

              {filename && (
                <>
                  <PropertyKey>Filename:</PropertyKey>
                  <PropertyValue>{filename}</PropertyValue>
                </>
              )}

              {mediaType && (
                <>
                  <PropertyKey>Type:</PropertyKey>
                  <PropertyValue>{mediaType}</PropertyValue>
                </>
              )}

              {size && (
                <>
                  <PropertyKey>Size:</PropertyKey>
                  <PropertyValue>{formatFileSize(size)}</PropertyValue>
                </>
              )}

              {lastModified && (
                <>
                  <PropertyKey>Modified:</PropertyKey>
                  <PropertyValue>{formatDate(lastModified)}</PropertyValue>
                </>
              )}

              {sourceId && (
                <>
                  <PropertyKey>Source ID:</PropertyKey>
                  <PropertyValue>{sourceId}</PropertyValue>
                </>
              )}
            </PropertyGrid>
          </SectionContent>
        </DetailsSection>

        {(content ||
          (type === "file" && mediaType?.startsWith("image/") && url)) && (
          <DetailsSection>
            <SectionTitle>Preview</SectionTitle>
            <SectionContent>
              {type === "file" && mediaType?.startsWith("image/") && url ? (
                <ImagePreview
                  src={`data:${mediaType};base64,${url}`}
                  alt={filename || "Image preview"}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                  }}
                />
              ) : (
                <PreviewContent>
                  {content && content.length > 1000
                    ? `${content.substring(0, 1000)}...`
                    : content}
                </PreviewContent>
              )}
            </SectionContent>
          </DetailsSection>
        )}
      </ContextDetails>
    </ContextContainer>
  );
};

export default ContextPart;
