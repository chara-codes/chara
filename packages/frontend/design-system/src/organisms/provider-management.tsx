"use client";

import type React from "react";
import { useState } from "react";
import styled from "styled-components";
import { trpc } from '@chara-codes/core';
import ProviderList from "../molecules/provider-list";
import ProviderForm from "../molecules/provider-form";
import ModelSelection from "../molecules/model-selection";

interface ProviderConfig {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  configuration: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const ManagementContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 20px;
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
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled.div`
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
`;

const ProviderManagement: React.FC = () => {
  const [editingProvider, setEditingProvider] = useState<ProviderConfig | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectingModelsFor, setSelectingModelsFor] = useState<ProviderConfig | null>(null);

  // TRPC mutations
  const createProviderMutation = trpc.settings.providers.create.useMutation();
  const updateProviderMutation = trpc.settings.providers.update.useMutation();
  const providersQuery = trpc.settings.providers.list.useQuery();

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

  const handleSubmitProvider = async (providerData: Omit<ProviderConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      let createdProvider: ProviderConfig;
      
      if (editingProvider) {
        // Update existing provider
        createdProvider = await updateProviderMutation.mutateAsync({
          id: editingProvider.id,
          updates: providerData
        });
      } else {
        // Create new provider
        createdProvider = await createProviderMutation.mutateAsync(providerData);
      }
      
      // Refresh the providers list
      await providersQuery.refetch();
      
      // Close the form
      handleCloseForm();
      
      // For new providers, show model selection
      if (!editingProvider && createdProvider.enabled) {
        setSelectingModelsFor(createdProvider);
      }
    } catch (error) {
      console.error('Failed to save provider:', error);
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