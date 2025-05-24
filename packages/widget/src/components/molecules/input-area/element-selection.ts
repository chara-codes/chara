import { useElementSelector as useElementSelectorHook } from "../../../hooks/use-element-selector"

// Create a custom hook to wrap the element selector functionality
export const useElementSelectionUtils = () => {
  const { detectComponentInfo, startElementSelection, createCommentModal, endElementSelection } =
    useElementSelectorHook(() => {})

  return {
    detectComponentInfo,
    startElementSelection,
    createCommentModal,
    endElementSelection,
  }
}

// Export a function to clean up UI elements for element selection
export const cleanupElementSelectionUI = () => {
  // This is a stub that will be handled by the hook
  console.warn("cleanupElementSelectionUI is deprecated, use the useElementSelector hook instead")
}
