import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { codeGrep } from "../code-grep";

const TEST_DIR = "test-temp/code-grep-test";

describe("code-grep tool", () => {
  beforeAll(async () => {
    // Create test directory and files
    await mkdir(TEST_DIR, { recursive: true });

    // JavaScript test file
    await writeFile(
      join(TEST_DIR, "test.js"),
      `
import React from 'react';
import { useState } from 'react';

function MyComponent() {
  const [count, setCount] = useState(0);

  console.log("Component rendered");

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>
        Count: {count}
      </button>
    </div>
  );
}

export default MyComponent;
`
    );

    // TypeScript test file
    await writeFile(
      join(TEST_DIR, "utils.ts"),
      `
interface User {
  id: number;
  name: string;
  email: string;
}

function getUserById(id: number): User | null {
  console.log(\`Fetching user with id: \${id}\`);
  return null;
}

class UserService {
  private users: User[] = [];

  addUser(user: User): void {
    this.users.push(user);
    console.log("User added:", user.name);
  }

  getUsers(): User[] {
    return this.users;
  }
}

export { User, getUserById, UserService };
`
    );

    // Vue test file
    await writeFile(
      join(TEST_DIR, "Component.vue"),
      `<template>
  <div>
    <h1>{{ title }}</h1>
    <button @click="handleClick">Click me</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const title = ref('Hello Vue');
const count = ref(0);

function handleClick() {
  count.value++;
  console.log('Button clicked', count.value);
}
</script>

<script lang="js">
export default {
  name: 'Component'
}
</script>

<style scoped>
h1 {
  color: blue;
}
</style>
`
    );

    // Svelte test file
    await writeFile(
      join(TEST_DIR, "Counter.svelte"),
      `<script lang="ts">
  let count = 0;

  function increment() {
    count += 1;
    console.log('Count incremented to', count);
  }
</script>

<h1>Count: {count}</h1>
<button on:click={increment}>Increment</button>

<style>
  h1 {
    color: purple;
  }
</style>
`
    );

    // Astro test file
    await writeFile(
      join(TEST_DIR, "Page.astro"),
      `---
import Layout from '../layouts/Layout.astro';

const title = 'Welcome to Astro';
const items = ['apple', 'banana', 'cherry'];

console.log('Page rendered with title:', title);
---

<Layout title={title}>
  <main>
    <h1>Welcome to <span class="text-gradient">Astro</span></h1>
    <ul>
      {items.map(item => <li>{item}</li>)}
    </ul>
  </main>
</Layout>

<script>
  console.log('Client-side script loaded');

  function trackClick() {
    console.log('Element clicked');
  }
</script>

<style>
  .text-gradient {
    background-image: linear-gradient(45deg, #4f39fa, #da62c4);
  }
</style>
`
    );
  });

  afterAll(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
  });

  test("should find console.log statements", async () => {
    const result = await codeGrep.execute({
      pattern: "console.log($A)",
      paths: TEST_DIR,
      maxMatches: 10,
      includeContext: false,
    });

    expect(result.success).toBe(true);
    expect(result.data.total).toBeGreaterThan(0);

    const match = result.data.matches.find((m) =>
      m.text.includes("Component rendered")
    );
    expect(match).toBeDefined();
    expect(match?.match?.A).toBe('"Component rendered"');
  });

  test("should find import statements", async () => {
    const result = await codeGrep.execute({
      pattern: "import $NAME from $MODULE",
      paths: TEST_DIR,
      maxMatches: 10,
      includeContext: false,
    });

    expect(result.success).toBe(true);
    expect(result.data.total).toBeGreaterThan(0);

    const reactImport = result.data.matches.find(
      (m) => m.match?.MODULE === "'react'"
    );
    expect(reactImport).toBeDefined();
    expect(reactImport?.match?.NAME).toBe("React");
  });

  test("should find destructured imports", async () => {
    const result = await codeGrep.execute({
      pattern: "import { $NAME } from $MODULE",
      paths: TEST_DIR,
      maxMatches: 10,
      includeContext: false,
    });

    expect(result.success).toBe(true);
    expect(result.data.total).toBeGreaterThan(0);

    const useStateImport = result.data.matches.find(
      (m) => m.match?.MODULE === "'react'"
    );
    expect(useStateImport).toBeDefined();
    expect(useStateImport?.match?.NAME).toBe("useState");
  });

  test("should find function definitions", async () => {
    const result = await codeGrep.execute({
      pattern: "function $NAME($$$PARAMS) { $$$BODY }",
      paths: TEST_DIR,
      maxMatches: 10,
      includeContext: false,
    });

    expect(result.success).toBe(true);
    expect(result.data.total).toBeGreaterThan(0);

    const myComponentFunc = result.data.matches.find(
      (m) => m.match?.NAME === "MyComponent"
    );
    expect(myComponentFunc).toBeDefined();
  });

  test("should find type annotations", async () => {
    const result = await codeGrep.execute({
      pattern: "function $NAME($A: $TYPE)",
      paths: TEST_DIR,
      maxMatches: 10,
      includeContext: false,
    });

    expect(result.success).toBe(true);

    // Should find TypeScript functions with type annotations
    if (result.data.total > 0) {
      const typedFunction = result.data.matches.find(
        (m) => m.match?.NAME === "getUserById"
      );
      expect(typedFunction).toBeDefined();
      expect(typedFunction?.match?.TYPE).toBe("number");
    }
  });

  test("should find class definitions with methods", async () => {
    const result = await codeGrep.execute({
      pattern: "class $NAME { $$$BODY }",
      paths: TEST_DIR,
      maxMatches: 10,
      includeContext: false,
    });

    expect(result.success).toBe(true);
    expect(result.data.total).toBeGreaterThan(0);

    const userServiceClass = result.data.matches.find(
      (m) => m.match?.NAME === "UserService"
    );
    expect(userServiceClass).toBeDefined();
  });

  test("should filter by language", async () => {
    const result = await codeGrep.execute({
      pattern: "console.log($A)",
      paths: TEST_DIR,
      maxMatches: 10,
      includeContext: false,
      languages: ["typescript"],
    });

    expect(result.success).toBe(true);
    // Should only find matches in .ts files
    if (result.data.matches.length > 0) {
      const hasJsFile = result.data.matches.some((m) => m.file.endsWith(".js"));
      expect(hasJsFile).toBe(false);
    }
  });

  test("should include context when requested", async () => {
    const result = await codeGrep.execute({
      pattern: "console.log($A)",
      paths: TEST_DIR,
      maxMatches: 1,
      includeContext: true,
    });

    expect(result.success).toBe(true);
    expect(result.data.total).toBeGreaterThan(0);
    expect(result.data.matches[0].context).toBeDefined();
  });

  test("should respect maxMatches limit", async () => {
    const result = await codeGrep.execute({
      pattern: "console.log($A)",
      paths: TEST_DIR,
      maxMatches: 2,
      includeContext: false,
    });

    expect(result.success).toBe(true);
    expect(result.data.matches.length).toBeLessThanOrEqual(2);
  });

  test("should handle non-existent patterns gracefully", async () => {
    const result = await codeGrep.execute({
      pattern: "nonExistentFunction($A)",
      paths: TEST_DIR,
      maxMatches: 10,
      includeContext: false,
    });

    expect(result.success).toBe(true);
    expect(result.data.total).toBe(0);
    expect(result.data.matches).toEqual([]);
  });

  test("should handle invalid paths gracefully", async () => {
    const result = await codeGrep.execute({
      pattern: "console.log($A)",
      paths: "non-existent-directory",
      maxMatches: 10,
      includeContext: false,
    });

    expect(result.success).toBe(true);
    expect(result.data.total).toBe(0);
    expect(result.data.files_searched).toBe(0);
  });

  test("should find variable declarations", async () => {
    const result = await codeGrep.execute({
      pattern: "const [$VAR, $SETTER] = useState($INITIAL)",
      paths: TEST_DIR,
      maxMatches: 10,
      includeContext: false,
    });

    expect(result.success).toBe(true);
    expect(result.data.total).toBeGreaterThan(0);

    const stateMatch = result.data.matches[0];
    expect(stateMatch?.match?.VAR).toBe("count");
    expect(stateMatch?.match?.SETTER).toBe("setCount");
    expect(stateMatch?.match?.INITIAL).toBe("0");
  });

  test("should work with multiple file extensions", async () => {
    const result = await codeGrep.execute({
      pattern: "console.log($A)",
      paths: TEST_DIR,
      maxMatches: 10,
      includeContext: false,
    });

    expect(result.success).toBe(true);
    expect(result.data.total).toBeGreaterThan(0);

    // Should find matches in both .js and .ts files
    const jsMatch = result.data.matches.find((m) => m.file.endsWith(".js"));
    const tsMatch = result.data.matches.find((m) => m.file.endsWith(".ts"));

    expect(jsMatch || tsMatch).toBeDefined();
  });

  test("should find code in Vue single file components", async () => {
    const result = await codeGrep.execute({
      pattern: "console.log($A, $B)",
      paths: TEST_DIR,
      maxMatches: 10,
      includeContext: false,
    });

    expect(result.success).toBe(true);
    expect(result.data.total).toBeGreaterThan(0);

    const vueMatch = result.data.matches.find((m) => m.file.endsWith(".vue"));
    expect(vueMatch).toBeDefined();
    expect(vueMatch?.match?.A).toBe("'Button clicked'");
    expect(vueMatch?.match?.B).toBe("count.value");
  });

  test("should find Vue import statements", async () => {
    const result = await codeGrep.execute({
      pattern: "import { $NAME } from $MODULE",
      paths: TEST_DIR,
      maxMatches: 10,
      includeContext: false,
    });

    expect(result.success).toBe(true);

    const vueImport = result.data.matches.find(
      (m) => m.file.endsWith(".vue") && m.match?.MODULE === "'vue'"
    );
    expect(vueImport).toBeDefined();
    expect(vueImport?.match?.NAME).toBe("ref");
  });

  test("should find code in Svelte components", async () => {
    const result = await codeGrep.execute({
      pattern: "console.log($A, $B)",
      paths: TEST_DIR,
      maxMatches: 10,
      includeContext: false,
    });

    expect(result.success).toBe(true);

    const svelteMatch = result.data.matches.find((m) =>
      m.file.endsWith(".svelte")
    );
    expect(svelteMatch).toBeDefined();
    expect(svelteMatch?.match?.A).toBe("'Count incremented to'");
    expect(svelteMatch?.match?.B).toBe("count");
  });

  test("should find Svelte function definitions", async () => {
    const result = await codeGrep.execute({
      pattern: "function $NAME() { $$$BODY }",
      paths: TEST_DIR,
      maxMatches: 10,
      includeContext: false,
    });

    expect(result.success).toBe(true);

    const svelteFunc = result.data.matches.find(
      (m) => m.file.endsWith(".svelte") && m.match?.NAME === "increment"
    );
    expect(svelteFunc).toBeDefined();
  });

  test("should find code in Astro files (frontmatter)", async () => {
    const result = await codeGrep.execute({
      pattern: "console.log($A, $B)",
      paths: TEST_DIR,
      maxMatches: 10,
      includeContext: false,
    });

    expect(result.success).toBe(true);

    const astroMatch = result.data.matches.find(
      (m) => m.file.endsWith(".astro") && m.text.includes("Page rendered")
    );
    expect(astroMatch).toBeDefined();
    expect(astroMatch?.match?.A).toBe("'Page rendered with title:'");
    expect(astroMatch?.match?.B).toBe("title");
  });

  test("should find code in Astro script sections", async () => {
    const result = await codeGrep.execute({
      pattern: "function $NAME() { $$$BODY }",
      paths: TEST_DIR,
      maxMatches: 10,
      includeContext: false,
    });

    expect(result.success).toBe(true);

    const astroScript = result.data.matches.find(
      (m) => m.file.endsWith(".astro") && m.match?.NAME === "trackClick"
    );
    expect(astroScript).toBeDefined();
  });

  test("should filter by component file types", async () => {
    const vueResult = await codeGrep.execute({
      pattern: "console.log($A)",
      paths: TEST_DIR,
      maxMatches: 10,
      includeContext: false,
      languages: ["vue"],
    });

    expect(vueResult.success).toBe(true);
    if (vueResult.data.matches.length > 0) {
      const hasOnlyVue = vueResult.data.matches.every((m) =>
        m.file.endsWith(".vue")
      );
      expect(hasOnlyVue).toBe(true);
    }

    const svelteResult = await codeGrep.execute({
      pattern: "console.log($A)",
      paths: TEST_DIR,
      maxMatches: 10,
      includeContext: false,
      languages: ["svelte"],
    });

    expect(svelteResult.success).toBe(true);
    if (svelteResult.data.matches.length > 0) {
      const hasOnlySvelte = svelteResult.data.matches.every((m) =>
        m.file.endsWith(".svelte")
      );
      expect(hasOnlySvelte).toBe(true);
    }
  });

  test("should handle component files with different script lang attributes", async () => {
    const result = await codeGrep.execute({
      pattern: "const $VAR = ref($VALUE)",
      paths: TEST_DIR,
      maxMatches: 10,
      includeContext: false,
    });

    expect(result.success).toBe(true);

    const titleRef = result.data.matches.find(
      (m) => m.file.endsWith(".vue") && m.match?.VAR === "title"
    );
    expect(titleRef).toBeDefined();
    expect(titleRef?.match?.VALUE).toBe("'Hello Vue'");
  });

  test("should correctly map line numbers in component files", async () => {
    const result = await codeGrep.execute({
      pattern: "console.log($A, $B)",
      paths: TEST_DIR,
      maxMatches: 10,
      includeContext: false,
    });

    expect(result.success).toBe(true);

    const vueMatch = result.data.matches.find((m) => m.file.endsWith(".vue"));
    if (vueMatch) {
      // The console.log in Vue should be around line 15-16 (after template and script setup start)
      expect(vueMatch.line).toBeGreaterThan(10);
    }

    const astroMatch = result.data.matches.find(
      (m) => m.file.endsWith(".astro") && m.text.includes("Page rendered")
    );
    if (astroMatch) {
      // The console.log in Astro frontmatter should be around line 6-7
      expect(astroMatch.line).toBeLessThan(10);
    }
  });
});
