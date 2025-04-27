export const stackTypes = [
  "all",
  "frontend",
  "backend",
  "mobile",
  "others",
] as const;
export type StackType = (typeof stackTypes)[number];
