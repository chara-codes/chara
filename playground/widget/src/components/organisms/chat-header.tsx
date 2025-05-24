"use client"

import type React from "react"
import styled from "styled-components"
import type { Theme } from "../../styles/theme"
import { H3 } from "../atoms/typography"
import IconButton from "../atoms/icon-button"
import { CloseIcon, MinimizeIcon } from "../atoms/icons"

interface ChatHeaderProps {
  title: string
  onClose: () => void
  onMinimize?: () => void
}

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => {
    const themeObj = theme as Theme
    return `${themeObj.spacing.sm} ${themeObj.spacing.md}`
  }};
  background-color: ${({ theme }) => (theme as Theme).colors.primary};
  color: white;
  border-radius: ${({ theme }) => {
    const themeObj = theme as Theme
    return `${themeObj.borderRadius.md} ${themeObj.borderRadius.md} 0 0`
  }};
`

const ButtonGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => (theme as Theme).spacing.xs};
`

const StyledIconButton = styled(IconButton)`
  color: white;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`

const ChatHeader: React.FC<ChatHeaderProps> = ({ title, onClose, onMinimize }) => {
  return (
    <Container>
      <H3 color="default">{title}</H3>
      <ButtonGroup>
        {onMinimize && (
          <StyledIconButton onClick={onMinimize} size="sm">
            <MinimizeIcon />
          </StyledIconButton>
        )}
        <StyledIconButton onClick={onClose} size="sm">
          <CloseIcon />
        </StyledIconButton>
      </ButtonGroup>
    </Container>
  )
}

export default ChatHeader
