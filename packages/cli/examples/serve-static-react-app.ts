#!/usr/bin/env node

import { serveStaticAction } from "../src/actions/serve-static";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

/**
 * Example: React application with HTML imports
 *
 * This example demonstrates how to create a React application
 * using HTML imports with the serveStaticAction function.
 */

// Create React app files if they don't exist
function createReactApp() {
  const appDir = join(process.cwd(), "example-react-app");

  if (!existsSync(appDir)) {
    mkdirSync(appDir, { recursive: true });
  }

  // Create src directory
  const srcDir = join(appDir, "src");
  if (!existsSync(srcDir)) {
    mkdirSync(srcDir, { recursive: true });
  }

  // Create components directory
  const componentsDir = join(srcDir, "components");
  if (!existsSync(componentsDir)) {
    mkdirSync(componentsDir, { recursive: true });
  }

  // Create styles directory
  const stylesDir = join(srcDir, "styles");
  if (!existsSync(stylesDir)) {
    mkdirSync(stylesDir, { recursive: true });
  }

  // Create index.html
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>React App with HTML Imports</title>
    <link rel="stylesheet" href="./styles/global.css">
</head>
<body>
    <div id="root"></div>
    <script type="module" src="./app.tsx"></script>
</body>
</html>`;

  // Create app.tsx
  const appTsx = `import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './components/App';
import './styles/global.css';

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
`;

  // Create App component
  const appComponent = `import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { TodoList } from './TodoList';
import { AddTodo } from './AddTodo';
import '../styles/app.css';

export interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    // Load initial todos
    const initialTodos: Todo[] = [
      { id: 1, text: 'Learn React with HTML imports', completed: true },
      { id: 2, text: 'Build a todo app', completed: false },
      { id: 3, text: 'Deploy to production', completed: false },
    ];
    setTodos(initialTodos);
  }, []);

  const addTodo = (text: string) => {
    const newTodo: Todo = {
      id: Date.now(),
      text,
      completed: false,
    };
    setTodos([...todos, newTodo]);
  };

  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <AddTodo onAdd={addTodo} />
        <div className="filter-buttons">
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All ({todos.length})
          </button>
          <button
            className={filter === 'active' ? 'active' : ''}
            onClick={() => setFilter('active')}
          >
            Active ({todos.filter(t => !t.completed).length})
          </button>
          <button
            className={filter === 'completed' ? 'active' : ''}
            onClick={() => setFilter('completed')}
          >
            Completed ({todos.filter(t => t.completed).length})
          </button>
        </div>
        <TodoList
          todos={filteredTodos}
          onToggle={toggleTodo}
          onDelete={deleteTodo}
        />
      </main>
    </div>
  );
};
`;

  // Create Header component
  const headerComponent = `import React from 'react';
import '../styles/header.css';

export const Header: React.FC = () => {
  return (
    <header className="header">
      <h1>React Todo App</h1>
      <p>Built with HTML imports and Chara CLI</p>
    </header>
  );
};
`;

  // Create TodoList component
  const todoListComponent = `import React from 'react';
import { Todo } from './App';
import '../styles/todo-list.css';

interface TodoListProps {
  todos: Todo[];
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}

export const TodoList: React.FC<TodoListProps> = ({ todos, onToggle, onDelete }) => {
  if (todos.length === 0) {
    return (
      <div className="empty-state">
        <p>No todos found. Add one above!</p>
      </div>
    );
  }

  return (
    <ul className="todo-list">
      {todos.map(todo => (
        <li key={todo.id} className={todo.completed ? 'completed' : ''}>
          <div className="todo-item">
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => onToggle(todo.id)}
              className="todo-checkbox"
            />
            <span className="todo-text">{todo.text}</span>
            <button
              onClick={() => onDelete(todo.id)}
              className="delete-button"
              aria-label="Delete todo"
            >
              ×
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
};
`;

  // Create AddTodo component
  const addTodoComponent = `import React, { useState } from 'react';
import '../styles/add-todo.css';

interface AddTodoProps {
  onAdd: (text: string) => void;
}

export const AddTodo: React.FC<AddTodoProps> = ({ onAdd }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAdd(text.trim());
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="add-todo-form">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a new todo..."
        className="add-todo-input"
      />
      <button type="submit" className="add-todo-button">
        Add Todo
      </button>
    </form>
  );
};
`;

  // Create global CSS
  const globalCss = `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f5f5f5;
  color: #333;
  line-height: 1.6;
}

#root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.filter-buttons {
  display: flex;
  gap: 10px;
  margin: 20px 0;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
}

