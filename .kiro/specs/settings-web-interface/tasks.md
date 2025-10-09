# Implementation Plan

- [x] 1. Set up TRPC router and settings service foundation
  - Create settings TRPC router in @chara-codes/server with providers, models, and config endpoints
  - Implement settings service class that interfaces with @chara/settings global configuration
  - Add provider configuration types and validation schemas
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 2. Implement provider management backend functionality
  - [x] 2.1 Create provider CRUD operations in settings service
    - Implement create, read, update, delete operations for provider configurations
    - Add provider validation logic using provider config to determine required fields
    - Write unit tests for provider management operations
    - _Requirements: 2.1, 2.3, 2.4, 2.5_

  - [x] 2.2 Implement provider TRPC endpoints
    - Create TRPC procedures for provider list, create, update, delete operations
    - Add input validation and error handling for provider operations
    - Write integration tests for provider TRPC endpoints
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 7.1_

- [x] 3. Implement model management backend functionality
  - [x] 3.1 Create enabled models management in settings service
    - Implement functions to get/set enabled models list in global settings
    - Add integration with agents service models controller to fetch available models
    - Write unit tests for enabled models operations
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 6.1_

  - [x] 3.2 Implement model TRPC endpoints
    - Create TRPC procedures for getting available models, enabled models, enable/disable operations
    - Add model validation and error handling for enable/disable operations
    - Write integration tests for model TRPC endpoints
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6, 7.2_

- [x] 4. Update existing settings web interface components
  - [x] 4.1 Update settings page container with provider and model management
    - Modify existing settings page to add tab navigation between providers and models sections
    - Add TRPC provider setup and integrate with existing error handling patterns
    - Update loading states and error display to match existing interface styles
    - _Requirements: 1.1, 1.2, 7.3, 7.5_

  - [x] 4.2 Build provider management UI components using existing design system
    - Create provider list component using existing card/list styling patterns
    - Implement provider form component with dynamic fields matching existing form styles
    - Build provider card component following existing component design patterns
    - Add provider type selection and form validation using existing validation styles
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 7.1, 7.4_

  - [x] 4.3 Build model management UI components using existing design system
    - Create model list component following existing list/grid styling patterns
    - Implement model card component using existing card design and toggle styles
    - Add model filtering and grouping using existing filter component patterns
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 7.2_

- [x] 5. Implement enhanced model dropdown functionality
  - [x] 5.1 Create enhanced model dropdown component
    - Build dropdown component that shows only enabled models plus "Add model..." option
    - Implement model selection handling and state management
    - Add integration with existing chat interface model selection
    - _Requirements: 4.1, 4.2, 4.5_

  - [x] 5.2 Build add model dialog and workflow
    - Create modal dialog for selecting and enabling new models from available list
    - Implement model search and filtering within the add model dialog
    - Add model enabling workflow with validation and error handling
    - _Requirements: 4.2, 4.3, 4.4, 7.2_

- [ ] 6. Implement settings persistence and validation
  - [ ] 6.1 Add settings validation and error handling
    - Implement comprehensive validation for provider configurations
    - Add error handling for model enabling/disabling operations
    - Create user-friendly error messages and validation feedback
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ] 6.2 Implement settings persistence and recovery
    - Add settings persistence across application restarts using global settings
    - Implement error recovery and fallback behavior for corrupted settings
    - Add settings migration logic for existing configurations
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 7. Integrate settings with existing application workflow
  - [x] 7.1 Update model dropdown in chat interface
    - Modify existing model dropdown to use enabled models from settings
    - Add "Add model..." option to existing chat interface model selection
    - Ensure backward compatibility with existing model selection behavior
    - _Requirements: 4.1, 4.2, 4.5_

  - [ ] 7.2 Update settings navigation and access points
    - Update existing settings page route to include provider and model management sections
    - Implement deep linking to specific settings sections (providers/models) within existing navigation
    - Add settings access from model dropdown and integrate with existing UI patterns
    - _Requirements: 1.1, 1.2_

- [ ] 8. Write comprehensive tests and documentation
  - [ ] 8.1 Create unit tests for all components and services
    - Write unit tests for settings service provider and model operations
    - Create component tests for all settings UI components
    - Add validation and error handling test coverage
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ] 8.2 Write integration and end-to-end tests
    - Create integration tests for TRPC settings endpoints
    - Write end-to-end tests for complete provider setup and model enabling workflows
    - Add tests for settings persistence and application restart scenarios
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_