import enquirer from "enquirer";
import { green, red } from "picocolors";

// Types to match clack interface
interface ConfirmOptions {
  message: string;
  initialValue?: boolean;
}

interface SelectOptions {
  message: string;
  options: Array<{
    value: string;
    label: string;
    hint?: string;
  }>;
  initialValue?: string;
}

interface MultiSelectOptions {
  message: string;
  options: Array<{
    value: string;
    label: string;
    hint?: string;
  }>;
  required?: boolean;
}

interface TextOptions {
  message: string;
  placeholder?: string;
  defaultValue?: string;
  validate?: (value: string) => string | undefined;
}

// Global state for cancellation handling
let isCancelled = false;

// Helper function to check if user cancelled
export function isCancel(value: unknown): boolean {
  return isCancelled || value === undefined || value === null;
}

// Display intro message
export function intro(message: string): void {
  console.log("\n" + message);
}

// Display outro message
export function outro(message: string): void {
  console.log("\n" + message + "\n");
}

// Display cancel message and exit
export function cancel(message: string): void {
  console.log("\n" + red("✖ " + message) + "\n");
  process.exit(1);
}

// Confirm prompt wrapper
export async function confirm(options: ConfirmOptions): Promise<boolean> {
  isCancelled = false;

  try {
    const response = (await enquirer.prompt({
      type: "confirm",
      name: "value",
      message: options.message,
      initial: options.initialValue ?? false,
    })) as { value: boolean };

    return response.value;
  } catch (_error) {
    isCancelled = true;
    return Symbol("cancel") as any;
  }
}

// Select prompt wrapper
export async function select(options: SelectOptions): Promise<string> {
  isCancelled = false;

  const choices = options.options.map((option) => ({
    name: option.value,
    message: option.label,
    hint: option.hint,
  }));

  const initialIndex = options.initialValue
    ? choices.findIndex((choice) => choice.name === options.initialValue)
    : 0;

  try {
    const response = (await enquirer.prompt({
      type: "select",
      name: "value",
      message: options.message,
      choices,
      initial: initialIndex >= 0 ? initialIndex : 0,
    })) as { value: string };

    return response.value;
  } catch (_error) {
    isCancelled = true;
    return Symbol("cancel") as any;
  }
}

// Multiselect prompt wrapper
export async function multiselect(
  options: MultiSelectOptions,
): Promise<string[]> {
  isCancelled = false;

  const choices = options.options.map((option) => ({
    name: option.value,
    message: option.label,
    hint: option.hint,
  }));

  try {
    const response = (await enquirer.prompt({
      type: "multiselect",
      name: "value",
      message: options.message,
      choices,
      validate: options.required
        ? (value: any) =>
            (Array.isArray(value) && value.length > 0) ||
            "At least one selection is required"
        : undefined,
    })) as { value: string[] };

    return response.value;
  } catch (_error) {
    isCancelled = true;
    return Symbol("cancel") as any;
  }
}

// Text prompt wrapper
export async function text(options: TextOptions): Promise<string> {
  isCancelled = false;

  try {
    const response = (await enquirer.prompt({
      type: "input",
      name: "value",
      message: options.message,
      initial: options.defaultValue || "",
      validate: options.validate
        ? (value: string) => {
            const result = options.validate?.(value);
            return result ? result : true;
          }
        : undefined,
    })) as { value: string };

    return response.value;
  } catch (_error) {
    isCancelled = true;
    return Symbol("cancel") as any;
  }
}

// Simple spinner implementation
export function spinner() {
  let isSpinning = false;
  let spinnerInterval: NodeJS.Timeout | null = null;
  let currentMessage = "";

  const spinnerChars = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let spinnerIndex = 0;

  const updateSpinner = () => {
    if (isSpinning) {
      process.stdout.write(`\r${spinnerChars[spinnerIndex]} ${currentMessage}`);
      spinnerIndex = (spinnerIndex + 1) % spinnerChars.length;
    }
  };

  return {
    start: (message: string) => {
      if (isSpinning) return;

      currentMessage = message;
      isSpinning = true;
      spinnerInterval = setInterval(updateSpinner, 100);
      updateSpinner();
    },

    stop: (message?: string) => {
      if (!isSpinning) return;

      isSpinning = false;
      if (spinnerInterval) {
        clearInterval(spinnerInterval);
        spinnerInterval = null;
      }

      if (message) {
        process.stdout.write(`\r${green("✓")} ${message}\n`);
      } else {
        process.stdout.write(`\r${green("✓")} ${currentMessage}\n`);
      }
    },
  };
}

// Reset cancellation state (useful for testing)
export function resetCancellation(): void {
  isCancelled = false;
}
