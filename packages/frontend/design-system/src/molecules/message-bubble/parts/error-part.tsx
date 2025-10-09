"use client";

import React from "react";
import styled from "styled-components";
import { ErrorIcon } from "../../../atoms/icons/error-icon";

const ErrorContainer = styled.div`
  display: flex;
  align-items: flex-start;
  background-color: #fff5f5;
  border: 1px solid #fed7d7;
  border-radius: 6px;
  padding: 8px 12px;
  margin: 8px 0;
  font-size: 13px;
  color: #c53030;
`;

const IconWrapper = styled.div`
  margin-right: 8px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
`;

const ErrorMessage = styled.span`
  white-space: pre-wrap;
  word-break: break-word;
  flex: 1;
  line-height: 1.4;
`;

interface ErrorPartProps {
  error: string | { message: string };
}

const ErrorPart: React.FC<ErrorPartProps> = ({ error }) => {
  const errorMessage = typeof error === "string" ? error : error.message;
  return (
    <ErrorContainer>
      <IconWrapper>
        <ErrorIcon />
      </IconWrapper>
      <ErrorMessage>Sorry, an error occurred: {errorMessage}</ErrorMessage>
    </ErrorContainer>
  );
};

export default ErrorPart;
