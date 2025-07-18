"use client";

import React from "react";
import styled from "styled-components";
import type { Theme } from "../theme";

interface DeploymentEnvironment {
  id: string;
  name: string;
  status: "success" | "warning" | "error" | "info";
  statusText: string;
  description: string;
  url?: string;
  lastDeployedAt?: string;
  version?: string;
}

interface DeploymentPreviewProps {
  environments?: DeploymentEnvironment[];
  isLoading?: boolean;
  title?: string;
}

const DeploymentPreviewContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
`;

const DeploymentHeader = styled.div`
  padding-bottom: 16px;
  border-bottom: 1px solid ${({ theme }) => (theme as Theme).colors?.border};
  margin-bottom: 16px;
`;

const DeploymentTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => (theme as Theme).colors?.text};
`;

const DeploymentsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
`;

const DeploymentItem = styled.div`
  padding: 16px;
  border-radius: 8px;
  background-color: ${({ theme }) => (theme as Theme).colors?.background};
  border: 1px solid ${({ theme }) => (theme as Theme).colors?.border};
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

const DeploymentItemHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const DeploymentName = styled.h4`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => (theme as Theme).colors.text};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StatusBadge = styled.span<{
  $status: "success" | "warning" | "error" | "info";
}>`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background-color: ${({ $status, theme }) => {
    switch ($status) {
      case "success":
        return (theme as Theme).colors.success + "20";
      case "warning":
        return (theme as Theme).colors.warning + "20";
      case "error":
        return (theme as Theme).colors.error + "20";
      case "info":
        return (theme as Theme).colors.info + "20";
    }
  }};
  color: ${({ $status, theme }) => {
    switch ($status) {
      case "success":
        return (theme as Theme).colors.success;
      case "warning":
        return (theme as Theme).colors.warning;
      case "error":
        return (theme as Theme).colors.error;
      case "info":
        return (theme as Theme).colors.info;
    }
  }};
`;

const DeploymentDescription = styled.p`
  margin: 0;
  font-size: 14px;
  color: ${({ theme }) => (theme as Theme).colors.textSecondary};
`;

const DeploymentMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 8px;
  font-size: 12px;
  color: ${({ theme }) => (theme as Theme).colors?.textSecondary};
`;

const DeploymentUrl = styled.a`
  color: ${({ theme }) => (theme as Theme).colors.primary};
  text-decoration: none;
  font-size: 12px;

  &:hover {
    text-decoration: underline;
  }
`;

const VersionBadge = styled.span`
  background-color: ${({ theme }) => (theme as Theme).colors?.backgroundSecondary};
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  color: ${({ theme }) => (theme as Theme).colors?.text};
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

const defaultEnvironments: DeploymentEnvironment[] = [
  {
    id: "1",
    name: "Production",
    status: "success",
    statusText: "Online",
    description: "Last deployed 2 hours ago",
    url: "https://app.example.com",
    lastDeployedAt: "2024-01-15T14:30:00Z",
    version: "v1.2.3",
  },
  {
    id: "2",
    name: "Staging",
    status: "info",
    statusText: "Updating",
    description: "Deployment in progress",
    url: "https://staging.example.com",
    lastDeployedAt: "2024-01-15T16:00:00Z",
    version: "v1.2.4-rc.1",
  },
  {
    id: "3",
    name: "Development",
    status: "warning",
    statusText: "Needs Attention",
    description: "Build warnings detected",
    url: "https://dev.example.com",
    lastDeployedAt: "2024-01-15T10:15:00Z",
    version: "v1.2.4-dev.5",
  },
];

const formatLastDeployed = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
};

export const DeploymentPreview: React.FC<DeploymentPreviewProps> = ({
  environments = defaultEnvironments,
  isLoading = false,
  title = "Deployment Status",
}) => {
  if (isLoading) {
    return (
      <DeploymentPreviewContainer>
        <LoadingContainer>Loading deployment status...</LoadingContainer>
      </DeploymentPreviewContainer>
    );
  }

  if (!environments || environments.length === 0) {
    return (
      <DeploymentPreviewContainer>
        <EmptyState>No deployment environments available</EmptyState>
      </DeploymentPreviewContainer>
    );
  }

  return (
    <DeploymentPreviewContainer>
      <DeploymentHeader>
        <DeploymentTitle>{title}</DeploymentTitle>
      </DeploymentHeader>

      <DeploymentsList>
        {environments.map((env) => (
          <DeploymentItem key={env.id}>
            <DeploymentItemHeader>
              <DeploymentName>
                {env.name}
                <StatusBadge $status={env.status}>
                  {env.statusText}
                </StatusBadge>
              </DeploymentName>
              {env.version && (
                <VersionBadge>{env.version}</VersionBadge>
              )}
            </DeploymentItemHeader>

            <DeploymentDescription>
              {env.description}
            </DeploymentDescription>

            <DeploymentMeta>
              {env.lastDeployedAt && (
                <span>
                  Deployed {formatLastDeployed(env.lastDeployedAt)}
                </span>
              )}
              {env.url && (
                <DeploymentUrl
                  href={env.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Environment →
                </DeploymentUrl>
              )}
            </DeploymentMeta>
          </DeploymentItem>
        ))}
      </DeploymentsList>
    </DeploymentPreviewContainer>
  );
};
