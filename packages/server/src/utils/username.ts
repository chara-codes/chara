const adjectives = [
  "Happy", "Clever", "Brave", "Gentle", "Swift", 
  "Bright", "Wise", "Lucky", "Jolly", "Mighty",
  "Quirky", "Lively", "Dazzling", "Curious", "Magical"
];

const nouns = [
  "Panda", "Dragon", "Phoenix", "Unicorn", "Dolphin",
  "Tiger", "Eagle", "Fox", "Wolf", "Bear",
  "Owl", "Lion", "Penguin", "Koala", "Raccoon"
];

/**
 * Generates a random fun username by combining an adjective and a noun
 */
export function generateUsername(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adjective}${noun}`;
}
