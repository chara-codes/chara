import { useUIStore, PANEL_WIDTH_CONSTRAINTS } from "../store/ui-store"

export function useChatOverlay() {
  const {
    isChatOverlayOpen,
    toggleChatOverlay,
    openChatOverlay,
    closeChatOverlay,
    chatOverlayWidth,
    setChatOverlayWidth,
    resetChatOverlayWidth,
  } = useUIStore()

  return {
    isOpen: isChatOverlayOpen,
    toggle: toggleChatOverlay,
    open: openChatOverlay,
    close: closeChatOverlay,
    width: chatOverlayWidth,
    setWidth: setChatOverlayWidth,
    resetWidth: resetChatOverlayWidth,
    widthConstraints: PANEL_WIDTH_CONSTRAINTS,
  }
}
