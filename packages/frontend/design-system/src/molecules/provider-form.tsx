"use client";

import type React from "react";
import { useState, useEffect } from "react";
import styled from "styled-components";
import {
  InputBase,
  LabelBase,
  ErrorMessageBase,
  FormGroupBase,
  FormRowBase,
  FormSectionBase,
  SectionTitleBase,
  ButtonBase,
  SelectBase
} from "../atoms/form-elements";

interface ProviderConfig {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  configuration: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

interface ProviderFormProps {
  provider?: ProviderConfig;
  onSubmit: (provider: Omit<ProviderConfig, 'id' | 'createdAt' | 'updatedAt'> & { name?: string }) => void;
  onCancel: () => void;
}

interface ProviderFieldConfig {
  name: string;
  type: 'text' | 'password' | 'url' | 'number';
  required: boolean;
  placeholder?: string;
  label: string;
}

const FormContainer = styled.div`
  background-color: ${props => props.theme.colors.backgroundSecondary};
  border-radius: 8px;
  box-shadow: ${props => props.theme.shadows.lg};
  overflow: hidden;
`;

const FormHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  background-color: ${props => props.theme.colors.background};
`;

const FormTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin: 0;
`;

const FormContent = styled.form`
  padding: 24px;
`;

const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid ${props => props.theme.colors.border};
  background-color: ${props => props.theme.colors.background};
`;

const ValidationSummary = styled.div`
  background-color: ${props => props.theme.colors.errorLight};
  border: 1px solid ${props => props.theme.colors.error};
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 20px;
`;

const ValidationTitle = styled.h4`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme.colors.error};
  margin: 0 0 8px 0;
`;

const ValidationList = styled.ul`
  margin: 0;
  padding-left: 20px;
  color: ${props => props.theme.colors.error};
  font-size: 13px;
`;

const RequiredIndicator = styled.span`
  color: ${props => props.theme.colors.error};
