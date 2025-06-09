"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { useChatStore, useModelsStore } from '@frontend/core';

// Make the footer more compact
const FooterContainer = styled.footer`
  all: revert;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  border-top: 1px solid #e5e7eb;
  background-color: #fff;
`;

const ModeSelector = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ModeButton = styled.button<{ $active: boolean }>`
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
`;

const ModelSelectorContainer = styled.div`
  position: relative;
  font-size: 12px;
`;

const ModelSelectorButton = styled.button`
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
`;

const ChevronDownIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6 9L12 15L18 9"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SearchIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const DropdownContainer = styled.div`
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 4px;
  width: 240px;
  background-color: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  z-index: 50;
  max-height: 300px;
  overflow-y: auto;
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

const ProviderGroup = styled.div`
  padding: 0;
`;

const ProviderHeader = styled.div`
  padding: 8px 12px;
  font-weight: 500;
  color: #6b7280;
  background-color: #f9fafb;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const ModelOption = styled.div<{ $selected: boolean }>`
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
`;

const NoResults = styled.div`
  padding: 12px;
  text-align: center;
  color: #6b7280;
  font-style: italic;
`;

const ModelInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const SourceBadge = styled.span<{ $sourceType: string }>`
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 500;
  background-color: ${(props) => {
    switch (props.$sourceType) {
      case "unified":
        return "#e0e7ff"; // Purple for unified services
      case "native":
        return "#dbeafe"; // Blue for native services
      case "local":
        return "#dcfce7"; // Green for local services
      default:
        return "#f3f4f6"; // Gray for unknown
    }
  }};
  color: ${(props) => {
    switch (props.$sourceType) {
      case "unified":
        return "#5b21b6";
      case "native":
        return "#1d4ed8";
      case "local":
        return "#166534";
      default:
        return "#6b7280";
    }
  }};
`;

const ModelOptionContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

const getModelSourceType = (provider: string): string => {
  const lowerProvider = provider.toLowerCase();
  if (lowerProvider.includes("openrouter")) return "unified";
  if (["openai", "anthropic", "mistral", "together"].includes(lowerProvider))
    return "native";
  if (["ollama", "lmstudio"].includes(lowerProvider)) return "local";
  return "unknown";
};

const getSourceLabel = (sourceType: string): string => {
  switch (sourceType) {
    case "unified":
      return "Unified";
    case "native":
      return "Native";
    case "local":
      return "Local";
    default:
      return "Unknown";
  }
};

const Footer: React.FC = () => {
  const { mode, model, setMode, setModel } = useChatStore();
  const { models, addRecentModel } = useModelsStore();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Get the selected model name for display
  const getSelectedModelInfo = () => {
    const foundModel = models.find((m) => m.id === model);
    if (foundModel) {
      const sourceType = getModelSourceType(foundModel.provider);
      return { name: foundModel.name, sourceType };
    }
    return { name: model, sourceType: "unknown" };
  };

  // Group models by provider
  const groupedModels = models.reduce(
    (acc, model) => {
      if (!acc[model.provider]) {
        acc[model.provider] = [];
      }
      acc[model.provider].push(model);
      return acc;
    },
    {} as Record<string, typeof models>,
  );

  // Filter models based on search query
  const filteredModelData = Object.entries(groupedModels)
    .map(([provider, providerModels]) => ({
      provider,
      models: providerModels.filter(
        (model) =>
          model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          provider.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    }))
    .filter((provider) => provider.models.length > 0);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Focus search input when dropdown opens
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 10);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleModelChange = (modelId: string) => {
    setModel(modelId);
    addRecentModel(modelId);
    setIsDropdownOpen(false);
  };

  return (
    <FooterContainer>
      <ModeSelector>
        <ModeButton $active={mode === "write"} onClick={() => setMode("write")}>
          Write
        </ModeButton>
        <ModeButton $active={mode === "ask"} onClick={() => setMode("ask")}>
          Ask
        </ModeButton>
      </ModeSelector>
      <ModelSelectorContainer ref={dropdownRef}>
        <ModelSelectorButton onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
          <ModelInfo>
            {getSelectedModelInfo().name}
            <SourceBadge $sourceType={getSelectedModelInfo().sourceType}>
              {getSourceLabel(getSelectedModelInfo().sourceType)}
            </SourceBadge>
          </ModelInfo>
          <ChevronDownIcon />
        </ModelSelectorButton>

        {isDropdownOpen && (
          <DropdownContainer>
            <SearchContainer>
              <SearchInput
                ref={searchInputRef}
                placeholder="Search models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <SearchIconWrapper>
                <SearchIcon />
              </SearchIconWrapper>
            </SearchContainer>

            {filteredModelData.length > 0 ? (
              filteredModelData.map((provider) => (
                <ProviderGroup key={provider.provider}>
                  <ProviderHeader>{provider.provider}</ProviderHeader>
                  {provider.models.map((modelOption) => (
                    <ModelOption
                      key={modelOption.id}
                      $selected={model === modelOption.id}
                      onClick={() => handleModelChange(modelOption.id)}
                    >
                      <ModelOptionContent>
                        <span>{modelOption.name}</span>
                        <SourceBadge
                          $sourceType={getModelSourceType(modelOption.provider)}
                        >
                          {getSourceLabel(
                            getModelSourceType(modelOption.provider),
                          )}
                        </SourceBadge>
                      </ModelOptionContent>
                    </ModelOption>
                  ))}
                </ProviderGroup>
              ))
            ) : (
              <NoResults>No models found</NoResults>
            )}
          </DropdownContainer>
        )}
      </ModelSelectorContainer>
    </FooterContainer>
  );
};

export default Footer;
