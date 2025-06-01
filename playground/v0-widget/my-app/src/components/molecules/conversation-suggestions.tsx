"use client"

import type React from "react"
import { useRef, useState, useEffect, useCallback } from "react"
import styled from "styled-components"
import type { Theme } from "../../styles/theme"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PromptBlockProps {
  text: string
  onClick: () => void
}

interface ConversationSuggestionsProps {
  onSelectSuggestion: (suggestion: string) => void
}

const ScrollWrapper = styled.div`
position: relative;
width: 100%;
display: flex;
align-items: center;
`

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
`

const SuggestionsTitle = styled.h3`
width: 100%;
font-size: 14px;
font-weight: 500;
color: ${({ theme }) => (theme as Theme).colors.textSecondary};
margin-bottom: 12px;
padding: 0 8px; /* Reduced horizontal padding */
box-sizing: border-box;
`

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
`

const PromptBlock = styled.div`
display: flex;
align-items: center;
min-width: fit-content;
max-width: 220px; /* Increased max width */
height: 36px;
padding: 0 16px;
margin-right: 8px;
background-color: ${({ theme }) => (theme as Theme).colors.backgroundSecondary};
border: 1px solid ${({ theme }) => (theme as Theme).colors.border};
border-radius: 18px;
cursor: pointer;
transition: all 0.2s ease;
scroll-snap-align: start;
flex-shrink: 0; /* Prevent shrinking */

&:hover {
  border-color: ${({ theme }) => (theme as Theme).colors.primary};
  background-color: ${({ theme }) => `${(theme as Theme).colors.primary}05`};
}

&:last-child {
  margin-right: 0;
}
`

const PromptText = styled.span`
font-size: 13px;
font-weight: 400;
color: ${({ theme }) => (theme as Theme).colors.text};
white-space: nowrap;
overflow: hidden;
text-overflow: ellipsis;
`

const ScrollButton = styled.button`
position: absolute;
top: 50%;
transform: translateY(-50%);
z-index: 2;
width: 30px; // Slightly smaller to fit well
height: 30px;
border-radius: 50%;
background: radial-gradient(circle, ${({ theme }) => `${(theme as Theme).colors.backgroundSecondary}E6`} 0%, ${({ theme }) => `${(theme as Theme).colors.background}B3`} 100%); // E6 is ~90%, B3 is ~70% opacity
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
  background: radial-gradient(circle, ${({ theme }) => `${(theme as Theme).colors.backgroundSecondary}FF`} 0%, ${({ theme }) => `${(theme as Theme).colors.background}CC`} 100%); // More opaque on hover
}

svg {
  width: 18px;
  height: 18px;
}
`

const LeftScrollButton = styled(ScrollButton)`
left: -4px; // Position slightly overlapping the container edge for better reach
`

const RightScrollButton = styled(ScrollButton)`
right: -4px; // Position slightly overlapping the container edge
`

const PromptBlockComponent: React.FC<PromptBlockProps> = ({ text, onClick }) => {
  return (
    <PromptBlock onClick={onClick}>
      <PromptText>{text}</PromptText>
    </PromptBlock>
  )
}

const ConversationSuggestions: React.FC<ConversationSuggestionsProps> = ({ onSelectSuggestion }) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // Define conversation prompts
  const prompts = [
    "Help me brainstorm ideas for...",
    "How do I implement...",
    "Write a professional email about...",
    "Explain the concept of...",
    "Give me feedback on...",
    "What are the best practices for...",
    "Help me debug this code...",
    "Create a plan for...",
    "Summarize this article...",
    "Compare and contrast...",
  ]

  // Define full prompts that will be sent when a block is clicked
  const fullPrompts = [
    "Help me brainstorm ideas for a new mobile app that helps people track their daily habits.",
    "How do I implement a debounce function in JavaScript?",
    "Write a professional email to request a meeting with a potential client.",
    "Explain the concept of React hooks and how they improve component development.",
    "Give me feedback on my website design and suggest improvements.",
    "What are the best practices for optimizing database queries?",
    "Help me debug this code that's causing a memory leak in my Node.js application.",
    "Create a plan for launching a new product in the next quarter.",
    "Summarize this article about artificial intelligence trends.",
    "Compare and contrast microservices vs monolithic architecture.",
  ]

  const checkScrollability = useCallback(() => {
    const el = scrollRef.current
    if (el) {
      const tolerance = 1 // Tolerance for floating point inaccuracies
      const currentScrollLeft = el.scrollLeft
      const currentScrollWidth = el.scrollWidth
      const currentClientWidth = el.clientWidth

      setCanScrollLeft(currentScrollLeft > tolerance)
      setCanScrollRight(currentScrollLeft < currentScrollWidth - currentClientWidth - tolerance)
    } else {
      setCanScrollLeft(false)
      setCanScrollRight(false)
    }
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const debouncedCheck = () => {
      requestAnimationFrame(checkScrollability)
    }

    // Initial check, might need a slight delay if content width isn't stable immediately
    setTimeout(checkScrollability, 50)

    el.addEventListener("scroll", checkScrollability, { passive: true })
    window.addEventListener("resize", debouncedCheck)

    const resizeObserver = new ResizeObserver(debouncedCheck)
    resizeObserver.observe(el)

    return () => {
      el.removeEventListener("scroll", checkScrollability)
      window.removeEventListener("resize", debouncedCheck)
      resizeObserver.disconnect()
    }
  }, [checkScrollability, prompts]) // Re-check if prompts change

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.7 // Scroll by 70% of visible width
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }

  return (
    <SuggestionsContainer>
      <SuggestionsTitle>Try asking...</SuggestionsTitle>
      <ScrollWrapper>
        {canScrollLeft && (
          <LeftScrollButton onClick={() => scroll("left")} aria-label="Scroll left">
            <ChevronLeft />
          </LeftScrollButton>
        )}
        <ScrollContainer ref={scrollRef}>
          {prompts.map((prompt, index) => (
            <PromptBlockComponent key={index} text={prompt} onClick={() => onSelectSuggestion(fullPrompts[index])} />
          ))}
        </ScrollContainer>
        {canScrollRight && (
          <RightScrollButton onClick={() => scroll("right")} aria-label="Scroll right">
            <ChevronRight />
          </RightScrollButton>
        )}
      </ScrollWrapper>
    </SuggestionsContainer>
  )
}

export default ConversationSuggestions
