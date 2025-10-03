"use client"

import type React from "react"
import styled from "styled-components"
import Button from "../atoms/button"
import { ArrowLeftIcon, SearchIcon } from "../atoms/icons"

interface ViewNavigationProps {
  onBack: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
  placeholder?: string
  showSearch?: boolean
  leftElement?: React.ReactNode
  rightElement?: React.ReactNode
  centerElement?: React.ReactNode
}

const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  background-color: ${props => props.theme.colors.backgroundSecondary};
  transition: background-color ${props => props.theme.transitions.theme},
              border-color ${props => props.theme.transitions.theme};
`

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  min-width: 80px;
`

const CenterSection = styled.div`
  display: flex;
  flex: 1;
  width: 100%;
  justify-content: center;
  align-items: center;
`

const RightSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 80px;
`

const BackButton = styled(Button)`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  padding: 4px 10px;
  background-color: transparent;
  color: ${props => props.theme.colors.text};
  border: none;
  transition: background-color ${props => props.theme.transitions.theme},
              color ${props => props.theme.transitions.theme};
  
  &:hover {
    background-color: ${props => props.theme.colors.highlight};
  }
`

const SearchContainer = styled.div`
  position: relative;
  width: 100%;
  margin: 0 12px;
`

const SearchInput = styled.input`
  width: 100%;
  padding: 6px 10px 6px 32px;
  border-radius: 6px;
  border: 1px solid ${props => props.theme.colors.border};
  font-size: 13px;
  background-color: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  transition: background-color ${props => props.theme.transitions.theme},
              border-color ${props => props.theme.transitions.theme},
              color ${props => props.theme.transitions.theme};
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    background-color: ${props => props.theme.colors.backgroundSecondary};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.primaryLight};
  }

  &::placeholder {
    color: ${props => props.theme.colors.textSecondary};
  }
`

const SearchIconWrapper = styled.div`
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.theme.colors.textSecondary};
  transition: color ${props => props.theme.transitions.theme};
`

const ViewNavigation: React.FC<ViewNavigationProps> = ({
  onBack,
  searchQuery,
  onSearchChange,
  placeholder = "Search...",
  showSearch = true,
  leftElement,
  rightElement,
  centerElement,
}) => {
  return (
    <HeaderContainer>
      <LeftSection>
        {leftElement || (
          <BackButton onClick={onBack}>
            <ArrowLeftIcon width={16} height={16} />
            Back
          </BackButton>
        )}
      </LeftSection>

      <CenterSection>
        {centerElement ||
          (showSearch && (
            <SearchContainer>
              <SearchIconWrapper>
                <SearchIcon width={16} height={16} />
              </SearchIconWrapper>
              <SearchInput
                type="text"
                placeholder={placeholder}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </SearchContainer>
          ))}
      </CenterSection>

      <RightSection>{rightElement}</RightSection>
    </HeaderContainer>
  )
}

export default ViewNavigation
