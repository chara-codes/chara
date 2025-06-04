/**
 * Preview file representation
 */
export interface PreviewFile {
  /**
   * Unique identifier for the file
   */
  id: string;

  /**
   * File name with extension
   */
  name: string;

  /**
   * File content as string
   */
  content: string;

  /**
   * File type/extension
   */
  type: string;

  /**
   * File path relative to project root
   */
  path: string;

  /**
   * Whether this file is currently active/selected
   */
  isActive: boolean;
}

/**
 * Preview folder representation
 */
export interface PreviewFolder {
  /**
   * Unique identifier for the folder
   */
  id: string;

  /**
   * Folder name
   */
  name: string;

  /**
   * Folder path relative to project root
   */
  path: string;

  /**
   * Child folders (if any)
   */
  children: (PreviewFile | PreviewFolder)[];

  /**
   * Whether this folder is expanded/open
   */
  isOpen: boolean;
}

/**
 * Preview modes
 */
export type PreviewMode = "editor" | "split" | "preview";
export interface PreviewState {
  files: PreviewFile[];
  folders: PreviewFolder[];
  activeFileId: string | null;
}
