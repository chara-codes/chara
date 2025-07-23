# Contributing to Chara Codes

Thank you for your interest in contributing to Chara Codes! This document provides guidelines and information for contributors to help maintain code quality and ensure smooth collaboration.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Architecture Decisions](#architecture-decisions)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Package Management](#package-management)
- [Documentation Standards](#documentation-standards)
- [Issue Guidelines](#issue-guidelines)
- [Community Guidelines](#community-guidelines)

## Getting Started

### Prerequisites

- **Bun** (primary runtime) - [Install Bun](https://bun.sh/docs/installation)
- **Node.js 18+** (compatibility)
- **Git** with SSH keys configured
- **SQLite** (for database operations)

### Initial Setup

1. **Fork and Clone**
   ```bash
   git clone git@github.com:yourusername/chara.git
   cd chara
   ```

2. **Install Dependencies**
   ```bash
   bun install
   ```

3. **Setup Development Environment**
   ```bash
   # Initialize global configuration
   cd packages/cli && bun run init

   # Start all development servers
   bun dev
   ```

4. **Verify Setup**
   - Web Interface: http://localhost:1237
   - Server API: http://localhost:3030
   - Agents API: http://localhost:3031

## Development Workflow

### Branch Strategy

- **main**: Production-ready code
- **playground**: Alpha/experimental features
- **feature/**: New features (`feature/ai-widget-improvements`)
- **fix/**: Bug fixes (`fix/websocket-connection`)
- **docs/**: Documentation updates (`docs/api-reference`)

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `test`: Adding missing tests
- `chore`: Changes to build process or auxiliary tools

**Examples:**
```
feat(agents): add DeepSeek provider support
fix(web): resolve WebSocket reconnection issues
docs(cli): update installation instructions
refactor(server): simplify tRPC router structure
```

### Development Commands

```bash
# Start all services
bun dev

# Individual package development
cd packages/cli && bun dev
cd packages/server && bun dev
cd packages/web && bun dev
cd packages/agents && bun dev

# Build all packages
bun run build

# Build individual packages
cd packages/cli && bun run build
cd packages/web && bun run build
cd packages/agents && bun run build

# Run tests
bun test

# Run tests for specific packages
cd packages/agents && bun test
cd packages/settings && bun test
cd packages/server && bun test

# End-to-end tests
cd automation && bun test

# Lint and format (if available)
bun lint
bun format
```

## Code Standards

### TypeScript Guidelines

1. **Strict Type Safety**
   ```typescript
   // ✅ Good: Explicit types for function parameters and returns
   function processMessage(message: ChatMessage): ProcessedMessage {
     return { ...message, timestamp: Date.now() };
   }

   // ❌ Avoid: Using 'any' or implicit types
   function processMessage(message: any) {
     return message;
   }
   ```

2. **Interface over Type Aliases** (for object shapes)
   ```typescript
   // ✅ Good: Interface for extensible object shapes
   interface AIProvider {
     name: string;
     apiKey: string;
     models: string[];
   }

   // ✅ Good: Type alias for unions and primitives
   type ModelProvider = 'openai' | 'anthropic' | 'google';
   ```

3. **Consistent Naming**
   - **PascalCase**: Classes, interfaces, types, enums
   - **camelCase**: Variables, functions, methods
   - **SCREAMING_SNAKE_CASE**: Constants
   - **kebab-case**: File names, package names

### React/Frontend Standards

1. **Component Structure**
   ```typescript
   // ✅ Good: Functional component with proper typing
   interface ChatMessageProps {
     message: ChatMessage;
     onEdit?: (id: string) => void;
   }

   export function ChatMessage({ message, onEdit }: ChatMessageProps) {
     return (
       <div className="chat-message">
         {/* Component content */}
       </div>
     );
   }
   ```

2. **Hooks and State Management**
   ```typescript
   // ✅ Good: Custom hooks for complex logic
   function useChatMessages() {
     const [messages, setMessages] = useState<ChatMessage[]>([]);

     const addMessage = useCallback((message: ChatMessage) => {
       setMessages(prev => [...prev, message]);
     }, []);

     return { messages, addMessage };
   }
   ```

3. **Styling Approach**
   - Use **Tailwind CSS** for utility-first styling
   - Use **Styled Components** for complex component styling
   - Maintain consistency with design system components from `@chara-codes/design-system`

### Backend/Server Standards

1. **tRPC Router Structure**
   ```typescript
   // ✅ Good: Organized router with proper validation
   export const chatRouter = router({
     create: publicProcedure
       .input(createChatSchema)
       .mutation(async ({ input, ctx }) => {
         return await ctx.db.insert(chats).values(input);
       }),

     list: publicProcedure
       .input(listChatsSchema)
       .query(async ({ input, ctx }) => {
         return await ctx.db.query.chats.findMany({
           where: eq(chats.userId, input.userId),
         });
       }),
   });
   ```

2. **Database Operations**
   ```typescript
   // ✅ Good: Use Drizzle ORM with proper error handling
   export async function createChat(data: NewChat) {
     try {
       const [chat] = await db.insert(chats).values(data).returning();
       return { success: true, data: chat };
     } catch (error) {
       logger.error('Failed to create chat', { error, data });
       return { success: false, error: 'Failed to create chat' };
     }
   }
   ```

3. **Error Handling**
   ```typescript
   // ✅ Good: Structured error responses
   if (!user) {
     throw new TRPCError({
       code: 'UNAUTHORIZED',
       message: 'User must be authenticated',
     });
   }
   ```

## Architecture Decisions

### When to Create New Packages

Create a new package when:
- **Functionality is reusable** across multiple other packages
- **Clear separation of concerns** exists
- **Independent versioning** would be beneficial
- **External publication** is planned

### AI Provider Integration

When adding new AI providers:

1. **Extend the BaseProvider interface**
   ```typescript
   export class NewProvider extends AbstractProvider {
     readonly key = "new-provider";
     readonly name = "New Provider";
     readonly requiresApiKey = true;
     readonly apiKeyEnvVar = "NEW_PROVIDER_API_KEY";

     public async canInitialize(): Promise<boolean> {
       const apiKey = await getEnvVar(this.apiKeyEnvVar!);
       return validateApiKey(apiKey, this.name);
     }

     public async createProvider(): Promise<(modelId: string) => LanguageModelV1> {
       // Implementation here
     }

     public async fetchModels(): Promise<ModelInfo[]> {
       // Implementation here
     }
   }
   ```

2. **Add provider to the providers/index.ts** exports
3. **Add environment variables** to the supported list
4. **Add comprehensive tests** for the new provider
5. **Update models whitelist** if adding new models
6. **Document provider-specific features** and limitations

### Tool System Extensions

For new tools in the agents package:

1. **Implement the Tool interface**
   ```typescript
   interface Tool {
     name: string;
     description: string;
     parameters: ToolParameters;
     execute(params: unknown): Promise<ToolResult>;
   }
   ```

2. **Add security validation** for file system operations
3. **Include proper error handling** and user feedback
4. **Write comprehensive tests** including edge cases
5. **Document tool capabilities** and usage examples

### State Management Decisions

- **Zustand**: For client-side state management
- **tRPC**: For server state synchronization
- **WebSocket**: For real-time updates
- **Local Storage**: For user preferences and settings

### Tunnel Service Integration

When working with the tunnel service for local development sharing:

1. **Configure tunnel settings** in project configuration:
   ```typescript
   interface TunnelConfig {
     subdomain?: string;
     port: number;
     contentReplacements?: Record<string, string>;
   }
   ```

2. **Use tunnel for development**:
   ```bash
   # Start tunnel with custom subdomain
   cd packages/tunnel
   bun dev --subdomain=my-project

   # Access via tunnel URL
   # https://my-project.localhost:1337
   ```

3. **Test tunnel functionality**:
   - Verify WebSocket connections work through tunnel
   - Test content replacement features
   - Validate AI Widget integration in tunnel mode
   - Ensure proper HTTPS handling

### Model Context Protocol (MCP) Integration

When adding new MCP servers or tools:

1. **Configure MCP servers** in project `.chara.json`:
   ```json
   {
     "mcpServers": {
       "filesystem": {
         "command": "npx",
         "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/project"]
       },
       "puppeteer": {
         "command": "npx",
         "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
       }
     }
   }
   ```

2. **Test MCP integration** thoroughly
3. **Document server capabilities** and usage
4. **Handle connection failures** gracefully
5. **Update agent tools** to utilize MCP resources

### AI Widget Development

For AI Widget features:

1. **Widget Integration**
   ```typescript
   // Widget should be embeddable and context-aware
   interface WidgetConfig {
     enableElementSelection: boolean;
     showVisualHighlights: boolean;
     contextCapture: 'minimal' | 'full';
   }
   ```

2. **Element Selection System**
   - Use visual highlighting for selected elements
   - Capture DOM context and styling information
   - Provide accessibility information to AI
   - Handle dynamic content updates

3. **Testing Widget Features**
   - Test in various web environments
   - Verify element selection accuracy
   - Test context capture completeness
   - Validate AI assistance quality

## Testing Guidelines

### Unit Tests

```typescript
// ✅ Good: Descriptive test cases with proper setup
describe('ChatMessage', () => {
  const mockMessage: ChatMessage = {
    id: '1',
    content: 'Hello world',
    role: 'user',
    timestamp: Date.now(),
  };

  it('should render message content correctly', () => {
    render(<ChatMessage message={mockMessage} />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked', () => {
    const onEdit = vi.fn();
    render(<ChatMessage message={mockMessage} onEdit={onEdit} />);

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(onEdit).toHaveBeenCalledWith('1');
  });
});
```

### Integration Tests

```typescript
// ✅ Good: Test complete workflows
describe('Chat API', () => {
  it('should create and retrieve chat messages', async () => {
    const chat = await trpc.chat.create.mutate({
      title: 'Test Chat',
      userId: 'user-1',
    });

    const message = await trpc.message.create.mutate({
      chatId: chat.id,
      content: 'Hello',
      role: 'user',
    });

    const messages = await trpc.message.list.query({
      chatId: chat.id,
    });

    expect(messages).toContain(message);
  });
});
```

### E2E Tests

```typescript
// ✅ Good: Test user workflows end-to-end
test('user can create and send chat messages', async ({ page }) => {
  await page.goto('http://localhost:1237');

  // Create new chat
  await page.click('[data-testid="new-chat"]');
  await page.fill('[data-testid="chat-title"]', 'Test Chat');

  // Send message
  await page.fill('[data-testid="message-input"]', 'Hello AI');
  await page.click('[data-testid="send-button"]');

  // Verify response
  await expect(page.locator('[data-testid="ai-response"]')).toBeVisible();
});
```

## Pull Request Process

### Before Submitting

1. **Run all checks locally**
   ```bash
   bun lint
   bun test
   bun build
   ```

2. **Update documentation** if needed
3. **Add tests** for new functionality
4. **Check breaking changes** and update CHANGELOG.md

### PR Requirements

1. **Clear Description**
   - What changes were made and why
   - Link to related issues
   - Screenshots for UI changes
   - Breaking changes highlighted

2. **Proper Labels**
   - `type: feature` / `type: bugfix` / `type: docs`
   - `area: cli` / `area: web` / `area: agents` / etc.
   - `priority: high` / `priority: medium` / `priority: low`
   - `breaking` for breaking changes

3. **Review Checklist**
   - [ ] Code follows style guidelines
   - [ ] Tests pass and new tests added
   - [ ] Documentation updated
   - [ ] No breaking changes (or properly documented)
   - [ ] Performance impact considered

### Review Process

1. **Automated Checks**: CI/CD pipeline runs tests and builds
2. **Code Review**: At least one maintainer review required
3. **Testing**: E2E tests for significant changes
4. **Approval**: Maintainer approval before merge

## Package Management

### Adding Dependencies

1. **Evaluate necessity**: Is this dependency really needed?
2. **Check bundle size**: Use `bundlephobia.com` to check impact
3. **Verify maintenance**: Is the package actively maintained?
4. **Security audit**: Check for known vulnerabilities
5. **License compatibility**: Ensure license is compatible with Apache 2.0
6. **Add to correct package**: Use workspace dependencies when possible

```bash
# Add to specific package (navigate to package first)
cd packages/web
bun add react-beautiful-dnd

# Add development dependency to workspace root
bun add -D eslint

# Add peer dependency
bun add --peer react

# Install workspace dependency
cd packages/web
bun add @chara-codes/core@workspace:*
```

### Workspace Dependencies

```json
{
  "dependencies": {
    "@chara-codes/core": "workspace:*",
    "@chara-codes/design-system": "workspace:*"
  }
}
```

## Documentation Standards

### Code Documentation

```typescript
/**
 * Processes a chat message and generates an AI response.
 *
 * @param message - The user's chat message
 * @param options - Configuration options for AI generation
 * @returns Promise resolving to the AI response
 *
 * @example
 * const response = await processMessage(
 *   { content: "Hello", role: "user" },
 *   { model: "gpt-4", temperature: 0.7 }
 * );
 *
 */
export async function processMessage(
  message: ChatMessage,
  options: AIOptions
): Promise<AIResponse> {
  // Implementation
}
```

### README Updates

When adding new features:
1. Update feature list in main README.md
2. Add usage examples
3. Update configuration options
4. Document any new environment variables

### API Documentation

Use JSDoc comments for tRPC procedures:
```typescript
export const chatRouter = router({
  /**
   * Create a new chat conversation
   * @summary Create chat
   * @tags Chat
   */
  create: publicProcedure
    .input(createChatSchema)
    .mutation(async ({ input }) => {
      // Implementation
    }),
});
```

## Issue Guidelines

### Bug Reports

Include:
- **Environment**: OS, Bun/Node version, package versions
- **Chara Version**: CLI version, package versions
- **Configuration**: AI providers configured, MCP servers used
- **Steps to reproduce**: Clear, numbered steps
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Screenshots/logs**: If applicable
- **Error messages**: Full error stack traces
- **Browser info**: If web interface related

### Feature Requests

Include:
- **Problem statement**: What problem does this solve?
- **Proposed solution**: How should it work?
- **Alternatives considered**: Other approaches considered
- **Use cases**: Specific examples of how it would be used
- **Impact**: Who would benefit from this feature?
- **Implementation scope**: Which packages would be affected?

### Labels for Issues

- **Type**: `bug`, `feature`, `docs`, `question`, `enhancement`
- **Priority**: `priority: high`, `priority: medium`, `priority: low`
- **Area**: `area: cli`, `area: web`, `area: agents`, `area: server`, `area: widget`, `area: tunnel`, `area: settings`
- **Status**: `status: needs-investigation`, `status: blocked`, `status: ready`, `status: in-progress`
- **Provider**: `provider: openai`, `provider: anthropic`, `provider: google` (for provider-specific issues)
- **Platform**: `platform: windows`, `platform: macos`, `platform: linux` (for platform-specific issues)

## Community Guidelines

### Code of Conduct

- **Be respectful**: Treat everyone with respect and kindness
- **Be inclusive**: Welcome newcomers and diverse perspectives
- **Be constructive**: Provide helpful feedback and suggestions
- **Be patient**: Everyone is learning and improving

### Communication

- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For questions, ideas, and general discussion
- **Pull Requests**: For code contributions and reviews
- **Project Board**: Track development progress and roadmap
- **Release Notes**: Stay updated with new features and changes

### Recognition

Contributors are recognized through:
- **Contributor listings** in documentation and README
- **Release notes** acknowledgments for each contribution
- **Special mentions** for significant contributions
- **Community highlights** for helpful discussions and support
- **Documentation credits** for improving guides and examples

## Getting Help

- **Documentation**: Check existing docs and README files
- **Search Issues**: Look for similar problems or questions
- **Create Issue**: Ask questions with detailed context
- **GitHub Discussions**: For questions and general discussion

## Development Tips

### Working with Providers

```bash
# Test provider initialization
cd packages/agents
bun test src/providers/__tests__/

# Test specific provider
bun test src/providers/__tests__/new-provider-structure.test.ts

# Add a new provider
# 1. Create provider file in packages/agents/src/providers/providers/my-provider.ts
# 2. Export from packages/agents/src/providers/providers/index.ts
# 3. Add tests in packages/agents/src/providers/__tests__/
# 4. Update models whitelist in packages/settings/src/models.ts
# 5. Update documentation
```

### Working with the Web Interface

```bash
# Start web development
cd packages/web
bun dev

# Build design system components
cd packages/frontend/design-system
bun run build

# Work with core frontend utilities
cd packages/frontend/core
bun run build

# Test widget functionality
cd packages/widget
bun dev
```

### Working with Settings

```bash
# Test settings utilities
cd packages/settings
bun test

# Check models whitelist
bun run -e "console.log(await import('./src/models.js').then(m => m.DEFAULT_MODELS_WHITELIST))"

# Test global config operations
bun test src/__tests__/global-config.test.ts

# Test models management
bun test src/__tests__/models.test.ts
```

### Working with Tunnel Service

```bash
# Start tunnel development
cd packages/tunnel
bun dev

# Test tunnel with custom subdomain
bun dev --subdomain=test-project

# Test tunnel with content replacements
bun dev --replace-localhost=true

# Run tunnel tests
bun test
```

### Working with Logger

```bash
# Use logger in development
import { logger } from '@chara-codes/logger';

logger.info('Starting process', { context: 'additional data' });
logger.error('Error occurred', { error, stack: error.stack });
logger.debug('Debug info', { variables: { key: 'value' } });

# Test logger functionality
cd packages/logger
bun test
```

### Debugging

- Use `@chara-codes/logger` for consistent logging
- Check provider health with `providersRegistry.getProviderStatus()`
- Use browser dev tools for frontend debugging
- Check WebSocket connections in Network tab

---

Thank you for contributing to Chara Codes! Your involvement helps make coding more joyful for developers everywhere. 🚀

For questions about these guidelines or the contribution process, please open an issue or reach out to the maintainers.
