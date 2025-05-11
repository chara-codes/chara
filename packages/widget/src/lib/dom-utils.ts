export const getXPath = (element: HTMLElement): string => {
  if (!element) return ""
  if (element === document.body) return "/html/body"

  let xpath = ""
  const parent = element.parentElement

  if (!parent) return ""

  // Get the tag name and position among siblings of the same type
  const tagName = element.tagName.toLowerCase()
  const siblings = Array.from(parent.children).filter(
    (child) => (child as HTMLElement).tagName.toLowerCase() === tagName,
  )

  const position = siblings.indexOf(element) + 1

  // Build the XPath segment
  xpath = `/${tagName}[${position}]`

  // Recursively build the full XPath
  const parentXPath = getXPath(parent)
  return parentXPath + xpath
}

// Function to get relative XPath from a parent element
export const getRelativeXPath = (element: HTMLElement, parentElement: HTMLElement | null): string => {
  if (!element || !parentElement || !parentElement.contains(element)) return ""
  if (element === parentElement) return "."

  let currentElement: HTMLElement | null = element
  let path = ""

  while (currentElement && currentElement !== parentElement) {
    const tagName = currentElement.tagName.toLowerCase()
    // Fix the parent type issue by explicitly typing it
    const parent: HTMLElement | null = currentElement.parentElement

    if (!parent) break

    // Get position among siblings of the same type
    const siblings = Array.from(parent.children).filter(
      (child) => (child as HTMLElement).tagName.toLowerCase() === tagName,
    )
    const position = siblings.length > 1 ? `[${siblings.indexOf(currentElement) + 1}]` : ""

    path = `/${tagName}${position}${path}`
    currentElement = parent
  }

  return `.${path}`
}

// Function to get computed styles summary
export const getStylesSummary = (element: HTMLElement): Record<string, string> => {
  const computedStyle = window.getComputedStyle(element)
  return {
    width: computedStyle.width,
    height: computedStyle.height,
    color: computedStyle.color,
    backgroundColor: computedStyle.backgroundColor,
    display: computedStyle.display,
    position: computedStyle.position,
    fontSize: computedStyle.fontSize,
  }
}

// Function to get element attributes
export const getElementAttributes = (element: HTMLElement): Record<string, string> => {
  const attributes: Record<string, string> = {}

  Array.from(element.attributes).forEach((attr) => {
    attributes[attr.name] = attr.value
  })

  return attributes
}

// Function to check if an element should be skipped as a component
// We'll skip divs unless they have specific attributes that indicate they're components
const shouldSkipAsComponent = (element: HTMLElement): boolean => {
  const tagName = element.tagName.toLowerCase()

  // Skip divs, spans, and other common layout elements unless they have specific component attributes
  if (tagName === "div" || tagName === "span" || tagName === "section" || tagName === "article") {
    // Don't skip if it has React, Vue, Angular, or other framework-specific attributes
    const hasFrameworkAttrs = Array.from(element.attributes).some(
      (attr) =>
        attr.name.startsWith("data-") ||
        attr.name.startsWith("v-") ||
        attr.name.startsWith("ng-") ||
        attr.name.startsWith("_ng") ||
        attr.name.startsWith("svelte-"),
    )

    // Skip if it doesn't have framework attributes
    return !hasFrameworkAttrs
  }

  return false
}

// Function to detect component framework and name
export const getComponentInfo = (element: HTMLElement): { name: string; framework: string; isComponent: boolean } => {
  // Check if this element should be skipped as a component
  if (shouldSkipAsComponent(element)) {
    return {
      name: element.tagName.toLowerCase(),
      framework: "Unknown",
      isComponent: false,
    }
  }

  // Check for React components
  if (detectReactComponent(element)) {
    return {
      name: getReactComponentName(element),
      framework: "React",
      isComponent: true,
    }
  }

  // Check for Vue components
  if (detectVueComponent(element)) {
    return {
      name: getVueComponentName(element),
      framework: "Vue",
      isComponent: true,
    }
  }

  // Check for Svelte components
  if (detectSvelteComponent(element)) {
    return {
      name: getSvelteComponentName(element),
      framework: "Svelte",
      isComponent: true,
    }
  }

  // Check for Angular components
  if (detectAngularComponent(element)) {
    return {
      name: getAngularComponentName(element),
      framework: "Angular",
      isComponent: true,
    }
  }

  // Check for Web Components
  if (detectWebComponent(element)) {
    return {
      name: getWebComponentName(element),
      framework: "WebComponent",
      isComponent: true,
    }
  }

  // Default case - unknown component
  return {
    name: "Unknown Component",
    framework: "Unknown",
    isComponent: false,
  }
}

