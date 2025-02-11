import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("returns an empty string when no arguments are provided", () => {
    expect(cn()).toBe("");
  });

  it("returns the same class for a single argument", () => {
    expect(cn("foo")).toBe("foo");
  });

  it("merges multiple classes correctly", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("filters out falsy values", () => {
    expect(cn("foo", false, null, undefined, "", "bar")).toBe("foo bar");
  });
});
