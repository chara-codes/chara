/** Technology stack types */

export const stackTypes = [
  "all",
  "frontend",
  "backend",
  "mobile",
  "others",
] as const;
export const linkTypes = ["docs", "code"] as const;

export type LinkType = (typeof linkTypes)[number];
export type StackType = (typeof stackTypes)[number];
