import type {
  PreviewFile,
  PreviewFolder,
  PreviewState,
  PreviewMode
} from '@frontend/core';

// Additional package-specific types
export interface PreviewContainerProps {
  /**
   * Initial files to display
   */
  files?: PreviewFile[];

  /**
   * Initial folders structure
   */
  folders?: PreviewFolder[];

  /**
   * Initial active file ID
   */
  initialActiveFileId?: string | null;

  /**
   * Initial preview mode
   */
  initialMode?: PreviewMode;

  /**
   * Should files be editable
   */
  readOnly?: boolean;

  /**
   * Handler for file content changes
   */
  onFileChange?: (file: PreviewFile) => void;

  /**
   * Handler for file selection
   */
  onFileSelect?: (fileId: string) => void;

  /**
   * Handler for creating a new file
   */
  onCreateFile?: (path: string, name: string) => Promise<PreviewFile | null>;

  /**
   * Handler for creating a new folder
   */
  onCreateFolder?: (path: string, name: string) => Promise<PreviewFolder | null>;

  /**
   * Handler for deleting a file
   */
  onDeleteFile?: (fileId: string) => Promise<boolean>;

  /**
   * Handler for deleting a folder
   */
  onDeleteFolder?: (folderId: string) => Promise<boolean>;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Show the toolbar with mode toggle
   */
  showToolbar?: boolean;

  /**
   * Custom theme for the editor
   */
  theme?: 'light' | 'dark' | 'auto';
}

export interface FileExplorerProps {
  /**
   * Folders structure to display
   */
  folders: PreviewFolder[];

  /**
   * All files in the project
   */
  files: PreviewFile[];

  /**
   * ID of the currently active file
   */
  activeFileId: string | null;

  /**
   * Handler for file selection
   */
  onSelectFile: (fileId: string) => void;

  /**
   * Handler for toggling folder open/closed state
   */
  onToggleFolder: (folderId: string) => void;

  /**
   * Handler for creating a new file
   */
  onCreateFile?: (path: string, name: string) => void;

  /**
   * Handler for creating a new folder
   */
  onCreateFolder?: (path: string, name: string) => void;

  /**
   * Handler for deleting a file
   */
  onDeleteFile?: (fileId: string) => void;

  /**
   * Handler for deleting a folder
   */
  onDeleteFolder?: (folderId: string) => void;

  /**
   * Additional CSS classes
   */
  className?: string;
}

export interface EditorProps {
  /**
   * File to display in the editor
   */
  file: PreviewFile | null;

  /**
   * Is editor in read-only mode
   */
  readOnly?: boolean;

  /**
   * Handler for file content changes
   */
  onChange?: (content: string) => void;

  /**
   * Editor theme
   */
  theme?: 'light' | 'dark' | 'auto';

  /**
   * Additional CSS classes
   */
  className?: string;
}

export interface PreviewPaneProps {
  /**
   * File to preview
   */
  file: PreviewFile | null;

  /**
   * Additional CSS classes
   */
  className?: string;
}

export interface UsePreviewOptions {
  /**
   * Initial files to display
   */
  initialFiles?: PreviewFile[];

  /**
   * Initial folders structure
   */
  initialFolders?: PreviewFolder[];

  /**
   * Initial active file ID
   */
  initialActiveFileId?: string | null;

  /**
   * Initial preview mode
   */
  initialMode?: PreviewMode;
}

export interface UsePreviewResult {
  /**
   * All files in the project
   */
  files: PreviewFile[];

  /**
   * Folders structure
   */
  folders: PreviewFolder[];

  /**
   * ID of the currently active file
   */
  activeFileId: string | null;

  /**
   * Currently active file
   */
  activeFile: PreviewFile | null;

  /**
   * Current preview mode
   */
  mode: any;//PreviewMode;

  /**
   * Set active file by ID
   */
  setActiveFile: (fileId: string) => void;

  /**
   * Set preview mode
   */
  setMode: (mode: PreviewMode) => void;

  /**
   * Toggle a folder's open/closed state
   */
  toggleFolder: (folderId: string) => void;

  /**
   * Update a file's content
   */
  updateFileContent: (fileId: string, content: string) => void;

  /**
   * Create a new file
   */
  createFile: (path: string, name: string, content?: string) => PreviewFile;

  /**
   * Create a new folder
   */
  createFolder: (path: string, name: string) => PreviewFolder;

  /**
   * Delete a file
   */
  deleteFile: (fileId: string) => void;

  /**
   * Delete a folder
   */
  deleteFolder: (folderId: string) => void;
}
