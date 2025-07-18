/**
 * Utility to convert tool call data structure to toolCallId-indexed result format
 */

export interface ToolCall {
  type: string;
  toolCallId: string;
  toolName: string;
  args: Record<string, any>;
}

export interface ToolResult {
  type: string;
  toolCallId: string;
  toolName: string;
  args: Record<string, any>;
  result: Record<string, any>;
}

export interface Step {
  stepType: string;
  text?: string;
  reasoningDetails?: any[];
  files?: any[];
  sources?: any[];
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  finishReason?: string;
  usage?: any;
  warnings?: any;
  request?: any;
  response?: any;
  providerMetadata?: any;
  experimental_providerMetadata?: any;
  isContinued?: boolean;
}

export interface InputData {
  finishReason?: string;
  usage?: any;
  text?: string;
  reasoningDetails?: any[];
  files?: any[];
  sources?: any[];
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  request?: any;
  response?: any;
  warnings?: any;
  providerMetadata?: any;
  experimental_providerMetadata?: any;
  steps?: Step[];
}

export interface ConvertedToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
  status: string;
  result: Record<string, any>;
}

export type ToolCallResultMap = Record<string, ConvertedToolCall>;

/**
 * Converts tool call data structure to toolCallId-indexed result format
 * @param data - The input data containing tool calls and results
 * @returns Object with toolCallId as key and converted tool call data as value
 */
export function convertToolCallsToResultMap(
  data: InputData
): ToolCallResultMap {
  const resultMap: ToolCallResultMap = {};

  // Helper function to process tool calls and results from a given set
  const processToolCallsAndResults = (
    toolCalls: ToolCall[] = [],
    toolResults: ToolResult[] = []
  ) => {
    // Create a map of tool results by toolCallId for quick lookup
    const resultsMap = new Map<string, ToolResult>();
    toolResults.forEach((result) => {
      resultsMap.set(result.toolCallId, result);
    });

    // Process each tool call
    toolCalls.forEach((toolCall) => {
      const correspondingResult = resultsMap.get(toolCall.toolCallId);

      if (correspondingResult) {
        resultMap[toolCall.toolCallId] = {
          id: toolCall.toolCallId,
          name: toolCall.toolName,
          arguments: toolCall.args,
          status: "success", // Assuming success if result exists
          result: correspondingResult.result,
        };
      } else {
        // Handle case where tool call doesn't have a corresponding result yet
        resultMap[toolCall.toolCallId] = {
          id: toolCall.toolCallId,
          name: toolCall.toolName,
          arguments: toolCall.args,
          status: "pending",
          result: {},
        };
      }
    });
  };

  // Process tool calls and results at the root level
  if (data.toolCalls || data.toolResults) {
    processToolCallsAndResults(data.toolCalls, data.toolResults);
  }

  // Process tool calls and results in steps
  if (data.steps) {
    data.steps.forEach((step) => {
      if (step.toolCalls || step.toolResults) {
        processToolCallsAndResults(step.toolCalls, step.toolResults);
      }
    });
  }

  return resultMap;
}
