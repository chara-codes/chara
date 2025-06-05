import { PreviewFile, PreviewFolder } from '@frontend/core/src';


/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop() || '' : '';
}

/**
 * Get language from file extension
 */
export function getLanguageFromExtension(extension: string): string {
  const mappings: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'json': 'json',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'less': 'less',
    'md': 'markdown',
    'py': 'python',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'go': 'go',
    'rust': 'rust',
    'rb': 'ruby',
    'php': 'php',
    'sh': 'shell',
    'yaml': 'yaml',
    'yml': 'yaml',
    'xml': 'xml',
    'sql': 'sql',
    'graphql': 'graphql',
    'swift': 'swift',
    'kt': 'kotlin',
    'rs': 'rust',
    'dart': 'dart',
    'vue': 'vue'
  };

  return mappings[extension.toLowerCase()] || 'plaintext';
}

/**
 * Get file icon based on file type
 */
export function getFileIcon(file: PreviewFile): string {
  const extension = getFileExtension(file.name).toLowerCase();

  // This is a simplified mapping - in a real app you'd use a more complete icon set
  const iconMappings: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'react',
    'ts': 'typescript',
    'tsx': 'react',
    'json': 'json',
    'html': 'html',
    'css': 'css',
    'scss': 'sass',
    'md': 'markdown',
    'py': 'python',
    'java': 'java',
    'go': 'go',
    'rs': 'rust',
    'rb': 'ruby',
    'php': 'php',
    'sh': 'terminal',
    'yml': 'yaml',
    'yaml': 'yaml',
    'xml': 'xml',
    'svg': 'image',
    'png': 'image',
    'jpg': 'image',
    'jpeg': 'image',
    'gif': 'image',
    'pdf': 'pdf',
    'zip': 'archive',
    'tar': 'archive',
    'gz': 'archive'
  };

  return iconMappings[extension] || 'document';
}

/**
 * Check if a file is binary (non-text)
 */
export function isBinaryFile(file: PreviewFile): boolean {
  const extension = getFileExtension(file.name).toLowerCase();
  const binaryExtensions = [
    'png', 'jpg', 'jpeg', 'gif', 'bmp', 'ico', 'webp',
    'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx',
    'zip', 'tar', 'gz', 'rar', '7z',
    'exe', 'dll', 'so', 'o', 'obj',
    'mp3', 'mp4', 'avi', 'mov', 'wmv',
    'ttf', 'otf', 'woff', 'woff2'
  ];

  return binaryExtensions.includes(extension);
}

/**
 * Build a folder tree from flat files and folders
 */
export function buildFolderTree(
  files: PreviewFile[],
  folders: PreviewFolder[]
): PreviewFolder[] {
  // First, create a map of paths to folders
  const folderMap = new Map<string, PreviewFolder>();

  // Create a root folder
  const root: PreviewFolder = {
    id: 'root',
    name: 'root',
    path: '/',
    children: [],
    isOpen: true
  };

  folderMap.set('/', root);

  // Add all folders to the map
  for (const folder of folders) {
    folderMap.set(folder.path, {
      ...folder,
      children: []
    });
  }

  // Build the folder hierarchy
  for (const folder of folders) {
    const parentPath = folder.path.substring(0, folder.path.lastIndexOf('/'));
    const parent = folderMap.get(parentPath || '/');

    if (parent) {
      const folderWithChildren = folderMap.get(folder.path);
      if (folderWithChildren) {
        parent.children.push(folderWithChildren);
      }
    }
  }

  // Add files to their parent folders
  for (const file of files) {
    const parentPath = file.path.substring(0, file.path.lastIndexOf('/'));
    const parent = folderMap.get(parentPath || '/');

    if (parent) {
      parent.children.push(file);
    }
  }

  return [root];
}

/**
 * Get all parent folder paths for a given path
 */
export function getParentFolderPaths(path: string): string[] {
  const parts = path.split('/').filter(Boolean);
  const paths: string[] = [];

  let currentPath = '';
  for (const part of parts) {
    currentPath += `/${part}`;
    paths.push(currentPath);
  }

  return paths;
}

/**
 * Generate a default folder structure for a new project
 */
export function generateDefaultProjectStructure(): {
  files: PreviewFile[];
  folders: PreviewFolder[];
} {
  const folders: PreviewFolder[] = [
    { id: 'folder-1', name: 'src', path: '/src', children: [], isOpen: true },
    { id: 'folder-2', name: 'components', path: '/src/components', children: [], isOpen: true },
    { id: 'folder-3', name: 'utils', path: '/src/utils', children: [], isOpen: true },
  ];

  const files: PreviewFile[] = [
    {
      id: 'file-1',
      name: 'index.ts',
      content: 'export * from \'./components\';\nexport * from \'./utils\';\n',
      type: 'ts',
      path: '/src/index.ts',
      isActive: false
    },
    {
      id: 'file-2',
      name: 'Button.tsx',
      content: '',
      type: 'tsx',
      path: '/src/components/Button.tsx',
      isActive: true
    },
    {
      id: 'file-3',
      name: 'index.ts',
      content: 'export * from \'./Button\';\n',
      type: 'ts',
      path: '/src/components/index.ts',
      isActive: false
    },
    {
      id: 'file-4',
      name: 'format.ts',
      content: 'export function formatDate(date: Date): string {\n  return date.toLocaleDateString();\n}\n\nexport function formatCurrency(amount: number): string {\n  return new Intl.NumberFormat(\'en-US\', {\n    style: \'currency\',\n    currency: \'USD\'\n  }).format(amount);\n}\n',
      type: 'ts',
      path: '/src/utils/format.ts',
      isActive: false
    },
    {
      id: 'file-5',
      name: 'index.ts',
      content: 'export * from \'./format\';\n',
      type: 'ts',
      path: '/src/utils/index.ts',
      isActive: false
    },
    {
      id: 'file-6',
      name: 'package.json',
      content: '{\n  "name": "my-project",\n  "version": "1.0.0",\n  "main": "dist/index.js",\n  "dependencies": {\n    "react": "^18.2.0",\n    "react-dom": "^18.2.0"\n  }\n}\n',
      type: 'json',
      path: '/package.json',
      isActive: false
    },
    {
      id: 'file-7',
      name: 'README.md',
      content: '# My Project\n\nA sample project structure for the preview component.\n\n## Getting Started\n\n```bash\nnpm install\nnpm start\n```\n',
      type: 'md',
      path: '/README.md',
      isActive: false
    }
  ];

  return { files, folders };
}
