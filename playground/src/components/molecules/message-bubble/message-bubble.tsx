"use client"

import React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import CommandTerminal from "../command-terminal"
import FileDiffComponent from "../file-diff"
import FileChangesList from "../file-changes-list"
import type { MessageBubbleProps, TooltipPosition } from "./types"
import {
  FileIcon,
  LinkIcon,
  TextIcon,
  DocumentationIcon,
  TerminalIcon,
  FilesIcon,
  CommandsIcon,
  TrashIcon,
} from "./icons"
import {
  BubbleContainer,
  Bubble,
  MessageContent,
  Time,
  ContextContainer,
  ContextItemComponent,
  ContextLabel,
  ContextItemWrapper,
  ContextPreviewTooltip,
  PreviewHeader,
  PreviewContent,
  PreviewType,
  InstructionSection,
  InstructionHeader,
  InstructionList,
  InstructionItem,
  TabsContainer,
  Tab,
  TabContent,
  DeleteButton,
} from "./styles"
import { getPreviewContent, calculateTooltipPosition } from "./utils"

const MessageBubble: React.FC<MessageBubbleProps> = ({
  id,
  content,
  isUser,
  timestamp,
  contextItems,
  filesToChange,
  commandsToExecute,
  executedCommands,
  fileDiffs,
  onKeepAllDiffs,
  onRevertAllDiffs,
  onKeepDiff,
  onRevertDiff,
  onDeleteMessage,
}) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({
    top: 0,
    left: 0,
    position: "right",
  })
  const [selectedDiff, setSelectedDiff] = useState<any | null>(null)
  const [activeTab, setActiveTab] = useState<"commands" | "diffs">("diffs")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Set default tab based on available content
  useEffect(() => {
    if (activeTab === "diffs" && !hasFileDiffs) {
      if (hasExecutedCommands) {
        setActiveTab("commands")
      }
    }
  }, [])

  const tooltipRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const chatContainerRef = useRef<HTMLDivElement | null>(null)

  // Find the chat container on mount
  useEffect(() => {
    // Look for the closest scrollable container
    const findScrollableParent = (element: HTMLElement | null): HTMLElement | null => {
      if (!element) return document.documentElement

      const overflowY = window.getComputedStyle(element).overflowY
      const isScrollable = overflowY !== "visible" && overflowY !== "hidden"

      if (isScrollable && element.scrollHeight > element.clientHeight) {
        return element
      }

      return findScrollableParent(element.parentElement)
    }

    if (itemRefs.current.size > 0) {
      const firstItem = itemRefs.current.values().next().value
      if (firstItem) {
        chatContainerRef.current = findScrollableParent(firstItem)
      }
    }
  }, [contextItems])

  const handleMouseEnter = (itemId: string) => {
    const itemElement = itemRefs.current.get(itemId)
    if (itemElement) {
      const position = calculateTooltipPosition(itemElement, chatContainerRef)
      setTooltipPosition(position)
      setActiveTooltip(itemId)
    }
  }

  const handleMouseLeave = () => {
    setActiveTooltip(null)
  }

  const handleDiffSelect = (diffId: string) => {
    const diff = fileDiffs?.find((d) => d.id === diffId) || null
    setSelectedDiff(diff)
  }

  const handleCloseDiff = () => {
    setSelectedDiff(null)
  }

  const handleDeleteClick = useCallback(() => {
    setShowDeleteConfirm(true)
  }, [])

  const handleDeleteConfirm = useCallback(() => {
    if (onDeleteMessage && id) {
      onDeleteMessage(id)
    }
    setShowDeleteConfirm(false)
  }, [onDeleteMessage, id])

  const handleDeleteCancel = useCallback(() => {
    setShowDeleteConfirm(false)
  }, [])

  const getIcon = (type: string) => {
    const lowerType = type.toLowerCase()
    switch (lowerType) {
      case "file":
        return <FileIcon />
      case "link":
        return <LinkIcon />
      case "text":
        return <TextIcon />
      case "documentation":
        return <DocumentationIcon />
      case "terminal":
        return <TerminalIcon />
      default:
        return null
    }
  }

  const hasContext = contextItems && contextItems.length > 0
  const hasFilesToChange = filesToChange && filesToChange.length > 0
  const hasCommandsToExecute = commandsToExecute && commandsToExecute.length > 0
  const hasExecutedCommands = executedCommands !== undefined && executedCommands.length > 0
  const hasFileDiffs = fileDiffs !== undefined && fileDiffs.length > 0
  const hasGenerationDetails = hasExecutedCommands || hasFileDiffs

  // Add these handlers before the return statement
  const handleKeepDiff = useCallback(
    (diffId: string) => {
      if (onKeepDiff) {
        onKeepDiff(diffId)
      }
    },
    [onKeepDiff],
  )

  const handleRevertDiff = useCallback(
    (diffId: string) => {
      if (onRevertDiff) {
        onRevertDiff(diffId)
      }
    },
    [onRevertDiff],
  )

  const handleKeepAllClick = useCallback(() => {
    if (onKeepAllDiffs) {
      onKeepAllDiffs()
    }
  }, [onKeepAllDiffs])

  const handleRevertAllClick = useCallback(() => {
    if (onRevertAllDiffs) {
      onRevertAllDiffs()
    }
  }, [onRevertAllDiffs])

  // Count pending diffs
  const pendingDiffsCount = fileDiffs?.filter((diff) => diff.status === "pending").length || 0

  return (
    <BubbleContainer isUser={isUser}>
      <Bubble isUser={isUser}>
        {isUser && onDeleteMessage && (
          <DeleteButton onClick={handleDeleteClick} title="Delete message and all subsequent messages">
            <TrashIcon />
          </DeleteButton>
        )}

        {showDeleteConfirm && (
          <div
            style={{
              position: "absolute",
              top: "0",
              right: "40px",
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "4px",
              padding: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              zIndex: 10,
            }}
          >
            <p style={{ margin: "0 0 8px 0", fontSize: "12px" }}>
              Delete this message and all subsequent messages? All changes will roll back.
            </p>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button
                onClick={handleDeleteCancel}
                style={{
                  padding: "4px 8px",
                  fontSize: "12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "4px",
                  background: "white",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                style={{
                  padding: "4px 8px",
                  fontSize: "12px",
                  border: "1px solid #ef4444",
                  borderRadius: "4px",
                  background: "#ef4444",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        )}

        <MessageContent>{content}</MessageContent>

        {hasContext && (
          <>
            <ContextContainer isUser={isUser}>
              <ContextLabel isUser={isUser}>Using context:</ContextLabel>
              {contextItems.map((item) => (
                <ContextItemWrapper
                  key={item.id}
                  onMouseEnter={() => handleMouseEnter(item.id)}
                  onMouseLeave={handleMouseLeave}
                >
                  <ContextItemComponent
                    ref={(el) => {
                      if (el) itemRefs.current.set(item.id, el)
                    }}
                    isUser={isUser}
                  >
                    {getIcon(item.type)}
                    {item.name}
                  </ContextItemComponent>

                  {/* Render the active tooltip */}
                  {activeTooltip === item.id && (
                    <ContextPreviewTooltip
                      key={`tooltip-${item.id}`}
                      ref={tooltipRef}
                      position={tooltipPosition.position}
                      style={{
                        top: `${tooltipPosition.top}px`,
                        left: `${tooltipPosition.left}px`,
                        transform:
                          tooltipPosition.position === "top" || tooltipPosition.position === "bottom"
                            ? "translateX(-50%)"
                            : "translateY(-50%)",
                      }}
                    >
                      <PreviewHeader>
                        {item.name}
                        <PreviewType>{item.type}</PreviewType>
                      </PreviewHeader>
                      <PreviewContent>{getPreviewContent(item)}</PreviewContent>
                    </ContextPreviewTooltip>
                  )}
                </ContextItemWrapper>
              ))}
            </ContextContainer>
          </>
        )}

        {/* Files to Change Section */}
        {!isUser && hasFilesToChange && !hasGenerationDetails && (
          <InstructionSection>
            <InstructionHeader>
              <FilesIcon />
              Files to Change
            </InstructionHeader>
            <InstructionList>
              {filesToChange.map((file, index) => (
                <InstructionItem key={index}>{file}</InstructionItem>
              ))}
            </InstructionList>
          </InstructionSection>
        )}

        {/* Commands to Execute Section */}
        {!isUser && hasCommandsToExecute && !hasGenerationDetails && (
          <InstructionSection>
            <InstructionHeader>
              <CommandsIcon />
              Commands to Execute
            </InstructionHeader>
            <InstructionList>
              {commandsToExecute.map((command, index) => (
                <InstructionItem key={index}>$ {command}</InstructionItem>
              ))}
            </InstructionList>
          </InstructionSection>
        )}

        {/* Generation Details Section with Tabs */}
        {!isUser && hasGenerationDetails && (
          <InstructionSection>
            {/* Only show tabs if both types of content are present */}
            {hasFileDiffs && hasExecutedCommands ? (
              <>
                <TabsContainer>
                  <Tab $active={activeTab === "diffs"} onClick={() => setActiveTab("diffs")}>
                    <FilesIcon />
                    Files
                  </Tab>
                  <Tab $active={activeTab === "commands"} onClick={() => setActiveTab("commands")}>
                    <TerminalIcon />
                    Commands
                  </Tab>
                </TabsContainer>

                <TabContent>
                  {activeTab === "commands" && hasExecutedCommands && <CommandTerminal commands={executedCommands} />}
                  {activeTab === "diffs" && hasFileDiffs && (
                    <FileChangesList
                      diffs={fileDiffs}
                      onSelectDiff={handleDiffSelect}
                      onKeepAll={pendingDiffsCount > 0 ? handleKeepAllClick : undefined}
                      onRevertAll={pendingDiffsCount > 0 ? handleRevertAllClick : undefined}
                    />
                  )}
                </TabContent>
              </>
            ) : (
              /* Show content directly without tabs if only one type is present */
              <TabContent>
                {hasExecutedCommands && (
                  <>
                    <InstructionHeader>
                      <TerminalIcon />
                      Commands
                    </InstructionHeader>
                    <CommandTerminal commands={executedCommands} />
                  </>
                )}
                {hasFileDiffs && (
                  <>
                    <InstructionHeader>
                      <FilesIcon />
                      Files
                    </InstructionHeader>
                    <FileChangesList
                      diffs={fileDiffs}
                      onSelectDiff={handleDiffSelect}
                      onKeepAll={pendingDiffsCount > 0 ? handleKeepAllClick : undefined}
                      onRevertAll={pendingDiffsCount > 0 ? handleRevertAllClick : undefined}
                    />
                  </>
                )}
              </TabContent>
            )}

            {/* File Diff Preview */}
            {selectedDiff && (
              <FileDiffComponent
                diff={selectedDiff}
                isVisible={hasFileDiffs}
                onClose={handleCloseDiff}
                onKeep={handleKeepDiff}
                onRevert={handleRevertDiff}
              />
            )}
          </InstructionSection>
        )}
      </Bubble>

      {timestamp && <Time>{timestamp}</Time>}
    </BubbleContainer>
  )
}

export default React.memo(MessageBubble)
