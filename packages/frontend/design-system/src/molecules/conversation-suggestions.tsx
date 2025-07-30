"use client";

import { useChatStore } from "@chara-codes/core";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import styled, { css, keyframes } from "styled-components";
import type { Theme } from "../../theme";

interface PromptBlockProps {
  text: string;
  onClick: () => void;
}

interface ConversationSuggestionsProps {
  onSelectSuggestion: (suggestion: string) => void;
}

// Predefined prompts to show while loading (synced with chat-store)
const PREDEFINED_PROMPTS = [
  "Help me brainstorm ideas for a new mobile app that helps people track their daily habits",
  "How do I implement a debounce function in JavaScript?",
  "Write a professional email to request a meeting with a potential client",
  "Explain the concept of React hooks and how they improve component development",
  "Give me feedback on my website design and suggest improvements",
  "What are the best practices for optimizing database queries?",
  "Help me debug this code that's causing a memory leak in my Node.js application",
  "Create a plan for launching a new product in the next quarter",
  "Summarize this article about artificial intelligence trends",
  "Compare and contrast microservices vs monolithic architecture",
];

// Animation keyframes
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
`;

const ScrollWrapper = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
`;

const SuggestionsContainer = styled.div`
  width: 100%;
  margin-top: auto;
  padding: 16px 0 0 0;
  background-color: ${({ theme }) => (theme as Theme).colors.background};
  position: relative;
  bottom: 0;
  left: 0;
  right: 0;
  box-sizing: border-box;
  max-width: none;
`;

const SuggestionsTitle = styled.h3`
  width: 100%;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => (theme as Theme).colors.textSecondary};
  margin-bottom: 12px;
  padding: 0 8px; /* Reduced horizontal padding */
  box-sizing: border-box;
`;

const ScrollContainer = styled.div`
  display: flex;
  width: 100%;
  overflow-x: auto;
  padding: 4px 8px 0; /* Reduced horizontal padding */
  margin-bottom: 0;
  scroll-padding: 8px; /* Adjusted to match new padding */
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  box-sizing: border-box;

  /* Hide scrollbar but keep functionality */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  &::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }

  /* Add space after the last item to show there's more content */
  &::after {
    content: "";
    padding-right: 8px; /* Adjusted to match new padding */
  }
`;

const PromptBlock = styled.div<{
  $isPlaceholder?: boolean;
  $animationDelay?: number;
}>`
  display: flex;
  align-items: center;
  width: 240px; /* Fixed width for 30-40 characters */
  height: 32px; /* Slightly reduced height for better proportions */
  padding: 0 12px; /* Reduced padding for more compact look */
  margin-right: 8px;
  background-color: ${({ theme }) =>
    (theme as Theme).colors.backgroundSecondary};
  border: 1px solid ${({ theme }) => (theme as Theme).colors.border};
  border-radius: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
  scroll-snap-align: start;
  flex-shrink: 0; /* Prevent shrinking */
  animation: ${fadeIn} 0.5s ease-out;
  animation-delay: ${({ $animationDelay }) => $animationDelay || 0}ms;
  animation-fill-mode: both;

  ${({ $isPlaceholder, theme }) =>
    $isPlaceholder &&
    css`
      background: linear-gradient(
        90deg,
        ${(theme as Theme).colors.backgroundSecondary} 0%,
        ${(theme as Theme).colors.background} 50%,
        ${(theme as Theme).colors.backgroundSecondary} 100%
      );
      background-size: 200px 100%;
      animation: ${shimmer} 1.5s ease-in-out infinite;
      cursor: default;

      &:hover {
        border-color: ${(theme as Theme).colors.border};
        background: linear-gradient(
          90deg,
          ${(theme as Theme).colors.backgroundSecondary} 0%,
          ${(theme as Theme).colors.background} 50%,
          ${(theme as Theme).colors.backgroundSecondary} 100%
        );
        background-size: 200px 100%;
      }
    `}

  ${({ $isPlaceholder }) =>
    !$isPlaceholder &&
    css`
      &:hover {
        border-color: ${({ theme }) => (theme as Theme).colors.primary};
        background-color: ${({ theme }) =>
          `${(theme as Theme).colors.primary}05`};
      }
    `}

  &:last-child {
    margin-right: 0;
  }
`;

const PromptText = styled.span<{ $isPlaceholder?: boolean }>`
  font-size: 12px;
  font-weight: 400;
  color: ${({ theme, $isPlaceholder }) =>
    $isPlaceholder
      ? (theme as Theme).colors.textSecondary
      : (theme as Theme).colors.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: ${({ $isPlaceholder }) => ($isPlaceholder ? 0.7 : 1)};
`;