// Function to detect React components
const detectReactComponent = (element: HTMLElement): boolean => {
  // Look for React-specific attributes
  const reactAttributes = ["data-reactroot", "data-reactid", "data-react-checksum", "data-component", "data-testid"]

  for (const attr of reactAttributes) {
    if (element.hasAttribute(attr)) {
      return true
    }
  }

  // Check for React fiber debug ID
  if (element.hasAttribute("data-reactroot") || Object.keys(element).some((key) => key.startsWith("__react"))) {
    return true
  }

  return false
}

// Function to get React component name
const getReactComponentName = (element: HTMLElement): string => {
  // Look for React-specific attributes
  const reactAttributes = ["data-reactroot", "data-reactid", "data-react-checksum", "data-component", "data-testid"]

  for (const attr of reactAttributes) {
    if (element.hasAttribute(attr)) {
      const attrValue = element.getAttribute(attr)
      if (attrValue && attrValue !== "true") {
        return attrValue
      }
    }
  }

  // Check for data-testid which often contains component name
  if (element.hasAttribute("data-testid")) {
    const testId = element.getAttribute("data-testid")
    if (testId) {
      // Convert kebab-case or snake_case to PascalCase
      if (testId.includes("-") || testId.includes("_")) {
        return testId
          .split(/[-_]/)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join("")
      }
      return testId
    }
  }

  // Check for className patterns that might indicate component names
  const className = element.className
  if (typeof className === "string" && className) {
    // Look for PascalCase class names which might indicate component names
    const matches = className.match(/[A-Z][a-z]+(?:[A-Z][a-z]+)*/)
    if (matches && matches.length > 0) {
      return matches[0]
    }
  }

  // If we can't find a specific name, use the element tag name
  // but capitalize it to make it look like a component name
  const tagName = element.tagName.toLowerCase()
  return tagName.charAt(0).toUpperCase() + tagName.slice(1)
}

// Function to detect Vue components
const detectVueComponent = (element: HTMLElement): boolean => {
  // Check for Vue-specific attributes
  const hasVueAttrs = Array.from(element.attributes).some(
    (attr) =>
      attr.name.startsWith("data-v-") ||
      attr.name.startsWith("v-") ||
      attr.name === "v-bind" ||
      attr.name === "v-model" ||
      attr.name === "v-if" ||
      attr.name === "v-for",
  )

  if (hasVueAttrs) return true

  // Check for Vue instance - use type assertion to avoid TypeScript errors
  const anyElement = element as any
  if (anyElement.__vue__ || anyElement.__vue_app__) return true

  return false
}

// Function to get Vue component name
const getVueComponentName = (element: HTMLElement): string => {
  // Try to get component name from data-v-* attribute
  const dataVAttr = Array.from(element.attributes).find((attr) => attr.name.startsWith("data-v-"))
  if (dataVAttr) {
    // Try to find a name attribute or prop
    const nameAttr = element.getAttribute("name")
    if (nameAttr) return nameAttr

    // If no name, use the tag name if it's a custom element
    if (element.tagName.includes("-")) {
      // Convert kebab-case to PascalCase for component name
      return element.tagName
        .toLowerCase()
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join("")
    }
  }

  // If it's a custom element, it might be a Vue component
  if (element.tagName.includes("-")) {
    // Convert kebab-case to PascalCase for component name
    return element.tagName
      .toLowerCase()
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("")
  }

  // If we can't find a specific name, use the element tag name
  // but capitalize it to make it look like a component name
  const tagName = element.tagName.toLowerCase()
  return tagName.charAt(0).toUpperCase() + tagName.slice(1)
}

