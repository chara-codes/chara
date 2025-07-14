# Git Service Documentation

The `IsoGitService` provides comprehensive Git operations for managing version history in the `.chara/history` directory using the isomorphic-git library.

## Overview

This service allows you to:
- Initialize Git repositories with automatic `.gitignore` setup
- Save changes to history with automatic commit detection
- Retrieve commit information and history
- Check repository status and uncommitted changes
- Make initial commits automatically during repository setup

## Installation

The service is available as part of the `@chara-codes/agents` package and uses `isomorphic-git` as the underlying Git implementation.

```typescript
import { isoGitService } from "@chara-codes/agents";
```

## API Reference

### Repository Management

#### `initializeRepository(workingDir: string): Promise<GitInitResult>`

Initializes a Git repository in the `.chara/history` directory. Also adds `.chara/` to the project's `.gitignore` file and creates an initial commit if files exist.

```typescript
const result = await isoGitService.initializeRepository("/path/to/project");
console.log(result.status); // "success" | "skipped"
console.log(result.message); // Human-readable message
console.log(result.path); // Path to the .chara/history directory
console.log(result.gitignoreUpdated); // true if .chara/ was added to .gitignore
console.log(result.initialCommitSha); // SHA of initial commit (if created)
console.log(result.filesCommitted); // Number of files in initial commit
```

#### `isRepositoryInitialized(workingDir: string): Promise<boolean>`

Checks if a Git repository is already initialized.

```typescript
const isInitialized = await isoGitService.isRepositoryInitialized("/path/to/project");
```

### Commit Operations

#### `saveToHistory(workingDir: string, commitMessage?: string): Promise<GitSaveResult>`

Saves all changes to Git history. Only commits files that have actually changed.

```typescript
const result = await isoGitService.saveToHistory(
  "/path/to/project",
  "Custom commit message"
);

console.log(result.status); // "success" | "no_changes"
console.log(result.commitSha); // SHA of the new commit
console.log(result.filesProcessed); // Number of files committed
console.log(result.files); // Array of committed file paths
```

### Commit Retrieval

#### `getLastCommit(workingDir: string): Promise<GitLastCommitResult>`

Retrieves information about the most recent commit.

```typescript
const result = await isoGitService.getLastCommit("/path/to/project");

if (result.status === "success" && result.commit) {
  console.log(result.commit.oid); // Commit SHA
  console.log(result.commit.commit.message); // Commit message
  console.log(result.commit.commit.author.name); // Author name
  console.log(result.commit.commit.author.email); // Author email
  console.log(new Date(result.commit.commit.author.timestamp * 1000)); // Commit date
}
```

#### `getCommitHistory(workingDir: string, options?: { depth?: number; ref?: string }): Promise<GitCommitHistoryResult>`

Retrieves commit history with optional filtering.

```typescript
// Get all commits
const allCommits = await isoGitService.getCommitHistory("/path/to/project");

// Get last 5 commits
const recentCommits = await isoGitService.getCommitHistory("/path/to/project", { 
  depth: 5 
});

// Get commits from specific branch/ref
const branchCommits = await isoGitService.getCommitHistory("/path/to/project", { 
  ref: "main" 
});

console.log(recentCommits.commits); // Array of GitCommitInfo objects
console.log(recentCommits.totalCount); // Number of commits returned
```

#### `getCommitByOid(workingDir: string, oid: string): Promise<GitCommitByOidResult>`

Retrieves a specific commit by its SHA.

```typescript
const result = await isoGitService.getCommitByOid(
  "/path/to/project",
  "a1b2c3d4e5f6..."
);

if (result.status === "success") {
  console.log(result.commit); // GitCommitInfo object
} else if (result.status === "not_found") {
  console.log("Commit not found");
}
```

### Status Operations

#### `getCurrentHeadSha(workingDir: string): Promise<GitHeadShaResult>`

Gets the SHA of the current HEAD commit.

```typescript
const result = await isoGitService.getCurrentHeadSha("/path/to/project");

if (result.status === "success") {
  console.log(result.sha); // Current HEAD SHA
} else if (result.status === "no_head") {
  console.log("No commits yet");
}
```

#### `hasUncommittedChanges(workingDir: string): Promise<GitUncommittedChangesResult>`

Checks for uncommitted changes in the working directory.

```typescript
const result = await isoGitService.hasUncommittedChanges("/path/to/project");

console.log(result.hasChanges); // boolean
console.log(result.changedFiles); // Array of changed file paths
console.log(result.message); // Summary message
```

## Type Definitions

### GitCommitInfo