.filter-buttons button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.filter-buttons button:hover {
  background: #e9ecef;
}

.filter-buttons button.active {
  background: #007bff;
  color: white;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
}

.empty-state p {
  font-size: 16px;
  font-style: italic;
}
`;

  // Create app-specific CSS
  const appCss = `/* App-specific styles */
.app {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.main-content {
  position: relative;
  overflow: hidden;
}

.main-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #007bff, #28a745, #ffc107, #dc3545);
}
`;

  // Create header CSS
  const headerCss = `.header {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.header h1 {
  font-size: 2.5em;
  margin-bottom: 10px;
  font-weight: 700;
}

.header p {
  font-size: 1.1em;
  opacity: 0.9;
  font-weight: 300;
}
`;

  // Create todo-list CSS
  const todoListCss = `.todo-list {
  list-style: none;
  padding: 0;
}

.todo-list li {
  border-bottom: 1px solid #eee;
  transition: background-color 0.2s;
}

.todo-list li:hover {
  background-color: #f8f9fa;
}

.todo-list li.completed {
  opacity: 0.6;
}

.todo-item {
  display: flex;
  align-items: center;
  padding: 15px;
  gap: 12px;
}

.todo-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #007bff;
}

.todo-text {
  flex: 1;
  font-size: 16px;
  transition: all 0.2s;
}

.todo-list li.completed .todo-text {
  text-decoration: line-through;
  color: #6c757d;
}

