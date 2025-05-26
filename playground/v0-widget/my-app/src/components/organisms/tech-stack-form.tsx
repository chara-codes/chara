"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import styled from "styled-components"
import {
  CodeIcon,
  ServerIcon,
  DatabaseIcon,
  GlobeIcon,
  LayersIcon,
  CloseIcon,
  PlusIcon,
  TrashIcon,
} from "../atoms/icons"
import Button from "../atoms/button"
import type { TechStackDetail } from "./tech-stack-detail-view"

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
`

const ModalContent = styled.div`
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
`

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  background-color: white;
  z-index: 10;
`

const ModalTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0;
`

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 4px;
  
  &:hover {
    background-color: #f3f4f6;
    color: #111827;
  }
`

const FormContent = styled.div`
  padding: 20px;
`

const FormSection = styled.div`
  margin-bottom: 24px;
`

const SectionTitle = styled.h4`
  font-size: 14px;
  font-weight: 500;
  color: #111827;
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
`

const FormRow = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  
  @media (max-width: 640px) {
    flex-direction: column;
    gap: 12px;
  }
`

const FormGroup = styled.div<{ $fullWidth?: boolean }>`
  display: flex;
  flex-direction: column;
  flex: ${(props) => (props.$fullWidth ? 1 : "0 0 calc(50% - 8px)")};
  
  @media (max-width: 640px) {
    flex: 1;
  }
`

const Label = styled.label`
  font-size: 12px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 4px;
`

const Input = styled.input<{ $hasError?: boolean }>`
  padding: 8px 12px;
  border: 1px solid ${(props) => (props.$hasError ? "#ef4444" : "#d1d5db")};
  border-radius: 6px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: ${(props) => (props.$hasError ? "#ef4444" : "#3b82f6")};
    box-shadow: 0 0 0 2px ${(props) => (props.$hasError ? "rgba(239, 68, 68, 0.2)" : "rgba(59, 130, 246, 0.2)")};
  }
`

const TextArea = styled.textarea<{ $hasError?: boolean }>`
  padding: 8px 12px;
  border: 1px solid ${(props) => (props.$hasError ? "#ef4444" : "#d1d5db")};
  border-radius: 6px;
  font-size: 14px;
  min-height: 80px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: ${(props) => (props.$hasError ? "#ef4444" : "#3b82f6")};
    box-shadow: 0 0 0 2px ${(props) => (props.$hasError ? "rgba(239, 68, 68, 0.2)" : "rgba(59, 130, 246, 0.2)")};
  }
`

const Select = styled.select<{ $hasError?: boolean }>`
  padding: 8px 12px;
  border: 1px solid ${(props) => (props.$hasError ? "#ef4444" : "#d1d5db")};
  border-radius: 6px;
  font-size: 14px;
  background-color: white;
  
  &:focus {
    outline: none;
    border-color: ${(props) => (props.$hasError ? "#ef4444" : "#3b82f6")};
    box-shadow: 0 0 0 2px ${(props) => (props.$hasError ? "rgba(239, 68, 68, 0.2)" : "rgba(59, 130, 246, 0.2)")};
  }
`

const Checkbox = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  
  input {
    width: 16px;
    height: 16px;
  }
  
  label {
    font-size: 14px;
    color: #374151;
    margin: 0;
  }
`

const ErrorMessage = styled.div`
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
`

const IconSelector = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 8px;
`

const IconOption = styled.div<{ $selected: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background-color: ${(props) => (props.$selected ? "#3b82f6" : "#f3f4f6")};
  color: ${(props) => (props.$selected ? "white" : "#6b7280")};
  border: 1px solid ${(props) => (props.$selected ? "#3b82f6" : "#e5e7eb")};
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${(props) => (props.$selected ? "#3b82f6" : "#e5e7eb")};
  }
`

const LinkItem = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background-color: #f9fafb;
`

const LinkFields = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const LinkRow = styled.div`
  display: flex;
  gap: 12px;
  
  @media (max-width: 640px) {
    flex-direction: column;
    gap: 8px;
  }
`

const RemoveButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 4px;
  align-self: flex-start;
  
  &:hover {
    background-color: #fee2e2;
    color: #ef4444;
  }
`

const AddButton = styled(Button)`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
`

const JsonEditor = styled.textarea<{ $hasError?: boolean }>`
  padding: 12px;
  border: 1px solid ${(props) => (props.$hasError ? "#ef4444" : "#d1d5db")};
  border-radius: 6px;
  font-size: 14px;
  font-family: monospace;
  min-height: 120px;
  resize: vertical;
  background-color: #1e293b;
  color: #e2e8f0;
  
  &:focus {
    outline: none;
    border-color: ${(props) => (props.$hasError ? "#ef4444" : "#3b82f6")};
    box-shadow: 0 0 0 2px ${(props) => (props.$hasError ? "rgba(239, 68, 68, 0.2)" : "rgba(59, 130, 246, 0.2)")};
  }
`

const ModalFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
  position: sticky;
  bottom: 0;
  background-color: white;
  z-index: 10;
`

const CancelButton = styled(Button)`
  background-color: white;
  color: #374151;
  border: 1px solid #d1d5db;
  
  &:hover {
    background-color: #f3f4f6;
  }
`

interface TechStackFormProps {
  techStack?: TechStackDetail
  onClose: () => void
  onSave: (techStack: TechStackDetail) => void
}

// Available categories
const categories = ["Frontend", "Backend", "Database", "Full Stack", "API", "DevOps", "Mobile", "Other"]

// Icon options with their components
const iconOptions = [
  { id: "code", component: <CodeIcon width={20} height={20} /> },
  { id: "server", component: <ServerIcon width={20} height={20} /> },
  { id: "database", component: <DatabaseIcon width={20} height={20} /> },
  { id: "globe", component: <GlobeIcon width={20} height={20} /> },
  { id: "layers", component: <LayersIcon width={20} height={20} /> },
]

// Default empty documentation link
const emptyDocLink = { name: "", url: "", description: "" }

// Default empty MCP server
const emptyMcpServer = {
  name: "",
  configuration: {
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-puppeteer"],
  },
}

// Generate a unique ID for new tech stacks
const generateId = (name: string) => {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "-")
}

const TechStackForm: React.FC<TechStackFormProps> = ({ techStack, onClose, onSave }) => {
  // Form state
  const [formData, setFormData] = useState<Partial<TechStackDetail>>({
    id: "",
    name: "",
    category: "Frontend",
    description: "",
    longDescription: "",
    icon: iconOptions[0].component,
    popularity: 5,
    version: "",
    releaseDate: "",
    isNew: false,
    documentationLinks: [],
    mcpServers: [],
  })

  // Selected icon ID
  const [selectedIconId, setSelectedIconId] = useState("code")

  // Form validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  // JSON validation errors for MCP servers
  const [mcpJsonErrors, setMcpJsonErrors] = useState<Record<number, string>>({})

  // Initialize form with tech stack data if editing
  useEffect(() => {
    if (techStack) {
      setFormData({
        ...techStack,
      })

      // Find the icon ID
      const iconId =
        iconOptions.find((option) => JSON.stringify(option.component.props) === JSON.stringify(techStack.icon.props))
          ?.id || "code"

      setSelectedIconId(iconId)
    }
  }, [techStack])

  // Handle input change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target
      setFormData((prev) => ({ ...prev, [name]: value }))

      // Clear error for this field
      if (errors[name]) {
        setErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors[name]
          return newErrors
        })
      }
    },
    [errors],
  )

  // Handle checkbox change
  const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }, [])

  // Handle icon selection
  const handleIconSelect = useCallback((iconId: string) => {
    setSelectedIconId(iconId)
    const selectedIcon = iconOptions.find((option) => option.id === iconId)
    if (selectedIcon) {
      setFormData((prev) => ({ ...prev, icon: selectedIcon.component }))
    }
  }, [])

  // Handle documentation link change
  const handleDocLinkChange = useCallback((index: number, field: string, value: string) => {
    setFormData((prev) => {
      const links = [...(prev.documentationLinks || [])]
      links[index] = { ...links[index], [field]: value }
      return { ...prev, documentationLinks: links }
    })
  }, [])

  // Add new documentation link
  const handleAddDocLink = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      documentationLinks: [...(prev.documentationLinks || []), { ...emptyDocLink }],
    }))
  }, [])

  // Remove documentation link
  const handleRemoveDocLink = useCallback((index: number) => {
    setFormData((prev) => {
      const links = [...(prev.documentationLinks || [])]
      links.splice(index, 1)
      return { ...prev, documentationLinks: links }
    })
  }, [])

  // Handle MCP server name change
  const handleMcpServerNameChange = useCallback((index: number, value: string) => {
    setFormData((prev) => {
      const servers = [...(prev.mcpServers || [])]
      servers[index] = { ...servers[index], name: value }
      return { ...prev, mcpServers: servers }
    })
  }, [])

  // Handle MCP server configuration change
  const handleMcpServerConfigChange = useCallback(
    (index: number, value: string) => {
      try {
        // Try to parse the JSON
        const config = JSON.parse(value)

        setFormData((prev) => {
          const servers = [...(prev.mcpServers || [])]
          servers[index] = { ...servers[index], configuration: config }
          return { ...prev, mcpServers: servers }
        })

        // Clear error for this server
        if (mcpJsonErrors[index]) {
          setMcpJsonErrors((prev) => {
            const newErrors = { ...prev }
            delete newErrors[index]
            return newErrors
          })
        }
      } catch (error) {
        // Set error for invalid JSON
        setMcpJsonErrors((prev) => ({
          ...prev,
          [index]: "Invalid JSON format",
        }))
      }
    },
    [mcpJsonErrors],
  )

  // Add new MCP server
  const handleAddMcpServer = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      mcpServers: [...(prev.mcpServers || []), { ...emptyMcpServer }],
    }))
  }, [])

  // Remove MCP server
  const handleRemoveMcpServer = useCallback(
    (index: number) => {
      setFormData((prev) => {
        const servers = [...(prev.mcpServers || [])]
        servers.splice(index, 1)
        return { ...prev, mcpServers: servers }
      })

      // Clear error for this server
      if (mcpJsonErrors[index]) {
        setMcpJsonErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors[index]
          return newErrors
        })
      }
    },
    [mcpJsonErrors],
  )

  // Validate form
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {}

    // Required fields
    if (!formData.name) newErrors.name = "Name is required"
    if (!formData.category) newErrors.category = "Category is required"
    if (!formData.description) newErrors.description = "Description is required"

    // Validate documentation links
    const docLinks = formData.documentationLinks || []
    docLinks.forEach((link, index) => {
      if (!link.name) newErrors[`docLink_${index}_name`] = "Name is required"
      if (!link.url) newErrors[`docLink_${index}_url`] = "URL is required"
    })

    // Check if there are any JSON errors
    const hasJsonErrors = Object.keys(mcpJsonErrors).length > 0

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0 && !hasJsonErrors
  }, [formData, mcpJsonErrors])

  // Handle form submission
  const handleSubmit = useCallback(() => {
    if (validateForm()) {
      // Generate ID from name if not editing
      const id = techStack?.id || generateId(formData.name || "")

      onSave({
        id,
        name: formData.name || "",
        category: formData.category || "Other",
        description: formData.description || "",
        longDescription: formData.longDescription || "",
        icon: formData.icon || iconOptions[0].component,
        popularity: formData.popularity || 5,
        version: formData.version || "",
        releaseDate: formData.releaseDate || "",
        isNew: formData.isNew || false,
        documentationLinks: formData.documentationLinks || [],
        mcpServers: formData.mcpServers || [],
      })
    }
  }, [formData, techStack, validateForm, onSave])

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>{techStack ? "Edit Tech Stack" : "Add New Tech Stack"}</ModalTitle>
          <CloseButton onClick={onClose}>
            <CloseIcon width={18} height={18} />
          </CloseButton>
        </ModalHeader>

        <FormContent>
          {/* Basic Information Section */}
          <FormSection>
            <SectionTitle>Basic Information</SectionTitle>

            <FormRow>
              <FormGroup>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleChange}
                  placeholder="e.g. React"
                  $hasError={!!errors.name}
                />
                {errors.name && <ErrorMessage>{errors.name}</ErrorMessage>}
              </FormGroup>

              <FormGroup>
                <Label htmlFor="category">Category *</Label>
                <Select
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
                </Select>
                {errors.category && <ErrorMessage>{errors.category}</ErrorMessage>}
              </FormGroup>
            </FormRow>

            <FormGroup $fullWidth>
              <Label htmlFor="description">Short Description *</Label>
              <Input
                id="description"
                name="description"
                value={formData.description || ""}
                onChange={handleChange}
                placeholder="Brief description (1-2 sentences)"
                $hasError={!!errors.description}
              />
              {errors.description && <ErrorMessage>{errors.description}</ErrorMessage>}
            </FormGroup>

            <FormGroup $fullWidth>
              <Label htmlFor="longDescription">Detailed Description</Label>
              <TextArea
                id="longDescription"
                name="longDescription"
                value={formData.longDescription || ""}
                onChange={handleChange}
                placeholder="Detailed description of the technology"
              />
            </FormGroup>

            <FormRow>
              <FormGroup>
                <Label htmlFor="version">Version</Label>
                <Input
                  id="version"
                  name="version"
                  value={formData.version || ""}
                  onChange={handleChange}
                  placeholder="e.g. 18.2.0"
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="popularity">Popularity (1-10)</Label>
                <Input
                  id="popularity"
                  name="popularity"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.popularity || 5}
                  onChange={handleChange}
                />
              </FormGroup>
            </FormRow>

            <FormRow>
              <FormGroup>
                <Label htmlFor="releaseDate">Release Date</Label>
                <Input
                  id="releaseDate"
                  name="releaseDate"
                  type="date"
                  value={formData.releaseDate || ""}
                  onChange={handleChange}
                />
              </FormGroup>

              <FormGroup>
                <Label>Icon</Label>
                <IconSelector>
                  {iconOptions.map((option) => (
                    <IconOption
                      key={option.id}
                      $selected={selectedIconId === option.id}
                      onClick={() => handleIconSelect(option.id)}
                    >
                      {option.component}
                    </IconOption>
                  ))}
                </IconSelector>
              </FormGroup>
            </FormRow>

            <Checkbox>
              <input
                id="isNew"
                name="isNew"
                type="checkbox"
                checked={formData.isNew || false}
                onChange={handleCheckboxChange}
              />
              <label htmlFor="isNew">Mark as New</label>
            </Checkbox>
          </FormSection>

          {/* Documentation Links Section */}
          <FormSection>
            <SectionTitle>Documentation Links</SectionTitle>

            {(formData.documentationLinks || []).map((link, index) => (
              <LinkItem key={index}>
                <LinkFields>
                  <LinkRow>
                    <FormGroup>
                      <Label htmlFor={`docLink_${index}_name`}>Name *</Label>
                      <Input
                        id={`docLink_${index}_name`}
                        value={link.name}
                        onChange={(e) => handleDocLinkChange(index, "name", e.target.value)}
                        placeholder="e.g. Official Documentation"
                        $hasError={!!errors[`docLink_${index}_name`]}
                      />
                      {errors[`docLink_${index}_name`] && (
                        <ErrorMessage>{errors[`docLink_${index}_name`]}</ErrorMessage>
                      )}
                    </FormGroup>

                    <FormGroup>
                      <Label htmlFor={`docLink_${index}_url`}>URL *</Label>
                      <Input
                        id={`docLink_${index}_url`}
                        value={link.url}
                        onChange={(e) => handleDocLinkChange(index, "url", e.target.value)}
                        placeholder="https://example.com/docs"
                        $hasError={!!errors[`docLink_${index}_url`]}
                      />
                      {errors[`docLink_${index}_url`] && <ErrorMessage>{errors[`docLink_${index}_url`]}</ErrorMessage>}
                    </FormGroup>
                  </LinkRow>

                  <FormGroup $fullWidth>
                    <Label htmlFor={`docLink_${index}_description`}>Description</Label>
                    <Input
                      id={`docLink_${index}_description`}
                      value={link.description || ""}
                      onChange={(e) => handleDocLinkChange(index, "description", e.target.value)}
                      placeholder="Brief description of this resource"
                    />
                  </FormGroup>
                </LinkFields>

                <RemoveButton onClick={() => handleRemoveDocLink(index)}>
                  <TrashIcon width={16} height={16} />
                </RemoveButton>
              </LinkItem>
            ))}

            <AddButton onClick={handleAddDocLink}>
              <PlusIcon width={14} height={14} />
              Add Documentation Link
            </AddButton>
          </FormSection>

          {/* MCP Servers Section */}
          <FormSection>
            <SectionTitle>MCP Servers</SectionTitle>

            {(formData.mcpServers || []).map((server, index) => (
              <LinkItem key={index}>
                <LinkFields>
                  <FormGroup $fullWidth>
                    <Label htmlFor={`mcpServer_${index}_name`}>Server Name</Label>
                    <Input
                      id={`mcpServer_${index}_name`}
                      value={server.name}
                      onChange={(e) => handleMcpServerNameChange(index, e.target.value)}
                      placeholder="e.g. production-server-01"
                    />
                  </FormGroup>

                  <FormGroup $fullWidth>
                    <Label htmlFor={`mcpServer_${index}_config`}>Configuration (JSON)</Label>
                    <JsonEditor
                      id={`mcpServer_${index}_config`}
                      value={JSON.stringify(server.configuration, null, 2)}
                      onChange={(e) => handleMcpServerConfigChange(index, e.target.value)}
                      $hasError={!!mcpJsonErrors[index]}
                    />
                    {mcpJsonErrors[index] && <ErrorMessage>{mcpJsonErrors[index]}</ErrorMessage>}
                  </FormGroup>
                </LinkFields>

                <RemoveButton onClick={() => handleRemoveMcpServer(index)}>
                  <TrashIcon width={16} height={16} />
                </RemoveButton>
              </LinkItem>
            ))}

            <AddButton onClick={handleAddMcpServer}>
              <PlusIcon width={14} height={14} />
              Add MCP Server
            </AddButton>
          </FormSection>
        </FormContent>

        <ModalFooter>
          <CancelButton onClick={onClose}>Cancel</CancelButton>
          <Button onClick={handleSubmit}>Save Tech Stack</Button>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  )
}

export default TechStackForm
