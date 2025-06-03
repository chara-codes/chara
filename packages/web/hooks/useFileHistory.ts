import { useState, useEffect, useCallback } from 'react';
import browserGitService from '../lib/git/browserGitService';
import { FileHistoryItem, GitCommit, GitDiff } from '../lib/git/gitService';

interface UseFileHistoryOptions {
  autoInit?: boolean;
  defaultBranch?: string;
  corsProxy?: string;
}

interface UseFileHistoryState {
  isLoading: boolean;
  error: Error | null;
  fileHistory: FileHistoryItem[] | null;
  currentBranch: string | null;
  availableBranches: string[] | null;
}

export function useFileHistory(
  repoUrl?: string,
  options: UseFileHistoryOptions = {}
) {
  const {
    autoInit = false,
    defaultBranch = 'main',
    corsProxy,
  } = options;

  const [state, setState] = useState<UseFileHistoryState>({
    isLoading: false,
    error: null,
    fileHistory: null,
    currentBranch: null,
    availableBranches: null,
  });

  // Initialize repository
  const initRepo = useCallback(
    async (branch: string = defaultBranch) => {
      if (!repoUrl) return;

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        browserGitService.configure(repoUrl, '/repo', corsProxy);
        await browserGitService.initRepo(branch);
        
        // Get current branch and available branches
        const currentBranch = await browserGitService.getCurrentBranch();
        const availableBranches = await browserGitService.listBranches();
        
        setState((prev) => ({
          ...prev,
          isLoading: false,
          currentBranch,
          availableBranches,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error : new Error(String(error)),
        }));
      }
    },
    [repoUrl, corsProxy, defaultBranch]
  );

  // Get file history
  const getFileHistory = useCallback(
    async (filePath: string, depth: number = 10) => {
      if (!browserGitService.isInitialized()) {
        await initRepo();
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const history = await browserGitService.getFullFileHistory(filePath, depth);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          fileHistory: history,
        }));
        return history;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error : new Error(String(error)),
        }));
        return null;
      }
    },
    [initRepo]
  );

  // Compare two versions
  const compareVersions = useCallback(
    async (filePath: string, oldCommitOid: string, newCommitOid: string): Promise<GitDiff | null> => {
      if (!browserGitService.isInitialized()) {
        await initRepo();
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const diff = await browserGitService.compareVersions(
          filePath,
          oldCommitOid,
          newCommitOid
        );
        setState((prev) => ({ ...prev, isLoading: false }));
        return diff;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error : new Error(String(error)),
        }));
        return null;
      }
    },
    [initRepo]
  );

  // Change branch
  const changeBranch = useCallback(
    async (branch: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        await initRepo(branch);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          currentBranch: branch,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error : new Error(String(error)),
        }));
      }
    },
    [initRepo]
  );

  // Clear repository data
  const clearRepository = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      await browserGitService.clearRepository();
      setState({
        isLoading: false,
        error: null,
        fileHistory: null,
        currentBranch: null,
        availableBranches: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error(String(error)),
      }));
    }
  }, []);

  // Auto-initialize when repoUrl is provided and autoInit is true
  useEffect(() => {
    if (repoUrl && autoInit && !browserGitService.isInitialized()) {
      initRepo();
    }
  }, [repoUrl, autoInit, initRepo]);

  return {
    ...state,
    initRepo,
    getFileHistory,
    compareVersions,
    changeBranch,
    clearRepository,
    isInitialized: browserGitService.isInitialized(),
  };
}

export default useFileHistory;