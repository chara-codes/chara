"use client";

import type React from "react";
import { useState, useMemo } from "react";
import styled from "styled-components";
import { trpc } from '@chara-codes/core';
import { ButtonBase, SelectBase } from "../atoms/form-elements";

interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  description?: string;
  contextLength?: number;
  contextSize?: number;
  inputCost?: number;
  outputCost?: number;
}

interface EnhancedModelConfig extends ModelConfig {
  enabled: boolean;
  providerEnabled: boolean;
}

interface ModelListProps {
  groupBy?: 'provider' | 'status' | 'none';
}

const ListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ListHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const ListTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0;
`;

const FilterControls = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const FilterLabel = styled.label`
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
`;

const GroupContainer = styled.div`
  margin-bottom: 24px;
`;

const GroupHeader = styled.h4`
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 12px 0;
  padding: 8px 0;
  border-bottom: 1px solid #e5e7eb;
  text-transform: capitalize;
`;

const ModelGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
`;

const ModelCard = styled.div<{ $enabled: boolean; $providerEnabled: boolean }>`
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  opacity: ${props => !props.$providerEnabled ? 0.6 : 1};

  &:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
`;

const ModelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const ModelInfo = styled.div`
  flex: 1;
`;

const ModelName = styled.h5`
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
`;

const ModelProvider = styled.span`
  font-size: 12px;
  color: #6b7280;
  text-transform: capitalize;
`;

const ModelDescription = styled.p`
  font-size: 13px;
  color: #6b7280;
  margin: 8px 0;
  line-height: 1.4;
`;

const ModelMeta = styled.div`
  display: flex;
  gap: 16px;
  margin: 12px 0;
  font-size: 12px;
  color: #6b7280;
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
  color: #374151;
`;

const ModelActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
`;

const ModelStatus = styled.div<{ $enabled: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: ${props => props.$enabled ? '#059669' : '#6b7280'};
`;

