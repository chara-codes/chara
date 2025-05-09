# Chara Automation Testing Framework

This framework provides automated testing capabilities for Chara Codes using Playwright and AI SDK integration.

## Features

- 🎭 End-to-end testing with Playwright
- 🤖 AI-assisted test generation and validation
- 📊 Visual regression testing
- 📝 Detailed test reporting

## Getting Started

```bash
# Install dependencies
cd automation
bun install

# Run tests
bun test

# Run tests with UI
bun test:ui

# Generate test reports
bun test:report
```

## Architecture

The automation framework consists of several key components:

- **Test Fixtures**: Reusable test configurations and utilities
- **AI Helpers**: AI-powered test generation and validation
- **Visual Testing**: Screenshot comparison and analysis
- **Reporting**: Test results and analytics

## AI-Assisted Testing

The framework leverages the AI SDK to enhance testing capabilities:

- **Test Generation**: AI suggests test cases based on application code
- **Self-Healing Tests**: AI helps adapt tests when the UI changes
- **Validation Enhancement**: AI checks for visual and functional inconsistencies
- **Test Coverage Analysis**: AI recommends additional test scenarios

### Example: AI-Generated Test

```typescript
import { test } from '@playwright/test';
import { generateAITest } from '../helpers/ai-test-generator';

test('AI-generated test for code editor', async ({ page }) => {
  // AI SDK generates test steps based on component analysis
  const testSteps = await generateAITest('CodeEditor');
  
  // Execute the generated test steps
  for (const step of testSteps) {
    await step.execute(page);
    await step.validate(page);
  }
});
```

## Folder Structure

```
automation/
├── config/              # Configuration files
├── fixtures/            # Test fixtures and data
├── helpers/             # Test utilities
│   └── ai/              # AI SDK integration
├── tests/               # Test files
│   ├── e2e/             # End-to-end tests
│   ├── visual/          # Visual regression tests
│   └── ai-assisted/     # AI-powered tests
├── reports/             # Test reports and results
├── playwright.config.ts # Playwright configuration
└── package.json         # Dependencies and scripts
```

## Best Practices

- Write tests that focus on user journeys, not implementation details
- Use AI assistance for complex test scenarios
- Maintain independent, atomic tests
- Implement proper waiting strategies
- Regularly update visual baselines