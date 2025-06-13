"use client";

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import WriteFileBlock from "./write-file-block";

const DemoContainer = styled.div`
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
`;

const DemoHeader = styled.h2`
  font-size: 18px;
  color: #374151;
  margin-bottom: 20px;
`;

const DemoControls = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
`;

const DemoButton = styled.button`
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  background-color: #ffffff;
  color: #374151;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: #f9fafb;
    border-color: #9ca3af;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SpeedControl = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SpeedSlider = styled.input`
  width: 100px;
`;

const sampleFileContent = `import React from "react";
import styled from "styled-components";

const Container = styled.div\`
  padding: 20px;
  background-color: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
\`;

const Title = styled.h1\`
  font-size: 24px;
  color: #1f2937;
  margin-bottom: 16px;
\`;

const Button = styled.button\`
  padding: 8px 16px;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #2563eb;
  }
\`;

const ExampleComponent: React.FC = () => {
  const [count, setCount] = useState(0);

  return (
    <Container>
      <Title>Example Component</Title>
      <p>This is a sample React component with styled-components.</p>
      <p>Current count: {count}</p>
      <Button onClick={() => setCount(count + 1)}>
        Increment Count
      </Button>
    </Container>
  );
};

export default ExampleComponent;`;

const WriteFileBlockDemo: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [streamingSpeed, setStreamingSpeed] = useState(20);
  const [currentContent, setCurrentContent] = useState("");

  const startGeneration = () => {
    setCurrentContent("");
    setIsGenerating(true);

    // Simulate streaming by gradually building up the content
    let index = 0;
    const interval = setInterval(() => {
      if (index < sampleFileContent.length) {
        setCurrentContent(sampleFileContent.slice(0, index + 1));
        index++;
      } else {
        setIsGenerating(false);
        clearInterval(interval);
      }
    }, streamingSpeed);
  };

  const resetDemo = () => {
    setIsGenerating(false);
    setCurrentContent("");
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <DemoContainer>
      <DemoHeader>WriteFileBlock Demo</DemoHeader>

      <DemoControls>
        <DemoButton
          onClick={startGeneration}
          disabled={isGenerating}
        >
          {isGenerating ? "Generating..." : "Start Generation"}
        </DemoButton>

        <DemoButton onClick={resetDemo}>
          Reset
        </DemoButton>

        <DemoButton onClick={toggleVisibility}>
          {isVisible ? "Hide" : "Show"}
        </DemoButton>

        <SpeedControl>
          <label>Speed (ms):</label>
          <SpeedSlider
            type="range"
            min="1"
            max="100"
            value={streamingSpeed}
            onChange={(e) => setStreamingSpeed(Number(e.target.value))}
            disabled={isGenerating}
          />
          <span>{streamingSpeed}ms</span>
        </SpeedControl>
      </DemoControls>

      <WriteFileBlock
        filePath="src/components/ExampleComponent.tsx"
        content={currentContent}
        isGenerating={isGenerating}
        isVisible={isVisible}
        streamingSpeed={streamingSpeed}
        onClose={() => setIsVisible(false)}
      />

      {/* Additional examples */}
      <WriteFileBlock
        filePath="src/utils/helpers.ts"
        content={`export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};`}
        isGenerating={false}
        isVisible={true}
        onClose={() => console.log("Close helper file")}
      />
    </DemoContainer>
  );
};

export default WriteFileBlockDemo;
