"use client";

import { ReactElement } from "react";
import { useState, useCallback, useEffect } from "react";
import styled, { ThemeProvider } from "styled-components";
import {
  ArrowLeftIcon,
  CodeIcon,
  ServerIcon,
  DatabaseIcon,
  GlobeIcon,
  LayersIcon,
  PlusIcon,
} from "../atoms/icons";
import {
  TechStackDetail,
  useNavigateBack,
  useNavigateToTechStacks,
  useSelectedTechStackId,
} from "@chara/core";

import { useGetTechStackById, useUpdateTechStack } from "@chara/core";
import {
  InputBase,
  TextAreaBase,
  SelectBase,
  LabelBase,
  ErrorMessageBase,
  FormGroupBase,
  FormRowBase,
  FormSectionBase,
  SectionTitleBase,
  ButtonBase,
  CheckboxBase,
  IconSelectorBase,
  IconOptionBase,
} from "../atoms";
import { theme } from "../theme";

const { colors, typography, spacing, borderRadius, shadows, breakpoints } =
  theme;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background-color: ${colors.backgroundSecondary};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  padding: ${spacing.md} ${spacing.lg};
  border-bottom: 1px solid ${colors.border};
  background-color: ${colors.background};
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: ${borderRadius.md};
  border: none;
  background-color: transparent;
  color: ${colors.textSecondary};
  cursor: pointer;

  &:hover {
    background-color: ${colors.backgroundSecondary};
    color: ${colors.text};
  }
`;

const Title = styled.h2`
  font-size: ${typography.fontSize.lg};
  font-weight: ${typography.fontWeight.semibold};
  color: ${colors.text};
  margin: 0 0 0 ${spacing.md};
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${spacing.xl};

  @media (max-width: ${breakpoints.sm}) {
    padding: ${spacing.lg};
  }

  @media (max-width: ${breakpoints.xs}) {
    padding: ${spacing.md};
  }
`;

const LinkItem = styled.div`
  display: flex;
  gap: ${spacing.md};
  margin-bottom: ${spacing.md};
  padding: ${spacing.md};
  border: 1px solid ${colors.border};
  border-radius: ${borderRadius.md};
  background-color: ${colors.backgroundSecondary};
`;

const LinkFields = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${spacing.sm};
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${colors.textSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${spacing.xs};
  border-radius: ${borderRadius.sm};
  align-self: flex-start;

  &:hover {
    background-color: ${colors.errorLight};
    color: ${colors.error};
  }
`;

const AddButton = styled(ButtonBase)`
  display: flex;
  align-items: center;
  gap: ${spacing.xs};
  margin-top: ${spacing.sm};
`;

const JsonEditor = styled.textarea<{ $hasError?: boolean }>`
  width: 100%;
  padding: ${spacing.md};
  border: 1px solid
    ${(props) => (props.$hasError ? colors.error : colors.border)};
  border-radius: ${borderRadius.md};
  font-size: ${typography.fontSize.md};
  font-family: monospace;
  min-height: 120px;
  resize: vertical;
  background-color: #1e293b;
  color: #e2e8f0;

  &:focus {
    outline: none;
    border-color: ${(props) =>
      props.$hasError ? colors.error : colors.primary};
    box-shadow: ${shadows.focus}
      ${(props) => (props.$hasError ? colors.errorLight : colors.primaryLight)};
  }
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${spacing.md};
  padding: ${spacing.lg};
  border-top: 1px solid ${colors.border};
  background-color: ${colors.background};
`;

// Available categories
const categories = [
  "Frontend",
  "Backend",
  "Database",
  "Full Stack",
  "API",
  "DevOps",
  "Mobile",
  "Other",
];

// Icon options with their components
const iconOptions: { id: TechStackDetail["icon"]; component: ReactElement }[] =
  [
    { id: "code", component: <CodeIcon width={16} height={16} /> },
    { id: "server", component: <ServerIcon width={16} height={16} /> },
    { id: "database", component: <DatabaseIcon width={16} height={16} /> },
    { id: "globe", component: <GlobeIcon width={16} height={16} /> },
    { id: "layers", component: <LayersIcon width={16} height={16} /> },
  ];

// Default empty documentation link
const emptyDocLink = { name: "", url: "", description: "" };

// Default empty MCP server
const emptyMcpServer = {
  name: "",
  configuration: {
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-puppeteer"],
  },
};

