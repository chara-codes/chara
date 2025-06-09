"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  CodeIcon,
  ServerIcon,
  DatabaseIcon,
  GlobeIcon,
  LayersIcon,
} from '../atoms';
import { TechStackDetail } from "../organisms";

// Define the tech stacks state interface
interface TechStacksState {
  // All tech stacks
  techStacks: TechStackDetail[];

  // Loading state
  isLoading: boolean;

  // Error state
  error: string | null;

  // Actions
  addTechStack: (techStack: TechStackDetail) => void;
  updateTechStack: (techStack: TechStackDetail) => void;
  deleteTechStack: (id: string) => void;
  getTechStackById: (id: string) => TechStackDetail | undefined;
}

// Sample tech stacks data with extended details
const initialTechStacks: TechStackDetail[] = [
  // Frontend Frameworks
  {
    id: "react",
    name: "React",
    category: "Frontend",
    description: "A JavaScript library for building user interfaces",
    longDescription:
      "React is a declarative, efficient, and flexible JavaScript library for building user interfaces. It lets you compose complex UIs from small and isolated pieces of code called 'components'. React has been designed from the start for gradual adoption, and you can use as little or as much React as you need. It can also render on the server using Node and power mobile apps using React Native.",
    icon: <CodeIcon width={20} height={20} />,
    popularity: 9,
    version: "18.2.0",
    releaseDate: "2022-06-14",
    documentationLinks: [
      {
        name: "React Documentation",
        url: "https://reactjs.org/docs/getting-started.html",
        description:
          "Official React documentation with guides, API reference, and examples",
      },
      {
        name: "React GitHub Repository",
        url: "https://github.com/facebook/react",
        description: "Source code and issue tracking",
      },
      {
        name: "Create React App",
        url: "https://create-react-app.dev/",
        description: "Set up a modern web app by running one command",
      },
    ],
    mcpServers: [
      {
        name: "react-app-server-01",
        configuration: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-puppeteer"],
        },
      },
      {
        name: "react-app-server-02",
        configuration: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-puppeteer"],
        },
      },
      {
        name: "react-staging-server",
        configuration: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-puppeteer"],
        },
      },
    ],
  },
  {
    id: "vue",
    name: "Vue.js",
    category: "Frontend",
    description: "Progressive JavaScript framework for UIs",
    longDescription:
      "Vue.js is a progressive, incrementally-adoptable JavaScript framework for building UI on the web. Unlike other monolithic frameworks, Vue is designed from the ground up to be incrementally adoptable. The core library is focused on the view layer only, and is easy to pick up and integrate with other libraries or existing projects.",
    icon: <CodeIcon width={20} height={20} />,
    popularity: 7,
    version: "3.2.47",
    documentationLinks: [
      {
        name: "Vue.js Documentation",
        url: "https://vuejs.org/guide/introduction.html",
        description:
          "Official Vue.js documentation with guides and API reference",
      },
      {
        name: "Vue CLI",
        url: "https://cli.vuejs.org/",
        description: "Standard tooling for Vue.js development",
      },
    ],
    mcpServers: [
      {
        name: "vue-app-server-01",
        configuration: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-puppeteer"],
        },
      },
    ],
  },
  {
    id: "angular",
    name: "Angular",
    category: "Frontend",
    description: "Platform for building mobile & desktop web apps",
    icon: <CodeIcon width={20} height={20} />,
    popularity: 6,
  },
  {
    id: "svelte",
    name: "Svelte",
    category: "Frontend",
    description: "Cybernetically enhanced web apps",
    icon: <CodeIcon width={20} height={20} />,
    popularity: 5,
    isNew: true,
  },

  // Backend Frameworks
  {
    id: "node",
    name: "Node.js",
    category: "Backend",
    description: "JavaScript runtime built on Chrome's V8 engine",
    longDescription:
      "Node.js is an open-source, cross-platform JavaScript runtime environment that executes JavaScript code outside a web browser. Node.js lets developers use JavaScript to write command line tools and for server-side scripting—running scripts server-side to produce dynamic web page content before the page is sent to the user's web browser.",
    icon: <ServerIcon width={20} height={20} />,
    popularity: 9,
    version: "18.12.1",
    documentationLinks: [
      {
        name: "Node.js Documentation",
        url: "https://nodejs.org/en/docs/",
        description:
          "Official Node.js documentation with guides and API reference",
      },
      {
        name: "Node.js GitHub Repository",
        url: "https://github.com/nodejs/node",
        description: "Source code and issue tracking",
      },
    ],
    mcpServers: [
      {
        name: "node-api-server-01",
        configuration: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-puppeteer"],
          flags: ["--no-sandbox", "--disable-setuid-sandbox"],
          timeout: 30000,
        },
      },
      {
        name: "node-api-server-02",
        configuration: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-puppeteer"],
          flags: ["--no-sandbox", "--disable-setuid-sandbox"],
          timeout: 30000,
        },
      },
    ],
  },
  {
    id: "express",
    name: "Express",
    category: "Backend",
    description: "Fast, unopinionated web framework for Node.js",
    icon: <ServerIcon width={20} height={20} />,
    popularity: 8,
  },

  // Databases
  {
    id: "mongodb",
    name: "MongoDB",
    category: "Database",
    description: "Document-oriented NoSQL database",
    icon: <DatabaseIcon width={20} height={20} />,
    popularity: 8,
  },
  {
    id: "postgres",
    name: "PostgreSQL",
    category: "Database",
    description: "Powerful, open source object-relational database",
    icon: <DatabaseIcon width={20} height={20} />,
    popularity: 9,
  },

  // Full Stack
  {
    id: "next",
    name: "Next.js",
    category: "Full Stack",
    description: "React framework for production",
    icon: <LayersIcon width={20} height={20} />,
    popularity: 9,
    isNew: true,
  },

  // API
  {
    id: "graphql",
    name: "GraphQL",
    category: "API",
    description: "Query language for your API",
    icon: <GlobeIcon width={20} height={20} />,
    popularity: 7,
  },
];

export const useTechStacksStore = create<TechStacksState>()(
  devtools(
    (set, get) => ({
      // Initial state
      techStacks: initialTechStacks,
      isLoading: false,
      error: null,

      // Add a new tech stack
      addTechStack: (techStack: TechStackDetail) => {
        set((state) => ({
          techStacks: [...state.techStacks, techStack],
        }));
      },

      // Update an existing tech stack
      updateTechStack: (techStack: TechStackDetail) => {
        set((state) => ({
          techStacks: state.techStacks.map((stack) =>
            stack.id === techStack.id ? techStack : stack,
          ),
        }));
      },

      // Delete a tech stack
      deleteTechStack: (id: string) => {
        set((state) => ({
          techStacks: state.techStacks.filter((stack) => stack.id !== id),
        }));
      },

      // Get a tech stack by ID
      getTechStackById: (id: string) => {
        return get().techStacks.find((stack) => stack.id === id);
      },
    }),
    {
      name: "tech-stacks-store",
    },
  ),
);

// Selector hooks for common use cases
export const useTechStacks = () =>
  useTechStacksStore((state) => state.techStacks);
export const useAddTechStack = () =>
  useTechStacksStore((state) => state.addTechStack);
export const useUpdateTechStack = () =>
  useTechStacksStore((state) => state.updateTechStack);
export const useDeleteTechStack = () =>
  useTechStacksStore((state) => state.deleteTechStack);
export const useGetTechStackById = () =>
  useTechStacksStore((state) => state.getTechStackById);
