import { describe, expect, it } from "bun:test";
import { parseSuggestionsFromResponse } from "../suggestion-agent";

describe("Suggestion Agent", () => {
  describe("parseSuggestionsFromResponse", () => {
    it("should parse suggestions separated by <--->", () => {
      const response = `First suggestion

<--->

Second suggestion with details

<--->

Third suggestion`;

      const result = parseSuggestionsFromResponse(response);

      expect(result).toEqual([
        "First suggestion",
        "Second suggestion with details",
        "Third suggestion",
      ]);
    });

    it("should handle responses without separators", () => {
      const response = "Single suggestion without separators";

      const result = parseSuggestionsFromResponse(response);

      expect(result).toEqual(["Single suggestion without separators"]);
    });

    it("should clean up markdown formatting", () => {
      const response = `# First suggestion

<--->

* Second suggestion with bullet

<--->

1. Third numbered suggestion`;

      const result = parseSuggestionsFromResponse(response);

      expect(result).toEqual([
        "First suggestion",
        "Second suggestion with bullet",
        "Third numbered suggestion",
      ]);
    });

    it("should filter out empty suggestions", () => {
      const response = `First suggestion

<--->



<--->

Second suggestion

<--->

`;

      const result = parseSuggestionsFromResponse(response);

      expect(result).toEqual(["First suggestion", "Second suggestion"]);
    });

    it("should handle mixed formatting and empty sections", () => {
      const response = `## Header suggestion

<--->

<--->

* Bullet point suggestion

<--->

Normal suggestion text

<--->



<--->

1. Numbered suggestion`;

      const result = parseSuggestionsFromResponse(response);

      expect(result).toEqual([
        "Header suggestion",
        "Bullet point suggestion",
        "Normal suggestion text",
        "Numbered suggestion",
      ]);
    });

    it("should handle responses with only separators", () => {
      const response = `<--->

<--->

<--->`;

      const result = parseSuggestionsFromResponse(response);

      expect(result).toEqual([]);
    });

    it("should handle responses with trailing/leading whitespace", () => {
      const response = `   First suggestion

<--->

  Second suggestion

<--->

   Third suggestion   `;

      const result = parseSuggestionsFromResponse(response);

      expect(result).toEqual([
        "First suggestion",
        "Second suggestion",
        "Third suggestion",
      ]);
    });

    it("should handle complex markdown patterns", () => {
      const response = `### 1. First suggestion with numbers

<--->

**Second suggestion with bold**

<--->

- Third suggestion with dash

<--->

> Fourth suggestion with quote`;

      const result = parseSuggestionsFromResponse(response);

      expect(result).toEqual([
        "First suggestion with numbers",
        "Second suggestion with bold",
        "Third suggestion with dash",
        "> Fourth suggestion with quote",
      ]);
    });

    it("should handle suggestions with newlines", () => {
      const response = `First suggestion
with multiple lines

<--->

Second suggestion
also with
multiple lines

<--->

Single line suggestion`;

      const result = parseSuggestionsFromResponse(response);

      expect(result).toEqual([
        "First suggestion\nwith multiple lines",
        "Second suggestion\nalso with\nmultiple lines",
        "Single line suggestion",
      ]);
    });

    it("should handle empty input", () => {
      const response = "";

      const result = parseSuggestionsFromResponse(response);

      expect(result).toEqual([]);
    });

    it("should handle input with only whitespace", () => {
      const response = "   \n\n   \t   ";

      const result = parseSuggestionsFromResponse(response);

      expect(result).toEqual([]);
    });

    it("should handle multiple consecutive separators", () => {
      const response = `First suggestion

<--->

<--->

<--->

Second suggestion

<--->

<--->

Third suggestion`;

      const result = parseSuggestionsFromResponse(response);

      expect(result).toEqual([
        "First suggestion",
        "Second suggestion",
        "Third suggestion",
      ]);
    });

    it("should preserve special characters in suggestions", () => {
      const response = `Configure ESLint with @typescript-eslint/parser

<--->

Add environment variables to .env file

<--->

Set up npm scripts: "build", "test", "dev"`;

      const result = parseSuggestionsFromResponse(response);

      expect(result).toEqual([
        "Configure ESLint with @typescript-eslint/parser",
        "Add environment variables to .env file",
        'Set up npm scripts: "build", "test", "dev"',
      ]);
    });

    it("should handle suggestions with code blocks", () => {
      const response = `Add this function to utils.ts

<--->

Run \`npm install typescript\` command

<--->

Check the \`package.json\` configuration`;

      const result = parseSuggestionsFromResponse(response);

      expect(result).toEqual([
        "Add this function to utils.ts",
        "Run `npm install typescript` command",
        "Check the `package.json` configuration",
      ]);
    });

    it("should handle very long suggestions", () => {
      const longSuggestion =
        "This is a very long suggestion that goes on and on and provides detailed information about what needs to be done in the project including specific steps and considerations that developers should take into account when implementing the proposed changes and improvements to ensure everything works correctly and maintains good code quality standards throughout the development process";

      const response = `${longSuggestion}

<--->

Short suggestion`;

      const result = parseSuggestionsFromResponse(response);

      expect(result).toEqual([longSuggestion, "Short suggestion"]);
    });

    it("should handle Unicode characters", () => {
      const response = `Add 🚀 emoji to README.md

<--->

Configure TypeScript with ñ characters

<--->

Set up testing with 中文 comments`;

      const result = parseSuggestionsFromResponse(response);

      expect(result).toEqual([
        "Add 🚀 emoji to README.md",
        "Configure TypeScript with ñ characters",
        "Set up testing with 中文 comments",
      ]);
    });
  });

  describe("Response Format Validation", () => {
    it("should handle malformed separators", () => {
      const response = `First suggestion

<-->

Second suggestion

<---->

Third suggestion

<--->

Fourth suggestion`;

      const result = parseSuggestionsFromResponse(response);

      // Only proper <---> separators should work
      expect(result).toEqual([
        "First suggestion\n\n<-->\n\nSecond suggestion\n\n<---->\n\nThird suggestion",
        "Fourth suggestion",
      ]);
    });

    it("should handle case sensitivity", () => {
      const response = `First suggestion

<--->

Second suggestion

<--->

Third suggestion`;

      const result = parseSuggestionsFromResponse(response);

      expect(result).toEqual([
        "First suggestion",
        "Second suggestion",
        "Third suggestion",
      ]);
    });
  });
});