// Function to detect Svelte components
const detectSvelteComponent = (element: HTMLElement): boolean => {
  // Check for Svelte-specific attributes
  return Array.from(element.attributes).some(
    (attr) => attr.name.startsWith("svelte-") || attr.name === "sveltekit:prefetch",
  )
}

// Function to get Svelte component name
const getSvelteComponentName = (element: HTMLElement): string => {
  // Try to get component name from svelte-* attribute
  // We don't need to use svelteAttr since we're not using it
  Array.from(element.attributes).find((attr) => attr.name.startsWith("svelte-"))

  // If it's a custom element, it might be a Svelte component
  if (element.tagName.includes("-")) {
    // Convert kebab-case to PascalCase for component name
    return element.tagName
      .toLowerCase()
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("")
  }

  // If we can't find a specific name, use the element tag name
  // but capitalize it to make it look like a component name
  const tagName = element.tagName.toLowerCase()
  return tagName.charAt(0).toUpperCase() + tagName.slice(1)
}

// Function to detect Angular components
const detectAngularComponent = (element: HTMLElement): boolean => {
  // Check for Angular-specific attributes
  return Array.from(element.attributes).some(
    (attr) =>
      attr.name.startsWith("ng-") ||
      attr.name.startsWith("_ngcontent-") ||
      attr.name.startsWith("_nghost-") ||
      (attr.name.startsWith("(") && attr.name.endsWith(")")) || // Event binding
      (attr.name.startsWith("[") && attr.name.endsWith("]")), // Property binding
  )
}

// Function to get Angular component name
const getAngularComponentName = (element: HTMLElement): string => {
  // Angular components often use kebab-case with app- prefix
  if (element.tagName.toLowerCase().startsWith("app-")) {
    // Convert kebab-case to PascalCase for component name
    return element.tagName
      .toLowerCase()
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("")
  }

  // If it's a custom element, it might be an Angular component
  if (element.tagName.includes("-")) {
    // Convert kebab-case to PascalCase for component name
    return element.tagName
      .toLowerCase()
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("")
  }

  // If we can't find a specific name, use the element tag name
  // but capitalize it to make it look like a component name
  const tagName = element.tagName.toLowerCase()
  return tagName.charAt(0).toUpperCase() + tagName.slice(1)
}

// Function to detect Web Components
const detectWebComponent = (element: HTMLElement): boolean => {
  // Web Components have a hyphen in their tag name
  if (element.tagName.includes("-")) {
    return true
  }

  // Check for is attribute (customized built-in element)
  if (element.hasAttribute("is")) {
    return true
  }

  // Check for shadow root
  return !!element.shadowRoot
}

// Function to get Web Component name
const getWebComponentName = (element: HTMLElement): string => {
  // If it has a custom tag name, use that
  if (element.tagName.includes("-")) {
    // Convert kebab-case to PascalCase for component name
    return element.tagName
      .toLowerCase()
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("")
  }

  // If it has an 'is' attribute, use that
  if (element.hasAttribute("is")) {
    const isAttr = element.getAttribute("is")
    if (isAttr) {
      // Convert kebab-case to PascalCase if needed
      if (isAttr.includes("-")) {
        return isAttr
          .split("-")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join("")
      }
      return isAttr
    }
  }

  // If we can't find a specific name, use the element tag name
  // but capitalize it to make it look like a component name
  const tagName = element.tagName.toLowerCase()
  return tagName.charAt(0).toUpperCase() + tagName.slice(1)
}

// Function to find parent components of an element
export const findParentComponents = (
  element: HTMLElement,
): Array<{ name: string; element: HTMLElement; framework: string; isComponent: boolean }> => {
  const components: Array<{ name: string; element: HTMLElement; framework: string; isComponent: boolean }> = []
  let currentEl: HTMLElement | null = element

  // Walk up the DOM tree (up to 10 levels or until we reach body)
  for (let i = 0; i < 10 && currentEl && currentEl !== document.body; i++) {
    // Skip the selected element itself (we'll add it separately)
    if (i > 0) {
      const componentInfo = getComponentInfo(currentEl)

      // Add all elements that might be components or regular elements
      components.push({
        name: componentInfo.name,
        element: currentEl,
        framework: componentInfo.framework,
        isComponent: componentInfo.isComponent,
      })
    }

    currentEl = currentEl.parentElement
  }

  return components
}

