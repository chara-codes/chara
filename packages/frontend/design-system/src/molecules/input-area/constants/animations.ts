import { keyframes } from "styled-components";

export const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

export const pulse = keyframes`
  0%, 100% {
    box-shadow: 0 0 8px rgba(139, 92, 246, 0.3);
  }
  50% {
    box-shadow: 0 0 16px rgba(139, 92, 246, 0.8);
  }
`;

export const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;
