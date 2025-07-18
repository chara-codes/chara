"use client";

import React from "react";
import styled from "styled-components";
import type { Theme } from "../theme";

interface StatData {
  id: string;
  label: string;
  value: string | number;
  description?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

interface StatisticsPreviewProps {
  stats?: StatData[];
  isLoading?: boolean;
  title?: string;
}

const StatisticsPreviewContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const StatisticsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid ${({ theme }) => (theme as Theme).colors?.border};
`;

const StatisticsTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => (theme as Theme).colors?.text};
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  width: 100%;
  flex: 1;
  overflow-y: auto;
`;

const StatCard = styled.div`
  padding: 16px;
  border-radius: 8px;
  background-color: ${({ theme }) => (theme as Theme).colors?.background};
  border: 1px solid ${({ theme }) => (theme as Theme).colors?.border};
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const StatLabel = styled.h4`
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => (theme as Theme).colors.textSecondary};
`;

const StatValue = styled.p`
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: ${({ theme }) => (theme as Theme).colors.text};
`;

const StatDescription = styled.p`
  margin: 4px 0 0 0;
  font-size: 12px;
  color: ${({ theme }) => (theme as Theme).colors?.textSecondary};
  line-height: 1.4;
`;

const StatTrend = styled.div<{ $trend: "up" | "down" | "neutral" }>`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  font-size: 12px;
  font-weight: 500;
  color: ${({ $trend, theme }) => {
    switch ($trend) {
      case "up":
        return (theme as Theme).colors.success;
      case "down":
        return (theme as Theme).colors.error;
      default:
        return (theme as Theme).colors?.textSecondary;
    }
  }};
`;

const TrendIcon = styled.span`
  font-size: 10px;
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

const defaultStats: StatData[] = [
  {
    id: "1",
    label: "Components",
    value: 12,
    description: "Reusable UI components",
    trend: "up",
    trendValue: "+2 this week",
  },
  {
    id: "2",
    label: "Pages",
    value: 5,
    description: "Application pages",
    trend: "neutral",
  },
  {
    id: "3",
    label: "API Routes",
    value: 8,
    description: "Backend endpoints",
    trend: "up",
    trendValue: "+1 today",
  },
  {
    id: "4",
    label: "Test Coverage",
    value: "76%",
    description: "Code coverage percentage",
    trend: "up",
    trendValue: "+5% this month",
  },
  {
    id: "5",
    label: "Bundle Size",
    value: "245KB",
    description: "Compressed bundle size",
    trend: "down",
    trendValue: "-12KB optimized",
  },
  {
    id: "6",
    label: "Dependencies",
    value: 18,
    description: "NPM packages",
    trend: "neutral",
  },
];

const getTrendIcon = (trend: "up" | "down" | "neutral") => {
  switch (trend) {
    case "up":
      return "↗";
    case "down":
      return "↘";
    default:
      return "→";
  }
};

export const StatisticsPreview: React.FC<StatisticsPreviewProps> = ({
  stats = defaultStats,
  isLoading = false,
  title = "Project Statistics",
}) => {
  if (isLoading) {
    return (
      <StatisticsPreviewContainer>
        <LoadingContainer>Loading statistics...</LoadingContainer>
      </StatisticsPreviewContainer>
    );
  }

  if (!stats || stats.length === 0) {
    return (
      <StatisticsPreviewContainer>
        <EmptyState>No statistics available</EmptyState>
      </StatisticsPreviewContainer>
    );
  }

  return (
    <StatisticsPreviewContainer>
      <StatisticsHeader>
        <StatisticsTitle>{title}</StatisticsTitle>
      </StatisticsHeader>

      <StatsGrid>
        {stats.map((stat) => (
          <StatCard key={stat.id}>
            <StatLabel>{stat.label}</StatLabel>
            <StatValue>{stat.value}</StatValue>
            {stat.description && (
              <StatDescription>{stat.description}</StatDescription>
            )}
            {stat.trend && (
              <StatTrend $trend={stat.trend}>
                <TrendIcon>{getTrendIcon(stat.trend)}</TrendIcon>
                {stat.trendValue || stat.trend}
              </StatTrend>
            )}
          </StatCard>
        ))}
      </StatsGrid>
    </StatisticsPreviewContainer>
  );
};
