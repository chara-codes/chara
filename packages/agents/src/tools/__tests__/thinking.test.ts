import { describe, test, expect, beforeEach } from "bun:test";
import { thinking, resetThinkingEngine } from "../thinking";

describe("thinking tool", () => {
  beforeEach(() => {
    resetThinkingEngine();
  });

  test("should process a simple thought successfully", async () => {
    const result = await thinking.execute({
      thought: "I need to analyze the problem step by step",
      nextThoughtNeeded: true,
      thoughtNumber: 1,
      totalThoughts: 3,
    });

    expect(result).toContain("💭 Thought 1/3");
    expect(result).toContain("I need to analyze the problem step by step");
    expect(result).toContain("Next thought needed: Yes");
    expect(result).toContain("Total thoughts processed: 1");
  });

  test("should handle revision thoughts correctly", async () => {
    // First thought
    await thinking.execute({
      thought: "Initial approach: use method A",
      nextThoughtNeeded: true,
      thoughtNumber: 1,
      totalThoughts: 3,
    });

    // Revision thought
    const result = await thinking.execute({
      thought:
        "Actually, method A won't work because of constraint X. Let me reconsider method B.",
      nextThoughtNeeded: true,
      thoughtNumber: 2,
      totalThoughts: 3,
      isRevision: true,
      revisesThought: 1,
    });

    expect(result).toContain("🔄 Revision 2/3");
    expect(result).toContain("(revising thought 1)");
    expect(result).toContain("method B");
    expect(result).toContain('"isRevision": true');
    expect(result).toContain('"revisesThought": 1');
  });

  test("should handle branching thoughts correctly", async () => {
    // First thought
    await thinking.execute({
      thought: "I have two possible approaches to explore",
      nextThoughtNeeded: true,
      thoughtNumber: 1,
      totalThoughts: 4,
    });

    // Branch thought
    const result = await thinking.execute({
      thought: "Exploring branch A: using recursive approach",
      nextThoughtNeeded: true,
      thoughtNumber: 2,
      totalThoughts: 4,
      branchFromThought: 1,
      branchId: "recursive-approach",
    });

    expect(result).toContain("🌿 Branch 2/4");
    expect(result).toContain("(from thought 1, ID: recursive-approach)");
    expect(result).toContain("recursive approach");
    expect(result).toContain("Active branches: 1");
    expect(result).toContain('"branchId": "recursive-approach"');
  });

  test("should adjust total thoughts when current exceeds estimate", async () => {
    const result = await thinking.execute({
      thought: "This is more complex than I initially thought",
      nextThoughtNeeded: true,
      thoughtNumber: 5,
      totalThoughts: 3, // Lower than current number
    });

    expect(result).toContain("💭 Thought 5/5");
    expect(result).toContain('"totalThoughts": 5');
  });

  test("should handle final thought correctly", async () => {
    const result = await thinking.execute({
      thought:
        "Final conclusion: the solution is to use approach C with optimization D",
      nextThoughtNeeded: false,
      thoughtNumber: 3,
      totalThoughts: 3,
    });

    expect(result).toContain("💭 Thought 3/3");
    expect(result).toContain("Next thought needed: No");
    expect(result).toContain("Final conclusion");
    expect(result).toContain('"nextThoughtNeeded": false');
  });

  test("should handle multiline thoughts correctly", async () => {
    const multilineThought = `Let me break this down:
1. First, analyze the requirements
2. Then, design the solution
3. Finally, implement and test`;

    const result = await thinking.execute({
      thought: multilineThought,
      nextThoughtNeeded: true,
      thoughtNumber: 1,
      totalThoughts: 2,
    });

    expect(result).toContain("Let me break this down:");
    expect(result).toContain("1. First, analyze the requirements");
    expect(result).toContain("2. Then, design the solution");
    expect(result).toContain("3. Finally, implement and test");
  });

  test("should track multiple branches correctly", async () => {
    // Initial thought
    await thinking.execute({
      thought: "Need to explore multiple solutions",
      nextThoughtNeeded: true,
      thoughtNumber: 1,
      totalThoughts: 5,
    });

    // First branch
    await thinking.execute({
      thought: "Branch A: iterative solution",
      nextThoughtNeeded: true,
      thoughtNumber: 2,
      totalThoughts: 5,
      branchFromThought: 1,
      branchId: "iterative",
    });

    // Second branch
    const result = await thinking.execute({
      thought: "Branch B: functional solution",
      nextThoughtNeeded: true,
      thoughtNumber: 3,
      totalThoughts: 5,
      branchFromThought: 1,
      branchId: "functional",
    });

    expect(result).toContain("Active branches: 2");
    expect(result).toContain("functional solution");
  });

  test("should handle needsMoreThoughts parameter", async () => {
    const result = await thinking.execute({
      thought:
        "I thought I was done, but I realize I need to consider edge cases",
      nextThoughtNeeded: true,
      thoughtNumber: 3,
      totalThoughts: 3,
      needsMoreThoughts: true,
    });

    expect(result).toContain("💭 Thought 3/3");
    expect(result).toContain("edge cases");
    expect(result).toContain("Next thought needed: Yes");
  });

  test("should validate revision parameters correctly", async () => {
    await expect(
      thinking.execute({
        thought: "This is a revision",
        nextThoughtNeeded: true,
        thoughtNumber: 2,
        totalThoughts: 3,
        isRevision: true,
        // Missing revisesThought parameter
      }),
    ).rejects.toThrow("revisesThought is required when isRevision is true");
  });

  test("should validate branch parameters correctly", async () => {
    await expect(
      thinking.execute({
        thought: "This is a branch",
        nextThoughtNeeded: true,
        thoughtNumber: 2,
        totalThoughts: 3,
        branchFromThought: 1,
        // Missing branchId parameter
      }),
    ).rejects.toThrow(
      "branchId is required when branchFromThought is specified",
    );
  });

  test("should validate revisesThought number correctly", async () => {
    await expect(
      thinking.execute({
        thought: "Invalid revision",
        nextThoughtNeeded: true,
        thoughtNumber: 2,
        totalThoughts: 3,
        isRevision: true,
        revisesThought: 3, // Cannot revise a future thought
      }),
    ).rejects.toThrow("revisesThought must be less than current thoughtNumber");
  });

  test("should validate branchFromThought number correctly", async () => {
    await expect(
      thinking.execute({
        thought: "Invalid branch",
        nextThoughtNeeded: true,
        thoughtNumber: 2,
        totalThoughts: 3,
        branchFromThought: 2, // Cannot branch from same thought
        branchId: "test-branch",
      }),
    ).rejects.toThrow(
      "branchFromThought must be less than current thoughtNumber",
    );
  });

  test("should maintain state across multiple thoughts", async () => {
    // First thought
    await thinking.execute({
      thought: "Starting analysis",
      nextThoughtNeeded: true,
      thoughtNumber: 1,
      totalThoughts: 3,
    });

    // Second thought
    await thinking.execute({
      thought: "Building on previous analysis",
      nextThoughtNeeded: true,
      thoughtNumber: 2,
      totalThoughts: 3,
    });

    // Third thought should show accumulated state
    const result = await thinking.execute({
      thought: "Final synthesis",
      nextThoughtNeeded: false,
      thoughtNumber: 3,
      totalThoughts: 3,
    });

    expect(result).toContain("Total thoughts processed: 3");
    expect(result).toContain("Final synthesis");
  });

  test("should handle complex thinking scenario with revisions and branches", async () => {
    // Initial thought
    await thinking.execute({
      thought: "Problem: optimize database queries",
      nextThoughtNeeded: true,
      thoughtNumber: 1,
      totalThoughts: 4,
    });

    // First approach
    await thinking.execute({
      thought: "Approach 1: Add indexes to all columns",
      nextThoughtNeeded: true,
      thoughtNumber: 2,
      totalThoughts: 4,
    });

    // Revision of first approach
    await thinking.execute({
      thought:
        "Actually, indexing all columns would be too expensive. Need to be selective.",
      nextThoughtNeeded: true,
      thoughtNumber: 3,
      totalThoughts: 4,
      isRevision: true,
      revisesThought: 2,
    });

    // Branch to explore alternative
    const result = await thinking.execute({
      thought: "Alternative: Query optimization through caching layer",
      nextThoughtNeeded: true,
      thoughtNumber: 4,
      totalThoughts: 4,
      branchFromThought: 1,
      branchId: "caching-approach",
    });

    expect(result).toContain("🌿 Branch 4/4");
    expect(result).toContain("caching layer");
    expect(result).toContain("Active branches: 1");
    expect(result).toContain("Total thoughts processed: 4");
  });

  test("should have correct tool metadata", () => {
    expect(thinking.description).toContain(
      "dynamic and reflective problem-solving",
    );
    expect(thinking.description).toContain("sequential thoughts");
    expect(thinking.description).toContain("Breaking down complex problems");
    expect(thinking.description).toContain(
      "Hypothesis generation and verification",
    );
    expect(thinking.parameters).toBeDefined();
  });

  test("should format thoughts with proper borders", async () => {
    const result = await thinking.execute({
      thought: "Short thought",
      nextThoughtNeeded: false,
      thoughtNumber: 1,
      totalThoughts: 1,
    });

    expect(result).toContain("┌");
    expect(result).toContain("┐");
    expect(result).toContain("├");
    expect(result).toContain("┤");
    expect(result).toContain("└");
    expect(result).toContain("┘");
    expect(result).toContain("─");
  });

  test("should include JSON summary in output", async () => {
    const result = await thinking.execute({
      thought: "Test thought for JSON output",
      nextThoughtNeeded: false,
      thoughtNumber: 1,
      totalThoughts: 1,
    });

    expect(result).toContain("**Summary:**");
    expect(result).toContain("```json");
    expect(result).toContain('"thoughtNumber": 1');
    expect(result).toContain('"totalThoughts": 1');
    expect(result).toContain('"nextThoughtNeeded": false');
    expect(result).toContain(
      '"currentThought": "Test thought for JSON output"',
    );
  });

  test("should handle unicode characters in thoughts", async () => {
    const unicodeThought = "思考: 这是一个测试 🤔 → solution";

    const result = await thinking.execute({
      thought: unicodeThought,
      nextThoughtNeeded: false,
      thoughtNumber: 1,
      totalThoughts: 1,
    });

    expect(result).toContain("思考: 这是一个测试 🤔 → solution");
    expect(result).toContain(
      '"currentThought": "思考: 这是一个测试 🤔 → solution"',
    );
  });

  test("should handle very long thoughts", async () => {
    const longThought =
      "This is a very long thought that spans multiple lines and contains a lot of detailed analysis. ".repeat(
        10,
      );

    const result = await thinking.execute({
      thought: longThought,
      nextThoughtNeeded: false,
      thoughtNumber: 1,
      totalThoughts: 1,
    });

    expect(result).toContain(longThought);
    expect(result).toContain("💭 Thought 1/1");
  });
});
