/** Technology stack types */

export const stackTypes = [
  "all",
  "frontend",
  "backend",
  "database",
  "fullstack",
  "api",
  "devops",
  "mobile",
  "others",
] as const;

export type StackType = (typeof stackTypes)[number];

export const stackIconTypes = [
  "code",
  "globe",
  "layers",
  "server",
  "database",
] as const;

export type StackIconType = (typeof stackIconTypes)[number];
