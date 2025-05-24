"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import DropdownMenu from "../dropdown-menu"
import FileInput from "../file-input"
import type { InputAreaProps } from "../../../types/input-area"
import {
  InputContainer,
  InputWrapper,
  InputControls,
  ButtonsRow,
  SendButton,
  LoaderContainer,
  Loader,
  StyledInput,
} from "./styles"
import { PlusIcon, ClipIcon, PointerIcon, SendIcon, StopIcon, BeautifyIcon, UndoIcon } from "../../atoms/input-icons"
import IconButton from "../../atoms/icon-button"
import Tooltip from "../../atoms/tooltip"
import { useElementSelector } from "../../../hooks/use-element-selector"
import { createDropdownItems } from "./dropdown-items"
import styled from "styled-components"
import AnimatedButton from "./animated-button"

const RoundedIconButton = styled(IconButton)`
  border-radius: 8px;
  transition: background-color 0.2s ease;
  
  &:hover:not(:disabled) {
    background-color: rgba(0, 0, 0, 0.05);
  }
  
  &:active:not(:disabled) {
    background-color: rgba(0, 0, 0, 0.1);
  }
`

const InputArea: React.FC<InputAreaProps> = ({
  onSendMessage,
  onAddContext,
  isResponding = false,
  onStopResponse = () => {},
}) => {
  const [message, setMessage] = useState("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const plusButtonRef = useRef<HTMLDivElement>(null)
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | undefined>(undefined)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [originalText, setOriginalText] = useState<string>("")
  const [isBeautified, setIsBeautified] = useState(false)

  // Use our custom element selector hook
  const { startElementSelection } = useElementSelector(onAddContext)

  // const contextItems = useChatStore((state) => state.contextItems)
  // const hasContext = contextItems.length > 0

  const beautifyText = useCallback(() => {
    if (!message.trim()) return

    setOriginalText(message)
    setIsBeautified(true)

    // Simulate AI beautification (in production, this would call an AI service)
    const enhancedText = message
      .split(". ")
      .map((sentence) => {
        let s = sentence.trim()
        if (s.length > 0) {
          s = s.charAt(0).toUpperCase() + s.slice(1)
        }
        return s
      })
      .join(". ")
      .replace(/\bi\b/g, "I")
      .replace(/\bdont\b/g, "don't")
      .replace(/\bcant\b/g, "can't")
      .replace(/\bwont\b/g, "won't")

    setMessage(enhancedText)
  }, [message])

  const handleUndo = useCallback(() => {
    setMessage(originalText)
    setIsBeautified(false)
  }, [originalText])

  const handleSend = () => {
    if (message.trim() && !isResponding) {
      onSendMessage(message)
      setMessage("")
      setIsBeautified(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isResponding) {
      e.preventDefault()
      handleSend()
    }
  }

  const handlePlusClick = () => {
    if (plusButtonRef.current) {
      // const rect = plusButtonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: -250, // Position higher above the button to allow space for the dropdown
        left: 0,
      })
    }
    setIsDropdownOpen(!isDropdownOpen)
  }

  const handleDropdownClose = () => {
    setIsDropdownOpen(false)
  }

  const handleFileSelect = (file: File) => {
    onAddContext({
      name: file.name,
      type: "File",
      data: file,
    })
    // Close the dropdown after file selection
    setIsDropdownOpen(false)
  }

  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Create dropdown items
  const dropdownItems = createDropdownItems(startElementSelection, triggerFileUpload)

  const handleDropdownSelect = (item: { id: string; label: string; type: string }) => {
    if (item.id === "upload") {
      // The upload action is handled by the FileInput component
      return
    }

    // For other items, add them to the context
    onAddContext({
      name: item.label,
      type: item.type.toLowerCase(), // Use the type directly from the item
    })
  }

  // Check if the beautify button should be visible
  const showBeautifyButton = message.length > 10

  return (
    <InputContainer>
      <InputWrapper hasContext={false}>
        <InputControls>
          <StyledInput
            placeholder={isResponding ? "AI is responding..." : "Message the agent..."}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isResponding}
          />
          <ButtonsRow>
            <div ref={plusButtonRef}>
              <Tooltip text="Add context" position="top" delay={500}>
                <RoundedIconButton onClick={handlePlusClick} disabled={isResponding} aria-label="Add context">
                  <PlusIcon />
                </RoundedIconButton>
              </Tooltip>
            </div>
            <Tooltip text="Select element" position="top" delay={500}>
              <RoundedIconButton onClick={startElementSelection} disabled={isResponding} aria-label="Select element">
                <PointerIcon />
              </RoundedIconButton>
            </Tooltip>
            <Tooltip text="Upload file" position="top" delay={500}>
              <RoundedIconButton onClick={triggerFileUpload} disabled={isResponding} aria-label="Upload file">
                <ClipIcon />
              </RoundedIconButton>
            </Tooltip>
            <AnimatedButton isVisible={showBeautifyButton}>
              <Tooltip text={isBeautified ? "Undo beautify" : "Beautify text"} position="top" delay={500}>
                <RoundedIconButton
                  onClick={isBeautified ? handleUndo : beautifyText}
                  disabled={isResponding || (!isBeautified && !message.trim())}
                  aria-label={isBeautified ? "Undo beautify" : "Beautify text"}
                >
                  {isBeautified ? <UndoIcon /> : <BeautifyIcon />}
                </RoundedIconButton>
              </Tooltip>
            </AnimatedButton>
            <DropdownMenu
              items={dropdownItems}
              isOpen={isDropdownOpen && !isResponding}
              onClose={handleDropdownClose}
              position={dropdownPosition}
              onSelect={handleDropdownSelect}
            />
            <FileInput onFileSelect={handleFileSelect} ref={fileInputRef} />
          </ButtonsRow>
        </InputControls>
      </InputWrapper>
      <Tooltip text={isResponding ? "Stop response" : "Send message"} position="left" delay={500}>
        <SendButton
          onClick={isResponding ? onStopResponse : handleSend}
          variant="primary"
          $isResponding={isResponding}
          aria-label={isResponding ? "Stop response" : "Send message"}
        >
          {isResponding ? (
            <>
              <StopIcon />
              <LoaderContainer>
                <Loader />
              </LoaderContainer>
            </>
          ) : (
            <SendIcon />
          )}
        </SendButton>
      </Tooltip>
    </InputContainer>
  )
}

export default InputArea
