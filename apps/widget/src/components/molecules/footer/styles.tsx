import styled from "styled-components"

// Footer container
export const FooterContainer = styled.footer`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  border-top: 1px solid #e5e7eb;
  background-color: #fff;
`

// Mode selector
export const ModeSelector = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

export const ModeButton = styled.button<{ $active: boolean }>`
  padding: 4px 8px;
  border-radius: 4px;
  border: none;
  background-color: ${(props) => (props.$active ? "#f3f4f6" : "transparent")};
  color: ${(props) => (props.$active ? "#333" : "#6b7280")};
  font-size: 12px;
  cursor: pointer;
  
  &:hover {
    background-color: ${(props) => (props.$active ? "#f3f4f6" : "#f9fafb")};
  }
`

// Model selector
export const ModelSelectorContainer = styled.div`
  position: relative;
  font-size: 12px;
`

export const ModelSelectorButton = styled.button`
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
  background-color: #fff;
  color: #333;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  
  &:hover {
    background-color: #f9fafb;
  }
`

export const ModelInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`

export const SourceBadge = styled.span<{ $sourceType: string }>`
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 500;
  background-color: ${(props) => {
    switch (props.$sourceType) {
      case "unified":
        return "#e0e7ff" // Purple for unified services
      case "native":
        return "#dbeafe" // Blue for native services
      case "local":
        return "#dcfce7" // Green for local services
      default:
        return "#f3f4f6" // Gray for unknown
    }
  }};
  color: ${(props) => {
    switch (props.$sourceType) {
      case "unified":
        return "#5b21b6"
      case "native":
        return "#1d4ed8"
      case "local":
        return "#166534"
      default:
        return "#6b7280"
    }
  }};
`

// Dropdown
export const DropdownContainer = styled.div`
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 4px;
  width: 240px;
  background-color: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  z-index: 50;
  max-height: 300px;
  overflow-y: auto;
`

export const SearchContainer = styled.div`
  padding: 8px;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  background-color: #fff;
  z-index: 1;
`

export const SearchInput = styled.input`
  width: 100%;
  padding: 6px 8px 6px 28px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 12px;
  outline: none;
  
  &:focus {
    border-color: #2563eb;
  }
`

export const SearchIconWrapper = styled.div`
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
`

// Provider groups
export const ProviderGroup = styled.div`
  padding: 0;
`

export const ProviderHeader = styled.div`
  padding: 8px 12px;
  font-weight: 500;
  color: #6b7280;
  background-color: #f9fafb;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`

// Model options
export const ModelOption = styled.div<{ $selected: boolean }>`
  padding: 8px 12px;
  cursor: pointer;
  
  ${(props) =>
    props.$selected &&
    `
    background-color: #e5e7eb;
    font-weight: 500;
  `}
  
  &:hover {
    background-color: ${(props) => (props.$selected ? "#e5e7eb" : "#f3f4f6")};
  }
`

export const ModelOptionContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`

export const NoResults = styled.div`
  padding: 12px;
  text-align: center;
  color: #6b7280;
  font-style: italic;
`
