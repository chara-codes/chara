/**
 * Utility functions for context items
 */

import type { ContextItem } from "../../types";

/**
 * Gets the appropriate icon type for a context item
 * @param type - The context item type
 * @returns The icon type string
 */
export function getContextItemIconType(type: string): string {
  const lowerType = type.toLowerCase();
  switch (lowerType) {
    case "file":
      return "file";
    case "link":
      return "link";
    case "text":
      return "text";
    case "documentation":
      return "documentation";
    case "terminal":
      return "terminal";
    default:
      return "file"; // fallback to file icon
  }
}

/**
 * Checks if a context item is a file type
 * @param item - The context item to check
 * @returns true if the item is a file
 */
export function isFileContextItem(item: ContextItem): boolean {
  return item.type.toLowerCase() === "file";
}

/**
 * Checks if a context item should show a tooltip
 * @param item - The context item to check
 * @returns true if the item should show a tooltip
 */
export function shouldShowTooltip(item: ContextItem): boolean {
  if (!isFileContextItem(item)) {
    return false;
  }

  const file = item.data as File | undefined;
  const fileSize = file?.size;
  const mimeType = item.mimeType || file?.type;

  return !!(mimeType || fileSize || item.content);
}

/**
 * Gets the file size from a context item
 * @param item - The context item
 * @returns The file size in bytes, or undefined if not available
 */
export function getContextItemFileSize(item: ContextItem): number | undefined {
  if (!isFileContextItem(item)) {
    return undefined;
  }

  const file = item.data as File | undefined;
  return file?.size;
}

/**
 * Gets the MIME type from a context item
 * @param item - The context item
 * @returns The MIME type string, or undefined if not available
 */
export function getContextItemMimeType(item: ContextItem): string | undefined {
  const file = item.data as File | undefined;
  return item.mimeType || file?.type;
}

/**
 * Generates a unique ID for a context item
 * @returns A unique string ID
 */
export function generateContextItemId(): string {
  return Date.now().toString();
}

/**
 * Creates a context item from a file
 * @param file - The File object
 * @param content - Optional file content
 * @param mimeType - Optional MIME type override
 * @returns A new ContextItem
 */
export function createContextItemFromFile(
  file: File,
  content?: string,
  mimeType?: string
): Omit<ContextItem, "id"> {
  return {
    name: file.name,
    type: "file",
    data: file,
    content,
    mimeType: mimeType || file.type,
  };
}

/**
 * Creates a context item from text
 * @param name - The name for the context item
 * @param content - The text content
 * @returns A new ContextItem
 */
export function createContextItemFromText(
  name: string,
  content: string
): Omit<ContextItem, "id"> {
  return {
    name,
    type: "text",
    content,
    mimeType: "text/plain",
  };
}

/**
 * Creates a context item from a link
 * @param name - The name for the context item
 * @param url - The URL
 * @returns A new ContextItem
 */
export function createContextItemFromLink(
  name: string,
  url: string
): Omit<ContextItem, "id"> {
  return {
    name,
    type: "link",
    data: url,
  };
}