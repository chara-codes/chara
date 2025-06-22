import type { ToolCall, ToolResult } from "../types";

// Type definition for edit operations
interface EditOperation {
  oldText: string;
  newText: string;
  status?: "pending" | "applying" | "complete" | "error";
  error?: string;
}

interface ContentSegment {
  type: "text" | "tool-call";
  content: string;
  toolCall?: ToolCall;
}

export class MessageSegmentBuilder {
  private segments = [] as ContentSegment[];
  private currentTextSegment = "";
  private pendingToolCalls = new Map<string, ToolCall>();
  private toolCallInsertionPositions = new Map<string, number>();
  private completedToolCalls = new Set<string>();
  private lastSegmentsSnapshot: ContentSegment[] = [];
  private segmentVersions = new Map<number, number>();

  addTextDelta(delta: string): void {
    this.currentTextSegment += delta;
    // Increment version for the current text segment position
    const textSegmentPosition = this.segments.length;
    this.segmentVersions.set(
      textSegmentPosition,
      (this.segmentVersions.get(textSegmentPosition) || 0) + 1,
    );
  }

  beginToolCall(toolCallId: string, toolName: string): void {
    // Finalize any current text segment before adding tool call
    this.finalizeCurrentTextSegment();

    // Mark the position where this tool call should be inserted
    const insertionPosition = this.segments.length;
    this.toolCallInsertionPositions.set(toolCallId, insertionPosition);

    // Create pending tool call
    const toolCall: ToolCall = {
      id: toolCallId,
      name: toolName,
      arguments: {},
      status: "pending",
      timestamp: new Date().toISOString(),
    };

    this.pendingToolCalls.set(toolCallId, toolCall);

    // Add placeholder segment for the tool call
    this.segments.push({
      type: "tool-call",
      content: "",
      toolCall: { ...toolCall },
    });
  }

  updateToolCallArgs(toolCallId: string, args: Record<string, unknown>): void {
    const toolCall = this.pendingToolCalls.get(toolCallId);
    if (toolCall) {
      toolCall.arguments = args;
      toolCall.status = "in-progress";

      // For edit-file tool calls, ensure edits have proper status
      if (toolCall.name === "edit-file") {
        const edits = args.edits || [];
        if (Array.isArray(edits)) {
          toolCall.arguments = {
            ...args,
            edits: edits.map((edit: EditOperation) => ({
              ...edit,
              status: edit.status || "applying",
            })),
          };
        }
      }

      // Update the segment with the new tool call data
      const position = this.toolCallInsertionPositions.get(toolCallId);
      if (
        position !== undefined &&
        this.segments[position]?.type === "tool-call"
      ) {
        this.segments[position] = {
          ...this.segments[position],
          toolCall: { ...toolCall },
        };
        // Increment version for this segment position
        this.segmentVersions.set(
          position,
          (this.segmentVersions.get(position) || 0) + 1,
        );
      }
    }
  }

  completeToolCall(toolCallId: string, result?: ToolResult): void {
    const toolCall = this.pendingToolCalls.get(toolCallId);
    if (toolCall) {
      toolCall.result = result;
      const hasError =
        result && typeof result === "object" && "error" in result;
      toolCall.status = hasError ? "error" : "success";

      // For edit-file tool calls, update edit statuses based on completion
      if (toolCall.name === "edit-file") {
        const edits = toolCall.arguments?.edits || [];
        if (Array.isArray(edits)) {
          toolCall.arguments = {
            ...toolCall.arguments,
            edits: edits.map((edit: EditOperation) => ({
              ...edit,
              status: hasError ? "error" : "complete",
              error: hasError
                ? String((result as { error?: string })?.error)
                : undefined,
            })),
          };
        }
      }

      // Update the segment with the final tool call data
      const position = this.toolCallInsertionPositions.get(toolCallId);
      if (
        position !== undefined &&
        this.segments[position]?.type === "tool-call"
      ) {
        this.segments[position] = {
          ...this.segments[position],
          toolCall: { ...toolCall },
        };
        // Increment version for this segment position
        this.segmentVersions.set(
          position,
          (this.segmentVersions.get(position) || 0) + 1,
        );
      }

      // Move to completed set and clean up pending tracking
      this.completedToolCalls.add(toolCallId);
      this.pendingToolCalls.delete(toolCallId);
    }
  }

