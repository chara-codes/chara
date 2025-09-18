"use client";

import {
  BrowserContext,
  readFileContent,
  useRunnerProcesses,
  useSimpleBeautifier,
  useUIStore,
  type InputAreaProps,
} from "@chara-codes/core";
import { useElementSelector } from "@chara-codes/element-selector";
import type React from "react";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import IconButton from "../../atoms/icon-button";
import {
  BeautifyIcon,
  ClipIcon,
  PlusIcon,
  PointerIcon,
  SendIcon,
  StopIcon,
  UndoIcon,
} from "../../atoms/input-icons";
import Tooltip from "../../atoms/tooltip";
import DropdownMenu from "../dropdown-menu";
import FileInput from "../file-input";
import AnimatedButton from "./animated-button";
import { createDropdownItems } from "./dropdown-items";
import {
  ButtonsRow,
  InputContainer,
  InputControls,
  InputWrapper,
  Loader,
  LoaderContainer,
  SendButton,
  StyledInput,
} from "./styles";

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
  animation: shimmer 2s infinite linear, pulse 1.5s infinite ease-in-out;
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
  onStopResponse = () => {
    // no-op
  },
  buttonConfig, // Prop for button config
  initialMessage,
  chatId,
}) => {
  const { browser, sentMessageToApp } = useContext(BrowserContext);
  // Use the context-aware hook to get buttonConfig from the store
  const storeButtonConfig = useUIStore((state) => state.inputButtonConfig);

  const {
    setPrompt: setBeautifierPrompt,
    isBeautifying,
    result: beautifierResult,
    error: beautifierError,
    beautify,
    stop: stopBeautify,
    clear: clearBeautifier,
    hasResult: hasBeautifierResult,
  } = useSimpleBeautifier();

  // If buttonConfig prop is provided, it overrides the store's config.
  // Otherwise, use the config from the store.
  const effectiveButtonConfig = buttonConfig || storeButtonConfig;

  const [message, setMessage] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const plusButtonRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<
    { top: number; left: number } | undefined
  >(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [originalText, setOriginalText] = useState<string>("");
  const [isBeautified, setIsBeautified] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { startElementSelection } = useElementSelector(onAddContext);

  const startSelection = async () => {
    if (browser) {
      const contextItem = await sentMessageToApp("selectElement");
      onAddContext(contextItem);
    } else {
      startElementSelection();
    }
  };

  const querySelector = async () => {
    if (browser) {
      const result = await sentMessageToApp("select", {
        selector: "body",
        url: "http://127.0.0.1:8080/portfolio.html",
      });
      console.log(result);
    }
  };

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Force browser to recalculate layout
      textarea.style.height = "auto";
      // Force reflow to ensure accurate scrollHeight
      void textarea.offsetHeight;
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 300;
      const newHeight = Math.min(scrollHeight, maxHeight);
      textarea.style.height = `${newHeight}px`;
      textarea.style.overflowY = scrollHeight > maxHeight ? "auto" : "hidden";
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [adjustTextareaHeight]);

  // Track if user has edited the message to prevent overriding user input
  const userHasEditedRef = useRef(false);
  const lastInitialMessageRef = useRef<string | undefined>(undefined);
  const lastChatIdRef = useRef<string | undefined>(chatId);

  // Handle initialMessage prop - only apply if it's new and user hasn't edited
  useEffect(() => {
    if (
      initialMessage &&
      initialMessage !== lastInitialMessageRef.current &&
      !userHasEditedRef.current
    ) {
      setMessage(initialMessage);
      setIsBeautified(false);
      lastInitialMessageRef.current = initialMessage;
      userHasEditedRef.current = false; // Reset edit flag for new suggestion
      // Use requestAnimationFrame to ensure DOM has updated before adjusting height
      requestAnimationFrame(() => {
        adjustTextareaHeight();
      });
    }
  }, [initialMessage, adjustTextareaHeight]);

  const beautifyText = useCallback(() => {
    if (!message.trim()) return;

    try {
      setOriginalText(message);
      setBeautifierPrompt(message);
      beautify();
    } catch (error) {
      console.error("Error starting beautification:", error);
    }
  }, [message, setBeautifierPrompt, beautify]);

  const handleStopBeautify = useCallback(() => {
    try {
      if (stopBeautify) {
        stopBeautify();
      }
      if (originalText) {
        setMessage(originalText);
      }
      setIsBeautified(false);
      // Adjust height after reverting to original text
      requestAnimationFrame(() => {
        adjustTextareaHeight();
      });
    } catch (error) {
      console.error("Error stopping beautification:", error);
    }
  }, [stopBeautify, originalText, adjustTextareaHeight]);

  const handleUndo = useCallback(() => {
    try {
      if (originalText) {
        setMessage(originalText);
      }
      setIsBeautified(false);
      if (clearBeautifier) {
        clearBeautifier();
      }
      // Adjust height after undoing beautification
      requestAnimationFrame(() => {
        adjustTextareaHeight();
      });
    } catch (error) {
      console.error("Error undoing beautification:", error);
    }
  }, [originalText, clearBeautifier, adjustTextareaHeight]);

  const handleSend = useCallback(() => {
    if (message.trim() && !isResponding && !isBeautifying) {
      onSendMessage(message);
      setMessage("");
      setIsBeautified(false);
      if (clearBeautifier) {
        clearBeautifier();
      }
      userHasEditedRef.current = false; // Reset edit flag after sending
      // Reset textarea height after clearing message
      requestAnimationFrame(() => {
        adjustTextareaHeight();
      });
    }
  }, [
    message,
    isResponding,
    isBeautifying,
    onSendMessage,
    adjustTextareaHeight,
    clearBeautifier,
  ]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (
        e.key === "Enter" &&
        !e.shiftKey &&
        !isResponding &&
        !isLoading &&
        !isBeautifying
      ) {
        e.preventDefault();
        handleSend();
      }
    },
    [isResponding, isLoading, isBeautifying, handleSend]
  );

  const handlePlusClick = useCallback(() => {
    if (plusButtonRef.current && !isLoading && !isBeautifying) {
      setDropdownPosition({
        top: -250,
        left: 0,
      });
    }
    if (!isLoading && !isBeautifying) {
      setIsDropdownOpen(!isDropdownOpen);
    }
  }, [isLoading, isBeautifying, isDropdownOpen]);

  const handleDropdownClose = useCallback(() => {
    setIsDropdownOpen(false);
  }, []);

  const handleFileSelect = useCallback(
    async (file: File) => {
      const fileData = await readFileContent(file);
      onAddContext({
        name: file.name,
        type: "file",
        data: fileData.content,
        mimeType: fileData.mimeType,
        isBinary: fileData.isBinary,
      });
      setIsDropdownOpen(false);
    },
    [onAddContext]
  );

  const triggerFileUpload = useCallback(() => {
    if (fileInputRef.current && !isLoading && !isBeautifying) {
      fileInputRef.current.click();
    }
  }, [isLoading, isBeautifying]);

  const runnerProcesses = useRunnerProcesses();

  const dropdownItems = createDropdownItems(
    startSelection,
    triggerFileUpload,
    onAddContext,
    runnerProcesses
  );

  const handleDropdownSelect = useCallback(
    (item: {
      id: string;
      label: string;
      type: string;
      action?: () => void;
    }) => {
      if (item.action) {
        return;
      }
      onAddContext({
        name: item.label,
        type: item.type.toLowerCase(),
      });
    },
    [onAddContext]
  );

  const showBeautifyButton = message.length > 10;

  const isButtonEnabled = useCallback(
    (buttonId: string) => {
      const button = effectiveButtonConfig?.find((b) => b.id === buttonId);
      return button ? button.enabled : false;
    },
    [effectiveButtonConfig]
  );

  // Update message when beautifier result changes
  useEffect(() => {
    if (hasBeautifierResult && beautifierResult) {
      setMessage(beautifierResult);
      setIsBeautified(true);
      // Use double requestAnimationFrame to ensure DOM has fully updated
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          adjustTextareaHeight();
        });
      });
    }
  }, [hasBeautifierResult, beautifierResult, adjustTextareaHeight]);

  // Handle beautifier errors
  useEffect(() => {
    if (beautifierError) {
      console.error("Failed to beautify text:", beautifierError);
      // Revert to original text on error
      if (originalText) {
        setMessage(originalText);
      }
      setIsBeautified(false);
    }
  }, [beautifierError, originalText]);

  // Clean beautifier when chat changes
  // This ensures that when a user switches to another chat, the beautifier state is reset
  // preventing beautified text from carrying over to different conversations
  useEffect(() => {
    if (chatId && chatId !== lastChatIdRef.current) {
      // Clear beautifier state
      if (clearBeautifier) {
        clearBeautifier();
      }

      // Reset local state
      setIsBeautified(false);
      setOriginalText("");

      // Update the ref to track the new chat
      lastChatIdRef.current = chatId;

      // Reset user edit flag for new chat
      userHasEditedRef.current = false;
    }
  }, [chatId, clearBeautifier]);

  const getButtonTooltip = useCallback(
    (buttonId: string) => {
      const button = effectiveButtonConfig?.find((b) => b.id === buttonId);
      return button ? (button.tooltip as string) : "";
    },
    [effectiveButtonConfig]
  );

  return (
    <InputContainer
      style={{
        opacity: isLoading || isBeautifying ? 0.7 : 1,
        position: "relative",
      }}
    >
      {(isLoading || isBeautifying) && <LoadingLine />}
      <InputWrapper>
        <InputControls>
          <StyledInput
            ref={textareaRef}
            placeholder={
              isResponding ? "AI is responding..." : "Message the agent..."
            }
            value={message}
            onChange={useCallback(
              (e: React.ChangeEvent<HTMLTextAreaElement>) => {
                setMessage(e.target.value);
                userHasEditedRef.current = true; // Mark that user has edited
                adjustTextareaHeight();
              },
              [adjustTextareaHeight]
            )}
            onKeyDown={handleKeyDown}
            disabled={isResponding || isLoading || isBeautifying}
          />
          <ButtonsRow>
            {isButtonEnabled("add-context") && (
              <div ref={plusButtonRef}>
                <Tooltip
                  text={getButtonTooltip("add-context")}
                  position="top"
                  delay={500}
                >
                  <RoundedIconButton
                    onClick={handlePlusClick}
                    disabled={isResponding || isLoading || isBeautifying}
                    aria-label="Add context"
                  >
                    <PlusIcon />
                  </RoundedIconButton>
                </Tooltip>
              </div>
            )}
            {isButtonEnabled("select-element") && (
              <Tooltip
                text={getButtonTooltip("select-element")}
                position="top"
                delay={500}
              >
                <RoundedIconButton
                  onClick={startSelection}
                  disabled={isResponding || isLoading || isBeautifying}
                  aria-label="Select element"
                >
                  <PointerIcon />
                </RoundedIconButton>
              </Tooltip>
            )}
            {isButtonEnabled("upload-file") && (
              <Tooltip
                text={getButtonTooltip("upload-file")}
                position="top"
                delay={500}
              >
                <RoundedIconButton
                  onClick={triggerFileUpload}
                  disabled={isResponding || isLoading || isBeautifying}
                  aria-label="Upload file"
                >
                  <ClipIcon />
                </RoundedIconButton>
              </Tooltip>
            )}
            <AnimatedButton isVisible={showBeautifyButton}>
              <Tooltip
                text={
                  isBeautifying
                    ? "Stop beautify"
                    : isBeautified
                    ? "Undo beautify"
                    : "Beautify text"
                }
                position="top"
                delay={500}
              >
                <RoundedIconButton
                  onClick={
                    isBeautifying
                      ? handleStopBeautify
                      : isBeautified
                      ? handleUndo
                      : beautifyText
                  }
                  disabled={isBeautifying}
                  aria-label={
                    isBeautifying
                      ? "Stop beautify"
                      : isBeautified
                      ? "Undo beautify"
                      : "Beautify text"
                  }
                >
                  {isBeautifying ? (
                    <StopIcon />
                  ) : isBeautified ? (
                    <UndoIcon />
                  ) : (
                    <BeautifyIcon />
                  )}
                </RoundedIconButton>
              </Tooltip>
            </AnimatedButton>
            <DropdownMenu
              items={dropdownItems}
              isOpen={
                isDropdownOpen && !isResponding && !isLoading && !isBeautifying
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
          disabled={isLoading || isBeautifying}
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
