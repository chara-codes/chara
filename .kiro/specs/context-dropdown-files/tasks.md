# Implementation Plan

- [x] 1. Create file services in packages/server
  - Create FileListingService class that scans current working directory
  - Create FileContentService class that reads file content by path
  - Implement GitIgnore integration using ignore package to exclude .gitignore patterns
  - Add proper error handling for file system operations
  - _Requirements: 3.1, 3.2, 3.3, 6.1, 6.2_
  - _Status: Completed - Both FileListingService and FileContentService are fully implemented with GitIgnore support_

- [x] 2. Create context TRPC router
  - [x] 2.1 Create new context router in packages/server/src/api/routes/context.ts
    - Implement getFileList endpoint that calls FileListingService with working directory from process.cwd()
    - Implement getFileContent endpoint that calls FileContentService
    - Add input validation using Zod schemas for maxDepth and includeHidden parameters
    - Add proper error handling with TRPCError for file operations
    - _Requirements: 3.6, 1.3, 2.1_

  - [x] 2.2 Export context router and integrate with main TRPC router in packages/server/src/server.ts
    - Import contextRouter in server.ts
    - Add context router to appRouter object
    - Verify TRPC client can access new endpoints through type inference
    - _Requirements: 3.6_

- [x] 3. Enhance dropdown items generator
  - [x] 3.1 Modify createDropdownItems function in packages/frontend/design-system/src/molecules/input-area/dropdown-items.ts
    - Add optional fileList parameter of type FileSystemEntry[] to function signature
    - Remove all hardcoded file items (file-1 through file-5)
    - Remove all Documentation section items (doc-1 through doc-5)
    - Create createFileItems helper function that processes FileSystemEntry[] into DropdownItem[]
    - Flatten nested file structure to show files with indentation based on depth
    - _Requirements: 1.2, 1.5, 7.2_

  - [x] 3.2 Implement file selection actions in createFileItems helper
    - Use getVanillaTrpcClient() to create TRPC client for fetching file content
    - Call context.getFileContent.query() when file is selected
    - Use chatStore.addContextItem to add file with name, type: "File", content, mimeType, and isBinary
    - Add try-catch error handling with console.error for file loading failures
    - _Requirements: 2.1, 2.2, 2.3, 7.1_

- [x] 4. Update input area component integration
  - [x] 4.1 Modify input area component in packages/frontend/design-system/src/molecules/input-area/input-area.tsx
    - Add trpc.context.getFileList.useQuery() hook with enabled: false to prevent auto-fetch
    - Trigger query manually when dropdown is opened or on component mount
    - Pass fileList data to createDropdownItems function
    - Handle loading and error states with appropriate UI feedback
    - _Requirements: 1.3, 1.4, 4.3_

  - [x] 4.2 Verify context integration and existing functionality
    - Test that files are added to context with correct metadata (name, type, content, mimeType, isBinary)
    - Verify file content appears in context display UI
    - Ensure Actions section (Select Element, Upload File) still works
    - Ensure Terminal section with runner processes still works
    - _Requirements: 7.1, 7.4, 7.5_

- [x] 5. Add file type detection and handling
  - [x] 5.1 Implement MIME type detection in FileContentService
    - Use custom MIME type mapping for common file extensions
    - Add binary file detection logic using null byte checking
    - Return appropriate metadata with file content
    - _Requirements: 5.1, 5.4, 2.4_
    - _Status: Completed - FileContentService has getMimeType() and isBinaryContent() methods_

  - [ ] 5.2 Handle different file types in frontend (Optional Enhancement)
    - Show appropriate file icons based on file extensions in dropdown
    - Display file size and modification date in dropdown item metadata
    - Add visual indicators for binary files
    - _Requirements: 5.1, 5.2, 5.5_

- [x] 6. Implement performance optimizations
  - [x] 6.1 Add file listing depth limits
    - Implement maxDepth parameter in file listing (default: 3)
    - Show loading indicators during file operations
    - _Requirements: 4.1, 4.2, 4.3_
    - _Status: Completed - FileListingService supports maxDepth and includeHidden parameters_

  - [ ] 6.2 Add file filtering capabilities (Optional Enhancement)
    - Implement file name and extension filtering in dropdown
    - Add search functionality for large file lists
    - Prioritize common development file types
    - _Requirements: 4.5, 5.3_

- [x]* 7. Add comprehensive error handling and logging
  - Implement structured error responses for all file operations
  - Add appropriate logging for debugging file system issues
  - Create user-friendly error messages for common failure scenarios
  - Handle edge cases like permission errors and missing files
  - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - _Status: Completed - Both services have comprehensive error handling and logging_

- [ ]* 8. Write unit tests for services and components
  - Create unit tests for FileListingService with various directory structures
  - Write tests for FileContentService with different file types
  - Test TRPC router endpoints with valid and invalid inputs
  - Create component tests for enhanced dropdown functionality
  - _Requirements: All requirements validation_