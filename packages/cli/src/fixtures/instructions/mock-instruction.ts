import type { Instructions } from "../../instructions/types";
import { ActionType } from "../../instructions/types";

export const mockInstructions: Instructions = {
  projectRoot: "/Users/Adam_Nagy3/Documents/Work/Epam/chara/projects/projectA",
  actions: [
    {
      type: ActionType.SHELL,
      command: "mkdir -p src/components",
      metadata: { description: "Create components directory" },
    },
    {
      type: ActionType.CREATE,
      target: "src/components/Button.tsx",
      content: `import React from 'react';

const Button = () => {
  return <button>Click me</button>;
};

export default Button;`,
      metadata: { description: "Create a Button component in src/components" },
    },
    {
      type: ActionType.CREATE,
      target: "src/components/Header.tsx",
      content: `import React from 'react';

const Header = () => {
  return <header><h1>Welcome to My App</h1></header>;
};

export default Header;`,
      metadata: { description: "Create a Header component in src/components" },
    },
    {
      type: ActionType.UPDATE,
      target: "src/App.tsx",
      content: `import React from 'react';
import Button from './components/Button';
import Header from './components/Header';

const App = () => {
  return (
    <div>
      <Header />
      <Button />
    </div>
  );
};

export default App;`,
      metadata: {
        description:
          "Update App.tsx to include the Button and Header components",
      },
    },
    {
      type: ActionType.RENAME,
      target: "src/utils/helpers.ts",
      newName: "src/utils/utils.ts",
      metadata: { description: "Rename helpers.ts to utils.ts" },
    },
    {
      type: ActionType.DELETE,
      target: "src/components/OldComponent.tsx",
      metadata: { description: "Delete the old and unused component file" },
    },
    {
      type: ActionType.CREATE,
      target: "src/utils/formatDate.ts",
      content: `export const formatDate = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Intl.DateTimeFormat('en-US', options).format(date);
};`,
      metadata: { description: "Create a utility function to format dates" },
    },
    {
      type: ActionType.CREATE,
      target: "README.md",
      content: `# My Project

This is a sample project to test the instruction system.

## Components
- Button
- Header

## Utilities
- FormatDate`,
      metadata: { description: "Create a README.md file with project details" },
    },
    {
      type: ActionType.SHELL,
      command: "bun run dev",
      metadata: { description: "Spin up the development server" },
    },
  ],
};
