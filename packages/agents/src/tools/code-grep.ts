import { readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { Lang, parse } from "@ast-grep/napi";
import { tool } from "ai";
import { globby } from "globby";
import z from "zod";

interface CodeMatch {
  file: string;
  line: number;
  column: number;
  text: string;
  context?: string;
  match?: Record<string, string>;
}

interface CodeGrepResult {
  matches: CodeMatch[];
  total: number;
  files_searched: number;
}

interface CodeGrepError {
  error: string;
  code?: string;
}

interface ScriptSection {
  content: string;
  startLine: number;
  language: Lang;
}

// Language mapping from file extensions (only supported languages)
const LANGUAGE_MAP: Record<string, Lang> = {
  ".js": Lang.JavaScript,
  ".jsx": Lang.JavaScript,
  ".ts": Lang.TypeScript,
  ".tsx": Lang.TypeScript,
  ".html": Lang.Html,
  ".htm": Lang.Html,
  ".css": Lang.Css,
  ".vue": Lang.Html, // Will be processed specially
  ".svelte": Lang.Html, // Will be processed specially
  ".astro": Lang.Html, // Will be processed specially
};

function getLanguageFromFile(filePath: string): Lang | null {
  const ext = filePath.toLowerCase().match(/\.[^.]*$/)?.[0];
  return ext ? LANGUAGE_MAP[ext] || null : null;
}

function isComponentFile(filePath: string): boolean {
  const ext = filePath.toLowerCase().match(/\.[^.]*$/)?.[0];
  return ext === ".vue" || ext === ".svelte" || ext === ".astro";
}

function extractScriptSections(
  content: string,
  filePath: string
): ScriptSection[] {
  const ext = filePath.toLowerCase().match(/\.[^.]*$/)?.[0];
  const sections: ScriptSection[] = [];

  if (ext === ".vue") {
    // Extract <script> sections from Vue SFC
    const scriptRegex = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;
    const setupScriptRegex =
      /<script\s+setup(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;

    let match;

    // Check for <script setup> first
    while ((match = setupScriptRegex.exec(content)) !== null) {
      const scriptContent = match[1];
      const beforeScript = content.substring(0, match.index);
      const startLine = (beforeScript.match(/\n/g) || []).length + 1;

      // Determine language from lang attribute
      const langMatch = match[0].match(/lang=["']([^"']+)["']/);
      const language =
        langMatch && langMatch[1] === "ts" ? Lang.TypeScript : Lang.JavaScript;

      sections.push({
        content: scriptContent,
        startLine,
        language,
      });
    }

    // Reset regex lastIndex
    scriptRegex.lastIndex = 0;

    // Then check for regular <script> tags (excluding setup)
    while ((match = scriptRegex.exec(content)) !== null) {
      if (!match[0].includes("setup")) {
        const scriptContent = match[1];
        const beforeScript = content.substring(0, match.index);
        const startLine = (beforeScript.match(/\n/g) || []).length + 1;

        const langMatch = match[0].match(/lang=["']([^"']+)["']/);
        const language =
          langMatch && langMatch[1] === "ts"
            ? Lang.TypeScript
            : Lang.JavaScript;

        sections.push({
          content: scriptContent,
          startLine,
          language,
        });
      }
    }
  } else if (ext === ".svelte") {
    // Extract <script> sections from Svelte
    const scriptRegex = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;

    let match;
    while ((match = scriptRegex.exec(content)) !== null) {
      const scriptContent = match[1];
      const beforeScript = content.substring(0, match.index);
      const startLine = (beforeScript.match(/\n/g) || []).length + 1;

      const langMatch = match[0].match(/lang=["']([^"']+)["']/);
      const language =
        langMatch && langMatch[1] === "ts" ? Lang.TypeScript : Lang.JavaScript;

      sections.push({
        content: scriptContent,
        startLine,
        language,
      });
    }
  } else if (ext === ".astro") {
    // Extract frontmatter and script sections from Astro
    // Frontmatter (between --- delimiters at the start)
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      sections.push({
        content: frontmatterMatch[1],
        startLine: 2, // After the opening ---
        language: Lang.TypeScript, // Astro frontmatter is TypeScript by default
      });
    }

    // Script tags in the template
    const scriptRegex = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;
    let match;
    while ((match = scriptRegex.exec(content)) !== null) {
      const scriptContent = match[1];
      const beforeScript = content.substring(0, match.index);
      const startLine = (beforeScript.match(/\n/g) || []).length + 1;

      sections.push({
        content: scriptContent,
        startLine,
        language: Lang.TypeScript, // Astro uses TypeScript by default
      });
    }
  }

  return sections;
}

function makeRelativePath(filePath: string, cwd: string): string {
  const resolvedPath = resolve(filePath);
  return relative(cwd, resolvedPath);
}

async function searchScriptSection(
  scriptSection: ScriptSection,
  pattern: string,
  filePath: string,
  options: {
    maxMatches?: number;
    includeContext?: boolean;
  } = {}
): Promise<CodeMatch[] | CodeGrepError> {
  try {
    const ast = parse(scriptSection.language, scriptSection.content);
    const root = ast.root();

    const matches: CodeMatch[] = [];
    const nodes = root.findAll(pattern);

    for (const node of nodes) {
      if (options.maxMatches && matches.length >= options.maxMatches) {
        break;
      }

      const range = node.range();
      const nodeText = node.text();

      // Get context if requested
      let context: string | undefined;
      if (options.includeContext) {
        const parent = node.parent();
        context = parent ? parent.text() : nodeText;
      }

      // Extract meta variables if any
      const match: Record<string, string> = {};
      // Try to extract common meta variables
      const singleVars = [
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "NAME",
        "MODULE",
        "METHOD",
        "OBJ",
        "VAR",
        "VALUE",
        "TYPE",
        "CLASS",
        "EXPORTS",
        "INITIAL",
        "SETTER",
      ];
      for (const varName of singleVars) {
        const matchedNode = node.getMatch(varName);
        if (matchedNode) {
          match[varName] = matchedNode.text();
        }
      }

      // Try to extract multi meta variables
      const multiVars = ["ARGS", "PARAMS", "BODY", "FIELDS"];
      for (const varName of multiVars) {
        const multiMatches = node.getMultipleMatches(varName);
        if (multiMatches.length > 0) {
          match[varName] = multiMatches.map((n) => n.text()).join(", ");
        }
      }

      matches.push({
        file: filePath,
        line: range.start.line + scriptSection.startLine, // Adjust line number to original file
        column: range.start.column + 1, // Convert to 1-based
        text: nodeText,
        context: options.includeContext ? context : undefined,
        match: Object.keys(match).length > 0 ? match : undefined,
      });
    }

    return matches;
  } catch (error) {
    return {
      error: `Failed to search script section in ${filePath}: ${
        error instanceof Error ? error.message : String(error)
      }`,
      code: "SEARCH_ERROR",
    };
  }
}

async function searchFileWithPattern(
  filePath: string,
  pattern: string,
  language: Lang,
  options: {
    maxMatches?: number;
    includeContext?: boolean;
  } = {}
): Promise<CodeMatch[] | CodeGrepError> {
  try {
    const content = await readFile(filePath, "utf-8");

    // Handle component files (Vue, Svelte, Astro) specially
    if (isComponentFile(filePath)) {
      const scriptSections = extractScriptSections(content, filePath);
      const allMatches: CodeMatch[] = [];

      for (const section of scriptSections) {
        const result = await searchScriptSection(section, pattern, filePath, {
          maxMatches: options.maxMatches
            ? options.maxMatches - allMatches.length
            : undefined,
          includeContext: options.includeContext,
        });

        if ("error" in result) {
          // Log error but continue with other sections
          console.warn(
            `Error searching script section in ${filePath}: ${result.error}`
          );
          continue;
        }

        allMatches.push(...result);

        if (options.maxMatches && allMatches.length >= options.maxMatches) {
          break;
        }
      }

      return allMatches;
    }

    // Handle regular files
    const ast = parse(language, content);
    const root = ast.root();

    const matches: CodeMatch[] = [];
    const nodes = root.findAll(pattern);

    for (const node of nodes) {
      if (options.maxMatches && matches.length >= options.maxMatches) {
        break;
      }

      const range = node.range();
      const nodeText = node.text();

      // Get context if requested
      let context: string | undefined;
      if (options.includeContext) {
        const parent = node.parent();
        context = parent ? parent.text() : nodeText;
      }

      // Extract meta variables if any
      const match: Record<string, string> = {};
      // Try to extract common meta variables
      const singleVars = [
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "NAME",
        "MODULE",
        "METHOD",
        "OBJ",
        "VAR",
        "VALUE",
        "TYPE",
        "CLASS",
        "EXPORTS",
        "INITIAL",
        "SETTER",
      ];
      for (const varName of singleVars) {
        const matchedNode = node.getMatch(varName);
        if (matchedNode) {
          match[varName] = matchedNode.text();
        }
      }

      // Try to extract multi meta variables
      const multiVars = ["ARGS", "PARAMS", "BODY", "FIELDS"];
      for (const varName of multiVars) {
        const multiMatches = node.getMultipleMatches(varName);
        if (multiMatches.length > 0) {
          match[varName] = multiMatches.map((n) => n.text()).join(", ");
        }
      }

      matches.push({
        file: filePath,
        line: range.start.line + 1, // Convert to 1-based
        column: range.start.column + 1, // Convert to 1-based
        text: nodeText,
        context: options.includeContext ? context : undefined,
        match: Object.keys(match).length > 0 ? match : undefined,
      });
    }

    return matches;
  } catch (error) {
    return {
      error: `Failed to search file ${filePath}: ${
        error instanceof Error ? error.message : String(error)
      }`,
      code: "SEARCH_ERROR",
    };
  }
}

async function searchFiles(
  patterns: string | string[],
  pattern: string,
  options: {
    maxMatches?: number;
    includeContext?: boolean;
    languages?: string[];
  } = {}
): Promise<CodeGrepResult | CodeGrepError> {
  try {
    const cwd = process.cwd();
    const pathPatterns = Array.isArray(patterns) ? patterns : [patterns];

    // Build glob patterns based on languages if specified
    let globPatterns = pathPatterns;
    if (options.languages && options.languages.length > 0) {
      const extensions = options.languages.flatMap((lang) => {
        const lowerLang = lang.toLowerCase();

        // Handle component file types specially
        if (lowerLang === "vue") return [".vue"];
        if (lowerLang === "svelte") return [".svelte"];
        if (lowerLang === "astro") return [".astro"];

        // Handle regular languages
        const entries = Object.entries(LANGUAGE_MAP).filter(([_, l]) => {
          const langName = Object.keys(Lang).find(
            (key) => Lang[key as keyof typeof Lang] === l
          );
          return langName?.toLowerCase() === lowerLang;
        });
        return entries.map(([ext]) => ext);
      });

      if (extensions.length > 0) {
        globPatterns = pathPatterns
          .map((p) => {
            if (p.includes("*")) return p;
            return extensions.map((ext) => `${p}/**/*${ext}`);
          })
          .flat();
      }
    }

    const files = await globby(globPatterns, {
      ignore: [
        "**/node_modules/**",
        "**/.git/**",
        "**/.chara/**",
        "**/dist/**",
        "**/build/**",
        "**/.next/**",
        "**/.turbo/**",
        "**/coverage/**",
        "**/*.min.js",
        "**/*.min.css",
      ],
      absolute: true,
      onlyFiles: true,
    });

    const allMatches: CodeMatch[] = [];
    let filesSearched = 0;

    for (const file of files) {
      const language = getLanguageFromFile(file);
      const isComponent = isComponentFile(file);

      // Skip files that aren't supported (unless they're component files)
      if (!language && !isComponent) continue;

      filesSearched++;
      const relativePath = makeRelativePath(file, cwd);

      const result = await searchFileWithPattern(
        file,
        pattern,
        language || Lang.Html, // Use Html as fallback for component files
        {
          maxMatches: options.maxMatches
            ? options.maxMatches - allMatches.length
            : undefined,
          includeContext: options.includeContext,
        }
      );

      if ("error" in result) {
        // Log error but continue with other files
        console.warn(`Error searching ${relativePath}: ${result.error}`);
        continue;
      }

      // Update file paths to be relative
      const matches = result.map((match) => ({
        ...match,
        file: relativePath,
      }));

      allMatches.push(...matches);

      if (options.maxMatches && allMatches.length >= options.maxMatches) {
        break;
      }
    }

    return {
      matches: allMatches,
      total: allMatches.length,
      files_searched: filesSearched,
    };
  } catch (error) {
    return {
      error: `Search failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
      code: "GLOB_ERROR",
    };
  }
}

export const codeGrep = tool({
  description: `Search for code patterns using AST-based matching with ast-grep. Perfect for finding imports, function calls, method definitions, class usage, and other code structures. Supports multiple programming languages and uses syntax-aware pattern matching instead of simple text search.

Common patterns:
- Function calls: "console.log($A)" or "myFunction($$$ARGS)"
- Import statements: "import $NAME from $MODULE" or "import { $NAME } from $MODULE"
- Function definitions: "function $NAME($$$PARAMS) { $$$BODY }"
- Class definitions: "class $NAME { $$$BODY }"
- Variable declarations: "const $VAR = $VALUE" or "let $VAR: $TYPE = $VALUE"
- Method calls: "$OBJ.$METHOD($A)" or "$OBJ.$METHOD($$$ARGS)"

Supported languages: JavaScript, TypeScript, TSX, HTML, CSS, Vue, Svelte, Astro
Use meta variables like $VAR, $NAME, $ARG for single captures and $$$ARGS, $$$PARAMS for multiple captures.

For component files (Vue, Svelte, Astro), the tool will automatically extract and search within script sections.`,
  inputSchema: z.object({
    pattern: z
      .string()
      .describe(
        "AST pattern to search for (e.g., 'console.log($A)', 'import $NAME from $MODULE', 'function $NAME($$$PARAMS) { $$$BODY }', 'class $NAME { $$$BODY }')"
      ),
    paths: z
      .union([z.string(), z.array(z.string())])
      .describe(
        "File paths, directory paths, or glob patterns to search in. Examples: 'src/', '**/*.ts', ['src/', 'tests/']"
      ),
    maxMatches: z
      .number()
      .int()
      .min(1)
      .max(1000)
      .default(100)
      .describe("Maximum number of matches to return"),
    includeContext: z
      .boolean()
      .default(false)
      .describe("Include surrounding context for each match"),
    languages: z
      .array(z.string())
      .optional()
      .describe(
        "Filter by programming languages (e.g., ['javascript', 'typescript', 'html', 'css', 'vue', 'svelte', 'astro'])"
      ),
  }),
  execute: async ({
    pattern,
    paths,
    maxMatches,
    includeContext,
    languages,
  }) => {
    const result = await searchFiles(paths, pattern, {
      maxMatches,
      includeContext,
      languages,
    });

    if ("error" in result) {
      return {
        success: false,
        error: result.error,
        code: result.code,
      };
    }

    return {
      success: true,
      data: result,
      summary: `Found ${result.total} matches in ${result.files_searched} files`,
    };
  },
});