const StatusDot = styled.div<{ $enabled: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => props.$enabled ? '#10b981' : '#d1d5db'};
`;

const ToggleSwitch = styled.div<{ $enabled: boolean; $disabled: boolean }>`
  width: 36px;
  height: 20px;
  background-color: ${props => props.$disabled ? '#f3f4f6' : (props.$enabled ? '#3b82f6' : '#e5e7eb')};
  border-radius: 10px;
  position: relative;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  transition: background-color 0.2s ease;

  &::after {
    content: "";
    position: absolute;
    width: 16px;
    height: 16px;
    background-color: white;
    border-radius: 50%;
    top: 2px;
    left: ${props => props.$enabled ? 'calc(100% - 18px)' : '2px'};
    transition: left 0.2s ease;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
`;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  color: #6b7280;
`;

const ErrorState = styled.div`
  padding: 16px;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #dc2626;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px 24px;
  color: #6b7280;
`;

const DisabledProviderWarning = styled.div`
  background-color: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 4px;
  padding: 8px 12px;
  margin-bottom: 12px;
  font-size: 12px;
  color: #92400e;
`;

const ModelList: React.FC<ModelListProps> = ({ groupBy = 'provider' }) => {
  const [filter, setFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [togglingModel, setTogglingModel] = useState<string | null>(null);

  // TRPC queries and mutations
  const availableModelsQuery = trpc.settings.models.getAvailable.useQuery();
  const enabledModelsQuery = trpc.settings.models.getEnabled.useQuery();
  const providersQuery = trpc.settings.providers.list.useQuery();
  const enableModelMutation = trpc.settings.models.enable.useMutation({
    onSuccess: () => {
      enabledModelsQuery.refetch();
      setTogglingModel(null);
    }
  });
  const disableModelMutation = trpc.settings.models.disable.useMutation({
    onSuccess: () => {
      enabledModelsQuery.refetch();
      setTogglingModel(null);
    }
  });

  // Combine data to create enhanced model configs
  const enhancedModels = useMemo(() => {
    const availableModels = availableModelsQuery.data || [];
    const enabledModels = enabledModelsQuery.data || [];
    const providers = providersQuery.data || [];

    return availableModels.map(model => {
      const provider = providers.find(p => p.type === model.provider);
      return {
        ...model,
        enabled: enabledModels.includes(model.id),
        providerEnabled: provider?.enabled ?? false
      } as EnhancedModelConfig;
    });
  }, [availableModelsQuery.data, enabledModelsQuery.data, providersQuery.data]);

  // Filter models based on current filter
  const filteredModels = useMemo(() => {
    switch (filter) {
      case 'enabled':
        return enhancedModels.filter(model => model.enabled);
      case 'disabled':
        return enhancedModels.filter(model => !model.enabled);
      default:
        return enhancedModels;
    }
  }, [enhancedModels, filter]);

  // Group models based on groupBy prop
  const groupedModels = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Models': filteredModels };
    }

    return filteredModels.reduce((groups, model) => {
      let key: string;
      
      switch (groupBy) {
        case 'status':
          key = model.enabled ? 'Enabled' : 'Disabled';
          break;
        case 'provider':
        default:
          key = model.provider;
          break;
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(model);
      return groups;
    }, {} as Record<string, EnhancedModelConfig[]>);
  }, [filteredModels, groupBy]);

  const handleToggleModel = async (model: EnhancedModelConfig) => {
    if (!model.providerEnabled) {
      return; // Don't allow toggling if provider is disabled
    }

    setTogglingModel(model.id);
    try {
      if (model.enabled) {
        await disableModelMutation.mutateAsync({ modelId: model.id });
      } else {
        await enableModelMutation.mutateAsync({ modelId: model.id });
      }
    } catch (error) {
      console.error('Failed to toggle model:', error);
      setTogglingModel(null);
    }
  };

  const formatContextLength = (length?: number) => {
    if (!length) return 'Unknown';
    if (length >= 1000000) return `${(length / 1000000).toFixed(1)}M`;
    if (length >= 1000) return `${(length / 1000).toFixed(0)}K`;
    return length.toString();
  };

  const formatCost = (cost?: number) => {
    if (!cost) return 'Unknown';
    return `$${cost.toFixed(4)}`;
  };

  if (availableModelsQuery.isLoading || enabledModelsQuery.isLoading || providersQuery.isLoading) {
    return (
      <LoadingState>
        Loading models...
      </LoadingState>
    );
  }

  if (availableModelsQuery.error || enabledModelsQuery.error || providersQuery.error) {
    const error = availableModelsQuery.error || enabledModelsQuery.error || providersQuery.error;
    return (
      <ErrorState>
        Error loading models: {error?.message}
      </ErrorState>
    );
  }

  if (enhancedModels.length === 0) {
    return (
      <EmptyState>
        <h3>No models available</h3>
        <p>Configure providers first to see available models.</p>
      </EmptyState>
    );
  }

  return (
    <ListContainer>
      <ListHeader>
        <ListTitle>AI Models</ListTitle>
        <FilterControls>
          <FilterLabel htmlFor="model-filter">Filter:</FilterLabel>
          <SelectBase
            id="model-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'enabled' | 'disabled')}
          >
            <option value="all">All Models</option>
            <option value="enabled">Enabled Only</option>
            <option value="disabled">Disabled Only</option>
          </SelectBase>
        </FilterControls>
      </ListHeader>

      {Object.entries(groupedModels).map(([groupName, models]) => (
        <GroupContainer key={groupName}>
          {groupBy !== 'none' && <GroupHeader>{groupName}</GroupHeader>}
          
          <ModelGrid>
            {models.map((model) => (
              <ModelCard
                key={model.id}
                $enabled={model.enabled}
                $providerEnabled={model.providerEnabled}
              >
                {!model.providerEnabled && (
                  <DisabledProviderWarning>
                    Provider "{model.provider}" is disabled. Enable the provider to use this model.
                  </DisabledProviderWarning>
                )}
                
                <ModelHeader>
                  <ModelInfo>
                    <ModelName>{model.name}</ModelName>
                    <ModelProvider>{model.provider}</ModelProvider>
                  </ModelInfo>
                </ModelHeader>

                {model.description && (
                  <ModelDescription>{model.description}</ModelDescription>
                )}

                <ModelMeta>
                  <MetaItem>
                    <MetaLabel>Context</MetaLabel>
                    <MetaValue>{formatContextLength(model.contextLength || model.contextSize)}</MetaValue>
                  </MetaItem>
                  {model.inputCost && (
                    <MetaItem>
                      <MetaLabel>Input</MetaLabel>
                      <MetaValue>{formatCost(model.inputCost)}/1K</MetaValue>
                    </MetaItem>
                  )}
                  {model.outputCost && (
                    <MetaItem>
                      <MetaLabel>Output</MetaLabel>
                      <MetaValue>{formatCost(model.outputCost)}/1K</MetaValue>
                    </MetaItem>
                  )}
                </ModelMeta>

                <ModelActions>
                  <ModelStatus $enabled={model.enabled}>
                    <StatusDot $enabled={model.enabled} />
                    {model.enabled ? 'Enabled' : 'Disabled'}
                  </ModelStatus>
                  
                  <ToggleSwitch
                    $enabled={model.enabled}
                    $disabled={!model.providerEnabled || togglingModel === model.id}
                    onClick={() => handleToggleModel(model)}
                  />
                </ModelActions>
              </ModelCard>
            ))}
          </ModelGrid>
        </GroupContainer>
      ))}
    </ListContainer>
  );
};

export default ModelList;