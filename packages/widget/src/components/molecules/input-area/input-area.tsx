"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
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
import { useUIStore } from "../../../store/ui-store" // Updated to use the corrected context hook
import { useChatStore } from "../../../store/chat-store"

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

const LoadingLine = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  height: 3px;
  width: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    #3b82f6,
    #8b5cf6,
    #ec4899,
    #8b5cf6,
    #3b82f6,
    transparent
  );
  background-size: 200% 100%;
  animation:
    shimmer 2s infinite linear,
    pulse 1.5s infinite ease-in-out;
  box-shadow: 0 0 10px rgba(139, 92, 246, 0.5);

  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 0.8;
      transform: scaleY(1);
    }
    50% {
      opacity: 1;
      transform: scaleY(1.2);
    }
  }
`

const InputArea: React.FC<InputAreaProps> = ({
  onSendMessage,
  onAddContext,
  isResponding = false,
  isLoading = false,
  onStopResponse = () => {},
  buttonConfig, // Prop for button config
}) => {
  // Use the context-aware hook to get buttonConfig from the store
  const storeButtonConfig = useUIStore((state) => state.inputButtonConfig)
  const beautifyPromptStream = useChatStore((state) => state.beautifyPromptStream)

  // If buttonConfig prop is provided, it overrides the store's config.
  // Otherwise, use the config from the store.
  const effectiveButtonConfig = buttonConfig || storeButtonConfig

  const [message, setMessage] = useState("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const plusButtonRef = useRef<HTMLDivElement>(null)
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | undefined>(undefined)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [originalText, setOriginalText] = useState<string>("")
  const [isBeautified, setIsBeautified] = useState(false)
  const [isBeautifyLoading, setIsBeautifyLoading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { startElementSelection } = useElementSelector(onAddContext)

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const scrollHeight = textarea.scrollHeight
      const maxHeight = 150
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`
      textarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden'
    }
  }, [])

  useEffect(() => {
    adjustTextareaHeight()
  }, [adjustTextareaHeight])

  const beautifyText = useCallback(() => {
    if (!message.trim()) return

    const currentMessage = message
    setIsBeautifyLoading(true)
    setOriginalText(currentMessage)
    
    // Clear the current message to show streaming effect
    setMessage("")

    beautifyPromptStream(
      currentMessage,
      // onTextDelta - update message in real-time
      (delta: string) => {
        setMessage(prev => prev + delta)
        // Trigger height adjustment after each delta
        setTimeout(() => {
          const textarea = textareaRef.current
          if (textarea) {
            textarea.style.height = 'auto'
            const scrollHeight = textarea.scrollHeight
            const maxHeight = 150
            textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`
            textarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden'
          }
        }, 0)
      },
      // onComplete - finalize the beautification
      (finalText: string) => {
        setMessage(finalText)
        setIsBeautified(true)
        setIsBeautifyLoading(false)
      },
      // onError - handle errors
      (error: Error) => {
        console.error("Failed to beautify text:", error)
        // Revert to original text on error
        setMessage(currentMessage)
        setIsBeautifyLoading(false)
      }
    )
  }, [message, beautifyPromptStream])

  const handleUndo = useCallback(() => {
    setMessage(originalText)
    setIsBeautified(false)
  }, [originalText])

  const handleSend = () => {
    if (message.trim() && !isResponding && !isBeautifyLoading) {
      onSendMessage(message)
      setMessage("")
      setIsBeautified(false)
      // Reset textarea height after clearing message
      setTimeout(adjustTextareaHeight, 0)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isResponding && !isLoading && !isBeautifyLoading) {
      e.preventDefault()
      handleSend()
    }
  }

  const handlePlusClick = () => {
    if (plusButtonRef.current && !isLoading && !isBeautifyLoading) {
      setDropdownPosition({
        top: -250,
        left: 0,
      })
    }
    if (!isLoading && !isBeautifyLoading) {
      setIsDropdownOpen(!isDropdownOpen)
    }
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
    setIsDropdownOpen(false)
  }

  const triggerFileUpload = () => {
    if (fileInputRef.current && !isLoading && !isBeautifyLoading) {
      fileInputRef.current.click()
    }
  }

  const dropdownItems = createDropdownItems(startElementSelection, triggerFileUpload)

  const handleDropdownSelect = (item: {
    id: string
    label: string
    type: string
  }) => {
    if (item.id === "upload") {
      return
    }

    onAddContext({
      name: item.label,
      type: item.type.toLowerCase(),
    })
  }

  const showBeautifyButton = message.length > 10

  const isButtonEnabled = (buttonId: string) => {
    const button = effectiveButtonConfig?.find((b) => b.id === buttonId)
    return button ? button.enabled : false
  }

  const getButtonTooltip = (buttonId: string) => {
    const button = effectiveButtonConfig?.find((b) => b.id === buttonId)
    return button ? (button.tooltip as string) : ""
  }

  return (
    <InputContainer
      style={{
        opacity: isLoading || isBeautifyLoading ? 0.7 : 1,
        position: "relative",
      }}
    >
      {(isLoading || isBeautifyLoading) && <LoadingLine />}
      <InputWrapper>
        <InputControls>
          <StyledInput
            ref={textareaRef}
            placeholder={isResponding ? "AI is responding..." : "Message the agent..."}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value)
              adjustTextareaHeight()
            }}
            onKeyDown={handleKeyDown}
            disabled={isResponding || isLoading || isBeautifyLoading}
          />
          <ButtonsRow>
            {isButtonEnabled("add-context") && (
              <div ref={plusButtonRef}>
                <Tooltip text={getButtonTooltip("add-context")} position="top" delay={500}>
                  <RoundedIconButton
                    onClick={handlePlusClick}
                    disabled={isResponding || isLoading || isBeautifyLoading}
                    aria-label="Add context"
                  >
                    <PlusIcon />
                  </RoundedIconButton>
                </Tooltip>
              </div>
            )}
            {isButtonEnabled("select-element") && (
              <Tooltip text={getButtonTooltip("select-element")} position="top" delay={500}>
                <RoundedIconButton
                  onClick={startElementSelection}
                  disabled={isResponding || isLoading || isBeautifyLoading}
                  aria-label="Select element"
                >
                  <PointerIcon />
                </RoundedIconButton>
              </Tooltip>
            )}
            {isButtonEnabled("upload-file") && (
              <Tooltip text={getButtonTooltip("upload-file")} position="top" delay={500}>
                <RoundedIconButton
                  onClick={triggerFileUpload}
                  disabled={isResponding || isLoading || isBeautifyLoading}
                  aria-label="Upload file"
                >
                  <ClipIcon />
                </RoundedIconButton>
              </Tooltip>
            )}
            <AnimatedButton isVisible={showBeautifyButton}>
              <Tooltip text={isBeautified ? "Undo beautify" : "Beautify text"} position="top" delay={500}>
                <RoundedIconButton
                  onClick={isBeautified ? handleUndo : beautifyText}
                  disabled={isResponding || isLoading || isBeautifyLoading || (!isBeautified && !message.trim())}
                  aria-label={isBeautified ? "Undo beautify" : "Beautify text"}
                >
                  {isBeautified ? <UndoIcon /> : <BeautifyIcon />}
                </RoundedIconButton>
              </Tooltip>
            </AnimatedButton>
            <DropdownMenu
              items={dropdownItems}
              isOpen={isDropdownOpen && !isResponding && !isLoading && !isBeautifyLoading}
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
          $isResponding={isResponding}
          disabled={isLoading || isBeautifyLoading}
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
