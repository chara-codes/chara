"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import styled from "styled-components";
import "highlight.js/styles/github.css";
import { cleanThinkingTags } from "@chara-codes/core";

const TextContainer = styled.div`
  line-height: 1.6;

  /* Markdown styling */
  p {
    margin: 0 0 12px 0;

    &:last-child {
      margin-bottom: 0;
    }
  }

  code {
    background: rgba(0, 0, 0, 0.05);
    padding: 2px 4px;
    border-radius: 4px;
    font-family: "Monaco", "Menlo", "Consolas", monospace;
    font-size: 0.9em;
  }

  pre {
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    padding: 12px;
    overflow-x: auto;
    margin: 8px 0;

    code {
      background: none;
      padding: 0;
    }
  }

  blockquote {
    border-left: 4px solid #e5e7eb;
    margin: 12px 0;
    padding-left: 16px;
    color: #6b7280;
  }

  ul,
  ol {
    margin: 8px 0;
    padding-left: 20px;
  }

  li {
    margin: 4px 0;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin: 16px 0 8px 0;
    font-weight: 600;

    &:first-child {
      margin-top: 0;
    }
  }

  h1 {
    font-size: 1.5em;
  }
  h2 {
    font-size: 1.3em;
  }
  h3 {
    font-size: 1.2em;
  }
  h4,
  h5,
  h6 {
    font-size: 1.1em;
  }

  table {
    border-collapse: collapse;
    width: 100%;
    margin: 12px 0;
  }

  th,
  td {
    border: 1px solid #e5e7eb;
    padding: 8px 12px;
    text-align: left;
  }

  th {
    background: #f9fafb;
    font-weight: 600;
  }

  a {
    color: #3b82f6;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const PlainText = styled.div`
  white-space: pre-wrap;
  word-wrap: break-word;
`;

export interface TextPartProps {
  text: string;
  isUser?: boolean;
}

const TextPart: React.FC<TextPartProps> = ({ text, isUser = false }) => {
  if (!text) {
    return null;
  }

  // For user messages, render as plain text to preserve formatting
  if (isUser) {
    return (
      <TextContainer>
        <PlainText>{text}</PlainText>
      </TextContainer>
    );
  }

  // For assistant messages, clean thinking tags and render as markdown
  const cleanedText = cleanThinkingTags(text);

  return (
    <TextContainer>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        children={cleanedText}
      />
    </TextContainer>
  );
};

export default TextPart;
