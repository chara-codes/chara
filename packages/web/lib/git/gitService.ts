import git from 'isomorphic-git';
import { promises as fs } from 'fs';
import http from 'isomorphic-git/http/web';
import LightningFS from '@isomorphic-git/lightning-fs';

// Types for our git service
export interface GitCommit {
  oid: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      timestamp: number;
    };
    committer: {
      name: string;
      email: string;
      timestamp: number;
    };
  };
}

export interface FileHistoryItem {
  commit: GitCommit;
  content: string;
}

export interface GitDiff {
  path: string;
  oldContent: string;
  newContent: string;
  changes: Array<{
    type: 'added' | 'removed' | 'unchanged';
    content: string;
    lineNumber: number;
  }>;
}

// Initialize a lightning fs instance
const fs = new LightningFS('chara-fs');

class GitService {
  private dir: string;
  private url: string;
  private corsProxy: string | undefined;
  private initialized: boolean = false;

  constructor(repoUrl: string, dir: string = '/repo', corsProxy?: string) {
    this.url = repoUrl;
    this.dir = dir;
    this.corsProxy = corsProxy;
  }

  /**
   * Initialize the repository by cloning it
   */
  async initRepo(branch: string = 'main'): Promise<void> {
    if (this.initialized) return;
    
    try {
      await git.clone({
        fs,
        http,
        dir: this.dir,
        url: this.url,
        corsProxy: this.corsProxy,
        singleBranch: true,
        depth: 10, // Limit history depth for performance
        ref: branch
      });
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize git repository:', error);
      throw new Error(`Failed to initialize git repository: ${error.message}`);
    }
  }

  /**
   * Get the commit history for a specific file
   */
  async getFileHistory(filePath: string, depth: number = 10): Promise<GitCommit[]> {
    if (!this.initialized) {
      await this.initRepo();
    }

    try {
      const commits = await git.log({
        fs,
        dir: this.dir,
        depth,
        filepath: filePath
      });
      
      return commits;
    } catch (error) {
      console.error(`Failed to get history for file ${filePath}:`, error);
      throw new Error(`Failed to get history for file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Get the content of a file at a specific commit
   */
  async getFileAtCommit(filePath: string, commitOid: string): Promise<string> {
    if (!this.initialized) {
      await this.initRepo();
    }

    try {
      const { blob } = await git.readBlob({
        fs,
        dir: this.dir,
        oid: commitOid,
        filepath: filePath
      });
      
      return new TextDecoder().decode(blob);
    } catch (error) {
      console.error(`Failed to get file ${filePath} at commit ${commitOid}:`, error);
      throw new Error(`Failed to get file ${filePath} at commit ${commitOid}: ${error.message}`);
    }
  }

  /**
   * Get complete file history with content
   */
  async getFullFileHistory(filePath: string, depth: number = 10): Promise<FileHistoryItem[]> {
    const commits = await this.getFileHistory(filePath, depth);
    const history: FileHistoryItem[] = [];

    for (const commit of commits) {
      try {
        const content = await this.getFileAtCommit(filePath, commit.oid);
        history.push({
          commit,
          content
        });
      } catch (error) {
        console.warn(`Couldn't get content for commit ${commit.oid}:`, error);
        // Continue with other commits even if one fails
      }
    }

    return history;
  }

  /**
   * Compare two versions of a file
   */
  async compareVersions(
    filePath: string, 
    oldCommitOid: string, 
    newCommitOid: string
  ): Promise<GitDiff> {
    const oldContent = await this.getFileAtCommit(filePath, oldCommitOid);
    const newContent = await this.getFileAtCommit(filePath, newCommitOid);
    
    // Simple line-by-line diff
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    
    const changes = [];
    const maxLines = Math.max(oldLines.length, newLines.length);
    
    for (let i = 0; i < maxLines; i++) {
      const oldLine = oldLines[i] || '';
      const newLine = newLines[i] || '';
      
      if (oldLine === newLine) {
        changes.push({
          type: 'unchanged',
          content: oldLine,
          lineNumber: i + 1
        });
      } else {
        if (oldLine) {
          changes.push({
            type: 'removed',
            content: oldLine,
            lineNumber: i + 1
          });
        }
        if (newLine) {
          changes.push({
            type: 'added',
            content: newLine,
            lineNumber: i + 1
          });
        }
      }
    }
    
    return {
      path: filePath,
      oldContent,
      newContent,
      changes
    };
  }

  /**
   * Get current branch name
   */
  async getCurrentBranch(): Promise<string> {
    if (!this.initialized) {
      await this.initRepo();
    }
    
    try {
      const currentBranch = await git.currentBranch({
        fs,
        dir: this.dir,
        fullname: false
      });
      
      return currentBranch || 'main';
    } catch (error) {
      console.error('Failed to get current branch:', error);
      return 'main'; // Default to main if we can't determine the branch
    }
  }

  /**
   * List all available branches
   */
  async listBranches(): Promise<string[]> {
    if (!this.initialized) {
      await this.initRepo();
    }
    
    try {
      const branches = await git.listBranches({
        fs,
        dir: this.dir
      });
      
      return branches;
    } catch (error) {
      console.error('Failed to list branches:', error);
      throw new Error(`Failed to list branches: ${error.message}`);
    }
  }

  /**
   * Check if a repository is already initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

export default GitService;