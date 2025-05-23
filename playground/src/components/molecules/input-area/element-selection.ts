import { useElementSelector } from "../../../hooks/use-element-selector"

// Re-export the utility functions from the hook
export const detectComponentInfo = useElementSelector(() => {}).detectComponentInfo
export const startElementSelection = useElementSelector(() => {}).startElementSelection
export const createCommentModal = useElementSelector(() => {}).createCommentModal
export const endElementSelection = useElementSelector(() => {}).endElementSelection

// Export a function to clean up UI elements for element selection
export const cleanupElementSelectionUI = () => {
  // This is a stub that will be handled by the hook
  console.warn("cleanupElementSelectionUI is deprecated, use the useElementSelector hook instead")
}
