"use client";

import {
  trpc,
  useModelsStore,
  useModelSync,
  useProvidersStore,
} from "@chara-codes/core";
import type React from "react";
import { useEffect, useState } from "react";
import styled from "styled-components";
import ModelSelection from "../molecules/model-selection";
import ProviderForm from "../molecules/provider-form";
import ProviderList from "../molecules/provider-list";

interface ProviderConfig {
  id: string;
  name: string;
  type:
    | "openrouter"
    | "dial"
    | "openai"
    | "anthropic"
    | "google"
    | "deepseek"
    | "ollama"
    | "lmstudio"
    | "custom"
    | "moonshot"
    | "gemini-cli";
  enabled: boolean;
  configuration: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

interface ProviderData {
  name: string;
  type: ProviderConfig["type"];
  enabled: boolean;
  configuration: Record<string, unknown>;
}

const ManagementContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0;

  /* Remove extra spacing to align with settings items */
  & > div {
    gap: 8px;
  }

  /* Adjust list header to match settings style */
  & h3 {
    font-size: 13px;
    font-weight: 500;
    color: ${props => props.theme.colors.text};
    margin: 0 0 8px 0;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: ${props => props.theme.zIndices.modal};
  padding: 20px;
`;

const ModalContent = styled.div`
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
`;

const ProviderManagement: React.FC = () => {
  const [editingProvider, setEditingProvider] = useState<ProviderConfig | null>(
    null
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectingModelsFor, setSelectingModelsFor] =
    useState<ProviderConfig | null>(null);

  // Use stores
  const { refetchProviders, initializeStore: initializeProvidersStore } =
    useProvidersStore();
  const { refetchModels } = useModelsStore();
  const { notifyModelsChanged } = useModelSync();

  // TRPC mutations
  const createProviderMutation = trpc.settings.providers.create.useMutation();
  const updateProviderMutation = trpc.settings.providers.update.useMutation();
  const providersQuery = trpc.settings.providers.list.useQuery();

  // Initialize providers store on mount
  useEffect(() => {
    initializeProvidersStore();
  }, [initializeProvidersStore]);

  const handleAddProvider = () => {
    setShowAddForm(true);
    setEditingProvider(null);
  };

  const handleEditProvider = (provider: ProviderConfig) => {
    setEditingProvider(provider);
    setShowAddForm(false);
  };

  const handleCloseForm = () => {
    setShowAddForm(false);
    setEditingProvider(null);
  };

  const handleCloseModelSelection = () => {
    setSelectingModelsFor(null);
  };

  const handleSubmitProvider = async (providerData: ProviderData) => {
    try {
      let createdProvider: ProviderConfig;

      if (editingProvider) {
        // Update existing provider
        createdProvider = await updateProviderMutation.mutateAsync({
          id: editingProvider.id,
          updates: providerData,
        });
      } else {
        // Create new provider
        createdProvider = await createProviderMutation.mutateAsync(
          providerData
        );
      }

      // Refresh the providers list and stores
      await Promise.all([
        providersQuery.refetch(),
        refetchProviders(),
        refetchModels(), // Refetch models when providers change
      ]);

      // Notify all components about model changes
      notifyModelsChanged();

      // Close the form
      handleCloseForm();

      // For new providers, show model selection
      if (!editingProvider && createdProvider.enabled) {
        setSelectingModelsFor(createdProvider);
      }
    } catch (error) {
      console.error("Failed to save provider:", error);
      throw error; // Re-throw to let the form handle the error
    }
  };

  const handleSelectModelsForProvider = (provider: ProviderConfig) => {
    setSelectingModelsFor(provider);
  };

  const showForm = showAddForm || editingProvider !== null;

  return (
    <ManagementContainer>
      <ProviderList
        onEdit={handleEditProvider}
        onAdd={handleAddProvider}
        onSelectModels={handleSelectModelsForProvider}
      />

      {showForm && (
        <ModalOverlay onClick={handleCloseForm}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ProviderForm
              provider={editingProvider || undefined}
              onSubmit={handleSubmitProvider}
              onCancel={handleCloseForm}
            />
          </ModalContent>
        </ModalOverlay>
      )}

      {selectingModelsFor && (
        <ModalOverlay onClick={handleCloseModelSelection}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModelSelection
              provider={selectingModelsFor}
              onComplete={handleCloseModelSelection}
              onCancel={handleCloseModelSelection}
            />
          </ModalContent>
        </ModalOverlay>
      )}
    </ManagementContainer>
  );
};

export default ProviderManagement;
