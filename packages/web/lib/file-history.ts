import { FileHistoryViewer, FileHistoryButton } from '../components/file-history';
import GitService, { GitCommit, GitDiff, FileHistoryItem } from './git/gitService';
import browserGitService from './git/browserGitService';
import GitUtils from './git/gitUtils';
import { useFileHistory } from '../hooks/useFileHistory';

/**
 * File History Module for Chara Codes
 * 
 * This module provides Git-based file history visualization in the browser
 * using isomorphic-git. It allows viewing commit history, comparing versions,
 * and examining diffs without requiring server-side Git.
 * 
 * For detailed documentation, see:
 * @see {@link /docs/file-history.md}
 */

/**
 * Initialize file history for a repository
 * 
 * @param repoUrl - The URL of the Git repository
 * @param options - Optional configuration options
 * @returns A promise that resolves when initialization is complete
 */
export async function initializeFileHistory(
  repoUrl: string, 
  options?: { 
    branch?: string; 
    repoDir?: string;
    corsProxy?: string;
  }
): Promise<void> {
  const { branch = 'main', repoDir = '/repo', corsProxy } = options || {};
  
  // Configure the Git service
  browserGitService.configure(
    repoUrl, 
    repoDir, 
    corsProxy || GitUtils.getCorsProxyForRepo(repoUrl)
  );
  
  // Initialize the repository
  return browserGitService.initRepo(branch);
}

/**
 * Get the file history for a specific file
 * 
 * @param filePath - The path to the file in the repository
 * @param depth - How many commits to fetch (default: 10)
 * @returns A promise that resolves to an array of file history items
 */
export async function getFileHistory(
  filePath: string, 
  depth: number = 10
): Promise<FileHistoryItem[]> {
  if (!browserGitService.isInitialized()) {
    throw new Error('File history has not been initialized. Call initializeFileHistory first.');
  }
  
  return browserGitService.getFullFileHistory(filePath, depth);
}

/**
 * Compare two versions of a file
 * 
 * @param filePath - The path to the file in the repository
 * @param oldCommitOid - The commit ID of the older version
 * @param newCommitOid - The commit ID of the newer version
 * @returns A promise that resolves to a diff object
 */
export async function compareFileVersions(
  filePath: string,
  oldCommitOid: string,
  newCommitOid: string
): Promise<GitDiff> {
  if (!browserGitService.isInitialized()) {
    throw new Error('File history has not been initialized. Call initializeFileHistory first.');
  }
  
  return browserGitService.compareVersions(filePath, oldCommitOid, newCommitOid);
}

/**
 * Clear all file history data
 * 
 * @returns A promise that resolves when clearing is complete
 */
export async function clearFileHistory(): Promise<void> {
  return browserGitService.clearRepository();
}

// Re-export components
export { FileHistoryViewer, FileHistoryButton };

// Re-export types
export type { GitCommit, GitDiff, FileHistoryItem };

// Re-export hook
export { useFileHistory };

// Re-export utilities
export { GitUtils };

// Re-export service for advanced usage
export { browserGitService, GitService };

// Default export for convenience
export default {
  initializeFileHistory,
  getFileHistory,
  compareFileVersions,
  clearFileHistory,
  FileHistoryViewer,
  FileHistoryButton,
  useFileHistory,
  GitUtils,
  browserGitService
};