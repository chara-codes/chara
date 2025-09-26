"use client";

import { trpc } from "@chara-codes/core";
import type React from "react";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { ButtonBase } from "../atoms/form-elements";

interface ProviderConfig {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  configuration: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

interface ProviderListProps {
  onEdit: (provider: ProviderConfig) => void;
  onAdd: () => void;
  onSelectModels?: (provider: ProviderConfig) => void;
}

const ListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
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

const ProviderCard = styled.div`
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
`;

const ProviderHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const ProviderInfo = styled.div`
  flex: 1;
`;

const ProviderName = styled.h4`
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
`;

const ProviderType = styled.span`
  font-size: 12px;
  color: #6b7280;
  text-transform: capitalize;
`;

const ProviderStatus = styled.div<{ $enabled: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: ${(props) => (props.$enabled ? "#059669" : "#dc2626")};
`;

const StatusDot = styled.div<{ $enabled: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${(props) => (props.$enabled ? "#10b981" : "#ef4444")};
`;

const ProviderModels = styled.div`
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
`;

const ModelsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const ModelsTitle = styled.h5`
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const ModelsCount = styled.span`
  font-size: 11px;
  color: #9ca3af;
`;

const ModelsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const ModelTag = styled.span`
  font-size: 11px;
  padding: 2px 6px;
  background-color: #eff6ff;
  color: #1e40af;
  border-radius: 4px;
  border: 1px solid #bfdbfe;
`;

const NoModelsText = styled.span`
  font-size: 11px;
  color: #9ca3af;
  font-style: italic;
`;

const ProviderActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
`;

const ToggleSwitch = styled.div<{ $enabled: boolean }>`
  width: 36px;
  height: 20px;
  background-color: ${(props) => (props.$enabled ? "#3b82f6" : "#e5e7eb")};
  border-radius: 10px;
  position: relative;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &::after {
    content: "";
    position: absolute;
    width: 16px;
    height: 16px;
    background-color: white;
    border-radius: 50%;
    top: 2px;
    left: ${(props) => (props.$enabled ? "calc(100% - 18px)" : "2px")};
    transition: left 0.2s ease;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px 24px;
  color: #6b7280;
`;

const EmptyStateTitle = styled.h3`
  font-size: 16px;
  font-weight: 500;
  color: #374151;
  margin: 0 0 8px 0;
`;

const EmptyStateDescription = styled.p`
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 24px 0;
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

const ProviderList: React.FC<ProviderListProps> = ({
  onEdit,
  onAdd,
  onSelectModels,
}) => {
  const [deletingProvider, setDeletingProvider] = useState<string | null>(null);
  const [providerModels, setProviderModels] = useState<
    Record<string, string[]>
  >({});

  // TRPC queries and mutations
  const providersQuery = trpc.settings.providers.list.useQuery();
  const enabledModelsConfigQuery = trpc.settings.models.getEnabledWithConfig.useQuery();
  const updateProviderMutation = trpc.settings.providers.update.useMutation({
    onSuccess: () => {
      providersQuery.refetch();
    },
  });
  const deleteProviderMutation = trpc.settings.providers.delete.useMutation({
    onSuccess: () => {
      providersQuery.refetch();
      setDeletingProvider(null);
    },
  });

  // Fetch models for each provider and match with enabled models
  useEffect(() => {
    const fetchProviderModels = async () => {
      if (!providersQuery.data || !enabledModelsConfigQuery.data) return;

      const modelsMap: Record<string, string[]> = {};
      const enabledModelsConfig = enabledModelsConfigQuery.data;

      for (const provider of providersQuery.data) {
        if (!provider.enabled) {
          modelsMap[provider.id] = [];
          continue;
        }

        // Get enabled models for this provider from the configuration
        const enabledFromProvider = Object.entries(enabledModelsConfig)
          .filter(([modelId, config]) => {
            // Check if this model belongs to the current provider
            return config.provider === provider.type || modelId.startsWith(`${provider.type}:::`);
          })
          .map(([_modelId, config]) => config.name);

        modelsMap[provider.id] = enabledFromProvider;
      }

      setProviderModels(modelsMap);
    };

    fetchProviderModels();
  }, [providersQuery.data, enabledModelsConfigQuery.data]);

  const handleToggleEnabled = async (provider: ProviderConfig) => {
    try {
      await updateProviderMutation.mutateAsync({
        id: provider.id,
        updates: { enabled: !provider.enabled },
      });
    } catch (error) {
      console.error("Failed to toggle provider:", error);
    }
  };

  const handleDelete = async (providerId: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this provider? This action cannot be undone."
      )
    ) {
      setDeletingProvider(providerId);
      try {
        await deleteProviderMutation.mutateAsync({ id: providerId });
      } catch (error) {
        console.error("Failed to delete provider:", error);
        setDeletingProvider(null);
      }
    }
  };

  if (providersQuery.isLoading || enabledModelsConfigQuery.isLoading) {
    return <LoadingState>Loading providers...</LoadingState>;
  }

  if (providersQuery.error) {
    return (
      <ErrorState>
        Error loading providers: {providersQuery.error.message}
      </ErrorState>
    );
  }

  if (enabledModelsConfigQuery.error) {
    return (
      <ErrorState>
        Error loading enabled models: {enabledModelsConfigQuery.error.message}
      </ErrorState>
    );
  }

  const providers = providersQuery.data || [];

  return (
    <ListContainer>
      <ListHeader>
        <ListTitle>AI Providers</ListTitle>
        <ButtonBase $variant="primary" $size="small" onClick={onAdd}>
          Add Provider
        </ButtonBase>
      </ListHeader>

      {providers.length === 0 ? (
        <EmptyState>
          <EmptyStateTitle>No providers configured</EmptyStateTitle>
          <EmptyStateDescription>
            Add your first AI provider to start using models in your
            conversations.
          </EmptyStateDescription>
          <ButtonBase $variant="primary" onClick={onAdd}>
            Add Your First Provider
          </ButtonBase>
        </EmptyState>
      ) : (
        providers.map((provider) => {
          const enabledModels = providerModels[provider.id] || [];

          return (
            <ProviderCard key={provider.id}>
              <ProviderHeader>
                <ProviderInfo>
                  <ProviderName>{provider.name}</ProviderName>
                  <ProviderType>{provider.type}</ProviderType>
                </ProviderInfo>
                <ProviderStatus $enabled={provider.enabled}>
                  <StatusDot $enabled={provider.enabled} />
                  {provider.enabled ? "Enabled" : "Disabled"}
                </ProviderStatus>
              </ProviderHeader>

              {provider.enabled && (
                <ProviderModels>
                  <ModelsHeader>
                    <ModelsTitle>Enabled Models</ModelsTitle>
                    <ModelsCount>
                      {enabledModels.length} model
                      {enabledModels.length !== 1 ? "s" : ""}
                    </ModelsCount>
                  </ModelsHeader>

                  {enabledModels.length > 0 ? (
                    <ModelsList>
                      {enabledModels.map((modelName, index) => (
                        <ModelTag key={index}>{modelName}</ModelTag>
                      ))}
                    </ModelsList>
                  ) : (
                    <NoModelsText>No models enabled</NoModelsText>
                  )}
                </ProviderModels>
              )}

              <ProviderActions>
                <ToggleSwitch
                  $enabled={provider.enabled}
                  onClick={() => handleToggleEnabled(provider)}
                />
                {onSelectModels && provider.enabled && (
                  <ButtonBase
                    $variant="primary"
                    $size="small"
                    onClick={() => onSelectModels(provider)}
                  >
                    Manage Models
                  </ButtonBase>
                )}
                <ButtonBase
                  $variant="secondary"
                  $size="small"
                  onClick={() => onEdit(provider)}
                >
                  Edit
                </ButtonBase>
                <ButtonBase
                  $variant="destructive"
                  $size="small"
                  onClick={() => handleDelete(provider.id)}
                  disabled={deletingProvider === provider.id}
                >
                  {deletingProvider === provider.id ? "Deleting..." : "Delete"}
                </ButtonBase>
              </ProviderActions>
            </ProviderCard>
          );
        })
      )}
    </ListContainer>
  );
};

export default ProviderList;
