import { getFileExtension } from './file-utils';

/**
 * Detect language from file extension
 */
export function detectLanguage(filename: string): string {
  const extension = getFileExtension(filename).toLowerCase();
  
  const languageMap: Record<string, string> = {
    // JavaScript & TypeScript
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    
    // Web
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'less': 'less',
    'json': 'json',
    'xml': 'xml',
    'svg': 'xml',
    
    // Markdown
    'md': 'markdown',
    'markdown': 'markdown',
    
    // Python
    'py': 'python',
    'python': 'python',
    
    // Java
    'java': 'java',
    
    // C-family
    'c': 'c',
    'cpp': 'cpp',
    'h': 'c',
    'hpp': 'cpp',
    'cs': 'csharp',
    
    // Go
    'go': 'go',
    
    // Rust
    'rs': 'rust',
    
    // Ruby
    'rb': 'ruby',
    
    // PHP
    'php': 'php',
    
    // Shell
    'sh': 'shell',
    'bash': 'shell',
    
    // YAML
    'yaml': 'yaml',
    'yml': 'yaml',
    
    // SQL
    'sql': 'sql',
    
    // GraphQL
    'graphql': 'graphql',
    'gql': 'graphql',
    
    // Other languages
    'swift': 'swift',
    'kt': 'kotlin',
    'dart': 'dart',
    'vue': 'vue',
    'dockerfile': 'dockerfile',
    'docker': 'dockerfile',
  };
  
  return languageMap[extension] || 'plaintext';
}

/**
 * Get file icon class name based on language
 */
export function getIconForLanguage(language: string): string {
  const iconMap: Record<string, string> = {
    'javascript': 'devicon-javascript-plain colored',
    'typescript': 'devicon-typescript-plain colored',
    'html': 'devicon-html5-plain colored',
    'css': 'devicon-css3-plain colored',
    'scss': 'devicon-sass-original colored',
    'json': 'devicon-javascript-plain colored',
    'markdown': 'devicon-markdown-original',
    'python': 'devicon-python-plain colored',
    'java': 'devicon-java-plain colored',
    'c': 'devicon-c-plain colored',
    'cpp': 'devicon-cplusplus-plain colored',
    'csharp': 'devicon-csharp-plain colored',
    'go': 'devicon-go-plain colored',
    'rust': 'devicon-rust-plain colored',
    'ruby': 'devicon-ruby-plain colored',
    'php': 'devicon-php-plain colored',
    'shell': 'devicon-bash-plain',
    'yaml': 'devicon-yaml-plain',
    'docker': 'devicon-docker-plain colored',
  };
  
  return iconMap[language] || 'bi bi-file-code';
}

/**
 * Get syntax highlighting for content preview
 */
export function getSyntaxHighlighting(content: string, language: string): string {
  // This is a placeholder for real syntax highlighting
  // In a real implementation, you would use a library like highlight.js
  return content;
}

/**
 * Check if a file is viewable in the preview pane
 */
export function isPreviewableFile(filename: string): boolean {
  const extension = getFileExtension(filename).toLowerCase();
  
  const previewableExtensions = [
    // Images
    'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp',
    
    // Markdown
    'md', 'markdown',
    
    // HTML
    'html', 'htm',
    
    // PDF (if you have a PDF viewer)
    'pdf'
  ];
  
  return previewableExtensions.includes(extension);
}

/**
 * Get the preview type for a file
 */
export function getPreviewType(filename: string): 'image' | 'markdown' | 'html' | 'pdf' | 'none' {
  const extension = getFileExtension(filename).toLowerCase();
  
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(extension)) {
    return 'image';
  }
  
  if (['md', 'markdown'].includes(extension)) {
    return 'markdown';
  }
  
  if (['html', 'htm'].includes(extension)) {
    return 'html';
  }
  
  if (extension === 'pdf') {
    return 'pdf';
  }
  
  return 'none';
}