const ScrollButton = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  width: 30px; // Slightly smaller to fit well
  height: 30px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    ${({ theme }) => `${(theme as Theme).colors.backgroundSecondary}E6`} 0%,
    ${({ theme }) => `${(theme as Theme).colors.background}B3`} 100%
  ); // E6 is ~90%, B3 is ~70% opacity
  border: 1px solid ${({ theme }) => (theme as Theme).colors.border};
  color: ${({ theme }) => (theme as Theme).colors.textSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: ${({ theme }) => (theme as Theme).colors.primary};
    border-color: ${({ theme }) => (theme as Theme).colors.primary};
    background: radial-gradient(
      circle,
      ${({ theme }) => `${(theme as Theme).colors.backgroundSecondary}FF`} 0%,
      ${({ theme }) => `${(theme as Theme).colors.background}CC`} 100%
    ); // More opaque on hover
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const LeftScrollButton = styled(ScrollButton)`
  left: -4px; // Position slightly overlapping the container edge for better reach
`;

const RightScrollButton = styled(ScrollButton)`
  right: -4px; // Position slightly overlapping the container edge
`;

const PromptBlockComponent: React.FC<
  PromptBlockProps & {
    isPlaceholder?: boolean;
    animationDelay?: number;
  }
> = ({ text, onClick, isPlaceholder = false, animationDelay = 0 }) => {
  return (
    <PromptBlock
      onClick={isPlaceholder ? undefined : onClick}
      $isPlaceholder={isPlaceholder}
      $animationDelay={animationDelay}
    >
      <PromptText $isPlaceholder={isPlaceholder}>{text}</PromptText>
    </PromptBlock>
  );
};

const ConversationSuggestions: React.FC<ConversationSuggestionsProps> = ({
  onSelectSuggestion,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] =
    useState<string[]>(PREDEFINED_PROMPTS);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(true);
  const [showTransition, setShowTransition] = useState(false);

  // Get suggested prompts from chat store
  const getSuggestedPrompts = useChatStore(
    (state) => (state as any).getSuggestedPrompts
  );

  // Load suggested prompts on component mount
  useEffect(() => {
    const loadPrompts = async () => {
      setIsLoadingPrompts(true);
      try {
        const prompts = await getSuggestedPrompts();
        if (prompts && prompts.length > 0) {
          // Trigger transition effect
          setShowTransition(true);

          // Wait a brief moment before updating prompts for visual effect
          setTimeout(() => {
            setSuggestedPrompts(prompts);
            setIsLoadingPrompts(false);
          }, 300);
        } else {
          // Fallback to placeholder if no prompts returned
          setIsLoadingPrompts(false);
        }
      } catch (error) {
        console.error("Failed to load suggested prompts:", error);
        setIsLoadingPrompts(false);
      }
    };

    loadPrompts();
  }, [getSuggestedPrompts]);

  // Reset transition state when prompts change
  useEffect(() => {
    if (!isLoadingPrompts && showTransition) {
      const timer = setTimeout(() => {
        setShowTransition(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoadingPrompts, showTransition]);

  const checkScrollability = useCallback(() => {
    const el = scrollRef.current;
    if (el) {
      const tolerance = 1; // Tolerance for floating point inaccuracies
      const currentScrollLeft = el.scrollLeft;
      const currentScrollWidth = el.scrollWidth;
      const currentClientWidth = el.clientWidth;

      setCanScrollLeft(currentScrollLeft > tolerance);
      setCanScrollRight(
        currentScrollLeft < currentScrollWidth - currentClientWidth - tolerance
      );
    } else {
      setCanScrollLeft(false);
      setCanScrollRight(false);
    }
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const debouncedCheck = () => {
      requestAnimationFrame(checkScrollability);
    };

    // Initial check, might need a slight delay if content width isn't stable immediately
    setTimeout(checkScrollability, 50);

    el.addEventListener("scroll", checkScrollability, { passive: true });
    window.addEventListener("resize", debouncedCheck);

    const resizeObserver = new ResizeObserver(debouncedCheck);
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener("scroll", checkScrollability);
      window.removeEventListener("resize", debouncedCheck);
      resizeObserver.disconnect();
    };
  }, [checkScrollability, suggestedPrompts]); // Re-check if prompts change

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.7; // Scroll by 70% of visible width
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <SuggestionsContainer>
      <SuggestionsTitle>Try asking...</SuggestionsTitle>
      <ScrollWrapper>
        {canScrollLeft && (
          <LeftScrollButton
            onClick={() => scroll("left")}
            aria-label="Scroll left"
          >
            <ChevronLeft />
          </LeftScrollButton>
        )}
        <ScrollContainer ref={scrollRef}>
          {suggestedPrompts.map((prompt, index) => (
            <PromptBlockComponent
              // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
              key={`${isLoadingPrompts ? "placeholder" : "real"}-${index}`}
              text={prompt}
              onClick={() => onSelectSuggestion(prompt)}
              isPlaceholder={isLoadingPrompts}
              animationDelay={index * 100}
            />
          ))}
        </ScrollContainer>
        {canScrollRight && (
          <RightScrollButton
            onClick={() => scroll("right")}
            aria-label="Scroll right"
          >
            <ChevronRight />
          </RightScrollButton>
        )}
      </ScrollWrapper>
    </SuggestionsContainer>
  );
};

export default ConversationSuggestions;
