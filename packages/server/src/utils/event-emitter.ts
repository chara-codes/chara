import EventEmitter from "node:events";

// Define a type for the events map, where keys are event names and values are event payloads
export type EventsMap = Record<string, any>;

/**
 * TypedEventEmitter extends the Node.js EventEmitter with type safety
 *
 * @template T - EventsMap defining event names as keys and their payload types as values
 */
export class TypedEventEmitter<T extends EventsMap> extends EventEmitter {
  // Override emit to provide type checking for event names and payloads
  emit<E extends keyof T>(event: E, ...args: [T[E]]): boolean {
    return super.emit(event as string, ...args);
  }

  // Override on method with proper typing
  on<E extends keyof T>(event: E, listener: (payload: T[E]) => void): this {
    return super.on(event as string, listener);
  }

  // Override once method with proper typing
  once<E extends keyof T>(event: E, listener: (payload: T[E]) => void): this {
    return super.once(event as string, listener);
  }

  // Override off/removeListener method with proper typing
  off<E extends keyof T>(event: E, listener: (payload: T[E]) => void): this {
    return super.off(event as string, listener);
  }

  // Override addListener method with proper typing
  addListener<E extends keyof T>(
    event: E,
    listener: (payload: T[E]) => void,
  ): this {
    return super.addListener(event as string, listener);
  }

  // Override removeListener method with proper typing
  removeListener<E extends keyof T>(
    event: E,
    listener: (payload: T[E]) => void,
  ): this {
    return super.removeListener(event as string, listener);
  }
}

// Define an interface for your application's events
export interface ServerEvents {
  "server:start": { port: number };
  "server:stop": { code: number };
  "server:ping": { test: number; timestamp: number };
  "user:login": { userId: string; timestamp: number };
  "user:logout": { userId: string; timestamp: number };
  // Add other events as needed
}

// Create and export a typed event emitter instance
export const ee = new TypedEventEmitter<ServerEvents>();