.delete-button {
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.delete-button:hover {
  background: #c82333;
}
`;

  // Create add-todo CSS
  const addTodoCss = `.add-todo-form {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.add-todo-input {
  flex: 1;
  padding: 12px;
  border: 2px solid #e9ecef;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.2s;
}

.add-todo-input:focus {
  outline: none;
  border-color: #007bff;
}

.add-todo-button {
  padding: 12px 24px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.add-todo-button:hover {
  background: #0056b3;
}

.add-todo-button:active {
  transform: translateY(1px);
}
`;

  // Create package.json for React types
  const packageJson = `{
  "name": "react-html-imports-example",
  "version": "1.0.0",
  "description": "React app with HTML imports example",
  "type": "module",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0"
  }
}`;

  // Write all files
  writeFileSync(join(appDir, "index.html"), indexHtml);
  writeFileSync(join(srcDir, "app.tsx"), appTsx);
  writeFileSync(join(componentsDir, "App.tsx"), appComponent);
  writeFileSync(join(componentsDir, "Header.tsx"), headerComponent);
  writeFileSync(join(componentsDir, "TodoList.tsx"), todoListComponent);
  writeFileSync(join(componentsDir, "AddTodo.tsx"), addTodoComponent);
  writeFileSync(join(stylesDir, "global.css"), globalCss);
  writeFileSync(join(stylesDir, "app.css"), appCss);
  writeFileSync(join(stylesDir, "header.css"), headerCss);
  writeFileSync(join(stylesDir, "todo-list.css"), todoListCss);
  writeFileSync(join(stylesDir, "add-todo.css"), addTodoCss);
  writeFileSync(join(appDir, "package.json"), packageJson);

  return appDir;
}

/**
 * Example 1: Development server with hot reloading
 */
async function developmentServer() {
  console.log("🚀 Starting React development server...\n");

  const appDir = createReactApp();
  const htmlFile = join(appDir, "index.html");

  try {
    const { server, port, url } = await serveStaticAction({
      port: 3000,
      directories: {
        "/": htmlFile,
      },
      development: {
        hmr: true,
        console: true,
      },
      bundling: {
        enabled: true,
        minify: false,
        sourcemap: true,
      },
      verbose: true,
    });

    console.log(`✅ React development server running at: ${url}`);
    console.log("\n📝 Features enabled:");
    console.log("• React JSX/TSX compilation");
    console.log("• Hot module reloading");
    console.log("• Source maps for debugging");
    console.log("• Browser console forwarding");
    console.log("• CSS bundling and processing");

    console.log("\n🔧 Development workflow:");
    console.log("1. Edit files in the example-react-app directory");
    console.log("2. Changes will automatically reload in the browser");
    console.log("3. Check browser console for any errors");
    console.log("4. TypeScript errors will be shown in the terminal");

    // Graceful shutdown
    process.on("SIGINT", async () => {
      console.log("\n🛑 Shutting down development server...");
      server.close(() => {
        console.log("✅ Development server stopped successfully");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("❌ Failed to start development server:", error);
    process.exit(1);
  }
}

/**
 * Example 2: Production server with optimizations
 */
async function productionServer() {
  console.log("📦 Starting React production server...\n");

  const appDir = createReactApp();
  const htmlFile = join(appDir, "index.html");

  try {
    const { server, port, url } = await serveStaticAction({
      port: 3001,
      directories: {
        "/": htmlFile,
      },
      development: false,
      bundling: {
        enabled: true,
        minify: true,
        sourcemap: false,
        cache: true,
      },
      verbose: true,
    });

    console.log(`✅ React production server running at: ${url}`);
    console.log("\n📝 Production optimizations:");
    console.log("• Minified JavaScript and CSS");
    console.log("• Asset caching with ETags");
    console.log("• Optimized bundle sizes");
    console.log("• No source maps (smaller bundles)");

    console.log("\n🚀 Ready for deployment!");
    console.log("• All assets are optimized for production");
    console.log("• Proper caching headers are set");
    console.log("• Bundle sizes are minimized");

    // Graceful shutdown
    process.on("SIGINT", async () => {
      console.log("\n🛑 Shutting down production server...");
      server.close(() => {
        console.log("✅ Production server stopped successfully");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("❌ Failed to start production server:", error);
    process.exit(1);
  }
}

/**
 * Example 3: Multi-page React application
 */
async function multiPageApp() {
  console.log("🏗️ Starting multi-page React application...\n");

  const appDir = createReactApp();

  // Create additional pages
  const aboutHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>About - React App</title>
    <link rel="stylesheet" href="./src/styles/global.css">
</head>
<body>
    <div id="root"></div>
    <script type="module" src="./src/about.tsx"></script>
</body>
</html>`;

  const aboutTsx = `import React from 'react';
import { createRoot } from 'react-dom/client';
import { Header } from './components/Header';
import './styles/global.css';

const AboutPage: React.FC = () => {
  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <h2>About This App</h2>
        <p>This is a multi-page React application built with HTML imports.</p>
        <ul>
          <li>React 18 with TypeScript</li>
          <li>Hot module reloading</li>
          <li>CSS bundling and processing</li>
          <li>Multiple HTML entry points</li>
        </ul>
        <nav>
          <a href="/">← Back to Todo App</a>
        </nav>
      </main>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<AboutPage />);
`;

  writeFileSync(join(appDir, "about.html"), aboutHtml);
  writeFileSync(join(appDir, "src", "about.tsx"), aboutTsx);

  try {
    const { server, port, url } = await serveStaticAction({
      port: 3002,
      directories: {
        "/": join(appDir, "index.html"),
        "/about": join(appDir, "about.html"),
      },
      development: true,
      bundling: {
        enabled: true,
        sourcemap: true,
      },
      verbose: true,
    });

    console.log(`✅ Multi-page React app running at: ${url}`);
    console.log("\n📄 Pages available:");
    console.log("• http://localhost:3002/       -> Todo App");
    console.log("• http://localhost:3002/about  -> About Page");

    console.log("\n📝 Features:");
    console.log("• Multiple HTML entry points");
    console.log("• Shared React components");
    console.log("• Independent page bundles");
    console.log("• Common CSS and assets");

    // Graceful shutdown
    process.on("SIGINT", async () => {
      console.log("\n🛑 Shutting down multi-page app...");
      server.close(() => {
        console.log("✅ Multi-page app stopped successfully");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("❌ Failed to start multi-page app:", error);
    process.exit(1);
  }
}

// Run examples based on command line argument
const example = process.argv[2] || "development";

switch (example) {
  case "development":
  case "dev":
    developmentServer();
    break;
  case "production":
  case "prod":
    productionServer();
    break;
  case "multipage":
  case "multi":
    multiPageApp();
    break;
  default:
    console.log("Usage: node serve-static-react-app.ts [development|production|multipage]");
    console.log("\nExamples:");
    console.log("• development - React app with hot reloading");
    console.log("• production  - Optimized React app for production");
    console.log("• multipage   - Multi-page React application");
    process.exit(1);
}
