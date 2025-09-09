/**
 * Gets all CSS rules from stylesheets that apply to a given DOM element.
 *
 * @param {Element} element The DOM element to find styles for.
 * @returns {string} A string containing all matching CSS rules, grouped by selector.
 */
export function getAppliedCss(element: Element): string {
  const appliedRules: string[] = [];

  // Iterate over all stylesheets in the document
  for (const sheet of document.styleSheets) {
    try {
      // Attempt to access the CSS rules of a stylesheet.
      // This will fail for cross-origin stylesheets, so we use a try-catch block.
      const rules = sheet.cssRules;

      // Iterate over all rules in the stylesheet
      for (const rule of rules) {
        // We only care about standard style rules (type 1)
        if (rule instanceof CSSStyleRule) {
          // Use element.matches() to see if the selector applies to our element
          if (element.matches(rule.selectorText)) {
            // If it matches, add the rule's text content to our array
            appliedRules.push(rule.cssText);
          }
        }
      }
    } catch (e) {
      // Log a warning if a stylesheet can't be accessed (likely due to CORS)
      if (e instanceof DOMException && e.name !== "SecurityError") {
        throw e;
      }
      console.warn(`Could not access stylesheet: ${sheet.href}`);
    }
  }

  // Join all the found rules into a single string, separated by newlines
  return appliedRules.join("\n\n");
}
