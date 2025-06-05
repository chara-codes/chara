import type { Chat, Message } from '../types';

/**
 * Export chat history as JSON
 */
export function exportChatAsJson(chat: Chat): void {
  const dataStr = JSON.stringify(chat, null, 2);
  const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

  const exportFileDefaultName = `chat-${chat.id}-${new Date().toISOString()}.json`;

  // @ts-ignore
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
}

/**
 * Export chat history as text
 */
export function exportChatAsText(chat: Chat): void {
  let textContent = `Chat: ${chat.title}\n`;
  textContent += `Date: ${chat.timestamp}\n\n`;

  chat.messages.forEach((message) => {
    const author = message.isUser ? 'User' : 'AI';
    textContent += `${author} (${message.timestamp}):\n${message.content}\n\n`;
  });

  const dataUri = `data:text/plain;charset=utf-8,${encodeURIComponent(textContent)}`;

  const exportFileDefaultName = `chat-${chat.id}-${new Date().toISOString()}.txt`;

  // @ts-ignore
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
}

/**
 * Export chat history as Markdown
 */
export function exportChatAsMarkdown(chat: Chat): void {
  let mdContent = `# ${chat.title}\n\n`;
  mdContent += `*Date: ${chat.timestamp}*\n\n`;

  chat.messages.forEach((message) => {
    const author = message.isUser ? '**User**' : '**AI**';
    mdContent += `### ${author} *(${message.timestamp})*\n\n${message.content}\n\n`;

    // Add file diffs if present
    if (!message.isUser && message.fileDiffs && message.fileDiffs.length > 0) {
      mdContent += '#### File Changes\n\n';
      message.fileDiffs.forEach(diff => {
        mdContent += `- **${diff.filename}** (${diff.status})\n`;
      });
      mdContent += '\n';
    }

    // Add tool calls if present
    if (!message.isUser && message.toolCalls && message.toolCalls.length > 0) {
      mdContent += '#### Tool Calls\n\n';
      message.toolCalls.forEach(tool => {
        mdContent += `- **${tool.name}**\n`;
        if (tool.result) {
          mdContent += `  Result: ${typeof tool.result === 'string' ? tool.result : 'Complex data'}\n`;
        }
      });
      mdContent += '\n';
    }
  });

  const dataUri = `data:text/markdown;charset=utf-8,${encodeURIComponent(mdContent)}`;

  const exportFileDefaultName = `chat-${chat.id}-${new Date().toISOString()}.md`;

  // @ts-ignore
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
}
