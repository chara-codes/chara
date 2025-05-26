"use client"

import React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import CommandTerminal from "../command-terminal"
import FileDiffComponent from "../file-diff"
import FileChangesList from "../file-changes-list"
import type { MessageBubbleProps } from "./types"
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
  InstructionSection,
  InstructionHeader,
  InstructionList,
  InstructionItem,
  TabsContainer,
  Tab,
  TabContent,
  DeleteButton,
} from "./styles"
import { getPreviewContent } from "./utils"
import type { FileDiff } from "../../../store/types"
import styled from "styled-components" // Import styled-components

// New styled components for the inline context details
const ContextDetailsPanel = styled.div`
  margin-top: 8px;
  width: 100%;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  animation: slideDown 0.2s ease-out;
  
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`

const ContextDetailHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background-color: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
`

const ContextDetailTitle = styled.div`
  font-weight: 500;
  font-size: 14px;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 6px;
`

const ContextDetailType = styled.span`
  font-size: 11px;
  color: #6b7280;
  font-weight: normal;
  background-color: #e5e7eb;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: capitalize;
`

const ContextDetailContent = styled.div`
  padding: 12px;
  font-size: 13px;
  line-height: 1.5;
  color: #4b5563;
  max-height: 300px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-word;
  
  code, pre {
    font-family: monospace;
    background-color: #e5e7eb;
    padding: 2px 4px;
    border-radius: 4px;
    font-size: 12px;
  }
  
  pre {
    padding: 8px;
    overflow-x: auto;
    margin: 8px 0;
  }
  
  strong {
    color: #374151;
  }
`

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background-color: #e5e7eb;
    color: #4b5563;
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
  }
`

const CloseIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
)

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
  // Replace tooltip state with expanded context state
  const [expandedContextId, setExpandedContextId] = useState<string | null>(null)
  const [selectedDiff, setSelectedDiff] = useState<FileDiff | null>(null)
  const [activeTab, setActiveTab] = useState<"commands" | "diffs">("diffs")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const contextPanelRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const hasContext = contextItems && contextItems.length > 0
  const hasFilesToChange = filesToChange && filesToChange.length > 0
  const hasCommandsToExecute = commandsToExecute && commandsToExecute.length > 0
  const hasExecutedCommands = executedCommands !== undefined && executedCommands.length > 0
  const hasFileDiffs = fileDiffs !== undefined && fileDiffs.length > 0
  const hasGenerationDetails = hasExecutedCommands || hasFileDiffs

  // Set default tab based on available content
  useEffect(() => {
    if (activeTab === "diffs" && !hasFileDiffs) {
      if (hasExecutedCommands) {
        setActiveTab("commands")
      }
    }
  }, [activeTab, hasFileDiffs, hasExecutedCommands])

  // Handle click outside to close expanded context
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contextPanelRef.current &&
        !contextPanelRef.current.contains(event.target as Node) &&
        expandedContextId !== null
      ) {
        // Check if the click was on a context item
        let clickedOnContextItem = false
        itemRefs.current.forEach((itemEl) => {
          if (itemEl.contains(event.target as Node)) {
            clickedOnContextItem = true
          }
        })

        // Only close if not clicked on a context item
        if (!clickedOnContextItem) {
          setExpandedContextId(null)
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [expandedContextId])

  const handleContextItemClick = (itemId: string) => {
    setExpandedContextId((prevId) => (prevId === itemId ? null : itemId))
  }

  const handleCloseContextDetails = () => {
    setExpandedContextId(null)
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

  // Find the expanded context item
  const expandedContextItem = expandedContextId ? contextItems?.find((item) => item.id === expandedContextId) : null

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
                <ContextItemWrapper key={item.id}>
                  <ContextItemComponent
                    ref={(el) => {
                      if (el) itemRefs.current.set(item.id, el)
                    }}
                    isUser={isUser}
                    onClick={() => handleContextItemClick(item.id)}
                    style={{
                      backgroundColor: expandedContextId === item.id ? (isUser ? "#e5e7eb" : "#d1d5db") : undefined,
                    }}
                  >
                    {getIcon(item.type)}
                    {item.name}
                  </ContextItemComponent>
                </ContextItemWrapper>
              ))}
            </ContextContainer>

            {/* Expanded context details panel */}
            {expandedContextItem && (
              <ContextDetailsPanel ref={contextPanelRef}>
                <ContextDetailHeader>
                  <ContextDetailTitle>
                    {getIcon(expandedContextItem.type)}
                    {expandedContextItem.name}
                    <ContextDetailType>{expandedContextItem.type}</ContextDetailType>
                  </ContextDetailTitle>
                  <CloseButton onClick={handleCloseContextDetails} title="Close">
                    <CloseIcon />
                  </CloseButton>
                </ContextDetailHeader>
                <ContextDetailContent>{getPreviewContent(expandedContextItem)}</ContextDetailContent>
              </ContextDetailsPanel>
            )}
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
