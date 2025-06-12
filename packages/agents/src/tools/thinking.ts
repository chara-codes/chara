import { tool } from "ai";
import z from "zod";

interface ThoughtData {
  thought: string;
  thoughtNumber: number;
  totalThoughts: number;
  isRevision?: boolean;
  revisesThought?: number;
  branchFromThought?: number;
  branchId?: string;
  needsMoreThoughts?: boolean;
  nextThoughtNeeded: boolean;
}

class ThinkingEngine {
  private thoughtHistory: ThoughtData[] = [];
  private branches: Record<string, ThoughtData[]> = {};

  private formatThought(thoughtData: ThoughtData): string {
    const {
      thoughtNumber,
      totalThoughts,
      thought,
      isRevision,
      revisesThought,
      branchFromThought,
      branchId,
    } = thoughtData;

    let prefix = "";
    let context = "";

    if (isRevision) {
      prefix = "🔄 Revision";
      context = ` (revising thought ${revisesThought})`;
    } else if (branchFromThought) {
      prefix = "🌿 Branch";
      context = ` (from thought ${branchFromThought}, ID: ${branchId})`;
    } else {
      prefix = "💭 Thought";
      context = "";
    }

    const header = `${prefix} ${thoughtNumber}/${totalThoughts}${context}`;
    const border = "─".repeat(Math.max(header.length, thought.length + 4));

    return `
┌${border}┐
│ ${header.padEnd(border.length - 2)} │
├${border}┤
│ ${thought
      .split("\n")
      .map((line) => `${line.padEnd(border.length - 4)} `)
      .join("│\n│ ")} │
└${border}┘`;
  }

  public processThought(thoughtData: ThoughtData): string {
    // Validate thought number doesn't exceed total
    if (thoughtData.thoughtNumber > thoughtData.totalThoughts) {
      thoughtData.totalThoughts = thoughtData.thoughtNumber;
    }

    // Add to history
    this.thoughtHistory.push(thoughtData);

    // Handle branching
    if (thoughtData.branchFromThought && thoughtData.branchId) {
      if (!this.branches[thoughtData.branchId]) {
        this.branches[thoughtData.branchId] = [];
      }
      this.branches[thoughtData.branchId]?.push(thoughtData);
    }

    // Format the thought for display
    const formattedThought = this.formatThought(thoughtData);

    // Create summary for return
    const summary = {
      thoughtNumber: thoughtData.thoughtNumber,
      totalThoughts: thoughtData.totalThoughts,
      nextThoughtNeeded: thoughtData.nextThoughtNeeded,
      activeBranches: Object.keys(this.branches),
      totalThoughtsProcessed: this.thoughtHistory.length,
      currentThought: thoughtData.thought,
      isRevision: thoughtData.isRevision || false,
      revisesThought: thoughtData.revisesThought,
      branchInfo: thoughtData.branchFromThought
        ? {
            branchFromThought: thoughtData.branchFromThought,
            branchId: thoughtData.branchId,
          }
        : undefined,
    };

    return `${formattedThought}

**Thinking Progress:**
- Current: ${thoughtData.thoughtNumber}/${thoughtData.totalThoughts}
- Next thought needed: ${thoughtData.nextThoughtNeeded ? "Yes" : "No"}
- Total thoughts processed: ${this.thoughtHistory.length}
- Active branches: ${Object.keys(this.branches).length}

**Summary:**
\`\`\`json
${JSON.stringify(summary, null, 2)}
\`\`\``;
  }

  public getThoughtHistory(): ThoughtData[] {
    return [...this.thoughtHistory];
  }

  public getBranches(): Record<string, ThoughtData[]> {
    return { ...this.branches };
  }

  public reset(): void {
    this.thoughtHistory = [];
    this.branches = {};
  }
}

// Global thinking engine instance to maintain state across calls
const globalThinkingEngine = new ThinkingEngine();

