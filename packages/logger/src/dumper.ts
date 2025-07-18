import {
  cyan,
  gray,
  green,
  yellow,
  red,
  magenta,
  blue,
  bold,
} from "picocolors";

export interface DumpOptions {
  maxDepth?: number;
  maxArrayLength?: number;
  maxStringLength?: number;
  showTypes?: boolean;
  colors?: boolean;
  indent?: string;
  compact?: boolean;
}

export interface DumpContext {
  depth: number;
  visited: WeakSet<object>;
  options: Required<DumpOptions>;
  currentIndent: string;
}

const DEFAULT_OPTIONS: Required<DumpOptions> = {
  maxDepth: 7,
  maxArrayLength: 100,
  maxStringLength: 200,
  showTypes: true,
  colors: true,
  indent: "  ",
  compact: false,
};

export class Dumper {
  private options: Required<DumpOptions>;

  constructor(options: DumpOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  public dump(value: unknown, label?: string): string {
    const context: DumpContext = {
      depth: 0,
      visited: new WeakSet(),
      options: this.options,
      currentIndent: "",
    };

    const output = this.formatValue(value, context);

    if (label) {
      const labelStr = this.options.colors ? bold(cyan(label)) : label;
      return `${labelStr}:\n${output}`;
    }

    return output;
  }

  private formatValue(value: unknown, context: DumpContext): string {
    // Handle circular references
    if (
      value !== null &&
      typeof value === "object" &&
      context.visited.has(value)
    ) {
      return this.colorize("[Circular Reference]", "gray");
    }

    // Handle depth limit
    if (context.depth >= context.options.maxDepth) {
      return this.colorize("[Max Depth Exceeded]", "gray");
    }

    // Handle different types
    if (value === null) {
      return this.formatNull();
    }

    if (value === undefined) {
      return this.formatUndefined();
    }

    if (typeof value === "string") {
      return this.formatString(value);
    }

    if (typeof value === "number") {
      return this.formatNumber(value);
    }

    if (typeof value === "boolean") {
      return this.formatBoolean(value);
    }

    if (typeof value === "symbol") {
      return this.formatSymbol(value);
    }

    if (typeof value === "bigint") {
      return this.formatBigInt(value);
    }

    if (typeof value === "function") {
      return this.formatFunction(value);
    }

    if (value instanceof Date) {
      return this.formatDate(value);
    }

    if (value instanceof RegExp) {
      return this.formatRegExp(value);
    }

    if (value instanceof Error) {
      return this.formatError(value, context);
    }

    if (Array.isArray(value)) {
      return this.formatArray(value, context);
    }

    if (value instanceof Map) {
      return this.formatMap(value, context);
    }

    if (value instanceof Set) {
      return this.formatSet(value, context);
    }

    if (value instanceof Promise) {
      return this.formatPromise();
    }

    if (typeof value === "object") {
      return this.formatObject(value as Record<string, unknown>, context);
    }

    return this.colorize(String(value), "gray");
  }

  private formatNull(): string {
    const output = "null";
    return this.options.showTypes
      ? `${this.colorize(output, "gray")} ${this.typeInfo("null")}`
      : this.colorize(output, "gray");
  }

  private formatUndefined(): string {
    const output = "undefined";
    return this.options.showTypes
      ? `${this.colorize(output, "gray")} ${this.typeInfo("undefined")}`
      : this.colorize(output, "gray");
  }

  private formatString(value: string): string {
    let output = value;
    let truncated = false;

    if (value.length > this.options.maxStringLength) {
      output = value.slice(0, this.options.maxStringLength);
      truncated = true;
    }

    // Escape special characters for display
    output = JSON.stringify(output);

    if (truncated) {
      output += this.colorize("...", "gray");
    }

    const result = this.colorize(output, "green");
    return this.options.showTypes
      ? `${result} ${this.typeInfo("string", `length: ${value.length}`)}`
      : result;
  }

  private formatNumber(value: number): string {
    const output = String(value);
    const result = this.colorize(output, "yellow");

    if (!this.options.showTypes) return result;

    let typeDetails = "number";
    if (Number.isNaN(value)) {
      typeDetails = "NaN";
    } else if (!Number.isFinite(value)) {
      typeDetails = "infinite";
    } else if (Number.isInteger(value)) {
      typeDetails += ", integer";
    }

    return `${result} ${this.typeInfo(typeDetails)}`;
  }

  private formatBoolean(value: boolean): string {
    const output = String(value);
    const result = this.colorize(output, value ? "green" : "red");
    return this.options.showTypes
      ? `${result} ${this.typeInfo("boolean")}`
      : result;
  }

  private formatSymbol(value: symbol): string {
    const output = value.toString();
    const result = this.colorize(output, "magenta");
    return this.options.showTypes
      ? `${result} ${this.typeInfo("symbol")}`
      : result;
  }

  private formatBigInt(value: bigint): string {
    const output = `${value.toString()}n`;
    const result = this.colorize(output, "yellow");
    return this.options.showTypes
      ? `${result} ${this.typeInfo("bigint")}`
      : result;
  }

  // biome-ignore lint/complexity/noBannedTypes: <explanation>
  private formatFunction(value: Function): string {
    const name = value.name || "anonymous";
    const output = `[Function: ${name}]`;
    const result = this.colorize(output, "blue");

    if (!this.options.showTypes) return result;

    const params = this.getFunctionParameters(value);
    return `${result} ${this.typeInfo("function", `params: ${params}`)}`;
  }

  private formatDate(value: Date): string {
    const output = value.toISOString();
    const result = this.colorize(output, "cyan");
    return this.options.showTypes
      ? `${result} ${this.typeInfo("Date")}`
      : result;
  }

  private formatRegExp(value: RegExp): string {
    const output = value.toString();
    const result = this.colorize(output, "red");
    return this.options.showTypes
      ? `${result} ${this.typeInfo("RegExp")}`
      : result;
  }

  private formatError(value: Error, context: DumpContext): string {
    const newContext = this.createChildContext(context);
    const lines = [];

    lines.push(
      this.colorize(`[${value.constructor.name}: ${value.message}]`, "red"),
    );

    if (value.stack) {
      const stackLines = value.stack.split("\n").slice(1, 4); // Show first 3 stack frames
      for (const line of stackLines) {
        lines.push(
          `${newContext.currentIndent}${this.colorize(line.trim(), "gray")}`,
        );
      }
    }

    return lines.join("\n");
  }

  private formatArray(value: unknown[], context: DumpContext): string {
    const newContext = this.createChildContext(context);
    newContext.visited.add(value);

    const length = value.length;
    const showLength = this.options.showTypes
      ? ` ${this.typeInfo("Array", `length: ${length}`)}`
      : "";

    if (length === 0) {
      return `[]${showLength}`;
    }

    if (this.options.compact && length <= 5 && this.allPrimitives(value)) {
      const items = value
        .slice(0, this.options.maxArrayLength)
        .map((item) => this.formatValue(item, newContext));
      return `[${items.join(", ")}]${showLength}`;
    }

    const lines = [`[${showLength}`];
    const itemsToShow = Math.min(length, this.options.maxArrayLength);

    for (let i = 0; i < itemsToShow; i++) {
      const formattedValue = this.formatValue(value[i], newContext);
      lines.push(
        `${newContext.currentIndent}${this.colorize(String(i), "cyan")}: ${formattedValue}`,
      );
    }

    if (length > this.options.maxArrayLength) {
      lines.push(
        `${newContext.currentIndent}${this.colorize(`... ${length - this.options.maxArrayLength} more items`, "gray")}`,
      );
    }

    lines.push(`${context.currentIndent}]`);
    return lines.join("\n");
  }

  private formatObject(
    value: Record<string, unknown>,
    context: DumpContext,
  ): string {
    const newContext = this.createChildContext(context);
    newContext.visited.add(value);

    const keys = Object.keys(value);
    const constr = value.constructor?.name;
    const typeName = constr && constr !== "Object" ? constr : "Object";
    const showType = this.options.showTypes
      ? ` ${this.typeInfo(typeName, `keys: ${keys.length}`)}`
      : "";

    if (keys.length === 0) {
      return `{}${showType}`;
    }

    if (
      this.options.compact &&
      keys.length <= 3 &&
      this.allPrimitives(Object.values(value))
    ) {
      const items = keys.map((key) => {
        const formattedKey = this.needsQuotes(key) ? `"${key}"` : key;
        const formattedValue = this.formatValue(value[key], newContext);
        return `${this.colorize(formattedKey, "cyan")}: ${formattedValue}`;
      });
      return `{${items.join(", ")}}${showType}`;
    }

    const lines = [`{${showType}`];

    for (const key of keys) {
      const formattedKey = this.needsQuotes(key) ? `"${key}"` : key;
      const formattedValue = this.formatValue(value[key], newContext);
      lines.push(
        `${newContext.currentIndent}${this.colorize(formattedKey, "cyan")}: ${formattedValue}`,
      );
    }

    lines.push(`${context.currentIndent}}`);
    return lines.join("\n");
  }

  private formatMap(
    value: Map<unknown, unknown>,
    context: DumpContext,
  ): string {
    const newContext = this.createChildContext(context);
    newContext.visited.add(value);

    const size = value.size;
    const showType = this.options.showTypes
      ? ` ${this.typeInfo("Map", `size: ${size}`)}`
      : "";

    if (size === 0) {
      return `Map {}${showType}`;
    }

    const lines = [`Map {${showType}`];
    let count = 0;

    for (const [key, val] of value.entries()) {
      if (count >= this.options.maxArrayLength) {
        lines.push(
          `${newContext.currentIndent}${this.colorize(`... ${size - count} more entries`, "gray")}`,
        );
        break;
      }

      const formattedKey = this.formatValue(key, newContext);
      const formattedValue = this.formatValue(val, newContext);
      lines.push(
        `${newContext.currentIndent}${formattedKey} => ${formattedValue}`,
      );
      count++;
    }

    lines.push(`${context.currentIndent}}`);
    return lines.join("\n");
  }

  private formatSet(value: Set<unknown>, context: DumpContext): string {
    const newContext = this.createChildContext(context);
    newContext.visited.add(value);

    const size = value.size;
    const showType = this.options.showTypes
      ? ` ${this.typeInfo("Set", `size: ${size}`)}`
      : "";

    if (size === 0) {
      return `Set {}${showType}`;
    }

    const lines = [`Set {${showType}`];
    let count = 0;

    for (const val of value.values()) {
      if (count >= this.options.maxArrayLength) {
        lines.push(
          `${newContext.currentIndent}${this.colorize(`... ${size - count} more values`, "gray")}`,
        );
        break;
      }

      const formattedValue = this.formatValue(val, newContext);
      lines.push(`${newContext.currentIndent}${formattedValue}`);
      count++;
    }

    lines.push(`${context.currentIndent}}`);
    return lines.join("\n");
  }

  private formatPromise(): string {
    const result = this.colorize("[Promise]", "magenta");
    return this.options.showTypes
      ? `${result} ${this.typeInfo("Promise")}`
      : result;
  }

  private createChildContext(context: DumpContext): DumpContext {
    return {
      depth: context.depth + 1,
      visited: context.visited,
      options: context.options,
      currentIndent: context.currentIndent + context.options.indent,
    };
  }

  private colorize(text: string, color: string): string {
    if (!this.options.colors) return text;

    switch (color) {
      case "red":
        return red(text);
      case "green":
        return green(text);
      case "yellow":
        return yellow(text);
      case "blue":
        return blue(text);
      case "magenta":
        return magenta(text);
      case "cyan":
        return cyan(text);
      case "gray":
        return gray(text);
      default:
        return text;
    }
  }

  private typeInfo(type: string, details?: string): string {
    const info = details ? `${type} (${details})` : type;
    return this.colorize(`[${info}]`, "gray");
  }

  private allPrimitives(values: unknown[]): boolean {
    return values.every(
      (value) =>
        value === null ||
        value === undefined ||
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean" ||
        typeof value === "symbol" ||
        typeof value === "bigint",
    );
  }

  private needsQuotes(key: string): boolean {
    return !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key);
  }

  // biome-ignore lint/complexity/noBannedTypes: <explanation>
  private getFunctionParameters(fn: Function): string {
    const fnString = fn.toString();
    const match = fnString.match(/\(([^)]*)\)/);
    return match ? match[1] || "none" : "unknown";
  }
}

// Export a default dumper instance
export const defaultDumper = new Dumper();

// Export utility functions
export function dump(value: unknown, options?: DumpOptions): string {
  const dumper = new Dumper(options);
  return dumper.dump(value);
}

export function dumpToConsole(
  value: unknown,
  label?: string,
  options?: DumpOptions,
): void {
  const dumper = new Dumper(options);
  const output = dumper.dump(value, label);
  console.log(output);
}
