import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { TypedEventEmitter } from "../events";

interface TestEvents {
  "user:login": { userId: string; timestamp: Date };
  "user:logout": { userId: string; reason: string };
  "data:updated": { entity: string; id: string; changes: Record<string, any> };
  "task:started": { taskId: string; name: string };
  "task:completed": { taskId: string; duration: number; result?: any };
  error: { message: string; code?: number; stack?: string };
  "simple:event": string;
  "no:data": void;
}

describe("TypedEventEmitter", () => {
  let emitter: TypedEventEmitter<TestEvents>;

  beforeEach(() => {
    emitter = new TypedEventEmitter<TestEvents>();
  });

  afterEach(() => {
    emitter.removeAllListeners();
  });

  describe("Basic Event Handling", () => {
    test("should add and trigger event listeners", () => {
      let receivedData: any = null;
      let callCount = 0;

      emitter.on("user:login", (data) => {
        receivedData = data;
        callCount++;
      });

      const testData = { userId: "123", timestamp: new Date() };
      emitter.emit("user:login", testData);

      expect(callCount).toBe(1);
      expect(receivedData).toEqual(testData);
    });

    test("should handle multiple listeners for the same event", () => {
      const results: string[] = [];

      emitter.on("user:login", () => results.push("listener1"));
      emitter.on("user:login", () => results.push("listener2"));
      emitter.on("user:login", () => results.push("listener3"));

      emitter.emit("user:login", { userId: "123", timestamp: new Date() });

      expect(results).toEqual(["listener1", "listener2", "listener3"]);
    });

    test("should handle events with different data types", () => {
      let stringData: string | null = null;
      let objectData: any = null;
      let voidCalled = false;

      emitter.on("simple:event", (data) => {
        stringData = data;
      });

      emitter.on("user:login", (data) => {
        objectData = data;
      });

      emitter.on("no:data", () => {
        voidCalled = true;
      });

      emitter.emit("simple:event", "test string");
      emitter.emit("user:login", { userId: "456", timestamp: new Date() });
      emitter.emit("no:data", undefined);

      expect(stringData).toBe("test string");
      expect(objectData.userId).toBe("456");
      expect(voidCalled).toBe(true);
    });
  });

  describe("Once Listeners", () => {
    test("should trigger once listeners only once", () => {
      let callCount = 0;
      let receivedData: any = null;

      emitter.once("task:completed", (data) => {
        callCount++;
        receivedData = data;
      });

      const testData = { taskId: "task1", duration: 1000, result: "success" };

      emitter.emit("task:completed", testData);
      emitter.emit("task:completed", testData);
      emitter.emit("task:completed", testData);

      expect(callCount).toBe(1);
      expect(receivedData).toEqual(testData);
    });

    test("should handle multiple once listeners", () => {
      let count1 = 0;
      let count2 = 0;

      emitter.once("task:completed", () => count1++);
      emitter.once("task:completed", () => count2++);

      emitter.emit("task:completed", { taskId: "task1", duration: 100 });
      emitter.emit("task:completed", { taskId: "task2", duration: 200 });

      expect(count1).toBe(1);
      expect(count2).toBe(1);
    });
  });

  describe("Removing Listeners", () => {
    test("should remove specific listener with off", () => {
      let count1 = 0;
      let count2 = 0;

      const listener1 = () => count1++;
      const listener2 = () => count2++;

      emitter.on("user:logout", listener1);
      emitter.on("user:logout", listener2);

      emitter.emit("user:logout", { userId: "123", reason: "manual" });
      expect(count1).toBe(1);
      expect(count2).toBe(1);

      emitter.off("user:logout", listener1);
      emitter.emit("user:logout", { userId: "123", reason: "manual" });

      expect(count1).toBe(1); // Should not increment
      expect(count2).toBe(2); // Should increment
    });

    test("should remove all listeners for an event", () => {
      let count1 = 0;
      let count2 = 0;

      emitter.on("data:updated", () => count1++);
      emitter.on("data:updated", () => count2++);

      emitter.removeAllListeners("data:updated");
      emitter.emit("data:updated", { entity: "user", id: "123", changes: {} });

      expect(count1).toBe(0);
      expect(count2).toBe(0);
    });

    test("should remove all listeners for all events", () => {
      let userCount = 0;
      let taskCount = 0;

      emitter.on("user:login", () => userCount++);
      emitter.on("task:started", () => taskCount++);

      emitter.removeAllListeners();

      emitter.emit("user:login", { userId: "123", timestamp: new Date() });
      emitter.emit("task:started", { taskId: "task1", name: "test" });

      expect(userCount).toBe(0);
      expect(taskCount).toBe(0);
    });
  });

  describe("Listener Management", () => {
    test("should return correct listener count", () => {
      expect(emitter.listenerCount("user:login")).toBe(0);

      emitter.on("user:login", () => {});
      expect(emitter.listenerCount("user:login")).toBe(1);

      emitter.on("user:login", () => {});
      expect(emitter.listenerCount("user:login")).toBe(2);

      emitter.once("user:login", () => {});
      expect(emitter.listenerCount("user:login")).toBe(3);
    });

    test("should return event names with listeners", () => {
      emitter.on("user:login", () => {});
      emitter.on("task:started", () => {});

      const eventNames = emitter.eventNames();

      expect(eventNames).toContain("user:login");
      expect(eventNames).toContain("task:started");
      expect(eventNames.length).toBe(2);
    });

    test("should return listeners for an event", () => {
      const listener1 = () => {};
      const listener2 = () => {};

      emitter.on("error", listener1);
      emitter.on("error", listener2);

      const listeners = emitter.listeners("error");
      expect(listeners).toHaveLength(2);
    });
  });

  describe("Advanced Features", () => {
    test("should support prepend listeners", () => {
      const order: string[] = [];

      emitter.on("task:completed", () => order.push("normal"));
      emitter.prependListener("task:completed", () => order.push("prepended"));

      emitter.emit("task:completed", { taskId: "task1", duration: 100 });

      expect(order).toEqual(["prepended", "normal"]);
    });

    test("should support prepend once listeners", () => {
      const order: string[] = [];
      let prependedCount = 0;

      emitter.on("task:completed", () => order.push("normal"));
      emitter.prependOnceListener("task:completed", () => {
        order.push("prepended-once");
        prependedCount++;
      });

      emitter.emit("task:completed", { taskId: "task1", duration: 100 });
      emitter.emit("task:completed", { taskId: "task2", duration: 200 });

      expect(order).toEqual(["prepended-once", "normal", "normal"]);
      expect(prependedCount).toBe(1);
    });

    test("should support addListener and removeListener aliases", () => {
      let count = 0;
      const listener = () => count++;

      emitter.addListener("user:login", listener);
      emitter.emit("user:login", { userId: "123", timestamp: new Date() });
      expect(count).toBe(1);

      emitter.removeListener("user:login", listener);
      emitter.emit("user:login", { userId: "123", timestamp: new Date() });
      expect(count).toBe(1);
    });
  });

  describe("Error Handling", () => {
    test("should return boolean from emit", () => {
      // No listeners - should return false
      expect(
        emitter.emit("user:login", { userId: "123", timestamp: new Date() }),
      ).toBe(false);

      // With listeners - should return true
      emitter.on("user:login", () => {});
      expect(
        emitter.emit("user:login", { userId: "123", timestamp: new Date() }),
      ).toBe(true);
    });

    test("should handle error events according to Node.js EventEmitter behavior", () => {
      let errorListenerCalled = false;

      // Error events have special handling in Node.js EventEmitter
      emitter.on("error", (data) => {
        errorListenerCalled = true;
        expect(data.message).toBe("test error");
      });

      // Should not throw when there's an error listener
      expect(() => {
        emitter.emit("error", { message: "test error" });
      }).not.toThrow();

      expect(errorListenerCalled).toBe(true);
    });

    test("should throw on error events with no listeners", () => {
      // Error events without listeners should throw in Node.js EventEmitter
      expect(() => {
        emitter.emit("error", { message: "unhandled error" });
      }).toThrow();
    });
  });

  describe("Method Chaining", () => {
    test("should support method chaining", () => {
      let count = 0;

      const result = emitter
        .on("user:login", () => count++)
        .once("user:logout", () => count++)
        .addListener("task:started", () => count++);

      expect(result).toBe(emitter);

      emitter.emit("user:login", { userId: "123", timestamp: new Date() });
      emitter.emit("user:logout", { userId: "123", reason: "manual" });
      emitter.emit("task:started", { taskId: "task1", name: "test" });

      expect(count).toBe(3);
    });
  });

  describe("Raw Listeners", () => {
    test("should return raw listeners including wrapped once listeners", () => {
      const normalListener = () => {};
      const onceListener = () => {};

      emitter.on("task:started", normalListener);
      emitter.once("task:started", onceListener);

      const rawListeners = emitter.rawListeners("task:started");
      expect(rawListeners).toHaveLength(2);

      // First should be the normal listener
      expect(rawListeners[0]).toBe(normalListener);
      // Second should be wrapped (different from original)
      expect(rawListeners[1]).not.toBe(onceListener);
    });
  });

  describe("Memory Management", () => {
    test("should clean up listeners properly", () => {
      const listener = () => {};

      emitter.on("user:login", listener);
      expect(emitter.listenerCount("user:login")).toBe(1);

      emitter.off("user:login", listener);
      expect(emitter.listenerCount("user:login")).toBe(0);

      // Event name should be removed from eventNames when no listeners
      expect(emitter.eventNames()).not.toContain("user:login");
    });

    test("should handle removing non-existent listeners gracefully", () => {
      const listener = () => {};

      // Should not throw when removing non-existent listener
      expect(() => {
        emitter.off("user:login", listener);
      }).not.toThrow();

      expect(emitter.listenerCount("user:login")).toBe(0);
    });
  });

  describe("Type Safety", () => {
    test("should maintain type safety with complex event data", () => {
      let receivedUpdate: any = null;

      emitter.on("data:updated", (data) => {
        // TypeScript should infer the correct type
        receivedUpdate = {
          entity: data.entity,
          id: data.id,
          changes: data.changes,
          // These properties should be available due to typing
          hasChanges: Object.keys(data.changes).length > 0,
        };
      });

      const updateData = {
        entity: "user",
        id: "123",
        changes: { name: "John", email: "john@example.com" },
      };

      emitter.emit("data:updated", updateData);

      expect(receivedUpdate.entity).toBe("user");
      expect(receivedUpdate.id).toBe("123");
      expect(receivedUpdate.hasChanges).toBe(true);
    });
  });
});
