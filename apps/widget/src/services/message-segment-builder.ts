import type { ToolCall, ToolResult } from "../store/types";

interface ContentSegment {
  type: 'text' | 'tool-call';
  content: string;
  toolCall?: ToolCall;
}

export class MessageSegmentBuilder {
  private segments = [] as ContentSegment[];
  private currentTextSegment = '';
  private pendingToolCalls = new Map<string, ToolCall>();
  private toolCallInsertionPositions = new Map<string, number>();
  private completedToolCalls = new Set<string>();



  addTextDelta(delta: string): void {
    this.currentTextSegment += delta;
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
      type: 'tool-call',
      content: '',
      toolCall: { ...toolCall }
    });
  }

  updateToolCallArgs(toolCallId: string, args: Record<string, unknown>): void {
    const toolCall = this.pendingToolCalls.get(toolCallId);
    if (toolCall) {
      toolCall.arguments = args;
      toolCall.status = "in-progress";
      
      // Update the segment with the new tool call data
      const position = this.toolCallInsertionPositions.get(toolCallId);
      if (position !== undefined && this.segments[position]?.type === 'tool-call') {
        this.segments[position].toolCall = { ...toolCall };
      }
    }
  }

  completeToolCall(toolCallId: string, result?: ToolResult): void {
    const toolCall = this.pendingToolCalls.get(toolCallId);
    if (toolCall) {
      toolCall.result = result;
      toolCall.status = result && typeof result === 'object' && 'error' in result ? "error" : "success";
      
      // Update the segment with the final tool call data
      const position = this.toolCallInsertionPositions.get(toolCallId);
      if (position !== undefined && this.segments[position]?.type === 'tool-call') {
        this.segments[position].toolCall = { ...toolCall };
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
      
      // Update the segment with the error
      const position = this.toolCallInsertionPositions.get(toolCallId);
      if (position !== undefined && this.segments[position]?.type === 'tool-call') {
        this.segments[position].toolCall = { ...toolCall };
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
      if (position !== undefined && this.segments[position]?.type === 'tool-call') {
        this.segments[position].toolCall = { ...toolCall };
      }
    }
    
    // Filter out empty segments
    return this.segments.filter(segment => {
      if (segment.type === 'text') {
        return segment.content.trim().length > 0;
      }
      return segment.toolCall !== undefined;
    });
  }

  getSegments(): ContentSegment[] {
    // Return current segments with any pending text
    const segments = [...this.segments];
    
    if (this.currentTextSegment.trim()) {
      segments.push({
        type: 'text',
        content: this.currentTextSegment
      });
    }
    
    return segments;
  }

  clear(): void {
    this.segments = [];
    this.currentTextSegment = '';
    this.pendingToolCalls.clear();
    this.toolCallInsertionPositions.clear();
    this.completedToolCalls.clear();
  }

  isToolCallTracked(toolCallId: string): boolean {
    return this.pendingToolCalls.has(toolCallId) || 
           this.toolCallInsertionPositions.has(toolCallId) ||
           this.completedToolCalls.has(toolCallId);
  }

  private finalizeCurrentTextSegment(): void {
    if (this.currentTextSegment.trim()) {
      this.segments.push({
        type: 'text',
        content: this.currentTextSegment
      });
      this.currentTextSegment = '';
    }
  }

  // Helper method to handle legacy tool call format
  handleLegacyToolCall(toolCall: unknown): void {
    if (toolCall && typeof toolCall === 'object' && toolCall !== null && 'id' in toolCall) {
      const toolCallObj = toolCall as Record<string, unknown>;
      // If this is a tool call without prior setup, add it directly
      if (!this.pendingToolCalls.has(String(toolCallObj.id))) {
        this.finalizeCurrentTextSegment();
        
        const convertedToolCall: ToolCall = {
          id: String(toolCallObj.id),
          name: String(toolCallObj.name || 'unknown'),
          arguments: (toolCallObj.arguments as Record<string, unknown>) || {},
          status: (toolCallObj.status as ToolCall['status']) || 'success',
          result: toolCallObj.result as ToolResult | undefined,
          timestamp: String(toolCallObj.timestamp || new Date().toISOString()),
        };
        
        this.segments.push({
          type: 'tool-call',
          content: '',
          toolCall: convertedToolCall
        });
      }
    }
  }
}

export default MessageSegmentBuilder;