const EditTechStackView: React.FC = () => {
  // Get navigation actions
  const navigateBack = useNavigateBack();
  const navigateToTechStacks = useNavigateToTechStacks();

  // Get selected tech stack ID
  const selectedTechStackId = useSelectedTechStackId();

  // Get tech stack by ID function
  const getTechStackById = useGetTechStackById();

  // Get update tech stack action
  const { updateStack } = useUpdateTechStack();

  // Get the tech stack to edit
  const techStack = selectedTechStackId
    ? getTechStackById(selectedTechStackId)
    : undefined;

  // Form state
  const [formData, setFormData] = useState<Partial<TechStackDetail>>({
    id: "",
    name: "",
    category: "Frontend",
    description: "",
    longDescription: "",
    icon: iconOptions[0].id,
    isNew: false,
    documentationLinks: [],
    mcpServers: [],
  });

  // Selected icon ID
  const [selectedIconId, setSelectedIconId] = useState("code");

  // Form validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // JSON validation errors for MCP servers
  const [mcpJsonErrors, setMcpJsonErrors] = useState<Record<number, string>>(
    {},
  );

  // Initialize form with tech stack data
  useEffect(() => {
    if (techStack) {
      setFormData({
        ...techStack,
      });

      // Find the icon ID
      const iconId =
        iconOptions.find(
          (option) =>
            JSON.stringify(option.component.toString()) ===
            JSON.stringify(techStack.icon?.toString()),
        )?.id || "code";

      setSelectedIconId(iconId);
    }
  }, [techStack]);

  // Handle input change
  const handleChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));

      // Clear error for this field
      if (errors[name]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    },
    [errors],
  );

  // Handle checkbox change
  const handleCheckboxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, checked } = e.target;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    },
    [],
  );

  // Handle icon selection
  const handleIconSelect = useCallback((iconId: string) => {
    setSelectedIconId(iconId);
    const selectedIcon = iconOptions.find((option) => option.id === iconId);
    if (selectedIcon) {
      setFormData((prev) => ({ ...prev, icon: selectedIcon.id }));
    }
  }, []);

  // Handle documentation link change
  const handleDocLinkChange = useCallback(
    (index: number, field: string, value: string) => {
      setFormData((prev) => {
        const links = [...(prev.documentationLinks || [])];
        links[index] = { ...links[index], [field]: value };
        return { ...prev, documentationLinks: links };
      });
    },
    [],
  );

  // Add new documentation link
  const handleAddDocLink = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      documentationLinks: [
        ...(prev.documentationLinks || []),
        { ...emptyDocLink, id: crypto.randomUUID() },
      ],
    }));
  }, []);

  // Remove documentation link
  const handleRemoveDocLink = useCallback((index: number) => {
    setFormData((prev) => {
      const links = [...(prev.documentationLinks || [])];
      links.splice(index, 1);
      return { ...prev, documentationLinks: links };
    });
  }, []);

  // Handle MCP server name change
  const handleMcpServerNameChange = useCallback(
    (index: number, value: string) => {
      setFormData((prev) => {
        const servers = [...(prev.mcpServers || [])];
        servers[index] = { ...servers[index], name: value };
        return { ...prev, mcpServers: servers };
      });
    },
    [],
  );

  // Handle MCP server configuration change
  const handleMcpServerConfigChange = useCallback(
    (index: number, value: string) => {
      try {
        // Try to parse the JSON
        const config = JSON.parse(value);

        setFormData((prev) => {
          const servers = [...(prev.mcpServers || [])];
          servers[index] = { ...servers[index], configuration: config };
          return { ...prev, mcpServers: servers };
        });

        // Clear error for this server
        if (mcpJsonErrors[index]) {
          setMcpJsonErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[index];
            return newErrors;
          });
        }
      } catch (error) {
        // Set error for invalid JSON
        setMcpJsonErrors((prev) => ({
          ...prev,
          [index]: `Invalid JSON format ${error?.toString()}`,
        }));
      }
    },
    [mcpJsonErrors],
  );

  // Add new MCP server
  const handleAddMcpServer = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      mcpServers: [
        ...(prev.mcpServers || []),
        { ...emptyMcpServer, id: crypto.randomUUID() },
      ],
    }));
  }, []);

  // Remove MCP server
  const handleRemoveMcpServer = useCallback(
    (index: number) => {
      setFormData((prev) => {
        const servers = [...(prev.mcpServers || [])];
        servers.splice(index, 1);
        return { ...prev, mcpServers: servers };
      });

      // Clear error for this server
      if (mcpJsonErrors[index]) {
        setMcpJsonErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[index];
          return newErrors;
        });
      }
    },
    [mcpJsonErrors],
  );

  // Validate form
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.description)
      newErrors.description = "Description is required";

    // Validate documentation links
    const docLinks = formData.documentationLinks || [];
    docLinks.forEach((link, index) => {
      if (!link.name && link.url)
        newErrors[`docLink_${index}_name`] = "Name is required";
      if (link.name && !link.url)
        newErrors[`docLink_${index}_url`] = "URL is required";
    });

    // Check if there are any JSON errors
    const hasJsonErrors = Object.keys(mcpJsonErrors).length > 0;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && !hasJsonErrors;
  }, [formData, mcpJsonErrors]);

  // Handle form submission
  const handleSubmit = useCallback(() => {
    if (validateForm()) {
      // Create tech stack object
      const updatedTechStack: TechStackDetail = {
        id: formData.id || "",
        name: formData.name || "",
        category: formData.category || "Other",
        description: formData.description || "",
        longDescription: formData.longDescription || "",
        icon: formData.icon || iconOptions[0].id,
        isNew: formData.isNew || false,
        documentationLinks: (formData.documentationLinks || []).filter(
          (link) => link.name || link.url,
        ),
        mcpServers: (formData.mcpServers || []).filter((server) => server.name),
      };

      // Update tech stack in store
      updateStack(updatedTechStack);

      // Navigate back to tech stacks view
      navigateToTechStacks();
    }
  }, [formData, validateForm, updateStack, navigateToTechStacks]);

  // If no tech stack is selected, navigate back
  useEffect(() => {
    if (!selectedTechStackId) {
      navigateBack();
    }
  }, [selectedTechStackId, navigateBack]);

  return (
    <ThemeProvider theme={theme}>
      <Container>
        <Header>
          <BackButton onClick={navigateBack}>
            <ArrowLeftIcon width={18} height={18} />
          </BackButton>
          <Title>Edit Tech Stack</Title>
        </Header>

        <Content>
          {/* Basic Information Section */}
          <FormSectionBase>
            <SectionTitleBase>Basic Information</SectionTitleBase>

            <FormRowBase>
              <FormGroupBase>
                <LabelBase htmlFor="name">Name *</LabelBase>
                <InputBase
                  id="name"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleChange}
                  placeholder="e.g. React"
                  $hasError={!!errors.name}
                />
                {errors.name && (
                  <ErrorMessageBase>{errors.name}</ErrorMessageBase>
                )}
              </FormGroupBase>

              <FormGroupBase>
                <LabelBase htmlFor="category">Category *</LabelBase>
                <SelectBase
                  id="category"
                  name="category"
                  value={formData.category || ""}
                  onChange={handleChange}
                  $hasError={!!errors.category}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </SelectBase>
                {errors.category && (
                  <ErrorMessageBase>{errors.category}</ErrorMessageBase>
                )}
              </FormGroupBase>
            </FormRowBase>

            <FormGroupBase $fullWidth>
              <LabelBase htmlFor="description">Short Description *</LabelBase>
              <InputBase
                id="description"
                name="description"
                value={formData.description || ""}
                onChange={handleChange}
                placeholder="Brief description (1-2 sentences)"
                $hasError={!!errors.description}
              />
              {errors.description && (
                <ErrorMessageBase>{errors.description}</ErrorMessageBase>
              )}
            </FormGroupBase>

            <FormGroupBase $fullWidth>
              <LabelBase htmlFor="longDescription">
                Detailed Description
              </LabelBase>
              <TextAreaBase
                id="longDescription"
                name="longDescription"
                value={formData.longDescription || ""}
                onChange={handleChange}
                placeholder="Detailed description of the technology"
              />
            </FormGroupBase>

            <FormGroupBase>
              <LabelBase>Icon</LabelBase>
              <IconSelectorBase>
                {iconOptions.map((option) => (
                  <IconOptionBase
                    key={option.id}
                    $selected={selectedIconId === option.id}
                    onClick={() => handleIconSelect(option.id)}
                  >
                    {option.component}
                  </IconOptionBase>
                ))}
              </IconSelectorBase>
            </FormGroupBase>

            <CheckboxBase>
              <input
                id="isNew"
                name="isNew"
                type="checkbox"
                checked={formData.isNew || false}
                onChange={handleCheckboxChange}
              />
              <label htmlFor="isNew">Mark as New</label>
            </CheckboxBase>
          </FormSectionBase>

          {/* Documentation Links Section */}
          <FormSectionBase>
            <SectionTitleBase>Documentation Links</SectionTitleBase>

            {(formData.documentationLinks || []).map((link, index) => (
              <LinkItem key={link.id}>
                <LinkFields>
                  <FormGroupBase $fullWidth>
                    <LabelBase htmlFor={`docLink_${index}_name`}>
                      Name
                    </LabelBase>
                    <InputBase
                      id={`docLink_${index}_name`}
                      value={link.name}
                      onChange={(e) =>
                        handleDocLinkChange(index, "name", e.target.value)
                      }
                      placeholder="e.g. Official Documentation"
                      $hasError={!!errors[`docLink_${index}_name`]}
                    />
                    {errors[`docLink_${index}_name`] && (
                      <ErrorMessageBase>
                        {errors[`docLink_${index}_name`]}
                      </ErrorMessageBase>
                    )}
                  </FormGroupBase>

                  <FormGroupBase $fullWidth>
                    <LabelBase htmlFor={`docLink_${index}_url`}>URL</LabelBase>
                    <InputBase
                      id={`docLink_${index}_url`}
                      value={link.url}
                      onChange={(e) =>
                        handleDocLinkChange(index, "url", e.target.value)
                      }
                      placeholder="https://example.com/docs"
                      $hasError={!!errors[`docLink_${index}_url`]}
                    />
                    {errors[`docLink_${index}_url`] && (
                      <ErrorMessageBase>
                        {errors[`docLink_${index}_url`]}
                      </ErrorMessageBase>
                    )}
                  </FormGroupBase>

                  <FormGroupBase $fullWidth>
                    <LabelBase htmlFor={`docLink_${index}_description`}>
                      Description
                    </LabelBase>
                    <InputBase
                      id={`docLink_${index}_description`}
                      value={link.description || ""}
                      onChange={(e) =>
                        handleDocLinkChange(
                          index,
                          "description",
                          e.target.value,
                        )
                      }
                      placeholder="Brief description of this resource"
                    />
                  </FormGroupBase>
                </LinkFields>

                <RemoveButton onClick={() => handleRemoveDocLink(index)}>
                  <ArrowLeftIcon width={16} height={16} />
                </RemoveButton>
              </LinkItem>
            ))}

            <AddButton
              $variant="secondary"
              $size="small"
              onClick={handleAddDocLink}
            >
              <PlusIcon width={14} height={14} />
              Add Documentation Link
            </AddButton>
          </FormSectionBase>

          {/* MCP Servers Section */}
          <FormSectionBase>
            <SectionTitleBase>MCP Servers</SectionTitleBase>

            {(formData.mcpServers || []).map((server, index) => (
              <LinkItem key={server.name}>
                <LinkFields>
                  <FormGroupBase $fullWidth>
                    <LabelBase htmlFor={`mcpServer_${index}_name`}>
                      Server Name
                    </LabelBase>
                    <InputBase
                      id={`mcpServer_${index}_name`}
                      value={server.name}
                      onChange={(e) =>
                        handleMcpServerNameChange(index, e.target.value)
                      }
                      placeholder="e.g. mcp-server-name"
                    />
                  </FormGroupBase>

                  <FormGroupBase $fullWidth>
                    <LabelBase htmlFor={`mcpServer_${index}_config`}>
                      Configuration (JSON)
                    </LabelBase>
                    <JsonEditor
                      id={`mcpServer_${index}_config`}
                      value={JSON.stringify(server.configuration, null, 2)}
                      onChange={(e) =>
                        handleMcpServerConfigChange(index, e.target.value)
                      }
                      $hasError={!!mcpJsonErrors[index]}
                    />
                    {mcpJsonErrors[index] && (
                      <ErrorMessageBase>
                        {mcpJsonErrors[index]}
                      </ErrorMessageBase>
                    )}
                  </FormGroupBase>
                </LinkFields>

                <RemoveButton onClick={() => handleRemoveMcpServer(index)}>
                  <ArrowLeftIcon width={16} height={16} />
                </RemoveButton>
              </LinkItem>
            ))}

            <AddButton
              $variant="secondary"
              $size="small"
              onClick={handleAddMcpServer}
            >
              <PlusIcon width={14} height={14} />
              Add MCP Server
            </AddButton>
          </FormSectionBase>
        </Content>

        <Footer>
          <ButtonBase $variant="secondary" onClick={navigateBack}>
            Cancel
          </ButtonBase>
          <ButtonBase $variant="primary" onClick={handleSubmit}>
            Save Changes
          </ButtonBase>
        </Footer>
      </Container>
    </ThemeProvider>
  );
};

export default EditTechStackView;