  errorToolCall(toolCallId: string, error: string): void {
    const toolCall = this.pendingToolCalls.get(toolCallId);
    if (toolCall) {
      toolCall.result = { error };
      toolCall.status = "error";

      // For edit-file tool calls, mark all edits as failed
      if (toolCall.name === "edit-file" || toolCall.name === "edit_file") {
        const edits = toolCall.arguments?.edits || [];
        if (Array.isArray(edits)) {
          toolCall.arguments = {
            ...toolCall.arguments,
            edits: edits.map((edit: EditOperation) => ({
              ...edit,
              status: "error",
              error: error,
            })),
          };
        }
      }

      // Update the segment with the error
      const position = this.toolCallInsertionPositions.get(toolCallId);
      if (
        position !== undefined &&
        this.segments[position]?.type === "tool-call"
      ) {
        this.segments[position] = {
          ...this.segments[position],
          toolCall: { ...toolCall },
        };
        // Increment version for this segment position
        this.segmentVersions.set(
          position,
          (this.segmentVersions.get(position) || 0) + 1,
        );
      }

      // Move to completed set and clean up pending tracking
      this.completedToolCalls.add(toolCallId);
      this.pendingToolCalls.delete(toolCallId);
    }
  }

  finalize(): ContentSegment[] {
    // Finalize any remaining text segment
    this.finalizeCurrentTextSegment();

    // Clean up any remaining pending tool calls
    for (const [toolCallId, toolCall] of this.pendingToolCalls.entries()) {
      toolCall.status = "error";
      toolCall.result = { error: "Tool call was interrupted" };

      const position = this.toolCallInsertionPositions.get(toolCallId);
      if (
        position !== undefined &&
        this.segments[position]?.type === "tool-call"
      ) {
        this.segments[position].toolCall = { ...toolCall };
      }
    }

    // Filter out empty segments
    return this.segments.filter((segment) => {
      if (segment.type === "text") {
        return segment.content.trim().length > 0;
      }
      return segment.toolCall !== undefined;
    });
  }

  getSegments(): ContentSegment[] {
    // Only create new array if we have pending text or segments changed
    if (this.currentTextSegment.trim()) {
      const segments = [...this.segments];
      segments.push({
        type: "text",
        content: this.currentTextSegment,
      });
      return segments;
    }

    // Return existing segments without creating new array
    return this.segments;
  }

  private hasSegmentsChanged(newSegments: ContentSegment[]): boolean {
    if (newSegments.length !== this.lastSegmentsSnapshot.length) {
      return true;
    }

    for (let i = 0; i < newSegments.length; i++) {
      const newSegment = newSegments[i];
      const oldSegment = this.lastSegmentsSnapshot[i];

      if (!oldSegment) return true;

      if (newSegment.type !== oldSegment.type) return true;

      if (newSegment.type === "text") {
        if (newSegment.content !== oldSegment.content) return true;
      } else if (newSegment.type === "tool-call") {
        // Compare tool call data more efficiently using versions
        const currentVersion = this.segmentVersions.get(i) || 0;
        const oldVersion = (oldSegment as any).__version || 0;
        if (currentVersion !== oldVersion) {
          (newSegment as any).__version = currentVersion;
          return true;
        }
      }
    }

    return false;
  }

  clear(): void {
    this.segments = [];
    this.currentTextSegment = "";
    this.pendingToolCalls.clear();
    this.toolCallInsertionPositions.clear();
    this.completedToolCalls.clear();
    this.lastSegmentsSnapshot = [];
    this.segmentVersions.clear();
  }

  isToolCallTracked(toolCallId: string): boolean {
    return (
      this.pendingToolCalls.has(toolCallId) ||
      this.toolCallInsertionPositions.has(toolCallId) ||
      this.completedToolCalls.has(toolCallId)
    );
  }

  private finalizeCurrentTextSegment(): void {
    if (this.currentTextSegment.trim()) {
      const segmentPosition = this.segments.length;
      this.segments.push({
        type: "text",
        content: this.currentTextSegment,
      });
      // Set initial version for this segment
      this.segmentVersions.set(segmentPosition, 1);
      this.currentTextSegment = "";
    }
  }

  // Helper method to handle legacy tool call format
  handleLegacyToolCall(toolCall: unknown): void {
    if (
      toolCall &&
      typeof toolCall === "object" &&
      toolCall !== null &&
      "id" in toolCall
    ) {
      const toolCallObj = toolCall as Record<string, unknown>;
      // If this is a tool call without prior setup, add it directly
      if (!this.pendingToolCalls.has(String(toolCallObj.id))) {
        this.finalizeCurrentTextSegment();

        const convertedToolCall: ToolCall = {
          id: String(toolCallObj.id),
          name: String(toolCallObj.name || "unknown"),
          arguments: (toolCallObj.arguments as Record<string, unknown>) || {},
          status: (toolCallObj.status as ToolCall["status"]) || "success",
          result: toolCallObj.result as ToolResult | undefined,
          timestamp: String(toolCallObj.timestamp || new Date().toISOString()),
        };

        this.segments.push({
          type: "tool-call",
          content: "",
          toolCall: convertedToolCall,
        });
      }
    }
  }
}

export default MessageSegmentBuilder;
