"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import {
  SearchIcon,
  FileIcon,
  DocumentIcon,
  TerminalIcon,
  UploadIcon,
  PointerIcon,
} from "../atoms/icons";

interface DropdownItem {
  id: string;
  label: string;
  type: string;
  action?: () => void;
}

interface DropdownMenuProps {
  items: DropdownItem[];
  isOpen: boolean;
  onClose: () => void;
  position?: { top: number; left: number };
  onSelect: (item: DropdownItem) => void;
}

const DropdownContainer = styled.div<{
  position?: { top: number; left: number };
}>`
  position: absolute;
  top: ${(props) => (props.position ? `${props.position.top}px` : "100%")};
  left: ${(props) => (props.position ? `${props.position.left}px` : "0")};
  background-color: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  z-index: 10;
  width: 240px;
  max-height: 350px;
  display: flex;
  flex-direction: column;
`;

const SearchContainer = styled.div`
  padding: 8px;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  background-color: #fff;
  z-index: 1;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 6px 8px 6px 28px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 12px;
  outline: none;

  &:focus {
    border-color: #2563eb;
  }
`;

const SearchIconWrapper = styled.div`
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
`;

const DropdownContent = styled.div`
  overflow-y: auto;
  max-height: 300px;
`;

const GroupHeader = styled.div`
  padding: 8px 12px;
  font-weight: 500;
  color: #6b7280;
  background-color: #f9fafb;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  position: sticky;
  top: 0;
  z-index: 1;
`;

const DropdownItemStyled = styled.div`
  padding: 8px 12px;
  font-size: 13px;
  color: #333;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background-color: #f3f4f6;
  }
`;

const NoResults = styled.div`
  padding: 12px;
  text-align: center;
  color: #6b7280;
  font-style: italic;
`;

const DropdownMenu: React.FC<DropdownMenuProps> = ({
  items,
  isOpen,
  onClose,
  position,
  onSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Focus search input when dropdown opens
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 10);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter items based on search query
  const filteredItems = items.filter(
    (item) =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Group items by type
  const groupedItems = filteredItems.reduce(
    (groups, item) => {
      const type = item.type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(item);
      return groups;
    },
    {} as Record<string, DropdownItem[]>,
  );

  // Sort groups by type name
  const sortedGroups = Object.entries(groupedItems).sort(([typeA], [typeB]) =>
    typeA.localeCompare(typeB),
  );

  const handleItemClick = (item: DropdownItem) => {
    if (item.action) {
      item.action();
    }
    onSelect(item);
    onClose();
  };

  // Helper function to render the appropriate icon based on item type and label
  const getItemIcon = (item: DropdownItem) => {
    if (item.type === "File") {
      return <FileIcon />;
    }
    if (item.type === "Documentation") {
      return <DocumentIcon />;
    }
    if (item.type === "Terminal") {
      return <TerminalIcon />;
    }
    if (item.type === "Actions") {
      if (item.label.includes("Upload")) {
        return <UploadIcon />;
      }
      if (item.label.includes("Select Element")) {
        return <PointerIcon width={16} />;
      }
    }
    return null;
  };

  return (
    <DropdownContainer ref={dropdownRef} position={position}>
      <SearchContainer>
        <SearchInput
          ref={searchInputRef}
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <SearchIconWrapper>
          <SearchIcon />
        </SearchIconWrapper>
      </SearchContainer>
      <DropdownContent>
        {sortedGroups.length > 0 ? (
          sortedGroups.map(([type, items]) => (
            <div key={type}>
              <GroupHeader>{type}</GroupHeader>
              {items.map((item) => (
                <DropdownItemStyled
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                >
                  {getItemIcon(item)}
                  {item.label}
                </DropdownItemStyled>
              ))}
            </div>
          ))
        ) : (
          <NoResults>No results found</NoResults>
        )}
      </DropdownContent>
    </DropdownContainer>
  );
};

export default DropdownMenu;
