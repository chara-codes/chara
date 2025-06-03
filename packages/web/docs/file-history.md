# File History Documentation

## Introduction

The File History feature in Chara Codes provides git-based file history tracking and visualization directly in the browser. Built on isomorphic-git, this feature allows developers to:

- View commit history for individual files
- Compare different versions of a file
- Visualize changes between commits
- Access file history without leaving the application

This implementation works entirely in the browser without requiring a server-side Git installation, making it portable and easy to integrate into any project.

## Installation

The file history feature is pre-installed in the Chara Codes web application. If you're using it in a custom project, ensure you have the required dependencies:

```bash
bun add isomorphic-git @isomorphic-git/lightning-fs
```

## Components

### FileHistoryViewer

The main component for displaying file history:

```tsx
import { FileHistoryViewer } from '@/components/file-history';

<FileHistoryViewer
  repoUrl="https://github.com/username/repo"
  filePath="path/to/file.js"
  initialBranch="main"
  corsProxy="https://cors.isomorphic-git.org"
/>
```

### FileHistoryButton

A button component that opens file history in a dialog:

```tsx
import { FileHistoryButton } from '@/components/file-history';

<FileHistoryButton
  repoUrl="https://github.com/username/repo"
  filePath="path/to/file.js"
  initialBranch="main"
  buttonText="View History"
  variant="outline"
  size="sm"
/>
```

## React Hook: useFileHistory

A custom React hook for integrating file history into any component:

```tsx
import { useFileHistory } from '@/hooks/useFileHistory';

function MyComponent() {
  const {
    isLoading,
    error,
    fileHistory,
    currentBranch,
    availableBranches,
    initRepo,
    getFileHistory,
    compareVersions,
    changeBranch,
    clearRepository,
    isInitialized
  } = useFileHistory('https://github.com/username/repo', {
    autoInit: true,
    defaultBranch: 'main',
    corsProxy: 'https://cors.isomorphic-git.org'
  });

  // Use the hook methods and state
  // ...
}
```

## API Reference

### File History Module

```tsx
import {
  initializeFileHistory,
  getFileHistory,
  compareFileVersions,
  clearFileHistory,
  FileHistoryViewer,
  FileHistoryButton,
  useFileHistory,
  GitUtils
} from '@/lib/file-history';
```

#### Functions

| Function | Description |
|----------|-------------|
| `initializeFileHistory(repoUrl, options?)` | Initialize a Git repository for file history |
| `getFileHistory(filePath, depth?)` | Get the history for a specific file |
| `compareFileVersions(filePath, oldCommitOid, newCommitOid)` | Compare two versions of a file |
| `clearFileHistory()` | Clear all file history data |

#### Components

| Component | Description |
|-----------|-------------|
| `FileHistoryViewer` | Display file history and diffs |
| `FileHistoryButton` | Button that opens file history in a dialog |

#### Utility: GitUtils

Various helper functions for Git operations:

| Function | Description |
|----------|-------------|
| `parseRepoUrl(url)` | Parse and normalize a Git repository URL |
| `getCorsProxyForRepo(repoUrl)` | Get a suitable CORS proxy for a repository |
| `isValidRepoUrl(url)` | Validate a repository URL |
| `extractRepoInfo(url)` | Extract owner and repo name from a URL |
| `formatCommit(commit)` | Format a commit for display |
| `getDiffBackgroundClass(type)` | Get a CSS class for diff highlighting |

## Configuration Options

### CORS Proxy

When accessing Git repositories from a browser, you'll likely need a CORS proxy. The GitUtils module provides a helper to automatically select an appropriate proxy:

```tsx
import { GitUtils } from '@/lib/file-history';

const corsProxy = GitUtils.getCorsProxyForRepo(repoUrl);
```

You can also specify your own CORS proxy:

```tsx
const corsProxy = 'https://your-cors-proxy.example.com';
```

### Repository Options

When initializing a repository, you can configure:

- `branch`: The branch to use (default: 'main')
- `repoDir`: The directory in the virtual filesystem (default: '/repo')
- `corsProxy`: CORS proxy URL

```tsx
await initializeFileHistory('https://github.com/username/repo', {
  branch: 'develop',
  repoDir: '/custom-repo',
  corsProxy: 'https://cors.isomorphic-git.org'
});
```

## Demo Page

Visit the demo page at `/file-history` to see the file history feature in action.

## Troubleshooting

### CORS Issues

If you encounter CORS errors:

1. Ensure you're using a CORS proxy
2. Check if the repository is public
3. Try a different CORS proxy service

### Performance Considerations

- Large repositories may take time to clone
- Limit the history depth (default is 10 commits)
- Use the `depth` parameter when fetching file history

### Browser Storage Limitations

The file history uses browser storage (IndexedDB) which has size limitations:

- Clear history data when not needed with `clearFileHistory()`
- For very large repositories, consider server-side Git operations

## Example: Custom History Explorer

```tsx
import { useFileHistory } from '@/hooks/useFileHistory';
import { useState, useEffect } from 'react';

export function CustomHistoryExplorer({ repoUrl, filePath }) {
  const {
    fileHistory,
    getFileHistory,
    isInitialized,
    initRepo,
    isLoading
  } = useFileHistory(repoUrl, { autoInit: true });

  useEffect(() => {
    if (isInitialized && filePath) {
      getFileHistory(filePath);
    }
  }, [isInitialized, filePath, getFileHistory]);

  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      <h2>File History</h2>
      <ul>
        {fileHistory?.map((item) => (
          <li key={item.commit.oid}>
            {item.commit.commit.message} - {item.commit.commit.author.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
```