import GitService, { FileHistoryItem, GitCommit, GitDiff } from './gitService';
import LightningFS from '@isomorphic-git/lightning-fs';

// Initialize browser filesystem
const fs = new LightningFS('chara-fs');

/**
 * Browser-specific Git service wrapper
 * Provides a singleton instance and browser-specific adaptations
 */
class BrowserGitService {
  private static instance: BrowserGitService;
  private gitService: GitService | null = null;
  private repoUrl: string | null = null;
  private repoDir: string = '/repo';
  
  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  /**
   * Get the singleton instance of the BrowserGitService
   */
  public static getInstance(): BrowserGitService {
    if (!BrowserGitService.instance) {
      BrowserGitService.instance = new BrowserGitService();
    }
    return BrowserGitService.instance;
  }

  /**
   * Configure the Git service with repository information
   */
  public configure(repoUrl: string, repoDir: string = '/repo', corsProxy?: string): void {
    this.repoUrl = repoUrl;
    this.repoDir = repoDir;
    
    // Initialize GitService with the provided configuration
    this.gitService = new GitService(repoUrl, repoDir, corsProxy);
  }

  /**
   * Initialize or clone the repository
   */
  public async initRepo(branch: string = 'main'): Promise<void> {
    if (!this.gitService) {
      throw new Error('Git service not configured. Call configure() first.');
    }
    
    try {
      await this.gitService.initRepo(branch);
      // Store information in localStorage to persist across page refreshes
      this.saveRepoConfigToLocalStorage();
    } catch (error) {
      console.error('Failed to initialize repository in browser:', error);
      throw error;
    }
  }

  /**
   * Get file history
   */
  public async getFileHistory(filePath: string, depth: number = 10): Promise<GitCommit[]> {
    if (!this.gitService) {
      await this.restoreFromLocalStorage();
    }
    
    if (!this.gitService) {
      throw new Error('Git service not configured. Call configure() first.');
    }
    
    return this.gitService.getFileHistory(filePath, depth);
  }

  /**
   * Get complete file history with content
   */
  public async getFullFileHistory(filePath: string, depth: number = 10): Promise<FileHistoryItem[]> {
    if (!this.gitService) {
      await this.restoreFromLocalStorage();
    }
    
    if (!this.gitService) {
      throw new Error('Git service not configured. Call configure() first.');
    }
    
    return this.gitService.getFullFileHistory(filePath, depth);
  }

  /**
   * Compare two versions of a file
   */
  public async compareVersions(
    filePath: string, 
    oldCommitOid: string, 
    newCommitOid: string
  ): Promise<GitDiff> {
    if (!this.gitService) {
      await this.restoreFromLocalStorage();
    }
    
    if (!this.gitService) {
      throw new Error('Git service not configured. Call configure() first.');
    }
    
    return this.gitService.compareVersions(filePath, oldCommitOid, newCommitOid);
  }

  /**
   * Get current branch name
   */
  public async getCurrentBranch(): Promise<string> {
    if (!this.gitService) {
      await this.restoreFromLocalStorage();
    }
    
    if (!this.gitService) {
      throw new Error('Git service not configured. Call configure() first.');
    }
    
    return this.gitService.getCurrentBranch();
  }

  /**
   * List all available branches
   */
  public async listBranches(): Promise<string[]> {
    if (!this.gitService) {
      await this.restoreFromLocalStorage();
    }
    
    if (!this.gitService) {
      throw new Error('Git service not configured. Call configure() first.');
    }
    
    return this.gitService.listBranches();
  }

  /**
   * Check if repository is initialized
   */
  public isInitialized(): boolean {
    return this.gitService?.isInitialized() || false;
  }

  /**
   * Save repository configuration to localStorage
   */
  private saveRepoConfigToLocalStorage(): void {
    if (typeof window !== 'undefined' && this.repoUrl) {
      localStorage.setItem('chara-git-repo-url', this.repoUrl);
      localStorage.setItem('chara-git-repo-dir', this.repoDir);
    }
  }

  /**
   * Restore configuration from localStorage if available
   */
  private async restoreFromLocalStorage(): Promise<void> {
    if (typeof window !== 'undefined') {
      const storedUrl = localStorage.getItem('chara-git-repo-url');
      const storedDir = localStorage.getItem('chara-git-repo-dir') || '/repo';
      
      if (storedUrl) {
        this.configure(storedUrl, storedDir);
        
        // Don't automatically initialize to avoid unwanted network requests
        // The application should explicitly call initRepo when needed
      }
    }
  }

  /**
   * Clear repository data and configuration
   */
  public async clearRepository(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('chara-git-repo-url');
      localStorage.removeItem('chara-git-repo-dir');
    }
    
    // Reset the service
    this.gitService = null;
    this.repoUrl = null;
    this.repoDir = '/repo';
    
    // Clear the file system data if possible
    try {
      await fs.promises.rmdir(this.repoDir, { recursive: true });
    } catch (error) {
      console.warn('Failed to clear repository data:', error);
      // Continue even if cleaning fails
    }
  }
}

// Export the singleton instance
const browserGitService = BrowserGitService.getInstance();
export default browserGitService;