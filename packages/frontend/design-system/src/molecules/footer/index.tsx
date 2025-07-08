"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { ChevronDownIcon, SearchIcon, StarIcon } from "../../atoms/icons";
import {
  FooterContainer,
  ModeSelector,
  ModeButton,
  ModelSelectorContainer,
  ModelSelectorButton,
  DropdownContainer,
  SearchContainer,
  SearchInput,
  SearchIconWrapper,
  ProviderGroup,
  ProviderHeader,
  ModelOption,
  NoResults,
  ModelInfo,
  SourceBadge,
  ModelOptionContent,
} from "./styles";
import { getModelSourceType } from "./utils";
import { useChatStore, useModelsStore } from "@apk/core";

/**
 * Footer component with mode selector and model selector
 */
const Footer: React.FC = () => {
  const { mode, model, setMode, setModel } = useChatStore();
  const { models, addRecentModel } = useModelsStore();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Get the selected model info for display
  const getSelectedModelInfo = () => {
    const foundModel = models.find((m) => m.id === model);
    if (foundModel) {
      const sourceType = getModelSourceType(foundModel.provider);
      return {
        name: foundModel.name,
        sourceType,
        provider: foundModel.provider,
      };
    }
    return { name: model, sourceType: "unknown", provider: "unknown" };
  };

  // Separate recommended models from others
  const recommendedModels = models.filter((model) => model.recommended);
  const otherModels = models.filter((model) => !model.recommended);

  // Group other models by provider
  const groupedOtherModels = otherModels.reduce(
    (acc, model) => {
      if (!acc[model.provider]) {
        acc[model.provider] = [];
      }
      acc[model.provider].push(model);
      return acc;
    },
    {} as Record<string, typeof models>,
  );

  // Filter recommended models based on search query (no provider grouping)
  const filteredRecommendedModels = recommendedModels.filter(
    (model) =>
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.provider.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Filter other models based on search query
  const filteredOtherModels = Object.entries(groupedOtherModels)
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

  const selectedModel = getSelectedModelInfo();

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
            {selectedModel.name}
            <SourceBadge $sourceType={selectedModel.sourceType}>
              {selectedModel.provider}
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
                <SearchIcon width={14} height={14} />
              </SearchIconWrapper>
            </SearchContainer>

            {filteredRecommendedModels.length > 0 ||
            filteredOtherModels.length > 0 ? (
              <>
                {filteredRecommendedModels.length > 0 && (
                  <>
                    <ProviderGroup>
                      <ProviderHeader>
                        <StarIcon width={14} height={14} /> Recommended
                      </ProviderHeader>
                      {filteredRecommendedModels.map((modelOption) => (
                        <ModelOption
                          key={modelOption.id}
                          $selected={model === modelOption.id}
                          onClick={() => handleModelChange(modelOption.id)}
                        >
                          <ModelOptionContent>
                            <span>{modelOption.name}</span>
                            <span>
                              <SourceBadge
                                $sourceType={getModelSourceType(
                                  modelOption.provider,
                                )}
                              >
                                {modelOption.provider}
                              </SourceBadge>
                            </span>
                          </ModelOptionContent>
                        </ModelOption>
                      ))}
                    </ProviderGroup>
                    {filteredOtherModels.length > 0 && (
                      <div style={{ height: "8px" }} />
                    )}
                  </>
                )}
                {filteredOtherModels.map((provider) => (
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
                          <span>
                            <SourceBadge
                              $sourceType={getModelSourceType(
                                modelOption.provider,
                              )}
                            >
                              {modelOption.provider}
                            </SourceBadge>
                          </span>
                        </ModelOptionContent>
                      </ModelOption>
                    ))}
                  </ProviderGroup>
                ))}
              </>
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