```typescript
interface GitCommitInfo {
  oid: string; // Commit SHA
  commit: {
    message: string;
    tree: string; // Tree SHA
    parent: string[]; // Parent commit SHAs
    author: {
      name: string;
      email: string;
      timestamp: number; // Unix timestamp in seconds
      timezoneOffset: number; // Timezone offset in minutes
    };
    committer: {
      name: string;
      email: string;
      timestamp: number;
      timezoneOffset: number;
    };
    gpgsig?: string; // PGP signature if present
  };
  payload: string; // Raw commit payload
}

interface GitInitResult {
  status: "success" | "skipped";
  message: string;
  path: string;
  gitignoreUpdated?: boolean; // true if .chara/ was added to .gitignore
  initialCommitSha?: string; // SHA of initial commit (if created)
  filesCommitted?: number; // Number of files in initial commit
}
```

## Usage Examples

### Basic Workflow

```typescript
import { isoGitService } from "@chara-codes/agents";

async function gitWorkflow() {
  const workingDir = process.cwd();

  // Initialize repository (also updates .gitignore and makes initial commit)
  const initResult = await isoGitService.initializeRepository(workingDir);
  
  if (initResult.gitignoreUpdated) {
    console.log("✅ Added .chara/ to .gitignore");
  }
  
  if (initResult.initialCommitSha) {
    console.log(`✅ Initial commit: ${initResult.initialCommitSha} (${initResult.filesCommitted} files)`);
  }

  // Check for changes
  const changes = await isoGitService.hasUncommittedChanges(workingDir);
  
  if (changes.hasChanges) {
    // Save changes
    const saveResult = await isoGitService.saveToHistory(
      workingDir,
      "Automated commit"
    );
    console.log(`Committed ${saveResult.filesProcessed} files`);
  }

  // Get recent history
  const history = await isoGitService.getCommitHistory(workingDir, { depth: 10 });
  console.log(`Found ${history.totalCount} recent commits`);
}
```

### Monitoring Changes

```typescript
async function monitorChanges() {
  const workingDir = process.cwd();

  // Check current status
  const head = await isoGitService.getCurrentHeadSha(workingDir);
  const changes = await isoGitService.hasUncommittedChanges(workingDir);

  console.log(`Current HEAD: ${head.sha?.substring(0, 8) || "none"}`);
  console.log(`Uncommitted changes: ${changes.hasChanges}`);
  
  if (changes.changedFiles) {
    console.log(`Changed files: ${changes.changedFiles.join(", ")}`);
  }
}
```

### Commit Analysis

```typescript
async function analyzeCommits() {
  const workingDir = process.cwd();

  // Get last commit details
  const lastCommit = await isoGitService.getLastCommit(workingDir);
  
  if (lastCommit.commit) {
    const commit = lastCommit.commit;
    console.log(`Last commit: ${commit.oid.substring(0, 8)}`);
    console.log(`Message: ${commit.commit.message}`);
    console.log(`Author: ${commit.commit.author.name}`);
    console.log(`Date: ${new Date(commit.commit.author.timestamp * 1000)}`);
    console.log(`Parents: ${commit.commit.parent.length}`);
  }

  // Get commit history
  const history = await isoGitService.getCommitHistory(workingDir);
  
  if (history.commits) {
    console.log("\nRecent commits:");
    history.commits.slice(0, 5).forEach((commit, index) => {
      console.log(`${index + 1}. ${commit.oid.substring(0, 8)} - ${commit.commit.message}`);
    });
  }
}
```

## Error Handling

All methods throw descriptive errors for common failure scenarios:

```typescript
try {
  const result = await isoGitService.getLastCommit(workingDir);
} catch (error) {
  if (error.message.includes("not initialized")) {
    // Repository needs to be initialized first
    await isoGitService.initializeRepository(workingDir);
  } else {
    // Handle other errors
    console.error("Git operation failed:", error.message);
  }
}
```

## Repository Structure

The service creates and manages a Git repository in the `.chara/history` directory:

```
project/
├── .chara/
│   └── history/           # Git repository
│       ├── .git/          # Git metadata
│       ├── objects/       # Git objects
│       ├── refs/          # Git references
│       └── ...            # Other Git files
├── src/                   # Your project files
├── docs/                  # Your project files
└── ...                    # Your project files
```

All project files (excluding `.chara` and `.git` directories) are tracked and versioned in this history repository.

## Configuration

The service uses fixed configuration:
- **Author**: "Chara Agent" <agent@chara.dev>
- **Default Branch**: "main"
- **Ignored Paths**: `.chara/`, `.git/`
- **Auto-gitignore**: Automatically adds `.chara/` to project's `.gitignore`
- **Initial Commit**: Automatically creates initial commit during repository setup

## Performance Notes

- Only changed files are committed, improving performance for large projects
- File comparison is done using content hashing for accuracy
- The service respects `.gitignore` patterns in the working directory
- Initial commits are created efficiently during repository initialization
- Gitignore updates are atomic and safe for existing files