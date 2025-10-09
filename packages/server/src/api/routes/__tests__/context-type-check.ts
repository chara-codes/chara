/**
 * This file verifies that the context router is properly integrated
 * and type inference works correctly for TRPC clients
 */

import type { AppRouter } from "../../..";

// This type check verifies that the context router is part of AppRouter
type ContextRouter = AppRouter["context"];

// Verify getFileList is available
type GetFileList = ContextRouter["getFileList"];

// Verify getFileContent is available
type GetFileContent = ContextRouter["getFileContent"];

// If this file compiles without errors, type inference is working correctly
export type { ContextRouter, GetFileList, GetFileContent };
