export interface GitInitResult {
  status: "success" | "skipped";
  message: string;
  path: string;
  gitignoreUpdated?: boolean;
  initialCommitSha?: string;
  filesCommitted?: number;
}

export interface GitSaveResult {
  status: "success" | "no_changes";
  message: string;
  commitSha?: string;
  filesProcessed: number;
  commitMessage?: string;
  files?: string[];
}

export interface GitCommitInfo {
  oid: string;
  commit: {
    message: string;
    tree: string;
    parent: string[];
    author: {
      name: string;
      email: string;
      timestamp: number;
      timezoneOffset: number;
    };
    committer: {
      name: string;
      email: string;
      timestamp: number;
      timezoneOffset: number;
    };
    gpgsig?: string;
  };
  payload: string;
}

export interface GitLastCommitResult {
  status: "success" | "no_commits";
  message: string;
  commit?: GitCommitInfo;
}

export interface GitCommitHistoryResult {
  status: "success" | "no_commits";
  message: string;
  commits?: GitCommitInfo[];
  totalCount?: number;
}

export interface GitCommitByOidResult {
  status: "success" | "not_found";
  message: string;
  commit?: GitCommitInfo;
}

export interface GitHeadShaResult {
  status: "success" | "no_head";
  message: string;
  sha?: string;
}

export interface GitUncommittedChangesResult {
  status: "success";
  message: string;
  hasChanges: boolean;
  changedFiles?: string[];
}

export interface GitResetToCommitResult {
  status: "success" | "commit_not_found" | "error";
  message: string;
  targetCommitSha?: string;
  previousHeadSha?: string;
  commitsRemoved?: number;
}
