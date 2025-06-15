import { EventEmitter } from "node:events";

// Example usage with typed events
export interface AppEvents {
  "tool:calling": {
    name: string;
    toolCallId: string;
    data:
      | {
          type?: "stdout" | "stderr" | "complete";
          chunk?: string;
          command?: string;
          cd?: string;
          exitCode?: number | null;
        }
      | any;
  };
  "runner:started": {
    processId: string;
    serverInfo: {
      name: string;
      command: string;
      cwd: string;
      pid: number;
      serverUrl?: string;
      os: string;
      shell: string;
      startTime: Date;
    };
  };
  "runner:stopped": {
    processId: string;
    exitCode: number;
    serverInfo: {
      name: string;
      command: string;
      cwd: string;
      uptime?: number;
    };
  };
  "runner:output": {
    processId: string;
    type: "stdout" | "stderr";
    chunk: string;
    command: string;
    cwd: string;
  };
  "runner:error": {
    processId: string;
    error: string;
    serverInfo: {
      name: string;
      command: string;
      cwd: string;
    };
  };
  "runner:status": {
    processId: string;
    status: "starting" | "active" | "stopped" | "error";
    serverInfo: {
      name: string;
      command: string;
      cwd: string;
      pid?: number;
      uptime?: number;
    };
  };
  "runner:restarted": {
    processId: string;
    oldCommand: string;
    newCommand: string;
    serverInfo: {
      name: string;
      command: string;
      cwd: string;
      pid?: number;
    };
  };
  "runner:info-updated": {
    processId: string;
    updates: Partial<{
      name: string;
      serverUrl: string;
    }>;
    serverInfo: {
      name: string;
      command: string;
      cwd: string;
      pid?: number;
      serverUrl?: string;
    };
  };
  "runner:get-status": {
    processId?: string; // If provided, get specific process status; if not, get all
  };
  "runner:restart": {
    processId: string;
    newCommand?: string; // Optional new command to use for restart
  };
}

type EventMap = Record<string, any>;

export class TypedEventEmitter<
  TEventMap extends EventMap = EventMap,
> extends EventEmitter {
  /**
   * Add an event listener for the specified event
   */
  override on<K extends keyof TEventMap>(
    event: K,
    listener: (data: TEventMap[K]) => void,
  ): this {
    return super.on(event as string, listener);
  }

  /**
   * Add a one-time event listener for the specified event
   */
  override once<K extends keyof TEventMap>(
    event: K,
    listener: (data: TEventMap[K]) => void,
  ): this {
    return super.once(event as string, listener);
  }

  /**
   * Remove an event listener for the specified event
   */
  override off<K extends keyof TEventMap>(
    event: K,
    listener: (data: TEventMap[K]) => void,
  ): this {
    return super.off(event as string, listener);
  }

  /**
   * Emit an event with the specified data
   */
  override emit<K extends keyof TEventMap>(
    event: K,
    data: TEventMap[K],
  ): boolean {
    return super.emit(event as string, data);
  }

  /**
   * Add an event listener (alias for on)
   */
  override addListener<K extends keyof TEventMap>(
    event: K,
    listener: (data: TEventMap[K]) => void,
  ): this {
    return super.addListener(event as string, listener);
  }

  /**
   * Remove an event listener (alias for off)
   */
  override removeListener<K extends keyof TEventMap>(
    event: K,
    listener: (data: TEventMap[K]) => void,
  ): this {
    return super.removeListener(event as string, listener);
  }

  /**
   * Remove all listeners for a specific event or all events
   */
  override removeAllListeners<K extends keyof TEventMap>(event?: K): this {
    return super.removeAllListeners(event as string);
  }

  /**
   * Get the number of listeners for a specific event
   */
  override listenerCount<K extends keyof TEventMap>(event: K): number {
    return super.listenerCount(event as string);
  }

  /**
   * Get all listeners for a specific event
   */
  override listeners<K extends keyof TEventMap>(
    event: K,
  ): ((data: TEventMap[K]) => void)[] {
    return super.listeners(event as string) as ((data: TEventMap[K]) => void)[];
  }

  /**
   * Get all raw listeners for a specific event (including wrapped once listeners)
   */
  override rawListeners<K extends keyof TEventMap>(
    event: K,
  ): ((data: TEventMap[K]) => void)[] {
    return super.rawListeners(event as string) as ((
      data: TEventMap[K],
    ) => void)[];
  }

  /**
   * Get all event names that have listeners
   */
  override eventNames(): (keyof TEventMap)[] {
    return super.eventNames() as (keyof TEventMap)[];
  }

  /**
   * Prepend a listener to the beginning of the listeners array
   */
  override prependListener<K extends keyof TEventMap>(
    event: K,
    listener: (data: TEventMap[K]) => void,
  ): this {
    return super.prependListener(event as string, listener);
  }

  /**
   * Prepend a one-time listener to the beginning of the listeners array
   */
  override prependOnceListener<K extends keyof TEventMap>(
    event: K,
    listener: (data: TEventMap[K]) => void,
  ): this {
    return super.prependOnceListener(event as string, listener);
  }
}

// Create a typed event emitter instance
export const appEvents = new TypedEventEmitter<AppEvents>();

// Export the base class for custom implementations
export default TypedEventEmitter;
