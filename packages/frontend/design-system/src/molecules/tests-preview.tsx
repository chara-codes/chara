"use client";

import React from "react";
import styled from "styled-components";
import type { Theme } from "../theme";

interface TestResult {
  id: string;
  name: string;
  passed: boolean;
  duration?: number;
  error?: string;
}

interface TestsPreviewProps {
  tests?: TestResult[];
  isLoading?: boolean;
  totalTests?: number;
  passedTests?: number;
}

const TestsPreviewContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const TestsSummary = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: ${({ theme }) => (theme as Theme).colors?.backgroundSecondary};
  border-radius: 8px;
  border: 1px solid ${({ theme }) => (theme as Theme).colors?.border};
`;

const SummaryText = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => (theme as Theme).colors?.text};
`;

const SummaryBadge = styled.span<{ $type: "success" | "error" | "neutral" }>`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background-color: ${({ $type, theme }) => {
    switch ($type) {
      case "success":
        return (theme as Theme).colors.success + "20";
      case "error":
        return (theme as Theme).colors.error + "20";
      default:
        return (theme as Theme).colors?.backgroundSecondary;
    }
  }};
  color: ${({ $type, theme }) => {
    switch ($type) {
      case "success":
        return (theme as Theme).colors.success;
      case "error":
        return (theme as Theme).colors.error;
      default:
        return (theme as Theme).colors?.text;
    }
  }};
`;

const TestsList = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const TestItem = styled.div<{ $passed: boolean }>`
  padding: 12px 16px;
  border-radius: 8px;
  background-color: ${({ $passed, theme }) =>
    $passed
      ? (theme as Theme).colors.success + "15"
      : (theme as Theme).colors.error + "15"};
  border: 1px solid
    ${({ $passed, theme }) =>
      $passed
        ? (theme as Theme).colors.success
        : (theme as Theme).colors.error};
  color: ${({ theme }) => (theme as Theme).colors.text};
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
`;

const TestInfo = styled.div`
  flex: 1;
`;

const TestName = styled.div`
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
`;

const TestError = styled.div`
  font-size: 12px;
  color: ${({ theme }) => (theme as Theme).colors.error};
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  margin-top: 4px;
`;

const TestDuration = styled.div`
  font-size: 12px;
  color: ${({ theme }) => (theme as Theme).colors?.textSecondary};
  white-space: nowrap;
  margin-left: 12px;
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

const defaultTests: TestResult[] = [
  {
    id: "1",
    name: "Button component renders correctly",
    passed: true,
    duration: 15,
  },
  {
    id: "2",
    name: "Navigation links work as expected",
    passed: true,
    duration: 23,
  },
  {
    id: "3",
    name: "Form validation handles empty fields",
    passed: false,
    duration: 42,
    error: "Expected validation error but got none",
  },
  {
    id: "4",
    name: "API endpoints return correct data",
    passed: true,
    duration: 156,
  },
];

export const TestsPreview: React.FC<TestsPreviewProps> = ({
  tests = defaultTests,
  isLoading = false,
  totalTests,
  passedTests,
}) => {
  if (isLoading) {
    return (
      <TestsPreviewContainer>
        <LoadingContainer>Running tests...</LoadingContainer>
      </TestsPreviewContainer>
    );
  }

  if (!tests || tests.length === 0) {
    return (
      <TestsPreviewContainer>
        <EmptyState>No tests available</EmptyState>
      </TestsPreviewContainer>
    );
  }

  const actualPassedTests = passedTests ?? tests.filter(test => test.passed).length;
  const actualTotalTests = totalTests ?? tests.length;
  const allPassed = actualPassedTests === actualTotalTests;

  return (
    <TestsPreviewContainer>
      <TestsSummary>
        <SummaryText>
          {actualPassedTests}/{actualTotalTests} tests passed
        </SummaryText>
        <SummaryBadge $type={allPassed ? "success" : "error"}>
          {allPassed ? "All Passed" : "Some Failed"}
        </SummaryBadge>
      </TestsSummary>

      <TestsList>
        {tests.map((test) => (
          <TestItem key={test.id} $passed={test.passed}>
            <TestInfo>
              <TestName>
                {test.passed ? "✓" : "✗"} {test.name}
              </TestName>
              {test.error && <TestError>{test.error}</TestError>}
            </TestInfo>
            {test.duration && (
              <TestDuration>{test.duration}ms</TestDuration>
            )}
          </TestItem>
        ))}
      </TestsList>
    </TestsPreviewContainer>
  );
};
