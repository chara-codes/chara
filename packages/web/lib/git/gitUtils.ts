import LightningFS from '@isomorphic-git/lightning-fs';
import { GitCommit } from './gitService';

/**
 * Git utility functions for the browser environment
 */
export const GitUtils = {
  /**
   * Parse and normalize a Git repository URL
   * 
   * @param url The repository URL to parse
   * @returns Normalized URL
   */
  parseRepoUrl(url: string): string {
    // Remove trailing .git if present
    url = url.replace(/\.git$/, '');
    
    // Handle GitHub URLs
    if (url.includes('github.com')) {
      // Convert github.com/user/repo to https://github.com/user/repo
      if (!url.startsWith('http')) {
        if (url.startsWith('github.com')) {
          url = 'https://' + url;
        } else {
          url = 'https://github.com/' + url;
        }
      }
    }
    
    return url;
  },
  
  /**
   * Get a CORS proxy URL for the given repository URL
   * 
   * @param repoUrl The repository URL
   * @returns A suitable CORS proxy URL or undefined if not needed
   */
  getCorsProxyForRepo(repoUrl: string): string | undefined {
    // Return a suitable CORS proxy based on the repo provider
    if (repoUrl.includes('github.com')) {
      return 'https://cors.isomorphic-git.org';
    }
    
    return undefined;
  },
  
  /**
   * Check if a repository URL is valid
   * 
   * @param url The repository URL to validate
   * @returns Whether the URL appears to be a valid Git repository
   */
  isValidRepoUrl(url: string): boolean {
    if (!url) return false;
    
    // Check for common Git providers
    const providers = [
      'github.com',
      'gitlab.com',
      'bitbucket.org',
      'dev.azure.com',
      'git.sr.ht'
    ];
    
    return providers.some(provider => url.includes(provider)) || 
           url.includes('.git') ||
           url.includes('/git/');
  },
  
  /**
   * Extract owner and repository name from a Git URL
   * 
   * @param url The repository URL
   * @returns An object with owner and repo properties, or null if not extractable
   */
  extractRepoInfo(url: string): { owner: string; repo: string } | null {
    try {
      const parsed = new URL(url);
      const pathParts = parsed.pathname.split('/').filter(Boolean);
      
      if (pathParts.length >= 2) {
        return {
          owner: pathParts[0],
          repo: pathParts[1].replace('.git', '')
        };
      }
    } catch (e) {
      // URL parsing failed, try simple regex
      const match = url.match(/([^\/]+)\/([^\/]+)(?:\.git)?$/);
      if (match) {
        return {
          owner: match[1],
          repo: match[2].replace('.git', '')
        };
      }
    }
    
    return null;
  },
  
  /**
   * Create a file system for isomorphic-git
   * 
   * @param name The name for the file system
   * @returns A LightningFS instance
   */
  createFileSystem(name: string = 'git-fs'): LightningFS {
    return new LightningFS(name);
  },
  
  /**
   * Format a commit for display
   * 
   * @param commit The Git commit to format
   * @returns A formatted commit object with additional display properties
   */
  formatCommit(commit: GitCommit): GitCommit & { 
    shortHash: string; 
    formattedDate: string;
    timeAgo: string;
  } {
    const date = new Date(commit.commit.author.timestamp * 1000);
    
    return {
      ...commit,
      shortHash: commit.oid.substring(0, 7),
      formattedDate: date.toLocaleString(),
      timeAgo: GitUtils.getTimeAgo(date)
    };
  },
  
  /**
   * Get a human-readable time ago string
   * 
   * @param date The date to calculate from
   * @returns A human-readable relative time string
   */
  getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) {
      return Math.floor(interval) + " years ago";
    }
    
    interval = seconds / 2592000;
    if (interval > 1) {
      return Math.floor(interval) + " months ago";
    }
    
    interval = seconds / 86400;
    if (interval > 1) {
      return Math.floor(interval) + " days ago";
    }
    
    interval = seconds / 3600;
    if (interval > 1) {
      return Math.floor(interval) + " hours ago";
    }
    
    interval = seconds / 60;
    if (interval > 1) {
      return Math.floor(interval) + " minutes ago";
    }
    
    return Math.floor(seconds) + " seconds ago";
  },
  
  /**
   * Get a colored background class for a diff line type
   * 
   * @param type The type of diff line ('added', 'removed', or 'unchanged')
   * @returns A CSS class string for the background
   */
  getDiffBackgroundClass(type: 'added' | 'removed' | 'unchanged'): string {
    switch (type) {
      case 'added':
        return 'bg-green-100 dark:bg-green-900/30';
      case 'removed':
        return 'bg-red-100 dark:bg-red-900/30';
      default:
        return '';
    }
  },
  
  /**
   * Convert a browser fs path to a repository relative path
   * 
   * @param fsPath The path in the browser filesystem
   * @param repoDir The repository directory
   * @returns A path relative to the repository root
   */
  fsPathToRepoPath(fsPath: string, repoDir: string): string {
    if (fsPath.startsWith(repoDir)) {
      return fsPath.slice(repoDir.length > 1 ? repoDir.length + 1 : repoDir.length);
    }
    return fsPath;
  },
  
  /**
   * Convert a repository relative path to a browser fs path
   * 
   * @param repoPath The path relative to the repository
   * @param repoDir The repository directory
   * @returns A full path in the browser filesystem
   */
  repoPathToFsPath(repoPath: string, repoDir: string): string {
    if (repoPath.startsWith('/')) {
      repoPath = repoPath.slice(1);
    }
    
    return repoDir + (repoDir.endsWith('/') ? '' : '/') + repoPath;
  },
  
  /**
   * Create a download URL for a file in the repository
   * 
   * @param repoUrl The repository URL
   * @param filePath The path to the file
   * @param branch The branch name
   * @returns A URL that can be used to download the file
   */
  createFileDownloadUrl(repoUrl: string, filePath: string, branch: string = 'main'): string | null {
    const repoInfo = GitUtils.extractRepoInfo(repoUrl);
    if (!repoInfo) return null;
    
    if (repoUrl.includes('github.com')) {
      return `https://raw.githubusercontent.com/${repoInfo.owner}/${repoInfo.repo}/${branch}/${filePath}`;
    }
    
    return null;
  }
};

export default GitUtils;