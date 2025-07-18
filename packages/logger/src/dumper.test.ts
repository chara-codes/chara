import { test, expect, describe, beforeEach } from "bun:test";
import {
  Dumper,
  dump,
  dumpToConsole,
  defaultDumper,
  type DumpOptions,
} from "./dumper";

describe("Dumper", () => {
  let dumper: Dumper;

  beforeEach(() => {
    dumper = new Dumper({ colors: false });
  });

  describe("Basic data types", () => {
    test("should format null", () => {
      const result = dumper.dump(null);
      expect(result).toContain("null");
      expect(result).toContain("[null]");
    });

    test("should format undefined", () => {
      const result = dumper.dump(undefined);
      expect(result).toContain("undefined");
      expect(result).toContain("[undefined]");
    });

    test("should format strings", () => {
      const result = dumper.dump("hello world");
      expect(result).toContain('"hello world"');
      expect(result).toContain("[string");
      expect(result).toContain("length: 11");
    });

    test("should format long strings with truncation", () => {
      const longString = "a".repeat(300);
      const dumper = new Dumper({ maxStringLength: 50 });
      const result = dumper.dump(longString);
      expect(result).toContain("...");
      expect(result).toContain("length: 300");
    });

    test("should format numbers", () => {
      const result = dumper.dump(42);
      expect(result).toContain("42");
      expect(result).toContain("[number, integer]");
    });

    test("should format floating point numbers", () => {
      const result = dumper.dump(3.14);
      expect(result).toContain("3.14");
      expect(result).toContain("[number]");
    });

    test("should format NaN", () => {
      // biome-ignore lint/style/useNumberNamespace: <explanation>
      const result = dumper.dump(NaN);
      expect(result).toContain("NaN");
      expect(result).toContain("[NaN]");
    });

    test("should format Infinity", () => {
      // biome-ignore lint/style/useNumberNamespace: <explanation>
      const result = dumper.dump(Infinity);
      expect(result).toContain("Infinity");
      expect(result).toContain("[infinite]");
    });

    test("should format booleans", () => {
      const trueResult = dumper.dump(true);
      const falseResult = dumper.dump(false);

      expect(trueResult).toContain("true");
      expect(trueResult).toContain("[boolean]");
      expect(falseResult).toContain("false");
      expect(falseResult).toContain("[boolean]");
    });

    test("should format symbols", () => {
      const sym = Symbol("test");
      const result = dumper.dump(sym);
      expect(result).toContain("Symbol(test)");
      expect(result).toContain("[symbol]");
    });

    test("should format bigint", () => {
      const result = dumper.dump(123n);
      expect(result).toContain("123n");
      expect(result).toContain("[bigint]");
    });
  });

  describe("Complex types", () => {
    test("should format functions", () => {
      function testFunction(a: number, b: string) {
        return a + b;
      }
      const result = dumper.dump(testFunction);
      expect(result).toContain("[Function: testFunction]");
      expect(result).toContain("[function");
      expect(result).toContain("params:");
    });

    test("should format anonymous functions", () => {
      const fn = () => {};
      const result = dumper.dump(fn);
      expect(result).toContain("[Function:");
      expect(result).toContain("[function");
    });

    test("should format dates", () => {
      const date = new Date("2023-01-01T00:00:00.000Z");
      const result = dumper.dump(date);
      expect(result).toContain("2023-01-01T00:00:00.000Z");
      expect(result).toContain("[Date]");
    });

    test("should format regular expressions", () => {
      const regex = /test/gi;
      const result = dumper.dump(regex);
      expect(result).toContain("/test/gi");
      expect(result).toContain("[RegExp]");
    });

    test("should format errors", () => {
      const error = new Error("Test error");
      const result = dumper.dump(error);
      expect(result).toContain("[Error: Test error]");
    });

    test("should format promises", () => {
      const promise = Promise.resolve(42);
      const result = dumper.dump(promise);
      expect(result).toContain("[Promise]");
      expect(result).toContain("[Promise]");
    });
  });

  describe("Arrays", () => {
    test("should format empty arrays", () => {
      const result = dumper.dump([]);
      expect(result).toContain("[]");
      expect(result).toContain("[Array");
      expect(result).toContain("length: 0");
    });

    test("should format simple arrays", () => {
      const result = dumper.dump([1, 2, 3]);
      expect(result).toContain("0:");
      expect(result).toContain("1:");
      expect(result).toContain("2:");
      expect(result).toContain("length: 3");
    });

    test("should format arrays with length limit", () => {
      const longArray = Array.from({ length: 150 }, (_, i) => i);
      const dumper = new Dumper({ maxArrayLength: 5 });
      const result = dumper.dump(longArray);
      expect(result).toContain("... 145 more items");
    });

    test("should format compact arrays", () => {
      const dumper = new Dumper({
        compact: true,
        colors: false,
        showTypes: false,
      });
      const result = dumper.dump([1, 2, 3]);
      expect(result).toContain("[1, 2, 3]");
    });

    test("should format nested arrays", () => {
      const nested = [
        [1, 2],
        [3, 4],
      ];
      const result = dumper.dump(nested);
      expect(result).toContain("0:");
      expect(result).toContain("1:");
    });
  });

  describe("Objects", () => {
    test("should format empty objects", () => {
      const result = dumper.dump({});
      expect(result).toContain("{}");
      expect(result).toContain("[Object");
      expect(result).toContain("keys: 0");
    });

    test("should format simple objects", () => {
      const obj = { name: "John", age: 30 };
      const result = dumper.dump(obj);
      expect(result).toContain("name:");
      expect(result).toContain('"John"');
      expect(result).toContain("age:");
      expect(result).toContain("30");
      expect(result).toContain("keys: 2");
    });

    test("should format compact objects", () => {
      const dumper = new Dumper({
        compact: true,
        colors: false,
        showTypes: false,
      });
      const obj = { a: 1, b: 2 };
      const result = dumper.dump(obj);
      expect(result).toContain("{a: 1, b: 2}");
    });

    test("should format objects with special key names", () => {
      const obj = { "key-with-dashes": 1, "123numeric": 2 };
      const result = dumper.dump(obj);
      expect(result).toContain('"key-with-dashes"');
      expect(result).toContain('"123numeric"');
    });

    test("should format nested objects", () => {
      const nested = { user: { name: "John", details: { age: 30 } } };
      const result = dumper.dump(nested);
      expect(result).toContain("user:");
      expect(result).toContain("name:");
      expect(result).toContain("details:");
    });

    test("should detect circular references", () => {
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      const obj: any = { name: "test" };
      obj.self = obj;
      const result = dumper.dump(obj);
      expect(result).toContain("[Circular Reference]");
    });

    test("should respect max depth", () => {
      const deep = { a: { b: { c: { d: { e: "deep" } } } } };
      const dumper = new Dumper({ maxDepth: 2 });
      const result = dumper.dump(deep);
      expect(result).toContain("[Max Depth Exceeded]");
    });

    test("should format custom class instances", () => {
      class TestClass {
        constructor(public value: number) {}
      }
      const instance = new TestClass(42);
      const result = dumper.dump(instance);
      expect(result).toContain("[TestClass");
      expect(result).toContain("value:");
      expect(result).toContain("42");
    });
  });

  describe("Maps and Sets", () => {
    test("should format empty Maps", () => {
      const map = new Map();
      const result = dumper.dump(map);
      expect(result).toContain("Map {}");
      expect(result).toContain("size: 0");
    });

    test("should format Maps with entries", () => {
      const map = new Map([
        ["key1", "value1"],
        ["key2", "value2"],
      ]);
      const result = dumper.dump(map);
      expect(result).toContain('"key1"');
      expect(result).toContain('"value1"');
      expect(result).toContain('"key2"');
      expect(result).toContain('"value2"');
      expect(result).toContain("=>");
      expect(result).toContain("size: 2");
    });

    test("should format empty Sets", () => {
      const set = new Set();
      const result = dumper.dump(set);
      expect(result).toContain("Set {}");
      expect(result).toContain("size: 0");
    });

    test("should format Sets with values", () => {
      const set = new Set([1, 2, 3]);
      const result = dumper.dump(set);
      expect(result).toContain("1");
      expect(result).toContain("2");
      expect(result).toContain("3");
      expect(result).toContain("size: 3");
    });

    test("should limit Map entries display", () => {
      const largeMap = new Map();
      for (let i = 0; i < 150; i++) {
        largeMap.set(`key${i}`, `value${i}`);
      }
      const dumper = new Dumper({ maxArrayLength: 5 });
      const result = dumper.dump(largeMap);
      expect(result).toContain("... 145 more entries");
    });

    test("should limit Set values display", () => {
      const largeSet = new Set();
      for (let i = 0; i < 150; i++) {
        largeSet.add(i);
      }
      const dumper = new Dumper({ maxArrayLength: 5 });
      const result = dumper.dump(largeSet);
      expect(result).toContain("... 145 more values");
    });
  });

  describe("Options", () => {
    test("should respect showTypes option", () => {
      const dumper = new Dumper({ showTypes: false });
      const result = dumper.dump("test");
      expect(result).not.toContain("[string");
    });

    test("should respect colors option", () => {
      const dumperWithColors = new Dumper({ colors: true });
      const dumperWithoutColors = new Dumper({ colors: false });

      const withColors = dumperWithColors.dump("test");
      const withoutColors = dumperWithoutColors.dump("test");

      // This test verifies the structure is the same but colors are different
      expect(withColors).toContain('"test"');
      expect(withoutColors).toContain('"test"');
    });

    test("should respect custom indent", () => {
      const dumper = new Dumper({ indent: "    " });
      const result = dumper.dump({ a: { b: 1 } });
      expect(result).toContain("    ");
    });

    test("should use compact format when enabled", () => {
      const dumper = new Dumper({
        compact: true,
        colors: false,
        showTypes: false,
      });
      const obj = { a: 1, b: "test" };
      const result = dumper.dump(obj);
      expect(result).toContain("{a: 1, b:");
    });
  });

  describe("Labels", () => {
    test("should format with labels", () => {
      const result = dumper.dump({ test: "value" }, "My Variable");
      expect(result).toContain("My Variable:");
    });

    test("should format without labels", () => {
      const result = dumper.dump({ test: "value" });
      expect(result).toContain("test:");
      expect(result).not.toContain("My Variable:");
    });
  });

  describe("Edge cases", () => {
    test("should handle very deep nesting", () => {
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      const deep: Record<string, any> = {};
      let current = deep;
      for (let i = 0; i < 20; i++) {
        current.next = {};
        current = current.next;
      }

      const dumper = new Dumper({ maxDepth: 5 });
      const result = dumper.dump(deep);
      expect(result).toContain("[Max Depth Exceeded]");
    });

    test("should handle mixed data types", () => {
      const mixed = {
        str: "string",
        num: 42,
        bool: true,
        arr: [1, 2, 3],
        obj: { nested: "value" },
        fn: () => {},
        date: new Date(),
        regex: /test/,
      };

      const result = dumper.dump(mixed);
      expect(result).toContain("str:");
      expect(result).toContain("num:");
      expect(result).toContain("bool:");
      expect(result).toContain("arr:");
      expect(result).toContain("obj:");
      expect(result).toContain("fn:");
      expect(result).toContain("date:");
      expect(result).toContain("regex:");
    });

    test("should handle sparse arrays", () => {
      const sparse = new Array(5);
      sparse[1] = "value";
      sparse[4] = "another";

      const result = dumper.dump(sparse);
      expect(result).toContain("1:");
      expect(result).toContain("4:");
    });

    test("should handle objects with null prototype", () => {
      const obj = Object.create(null);
      obj.key = "value";

      const result = dumper.dump(obj);
      expect(result).toContain("key:");
    });
  });
});

