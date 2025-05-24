export const calculateTooltipPosition = (
  anchorElement: HTMLElement,
  tooltipElement: HTMLElement,
  containerElement: HTMLElement | null,
) => {
  const anchorRect = anchorElement.getBoundingClientRect()
  const tooltipRect = tooltipElement.getBoundingClientRect()

  // Get viewport dimensions
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  // Get container dimensions if available
  let containerRect = {
    top: 0,
    right: viewportWidth,
    bottom: viewportHeight,
    left: 0,
    width: viewportWidth,
    height: viewportHeight,
  }

  if (containerElement) {
    const rect = containerElement.getBoundingClientRect()
    containerRect = {
      top: Math.max(0, rect.top),
      right: Math.min(viewportWidth, rect.right),
      bottom: Math.min(viewportHeight, rect.bottom),
      left: Math.max(0, rect.left),
      width: rect.width,
      height: rect.height,
    }
  }

  // Calculate available space in each direction
  const spaceRight = containerRect.right - anchorRect.right - 10
  const spaceLeft = anchorRect.left - containerRect.left - 10
  // const spaceAbove = anchorRect.top - containerRect.top - 10
  const spaceBelow = containerRect.bottom - anchorRect.bottom - 10

  // Determine the best position based on available space
  let position: "top" | "right" | "bottom" | "left" = "right" // Default
  let top = 0
  let left = 0

  // Prefer right if there's enough space
  if (spaceRight >= tooltipRect.width) {
    position = "right"
    top = anchorRect.top + anchorRect.height / 2 - tooltipRect.height / 2
    left = anchorRect.right + 10

    // Adjust if tooltip would go outside container
    if (top < containerRect.top + 10) {
      top = containerRect.top + 10
    } else if (top + tooltipRect.height > containerRect.bottom - 10) {
      top = containerRect.bottom - tooltipRect.height - 10
    }
  }
  // Otherwise try left
  else if (spaceLeft >= tooltipRect.width) {
    position = "left"
    top = anchorRect.top + anchorRect.height / 2 - tooltipRect.height / 2
    left = anchorRect.left - tooltipRect.width - 10

    // Adjust if tooltip would go outside container
    if (top < containerRect.top + 10) {
      top = containerRect.top + 10
    } else if (top + tooltipRect.height > containerRect.bottom - 10) {
      top = containerRect.bottom - tooltipRect.height - 10
    }
  }
  // Otherwise try below
  else if (spaceBelow >= tooltipRect.height) {
    position = "bottom"
    top = anchorRect.bottom + 10
    left = anchorRect.left + anchorRect.width / 2 - tooltipRect.width / 2

    // Adjust if tooltip would go outside container
    if (left < containerRect.left + 10) {
      left = containerRect.left + 10
    } else if (left + tooltipRect.width > containerRect.right - 10) {
      left = containerRect.right - tooltipRect.width - 10
    }
  }
  // Last resort: above
  else {
    position = "top"
    top = anchorRect.top - tooltipRect.height - 10
    left = anchorRect.left + anchorRect.width / 2 - tooltipRect.width / 2

    // Adjust if tooltip would go outside container
    if (left < containerRect.left + 10) {
      left = containerRect.left + 10
    } else if (left + tooltipRect.width > containerRect.right - 10) {
      left = containerRect.right - tooltipRect.width - 10
    }
  }

  // Final safety check to ensure tooltip is within viewport
  if (top < 10) top = 10
  if (left < 10) left = 10
  if (top + tooltipRect.height > viewportHeight - 10) {
    top = viewportHeight - tooltipRect.height - 10
  }
  if (left + tooltipRect.width > viewportWidth - 10) {
    left = viewportWidth - tooltipRect.width - 10
  }

  return { top, left, position }
}