`;

// Provider type configurations (aligned with server-side PROVIDER_CONFIGS)
const PROVIDER_CONFIGS: Record<string, ProviderFieldConfig[]> = {
  openai: [
    { name: 'apiKey', type: 'password', required: true, placeholder: 'sk-...', label: 'API Key' }
  ],
  anthropic: [
    { name: 'apiKey', type: 'password', required: true, placeholder: 'sk-ant-...', label: 'API Key' }
  ],
  google: [
    { name: 'apiKey', type: 'password', required: true, placeholder: 'AI...', label: 'API Key' }
  ],
  dial: [
    { name: 'apiKey', type: 'password', required: true, placeholder: 'Bearer token', label: 'API Key' },
    { name: 'baseUrl', type: 'url', required: true, placeholder: 'https://dial.example.com', label: 'Base URL' }
  ],
  openrouter: [
    { name: 'apiKey', type: 'password', required: true, placeholder: 'sk-or-...', label: 'API Key' }
  ],
  deepseek: [
    { name: 'apiKey', type: 'password', required: true, placeholder: 'sk-...', label: 'API Key' }
  ],
  moonshot: [
    { name: 'apiKey', type: 'password', required: true, placeholder: 'sk-...', label: 'API Key' }
  ],
  'gemini-cli': [
    { name: 'apiKey', type: 'password', required: false, placeholder: 'AI... (optional, OAuth fallback)', label: 'API Key (Optional)' }
  ],
  ollama: [
    { name: 'baseUrl', type: 'url', required: false, placeholder: 'http://localhost:11434 (default)', label: 'Base URL (Optional)' }
  ],
  lmstudio: [
    { name: 'baseUrl', type: 'url', required: false, placeholder: 'http://localhost:1234/v1 (default)', label: 'Base URL (Optional)' }
  ],
  custom: [
    { name: 'baseUrl', type: 'url', required: true, placeholder: 'https://api.example.com', label: 'Base URL' },
    { name: 'apiKey', type: 'password', required: true, placeholder: 'API Key', label: 'API Key' }
  ]
};

const PROVIDER_TYPES = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'google', label: 'Google AI' },
  { value: 'dial', label: 'DIAL' },
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'moonshot', label: 'Moonshot' },
  { value: 'gemini-cli', label: 'Gemini CLI' },
  { value: 'ollama', label: 'Ollama' },
  { value: 'lmstudio', label: 'LM Studio' },
  { value: 'custom', label: 'Custom' }
];

const ProviderForm: React.FC<ProviderFormProps> = ({ provider, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    type: provider?.type || 'openai',
    enabled: provider?.enabled ?? true,
    configuration: provider?.configuration || {}
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when provider changes
  useEffect(() => {
    if (provider) {
      setFormData({
        type: provider.type,
        enabled: provider.enabled,
        configuration: provider.configuration
      });
    }
  }, [provider]);

  // Get field configuration for current provider type
  const fieldConfig = PROVIDER_CONFIGS[formData.type] || [];

  // Validation function
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate configuration fields
    fieldConfig.forEach(field => {
      const value = formData.configuration[field.name] || '';

      if (field.required && !value.trim()) {
        newErrors[field.name] = `${field.label} is required`;
      } else if (value && field.type === 'url') {
        try {
          new URL(value);
        } catch {
          newErrors[field.name] = 'Please enter a valid URL';
        }
      } else if (value && field.type === 'password') {
        // Basic API key validation based on provider type
        if (formData.type === 'openai' && !value.startsWith('sk-')) {
          newErrors[field.name] = 'OpenAI API key should start with sk-';
        } else if (formData.type === 'anthropic' && !value.startsWith('sk-ant-')) {
          newErrors[field.name] = 'Anthropic API key should start with sk-ant-';
        } else if (formData.type === 'openrouter' && !value.startsWith('sk-or-')) {
          newErrors[field.name] = 'OpenRouter API key should start with sk-or-';
        } else if (formData.type === 'google' && !value.startsWith('AI')) {
          newErrors[field.name] = 'Google AI API key should start with AI';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'type') {
      setFormData(prev => ({
        ...prev,
        [field]: value,
        // Reset configuration when type changes
        configuration: {}
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        configuration: {
          ...prev.configuration,
          [field]: value
        }
      }));
    }

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Use the provider type label as the name
      const providerTypeLabel = PROVIDER_TYPES.find(p => p.value === formData.type)?.label || formData.type;
      await onSubmit({
        ...formData,
        name: providerTypeLabel
      });
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <FormContainer>
      <FormHeader>
        <FormTitle>
          {provider ? 'Edit Provider' : 'Add New Provider'}
        </FormTitle>
      </FormHeader>

      <FormContent onSubmit={handleSubmit}>
        {hasErrors && (
          <ValidationSummary>
            <ValidationTitle>Please fix the following errors:</ValidationTitle>
            <ValidationList>
              {Object.entries(errors).map(([field, error]) => (
                <li key={field}>{error}</li>
              ))}
            </ValidationList>
          </ValidationSummary>
        )}

        <FormSectionBase>
          <SectionTitleBase>Provider Type</SectionTitleBase>

          <FormRowBase>
            <FormGroupBase $fullWidth>
              <LabelBase htmlFor="type">Select Provider</LabelBase>
              <SelectBase
                id="type"
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                $hasError={!!errors.type}
              >
                {PROVIDER_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </SelectBase>
              {errors.type && <ErrorMessageBase>{errors.type}</ErrorMessageBase>}
            </FormGroupBase>
          </FormRowBase>
        </FormSectionBase>

        <FormSectionBase>
          <SectionTitleBase>Configuration</SectionTitleBase>

          {fieldConfig.map(field => (
            <FormGroupBase key={field.name} $fullWidth>
              <LabelBase htmlFor={field.name}>
                {field.label}
                {field.required && <RequiredIndicator> *</RequiredIndicator>}
              </LabelBase>
              <InputBase
                id={field.name}
                type={field.type}
                value={formData.configuration[field.name] || ''}
                onChange={(e) => handleInputChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                $hasError={!!errors[field.name]}
              />
              {errors[field.name] && (
                <ErrorMessageBase>{errors[field.name]}</ErrorMessageBase>
              )}
            </FormGroupBase>
          ))}
        </FormSectionBase>
      </FormContent>

      <FormActions>
        <ButtonBase
          type="button"
          $variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </ButtonBase>
        <ButtonBase
          type="submit"
          $variant="primary"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : (provider ? 'Update Provider' : 'Add Provider')}
        </ButtonBase>
      </FormActions>
    </FormContainer>
  );
};

export default ProviderForm;
