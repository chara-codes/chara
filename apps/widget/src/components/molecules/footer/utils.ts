export const getModelSourceType = (provider: string): string => {
  const lowerProvider = provider.toLowerCase()

  // Unified services
  if (lowerProvider.includes("openrouter")) {
    return "unified"
  }

  // Native services
  if (["openai", "anthropic", "mistral ai", "together ai", "cohere"].includes(lowerProvider)) {
    return "native"
  }

  // Local services
  if (["ollama", "lmstudio", "local ai"].includes(lowerProvider)) {
    return "local"
  }

  return "unknown"
}

/**
 * Gets a human-readable label for a source type
 *
 * @param sourceType - The source type
 * @returns A human-readable label
 */
export const getSourceLabel = (sourceType: string): string => {
  switch (sourceType) {
    case "unified":
      return "Unified"
    case "native":
      return "Native"
    case "local":
      return "Local"
    default:
      return "Unknown"
  }
}