// Function to generate a component path string - now using just component names
// and filtering out non-component elements and div components
export const getComponentPath = (
  components: Array<{ name: string; element: HTMLElement; framework: string; isComponent: boolean }>,
): string => {
  if (!components.length) return "No parent components detected"

  // Filter to include only true components and skip divs
  const trueComponents = components.filter((comp) => {
    // Skip if not a component
    if (!comp.isComponent) return false

    // Skip if it's a div, span, or other common layout element
    const tagName = comp.element.tagName.toLowerCase()
    if (tagName === "div" || tagName === "span" || tagName === "section" || tagName === "article") {
      // Include only if it has a meaningful name (not just "Div" or "Span")
      return comp.name.toLowerCase() !== tagName && comp.name !== tagName.charAt(0).toUpperCase() + tagName.slice(1)
    }

    return true
  })

  if (trueComponents.length === 0) return "No parent components detected"

  // Just use the component names without the framework type
  return trueComponents
    .map((comp) => comp.name)
    .reverse()
    .join(" → ")
}

// Function to get all element information in one call
export const getDomElementInfo = (element: HTMLElement) => {
  const tagName = element.tagName.toLowerCase()
  const id = element.id ? `#${element.id}` : ""
  const elementName = `${tagName}${id}`
  const xpath = getXPath(element)
  const rect = element.getBoundingClientRect()
  const size = {
    width: Math.round(rect.width),
    height: Math.round(rect.height),
    top: Math.round(rect.top),
    left: Math.round(rect.left),
  }
  const styles = getStylesSummary(element)
  const attributes = getElementAttributes(element)
  const componentInfo = getComponentInfo(element)
  const parentComponents = findParentComponents(element)
  const componentPath = getComponentPath(parentComponents)

  // Find the first parent component (if any) that's not a div/span/etc
  const firstParentComponent = parentComponents.find((comp) => {
    if (!comp.isComponent) return false

    const tagName = comp.element.tagName.toLowerCase()
    if (tagName === "div" || tagName === "span" || tagName === "section" || tagName === "article") {
      // Include only if it has a meaningful name (not just "Div" or "Span")
      return comp.name.toLowerCase() !== tagName && comp.name !== tagName.charAt(0).toUpperCase() + tagName.slice(1)
    }

    return true
  })

  // Determine if we should use the parent component as the main component
  const useParentAsComponent = !componentInfo.isComponent && firstParentComponent

  // Set the component name and framework based on whether we're using the parent
  const finalComponentName = useParentAsComponent ? firstParentComponent.name : componentInfo.name
  const finalComponentFramework = useParentAsComponent ? firstParentComponent.framework : componentInfo.framework

  // Get relative path from component root if using parent component
  // If framework is unknown, use full XPath instead of relative path
  let relativePath = ""
  if (finalComponentFramework === "Unknown") {
    relativePath = xpath
  } else if (useParentAsComponent) {
    relativePath = getRelativeXPath(element, firstParentComponent.element)
  }

  return {
    selector: elementName,
    xpath,
    componentName: finalComponentName,
    componentFramework: finalComponentFramework,
    relativePath,
    isDirectComponent: componentInfo.isComponent,
    size,
    styles,
    attributes,
    textContent: element.textContent?.slice(0, 100) || "",
    componentPath,
    parentComponents: parentComponents
      .filter((comp) => {
        // Skip if not a component
        if (!comp.isComponent) return false

        // Skip if it's a div, span, or other common layout element with generic name
        const tagName = comp.element.tagName.toLowerCase()
        if (tagName === "div" || tagName === "span" || tagName === "section" || tagName === "article") {
          // Include only if it has a meaningful name (not just "Div" or "Span")
          return comp.name.toLowerCase() !== tagName && comp.name !== tagName.charAt(0).toUpperCase() + tagName.slice(1)
        }

        return true
      })
      .map((comp) => ({
        name: comp.name,
        selector: `${comp.element.tagName.toLowerCase()}${comp.element.id ? `#${comp.element.id}` : ""}`,
        framework: comp.framework,
        isComponent: comp.isComponent,
      })),
  }
}
