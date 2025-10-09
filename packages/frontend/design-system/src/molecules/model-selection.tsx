"use client";

import { trpc, useModelSync } from "@chara-codes/core";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { ButtonBase } from "../atoms/form-elements";

interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  contextSize?: number;
  hasTools?: boolean;
  recommended?: boolean;
  approved?: boolean;
}

interface ProviderConfig {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
}

interface ModelSelectionProps {
  provider: ProviderConfig;
  onComplete: () => void;
  onCancel: () => void;
}

const SelectionContainer = styled.div`
  background-color: ${props => props.theme.colors.backgroundSecondary};
  border-radius: 8px;
  box-shadow: ${props => props.theme.shadows.lg};
  overflow: hidden;
`;

const SelectionHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  background-color: ${props => props.theme.colors.background};
`;

const SelectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin: 0 0 8px 0;
`;

const SelectionSubtitle = styled.p`
  font-size: 14px;
  color: ${props => props.theme.colors.textSecondary};
  margin: 0;
`;

const SearchContainer = styled.div`
  padding: 16px 24px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  background-color: ${props => props.theme.colors.background};
  position: relative;
`;

const SearchInputWrapper = styled.div`
  position: relative;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 8px 12px 8px 36px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 6px;
  font-size: 14px;
  background-color: ${props => props.theme.colors.backgroundSecondary};
  color: ${props => props.theme.colors.text};
  outline: none;
  transition: border-color ${props => props.theme.transitions.theme},
              background-color ${props => props.theme.transitions.theme},
              color ${props => props.theme.transitions.theme};

  &:focus {
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primaryLight};
  }

  &::placeholder {
    color: ${props => props.theme.colors.textSecondary};
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.theme.colors.textSecondary};
  pointer-events: none;
`;

const ClearButton = styled.button`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: ${props => props.theme.colors.textSecondary};
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color ${props => props.theme.transitions.theme},
              color ${props => props.theme.transitions.theme};

  &:hover {
    background-color: ${props => props.theme.colors.highlight};
    color: ${props => props.theme.colors.text};
  }
`;

const SelectionContent = styled.div`
  padding: 24px;
  max-height: 450px;
  overflow-y: auto;
`;

const ModelGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const ModelCard = styled.div<{ $selected: boolean; $recommended?: boolean }>`
  border: 2px solid ${(props) => (props.$selected ? props.theme.colors.primary : props.theme.colors.border)};
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all ${props => props.theme.transitions.theme};
  background-color: ${(props) => (props.$selected ? props.theme.colors.primaryLight : props.theme.colors.backgroundSecondary)};
  position: relative;

  ${(props) =>
    props.$recommended &&
    `
    &::before {
      content: "Recommended";
      position: absolute;
      top: -1px;
      right: -1px;
      background-color: ${props.theme.colors.success};
      color: ${props.theme.colors.background};
      font-size: 10px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 0 6px 0 8px;
    }
  `}

  &:hover {
    border-color: ${(props) => (props.$selected ? props.theme.colors.primaryHover : props.theme.colors.borderHover)};
    box-shadow: ${props => props.theme.shadows.sm};
  }
`;

const ModelName = styled.h4`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin: 0 0 8px 0;
`;

const ModelMeta = styled.div`
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: ${props => props.theme.colors.textSecondary};
  margin-bottom: 12px;
`;

const MetaItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const MetaLabel = styled.span`
  font-weight: 500;
`;

const MetaValue = styled.span`
  color: ${props => props.theme.colors.text};
`;

const ModelFeatures = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const FeatureBadge = styled.span<{ $type: "tools" | "context" }>`
  font-size: 10px;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 4px;
  background-color: ${(props) =>
    props.$type === "tools" ? props.theme.colors.primaryLight : props.theme.colors.highlight};
  color: ${(props) => (props.$type === "tools" ? props.theme.colors.primary : props.theme.colors.text)};
  transition: background-color ${props => props.theme.transitions.theme},
              color ${props => props.theme.transitions.theme};
`;

const SelectionActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-top: 1px solid ${props => props.theme.colors.border};
  background-color: ${props => props.theme.colors.background};
`;

const SelectionSummary = styled.div`
  font-size: 14px;
  color: ${props => props.theme.colors.textSecondary};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
`;

const FilteredCount = styled.span`
  color: ${props => props.theme.colors.textSecondary};
  margin-left: 8px;
`;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  color: ${props => props.theme.colors.textSecondary};
`;

const ErrorState = styled.div`
  padding: 16px;
  background-color: ${props => props.theme.colors.errorLight};
  border: 1px solid ${props => props.theme.colors.error};
  border-radius: 6px;
  color: ${props => props.theme.colors.error};
  margin-bottom: 16px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px 24px;
  color: ${props => props.theme.colors.textSecondary};
`;

const ModelSelection: React.FC<ModelSelectionProps> = ({
  provider,
  onComplete,
  onCancel,
}) => {
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set());
  const [isEnabling, setIsEnabling] = useState(false);
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Get model sync service
  const { notifyModelsChanged } = useModelSync();

  // Get currently enabled models
  const enabledModelsConfigQuery =
    trpc.settings.models.getEnabledWithConfig.useQuery();

  // Mutations for enabling/disabling models
  const enableModelMutation = trpc.settings.models.enable.useMutation({
    onSuccess: () => {
      enabledModelsConfigQuery.refetch();
      notifyModelsChanged(); // Notify footer and other components
    },
  });
  const disableModelMutation = trpc.settings.models.disable.useMutation({
    onSuccess: () => {
      enabledModelsConfigQuery.refetch();
      notifyModelsChanged(); // Notify footer and other components
    },
  });

  // Fetch models from the agents service
  useEffect(() => {
    const fetchModels = async () => {
      setIsLoadingModels(true);
      setModelsError(null);

      try {
        const agentsUrl =
          import.meta.env?.VITE_AGENTS_BASE_URL || "http://localhost:3031/";
        const response = await fetch(
          `${agentsUrl}api/models?all&provider=${provider.type}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch models: ${response.statusText}`);
        }

        const responseData = await response.json();
        const modelsData = responseData.models || responseData;

        // Convert to ModelConfig format
        const formattedModels: ModelConfig[] = modelsData.map((model: any) => ({
          id: model.id || `${provider.type}_${model.name}`,
          name: model.name || model.id,
          provider: provider.type,
          contextSize:
            model.contextSize || model.contextLength || model.context_length,
          hasTools: model.hasTools || model.has_tools || false,
          recommended: model.recommended || false,
          approved: model.approved !== false,
        }));

        setModels(formattedModels);
      } catch (error) {
        console.error("Failed to fetch models from agents service:", error);
        setModelsError(
          error instanceof Error ? error.message : "Failed to fetch models"
        );
        setModels([]);
      } finally {
        setIsLoadingModels(false);
      }
    };

    fetchModels();
  }, [provider.type]);

  // Initialize selected models with currently enabled ones from this provider
  useEffect(() => {
    if (models.length > 0 && enabledModelsConfigQuery.data) {
      const providerModelIds = models.map((m) => m.id);
      const providerPrefix = `${provider.type}:::`;
      const enabledModelsConfig = enabledModelsConfigQuery.data;

      // Get enabled model IDs for this provider
      const enabledFromProvider = Object.keys(enabledModelsConfig).filter(
        (id) => {
          // Check if it's a prefixed ID for this provider
          if (id.startsWith(providerPrefix)) {
            const modelId = id.substring(providerPrefix.length);
            return providerModelIds.includes(modelId);
          }
          // Check if it's a non-prefixed ID that matches this provider's models
          return (
            providerModelIds.includes(id) &&
            enabledModelsConfig[id].provider === provider.type
          );
        }
      );

      // Convert to model IDs (remove prefix if present)
      const selectedModelIds = enabledFromProvider.map((id) =>
        id.startsWith(providerPrefix) ? id.substring(providerPrefix.length) : id
      );

      setSelectedModels(new Set(selectedModelIds));
    }
  }, [models, enabledModelsConfigQuery.data, provider.type]);

  // Focus search input when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && searchQuery) {
        e.preventDefault();
        setSearchQuery("");
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [searchQuery]);

  const handleModelToggle = (modelId: string) => {
    setSelectedModels((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(modelId)) {
        newSet.delete(modelId);
      } else {
        newSet.add(modelId);
      }
      return newSet;
    });
  };

  const handleSaveSelection = async () => {
    if (models.length === 0 || !enabledModelsConfigQuery.data) return;

    setIsEnabling(true);
    try {
      const providerModelIds = models.map((m) => m.id);
      const providerPrefix = `${provider.type}:::`;

      // Find currently enabled models from this provider
      const enabledModelsConfig = enabledModelsConfigQuery.data;
      const currentlyEnabledFromProvider = Object.keys(
        enabledModelsConfig
      ).filter((id) => {
        if (id.startsWith(providerPrefix)) {
          const modelId = id.substring(providerPrefix.length);
          return providerModelIds.includes(modelId);
        }
        return (
          providerModelIds.includes(id) &&
          enabledModelsConfig[id].provider === provider.type
        );
      });

      // Note: selectedPrefixedIds would be used if we needed to track them separately

      // Find models to enable (newly selected)
      const currentlyEnabledModelIds = currentlyEnabledFromProvider.map((id) =>
        id.startsWith(providerPrefix) ? id.substring(providerPrefix.length) : id
      );

      const toEnable = Array.from(selectedModels).filter(
        (modelId) => !currentlyEnabledModelIds.includes(modelId)
      );

      // Find models to disable (previously enabled but now unselected)
      const toDisable = currentlyEnabledFromProvider.filter((enabledId) => {
        const modelId = enabledId.startsWith(providerPrefix)
          ? enabledId.substring(providerPrefix.length)
          : enabledId;
        return !selectedModels.has(modelId);
      });

      // Execute enable operations with prefixed IDs
      for (const modelId of toEnable) {
        const prefixedId = `${providerPrefix}${modelId}`;
        await enableModelMutation.mutateAsync({ modelId: prefixedId });
      }

      // Execute disable operations with the original IDs (to handle both prefixed and non-prefixed)
      for (const modelId of toDisable) {
        await disableModelMutation.mutateAsync({ modelId });
      }

      // Notify all subscribers that models have changed
      notifyModelsChanged();
      onComplete();
    } catch (error) {
      console.error("Failed to save model selection:", error);
    } finally {
      setIsEnabling(false);
    }
  };

  const formatContextSize = (size?: number) => {
    if (!size) return "Unknown";
    if (size >= 1000000) return `${(size / 1000000).toFixed(1)}M`;
    if (size >= 1000) return `${(size / 1000).toFixed(0)}K`;
    return size.toString();
  };

  // Filter models based on search query
  const filteredModels = models.filter(
    (model) =>
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoadingModels || enabledModelsConfigQuery.isLoading) {
    return (
      <SelectionContainer>
        <SelectionHeader>
          <SelectionTitle>Loading Models</SelectionTitle>
          <SelectionSubtitle>
            Fetching available models from {provider.name}...
          </SelectionSubtitle>
        </SelectionHeader>
        <LoadingState>Loading models from {provider.name}...</LoadingState>
      </SelectionContainer>
    );
  }

  if (modelsError) {
    return (
      <SelectionContainer>
        <SelectionHeader>
          <SelectionTitle>Error Loading Models</SelectionTitle>
          <SelectionSubtitle>
            Failed to fetch models from {provider.name}
          </SelectionSubtitle>
        </SelectionHeader>
        <SelectionContent>
          <ErrorState>Error: {modelsError}</ErrorState>
          <ActionButtons>
            <ButtonBase $variant="secondary" onClick={onCancel}>
              Cancel
            </ButtonBase>
            <ButtonBase
              $variant="primary"
              onClick={() => window.location.reload()}
            >
              Retry
            </ButtonBase>
          </ActionButtons>
        </SelectionContent>
      </SelectionContainer>
    );
  }

  if (models.length === 0) {
    return (
      <SelectionContainer>
        <SelectionHeader>
          <SelectionTitle>No Models Available</SelectionTitle>
          <SelectionSubtitle>
            No models found for {provider.name}
          </SelectionSubtitle>
        </SelectionHeader>
        <SelectionContent>
          <EmptyState>
            <h3>No models available</h3>
            <p>
              This provider doesn't have any available models or they couldn't
              be loaded.
            </p>
          </EmptyState>
        </SelectionContent>
        <SelectionActions>
          <div></div>
          <ActionButtons>
            <ButtonBase $variant="secondary" onClick={onCancel}>
              Cancel
            </ButtonBase>
            <ButtonBase $variant="primary" onClick={onComplete}>
              Continue
            </ButtonBase>
          </ActionButtons>
        </SelectionActions>
      </SelectionContainer>
    );
  }

  return (
    <SelectionContainer>
      <SelectionHeader>
        <SelectionTitle>Manage Models for {provider.name}</SelectionTitle>
        <SelectionSubtitle>
          Choose which models you want to enable for use in conversations
        </SelectionSubtitle>
      </SelectionHeader>

      <SearchContainer>
        <SearchInputWrapper>
          <SearchIcon>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              role="img"
              aria-label="Search icon"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </SearchIcon>
          <SearchInput
            ref={searchInputRef}
            type="text"
            placeholder="Search models by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <ClearButton
              onClick={() => setSearchQuery("")}
              title="Clear search"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                role="img"
                aria-label="Clear search"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </ClearButton>
          )}
        </SearchInputWrapper>
      </SearchContainer>

      <SelectionContent>
        {filteredModels.length === 0 && searchQuery ? (
          <EmptyState>
            <h3>No models found</h3>
            <p>
              No models match your search for "{searchQuery}". Try a different
              search term.
            </p>
          </EmptyState>
        ) : (
          <ModelGrid>
            {filteredModels.map((model) => (
              <ModelCard
                key={model.id}
                $selected={selectedModels.has(model.id)}
                $recommended={model.recommended}
                onClick={() => handleModelToggle(model.id)}
              >
                <ModelName>{model.name}</ModelName>

                <ModelMeta>
                  <MetaItem>
                    <MetaLabel>Context</MetaLabel>
                    <MetaValue>
                      {formatContextSize(model.contextSize)}
                    </MetaValue>
                  </MetaItem>
                </ModelMeta>

                <ModelFeatures>
                  {model.hasTools && (
                    <FeatureBadge $type="tools">Function Calling</FeatureBadge>
                  )}
                  {model.contextSize && model.contextSize >= 100000 && (
                    <FeatureBadge $type="context">Large Context</FeatureBadge>
                  )}
                </ModelFeatures>
              </ModelCard>
            ))}
          </ModelGrid>
        )}
      </SelectionContent>

      <SelectionActions>
        <SelectionSummary>
          {selectedModels.size} of {models.length} models selected
          {searchQuery && filteredModels.length !== models.length && (
            <FilteredCount>
              ({filteredModels.length} shown)
            </FilteredCount>
          )}
        </SelectionSummary>

        <ActionButtons>
          <ButtonBase
            $variant="secondary"
            onClick={onCancel}
            disabled={isEnabling}
          >
            Cancel
          </ButtonBase>
          <ButtonBase
            $variant="primary"
            onClick={handleSaveSelection}
            disabled={isEnabling}
          >
            {isEnabling ? "Saving..." : "Save Selection"}
          </ButtonBase>
        </ActionButtons>
      </SelectionActions>
    </SelectionContainer>
  );
};

export default ModelSelection;
