import type { MessageContent } from "../types";

/**
 * Example demonstrating the new multi-part message format with automatic context inclusion
 *
 * This shows how messages automatically include both text and file attachments when
 * context items are selected, without requiring any additional user action.
 */

// Example 1: Simple text message (legacy format)
export const simpleTextMessage =
  "Analyze the following PDF and generate a summary.";

// Example 2: Multi-part message with text and PDF attachment
export const messageWithPdfContext: MessageContent[] = [
  {
    type: "text",
    text: "Analyze the following PDF and generate a summary.",
  },
  {
    type: "file",
    data: "JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovT3V0bGluZXMgMiAwIFIKL1BhZ2VzIDMgMCBSCj4+CmVuZG9iagoKMiAwIG9iago8PAovVHlwZSAvT3V0bGluZXMKL0NvdW50IDAKP...", // base64 encoded PDF data
    mimeType: "application/pdf",
  },
];

// Example 3: Multi-part message with text and image attachment
export const messageWithImageContext: MessageContent[] = [
  {
    type: "text",
    text: "What can you tell me about this image?",
  },
  {
    type: "file",
    data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", // base64 encoded image data
    mimeType: "image/png",
  },
];

// Example 4: Multi-part message with text context
export const messageWithTextContext: MessageContent[] = [
  {
    type: "text",
    text: "Based on the following context, please answer my question.",
  },
  {
    type: "text",
    text: "Context: API Documentation\nThe getUserData() function returns user information including name, email, and preferences.",
  },
];

// Example 5: Multi-part message with mixed context types
export const messageWithMixedContext: MessageContent[] = [
  {
    type: "text",
    text: "Please review this code and the attached design mockup.",
  },
  {
    type: "text",
    text: "Context: Code Snippet\nfunction processUserData(userData) {\n  return userData.map(user => ({\n    id: user.id,\n    name: user.name,\n    email: user.email\n  }));\n}",
  },
  {
    type: "file",
    data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", // base64 encoded design mockup
    mimeType: "image/png",
  },
];

/**
 * Usage example in the chat store:
 *
 * When sendMessage is called and context items are available:
 * 1. The user's input text automatically becomes the first part
 * 2. Each context item is automatically converted to additional parts
 * 3. File context items become 'file' type parts with base64 data
 * 4. Text context items become 'text' type parts
 *
 * The API receives the message in this format:
 * {
 *   messages: [
 *     {
 *       role: 'user',
 *       content: [
 *         { type: 'text', text: 'User input...' },
 *         { type: 'file', data: '...base64...', mimeType: 'application/pdf' },
 *         { type: 'text', text: 'Context: Additional info...' }
 *       ]
 *     }
 *   ]
 * }
 */

// Helper function to check if message has context
export function hasContextAttachments(
  content: string | MessageContent[],
): boolean {
  if (typeof content === "string") {
    return false;
  }
  return content.length > 1; // More than just the user's text input
}

// Helper function to count different types of context
export function getContextSummary(content: string | MessageContent[]): {
  textParts: number;
  fileParts: number;
  total: number;
} {
  if (typeof content === "string") {
    return { textParts: 1, fileParts: 0, total: 1 };
  }

  const textParts = content.filter((part) => part.type === "text").length;
  const fileParts = content.filter((part) => part.type === "file").length;

  return {
    textParts,
    fileParts,
    total: content.length,
  };
}
