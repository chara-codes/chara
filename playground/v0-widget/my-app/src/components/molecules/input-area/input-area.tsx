"use client";

import type React from "react";
import { useState, useRef, useCallback } from "react";
import DropdownMenu from "../dropdown-menu";
import FileInput from "../file-input";
import type { InputAreaProps } from "../../../types/input-area";
import {
  InputContainer,
  InputWrapper,
  InputControls,
  ButtonsRow,
  SendButton,
  LoaderContainer,
  Loader,
  StyledInput,
} from "./styles";
import {
  PlusIcon,
  ClipIcon,
  PointerIcon,
  SendIcon,
  StopIcon,
  BeautifyIcon,
  UndoIcon,
} from "../../atoms/input-icons";
import IconButton from "../../atoms/icon-button";
import Tooltip from "../../atoms/tooltip";
import { useElementSelector } from "../../../hooks/use-element-selector";
import { createDropdownItems } from "./dropdown-items";
import styled from "styled-components";
import AnimatedButton from "./animated-button";

const RoundedIconButton = styled(IconButton)`
  border-radius: 8px;
  transition: background-color 0.2s ease;

  &:hover:not(:disabled) {
    background-color: rgba(0, 0, 0, 0.05);
  }

  &:active:not(:disabled) {
    background-color: rgba(0, 0, 0, 0.1);
  }
`;

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
`;

const InputArea: React.FC<InputAreaProps> = ({
  onSendMessage,
  onAddContext,
  isResponding = false,
  isLoading = false,
  onStopResponse = () => {},
}) => {
  const [message, setMessage] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const plusButtonRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<
    { top: number; left: number } | undefined
  >(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [originalText, setOriginalText] = useState<string>("");
  const [isBeautified, setIsBeautified] = useState(false);
  const [isBeautifyLoading, setIsBeautifyLoading] = useState(false);

  // Use our custom element selector hook
  const { startElementSelection } = useElementSelector(onAddContext);

  const beautifyText = useCallback(() => {
    if (!message.trim()) return;

    setIsBeautifyLoading(true);

    // Store original text for undo functionality
    setOriginalText(message);

    // Simulate AI beautification with a delay to show loading
    setTimeout(() => {
      const enhancedText = message
        .split(". ")
        .map((sentence) => {
          let s = sentence.trim();
          if (s.length > 0) {
            s = s.charAt(0).toUpperCase() + s.slice(1);
          }
          return s;
        })
        .join(". ")
        .replace(/\bi\b/g, "I")
        .replace(/\bdont\b/g, "don't")
        .replace(/\bcant\b/g, "can't")
        .replace(/\bwont\b/g, "won't");

      setMessage(enhancedText);
      setIsBeautified(true);
      setIsBeautifyLoading(false);
    }, 1000); // 1 second delay to show loading
  }, [message]);

  const handleUndo = useCallback(() => {
    setMessage(originalText);
    setIsBeautified(false);
  }, [originalText]);

  const handleSend = () => {
    if (message.trim() && !isResponding && !isBeautifyLoading) {
      onSendMessage(message);
      setMessage("");
      setIsBeautified(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey &&
      !isResponding &&
      !isLoading &&
      !isBeautifyLoading
    ) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePlusClick = () => {
    if (plusButtonRef.current && !isLoading && !isBeautifyLoading) {
      // const rect = plusButtonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: -250, // Position higher above the button to allow space for the dropdown
        left: 0,
      });
    }
    if (!isLoading && !isBeautifyLoading) {
      setIsDropdownOpen(!isDropdownOpen);
    }
  };

  const handleDropdownClose = () => {
    setIsDropdownOpen(false);
  };

  const handleFileSelect = (file: File) => {
    onAddContext({
      name: file.name,
      type: "File",
      data: file,
    });
    // Close the dropdown after file selection
    setIsDropdownOpen(false);
  };

  const triggerFileUpload = () => {
    if (fileInputRef.current && !isLoading && !isBeautifyLoading) {
      fileInputRef.current.click();
    }
  };

  // Create dropdown items
  const dropdownItems = createDropdownItems(
    startElementSelection,
    triggerFileUpload,
  );

  const handleDropdownSelect = (item: {
    id: string;
    label: string;
    type: string;
  }) => {
    if (item.id === "upload") {
      // The upload action is handled by the FileInput component
      return;
    }

    // For other items, add them to the context
    onAddContext({
      name: item.label,
      type: item.type.toLowerCase(), // Use the type directly from the item
    });
  };

  // Check if the beautify button should be visible
  const showBeautifyButton = message.length > 10;

  return (
    <InputContainer
      style={{
        opacity: isLoading || isBeautifyLoading ? 0.7 : 1,
        position: "relative",
      }}
    >
      {(isLoading || isBeautifyLoading) && <LoadingLine />}
      <InputWrapper hasContext={false}>
        <InputControls>
          <StyledInput
            placeholder={
              isResponding ? "AI is responding..." : "Message the agent..."
            }
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isResponding || isLoading || isBeautifyLoading}
          />
          <ButtonsRow>
            <div ref={plusButtonRef}>
              <Tooltip text="Add context" position="top" delay={500}>
                <RoundedIconButton
                  onClick={handlePlusClick}
                  disabled={isResponding || isLoading || isBeautifyLoading}
                  aria-label="Add context"
                >
                  <PlusIcon />
                </RoundedIconButton>
              </Tooltip>
            </div>
            <Tooltip text="Select element" position="top" delay={500}>
              <RoundedIconButton
                onClick={startElementSelection}
                disabled={isResponding || isLoading || isBeautifyLoading}
                aria-label="Select element"
              >
                <PointerIcon />
              </RoundedIconButton>
            </Tooltip>
            <Tooltip text="Upload file" position="top" delay={500}>
              <RoundedIconButton
                onClick={triggerFileUpload}
                disabled={isResponding || isLoading || isBeautifyLoading}
                aria-label="Upload file"
              >
                <ClipIcon />
              </RoundedIconButton>
            </Tooltip>
            <AnimatedButton isVisible={showBeautifyButton}>
              <Tooltip
                text={isBeautified ? "Undo beautify" : "Beautify text"}
                position="top"
                delay={500}
              >
                <RoundedIconButton
                  onClick={isBeautified ? handleUndo : beautifyText}
                  disabled={
                    isResponding ||
                    isLoading ||
                    isBeautifyLoading ||
                    (!isBeautified && !message.trim())
                  }
                  aria-label={isBeautified ? "Undo beautify" : "Beautify text"}
                >
                  {isBeautified ? <UndoIcon /> : <BeautifyIcon />}
                </RoundedIconButton>
              </Tooltip>
            </AnimatedButton>
            <DropdownMenu
              items={dropdownItems}
              isOpen={
                isDropdownOpen &&
                !isResponding &&
                !isLoading &&
                !isBeautifyLoading
              }
              onClose={handleDropdownClose}
              position={dropdownPosition}
              onSelect={handleDropdownSelect}
            />
            <FileInput onFileSelect={handleFileSelect} ref={fileInputRef} />
          </ButtonsRow>
        </InputControls>
      </InputWrapper>
      <Tooltip
        text={isResponding ? "Stop response" : "Send message"}
        position="left"
        delay={500}
      >
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
  );
};

export default InputArea;
