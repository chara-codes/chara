
export interface TextReplacement {
  pattern: string | RegExp;
  replacement: string;
}

export interface StreamReplacementConfig {
  replacements?: TextReplacement[];
}