// Add reset function for testing
export const resetThinkingEngine = () => {
  globalThinkingEngine.reset();
};

export const thinking = tool({
  description: `A detailed tool for dynamic and reflective problem-solving through sequential thoughts.
This tool helps analyze complex problems through a flexible thinking process that can adapt and evolve.
Each thought can build on, question, or revise previous insights as understanding deepens.

When to use this tool:
- Breaking down complex problems into manageable steps
- Planning and design work that might need revision
- Analysis that could require course correction
- Problems where the full scope isn't initially clear
- Multi-step solutions requiring context maintenance
- Filtering out irrelevant information
- Hypothesis generation and verification

Key features:
- Adjust total_thoughts up or down as you progress
- Question or revise previous thoughts
- Add more thoughts even after reaching initial end
- Express uncertainty and explore alternatives
- Branch or backtrack non-linearly
- Generate and verify solution hypotheses
- Repeat until satisfied with the solution

Best practices:
1. Start with an initial estimate of needed thoughts, but be ready to adjust
2. Question or revise previous thoughts when needed
3. Add more thoughts if needed, even at the "end"
4. Express uncertainty when present
5. Mark thoughts that revise previous thinking or branch into new paths
6. Ignore irrelevant information
7. Generate solution hypotheses when appropriate
8. Verify hypotheses based on previous thoughts
9. Repeat until satisfied with the solution
10. Only set nextThoughtNeeded to false when truly done`,

  parameters: z.object({
    thought: z
      .string()
      .describe(
        "Your current thinking step - can include analysis, revisions, questions, realizations, or hypothesis generation/verification",
      ),
    nextThoughtNeeded: z
      .boolean()
      .describe(
        "Whether another thought step is needed to complete the problem-solving process",
      ),
    thoughtNumber: z
      .number()
      .int()
      .min(1)
      .describe("Current thought number in the sequence"),
    totalThoughts: z
      .number()
      .int()
      .min(1)
      .describe(
        "Current estimate of total thoughts needed (can be adjusted up or down)",
      ),
    isRevision: z
      .boolean()
      .optional()
      .describe("Whether this thought revises or questions previous thinking"),
    revisesThought: z
      .number()
      .int()
      .min(1)
      .optional()
      .describe(
        "Which thought number is being reconsidered (required if isRevision is true)",
      ),
    branchFromThought: z
      .number()
      .int()
      .min(1)
      .optional()
      .describe(
        "If branching to explore an alternative, which thought number is the branching point",
      ),
    branchId: z
      .string()
      .optional()
      .describe(
        "Unique identifier for this branch (required if branchFromThought is specified)",
      ),
    needsMoreThoughts: z
      .boolean()
      .optional()
      .describe(
        "If reaching the estimated end but realizing more thoughts are needed",
      ),
  }),
  execute: async ({
    thought,
    nextThoughtNeeded,
    thoughtNumber,
    totalThoughts,
    isRevision,
    revisesThought,
    branchFromThought,
    branchId,
    needsMoreThoughts,
  }) => {
    // Validation
    if (isRevision && !revisesThought) {
      throw new Error("revisesThought is required when isRevision is true");
    }

    if (branchFromThought && !branchId) {
      throw new Error(
        "branchId is required when branchFromThought is specified",
      );
    }

    if (revisesThought && revisesThought >= thoughtNumber) {
      throw new Error("revisesThought must be less than current thoughtNumber");
    }

    if (branchFromThought && branchFromThought >= thoughtNumber) {
      throw new Error(
        "branchFromThought must be less than current thoughtNumber",
      );
    }

    const thoughtData: ThoughtData = {
      thought,
      thoughtNumber,
      totalThoughts,
      nextThoughtNeeded,
      isRevision,
      revisesThought,
      branchFromThought,
      branchId,
      needsMoreThoughts,
    };

    return globalThinkingEngine.processThought(thoughtData);
  },
});
