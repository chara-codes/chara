"use client"

import type React from "react"
import { useState, useCallback, useRef } from "react"
import styled from "styled-components"
import type { Theme } from "../../styles/theme"
import TextInput from "../atoms/text-input"
import IconButton from "../atoms/icon-button"
import { SendIcon, BeautifyIcon, UndoIcon } from "../atoms/icons"
import Tooltip from "../atoms/tooltip"

interface ChatInputProps {
  onSendMessage: (message: string) => void
  placeholder?: string
  disabled?: boolean
}

const Container = styled.div`
  display: flex;
  align-items: center;
  padding: ${({ theme }) => (theme as Theme).spacing.sm};
  background-color: ${({ theme }) => (theme as Theme).colors.background};
  border-top: 1px solid ${({ theme }) => (theme as Theme).colors.border};
`

const StyledInput = styled(TextInput)`
  flex: 1;
  margin-right: ${({ theme }) => (theme as Theme).spacing.sm};
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
`

const BeautifyButton = styled(IconButton)`
  background-color: ${({ theme }) => (theme as Theme).colors.surface};
  border: 1px solid ${({ theme }) => (theme as Theme).colors.border};
  border-radius: 4px;
  padding: 6px;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background-color: ${({ theme }) => (theme as Theme).colors.border};
  }
`

// Simulated AI beautification function
const beautifyText = (text: string): string => {
  // In a real implementation, this would call an AI service
  // For now, we'll just make some simple transformations

  // Capitalize first letter of sentences
  const capitalized = text.replace(/(^\s*|[.!?]\s+)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase())

  // Fix common typos
  const fixedTypos = capitalized
    .replace(/\bi\b/g, "I")
    .replace(/\bdont\b/g, "don't")
    .replace(/\bim\b/g, "I'm")
    .replace(/\bcant\b/g, "can't")

  // Add some variety to common words
  const enhancedText = fixedTypos
    .replace(/\bgood\b/g, "excellent")
    .replace(/\bnice\b/g, "wonderful")
    .replace(/\bbad\b/g, "problematic")
    .replace(/\bsaid\b/g, "mentioned")

  return enhancedText
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  placeholder = "Type a message...",
  disabled = false,
}) => {
  const [message, setMessage] = useState("")
  const [originalMessage, setOriginalMessage] = useState<string | null>(null)
  const [isBeautified, setIsBeautified] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (message.trim()) {
        onSendMessage(message)
        setMessage("")
        setOriginalMessage(null)
        setIsBeautified(false)
      }
    },
    [message, onSendMessage],
  )

  const handleBeautify = useCallback(() => {
    if (!message.trim()) return

    // Save the original message for undo
    setOriginalMessage(message)

    // Apply the beautification
    const beautified = beautifyText(message)
    setMessage(beautified)
    setIsBeautified(true)

    // Focus the input after transformation
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [message])

  const handleUndo = useCallback(() => {
    if (originalMessage !== null) {
      setMessage(originalMessage)
      setIsBeautified(false)
      setOriginalMessage(null)

      // Focus the input after undoing
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }
  }, [originalMessage])

  return (
    <Container as="form" onSubmit={handleSubmit}>
      <StyledInput
        ref={inputRef}
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full"
      />
      <ButtonGroup>
        {isBeautified ? (
          <Tooltip text="Undo beautification" position="top" delay={300}>
            <BeautifyButton
              type="button"
              onClick={handleUndo}
              disabled={disabled || !isBeautified}
              aria-label="Undo beautification"
            >
              <UndoIcon />
            </BeautifyButton>
          </Tooltip>
        ) : (
          <Tooltip text="Beautify text" position="top" delay={300}>
            <BeautifyButton
              type="button"
              onClick={handleBeautify}
              disabled={disabled || !message.trim()}
              aria-label="Beautify text"
            >
              <BeautifyIcon />
            </BeautifyButton>
          </Tooltip>
        )}
        <IconButton type="submit" disabled={!message.trim() || disabled} aria-label="Send message">
          <SendIcon />
        </IconButton>
      </ButtonGroup>
    </Container>
  )
}

export default ChatInput
