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

    return `
${header}

${thought}`;
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
  description: `A detailed tool for engineering-focused problem-solving through systematic, sequential thoughts.
This tool helps analyze complex technical problems using structured engineering methodologies.
Each thought should build upon previous analysis using sound engineering principles and practices.

Engineering Problem-Solving Focus:
- Apply systematic engineering methodologies (requirements analysis, design patterns, testing strategies)
- Consider scalability, maintainability, performance, and reliability implications
- Evaluate trade-offs between different technical approaches
- Follow engineering best practices and industry standards
- Consider system architecture, dependencies, and integration points
- Think through error handling, edge cases, and failure modes
- Plan for testing, deployment, and monitoring

When to use this tool:
- Breaking down complex technical problems into manageable engineering tasks
- System design and architecture planning
- Technical analysis requiring engineering rigor
- Code design and implementation planning
- Performance optimization and troubleshooting
- Infrastructure and deployment strategy
- Technical risk assessment and mitigation
- Multi-step engineering solutions requiring context maintenance

Key engineering features:
- Systematic decomposition of technical problems
- Structured analysis of requirements and constraints
- Evaluation of multiple solution approaches
- Risk assessment and mitigation planning
- Design pattern identification and application
- Performance and scalability considerations
- Testing and validation strategy development

Engineering best practices:
1. Start with clear problem definition and requirements analysis
2. Consider multiple solution approaches and evaluate trade-offs
3. Think through system boundaries, interfaces, and dependencies
4. Plan for error handling, logging, and monitoring
5. Consider scalability, performance, and security implications
6. Apply appropriate design patterns and architectural principles
7. Plan testing strategy (unit, integration, system, performance)
8. Consider deployment, rollback, and operational concerns
9. Document key decisions and rationale
10. Validate solutions against requirements and constraints
11. Only set nextThoughtNeeded to false when engineering analysis is complete`,

  parameters: z.object({
    thought: z
      .string()
      .describe(
        "Your current engineering thinking step - should include technical analysis, design considerations, trade-off evaluations, risk assessments, or solution validation using engineering principles",
      ),
    nextThoughtNeeded: z
      .boolean()
      .describe(
        "Whether another thought step is needed to complete the engineering analysis and solution design",
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
      .describe(
        "Whether this thought revises previous technical analysis or design decisions based on new engineering insights",
      ),
    revisesThought: z
      .number()
      .int()
      .min(1)
      .optional()
      .describe(
        "Which engineering analysis or design decision is being reconsidered (required if isRevision is true)",
      ),
    branchFromThought: z
      .number()
      .int()
      .min(1)
      .optional()
      .describe(
        "If branching to explore an alternative technical approach or design solution, which thought number is the branching point",
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
        "If reaching the estimated end but realizing more engineering analysis or design work is needed",
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