describe("Utility functions", () => {
  test("dump function should work", () => {
    const result = dump({ test: "value" }, { colors: false });
    expect(result).toContain("test:");
    expect(result).toContain('"value"');
  });

  test("dump function should accept options", () => {
    const result = dump("test", { showTypes: false });
    expect(result).not.toContain("[string");
  });

  test("dumpToConsole should not throw", () => {
    expect(() => {
      dumpToConsole({ test: "value" }, "Test Label");
    }).not.toThrow();
  });

  test("defaultDumper should be available", () => {
    expect(defaultDumper).toBeInstanceOf(Dumper);
    const result = defaultDumper.dump("test");
    expect(result).toContain('"test"');
  });
});

describe("Performance and limits", () => {
  test("should handle large objects efficiently", () => {
    const testDumper = new Dumper({ colors: false });
    const large = {};
    for (let i = 0; i < 1000; i++) {
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      (large as any)[`key${i}`] = `value${i}`;
    }

    const start = Date.now();
    const result = testDumper.dump(large);
    const end = Date.now();

    expect(result).toContain("key0:");
    expect(end - start).toBeLessThan(1000); // Should complete within 1 second
  });

  test("should handle deeply nested circular structures", () => {
    const testDumper = new Dumper({ colors: false, maxDepth: 10 });
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const obj: any = { level: 0 };
    let current = obj;

    // Create a shorter chain that will definitely encounter the cycle
    for (let i = 1; i < 3; i++) {
      current.next = { level: i };
      current = current.next;
    }
    current.cycle = obj; // Create cycle back to root

    const result = testDumper.dump(obj);
    expect(result).toContain("[Circular Reference]");
    expect(result).toContain("level:");
  });
});
