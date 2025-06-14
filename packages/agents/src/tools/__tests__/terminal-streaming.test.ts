import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { terminal } from "../terminal";
import { appEvents } from "../../services/events";

describe("terminal streaming", () => {
  let events: Array<{ name: string; data: any }> = [];

  beforeEach(() => {
    events = [];
    appEvents.on("tool:calling", (eventData) => {
      events.push(eventData);
    });
  });

  afterEach(() => {
    appEvents.removeAllListeners("tool:calling");
  });

  it("should emit stdout events when command produces output", async () => {
    const result = await terminal.execute({
      command: 'echo "Hello World"',
      cd: process.cwd(),
    });

    expect(result).toContain("Hello World");

    // Check that we received streaming events
    const stdoutEvents = events.filter((e) => e.data?.type === "stdout");
    const completeEvents = events.filter((e) => e.data?.type === "complete");

    expect(stdoutEvents.length).toBeGreaterThan(0);
    expect(completeEvents.length).toBe(1);

    // Verify stdout event structure
    const stdoutEvent = stdoutEvents[0];
    expect(stdoutEvent.name).toBe("terminal");
    expect(stdoutEvent.toolCallId).toBeDefined();
    expect(stdoutEvent.data.type).toBe("stdout");
    expect(stdoutEvent.data.chunk).toContain("Hello World");
    expect(stdoutEvent.data.command).toBe('echo "Hello World"');
    expect(stdoutEvent.data.cd).toBe(process.cwd());

    // Verify complete event structure
    const completeEvent = completeEvents[0];
    expect(completeEvent.name).toBe("terminal");
    expect(completeEvent.toolCallId).toBeDefined();
    expect(completeEvent.data.type).toBe("complete");
    expect(completeEvent.data.exitCode).toBe(0);
    expect(completeEvent.data.command).toBe('echo "Hello World"');
    expect(completeEvent.data.cd).toBe(process.cwd());
  });

  it("should emit stderr events when command produces error output", async () => {
    const result = await terminal.execute({
      command: 'echo "Error message" >&2',
      cd: process.cwd(),
    });

    // Check that we received streaming events
    const stderrEvents = events.filter((e) => e.data?.type === "stderr");
    const completeEvents = events.filter((e) => e.data?.type === "complete");

    expect(stderrEvents.length).toBeGreaterThan(0);
    expect(completeEvents.length).toBe(1);

    // Verify stderr event structure
    const stderrEvent = stderrEvents[0];
    expect(stderrEvent.name).toBe("terminal");
    expect(stderrEvent.toolCallId).toBeDefined();
    expect(stderrEvent.data.type).toBe("stderr");
    expect(stderrEvent.data.chunk).toContain("Error message");
    expect(stderrEvent.data.command).toBe('echo "Error message" >&2');
    expect(stderrEvent.data.cd).toBe(process.cwd());
  });

  it("should emit both stdout and stderr events for mixed output", async () => {
    const result = await terminal.execute({
      command: 'echo "stdout message" && echo "stderr message" >&2',
      cd: process.cwd(),
    });

    const stdoutEvents = events.filter((e) => e.data?.type === "stdout");
    const stderrEvents = events.filter((e) => e.data?.type === "stderr");
    const completeEvents = events.filter((e) => e.data?.type === "complete");

    expect(stdoutEvents.length).toBeGreaterThan(0);
    expect(stderrEvents.length).toBeGreaterThan(0);
    expect(completeEvents.length).toBe(1);

    // Verify we got the expected content
    const stdoutContent = stdoutEvents.map((e) => e.data.chunk).join("");
    const stderrContent = stderrEvents.map((e) => e.data.chunk).join("");

    expect(stdoutContent).toContain("stdout message");
    expect(stderrContent).toContain("stderr message");
  });

  it("should emit complete event with correct exit code for failing command", async () => {
    try {
      await terminal.execute({
        command: "exit 1",
        cd: process.cwd(),
      });
    } catch (error) {
      // Command might throw or might not, depending on implementation
    }

    const completeEvents = events.filter((e) => e.data?.type === "complete");
    expect(completeEvents.length).toBe(1);

    const completeEvent = completeEvents[0];
    expect(completeEvent.data.exitCode).toBe(1);
  });

  it("should handle commands with no output", async () => {
    const result = await terminal.execute({
      command: "true", // Command that succeeds with no output
      cd: process.cwd(),
    });

    const completeEvents = events.filter((e) => e.data?.type === "complete");
    expect(completeEvents.length).toBe(1);

    const completeEvent = completeEvents[0];
    expect(completeEvent.data.exitCode).toBe(0);

    // Might have empty stdout/stderr events or no output events at all
    const outputEvents = events.filter(
      (e) => e.data?.type === "stdout" || e.data?.type === "stderr",
    );
    // Just verify we don't crash - output events may or may not be present
  });

  it("should preserve event order and command context", async () => {
    const testCommand = 'echo "test output"';
    const testCd = process.cwd();

    await terminal.execute({
      command: testCommand,
      cd: testCd,
    });

    // All events should have the same command and cd context
    for (const event of events) {
      expect(event.name).toBe("terminal");
      expect(event.toolCallId).toBeDefined();
      expect(event.data.command).toBe(testCommand);
      expect(event.data.cd).toBe(testCd);
    }

    // Complete event should come last
    const lastEvent = events[events.length - 1];
    expect(lastEvent.data.type).toBe("complete");
  });

  it("should handle streaming for commands with multiple lines of output", async () => {
    const result = await terminal.execute({
      command: 'printf "Line 1\\nLine 2\\nLine 3\\n"',
      cd: process.cwd(),
    });

    const stdoutEvents = events.filter((e) => e.data?.type === "stdout");
    const completeEvents = events.filter((e) => e.data?.type === "complete");

    expect(stdoutEvents.length).toBeGreaterThan(0);
    expect(completeEvents.length).toBe(1);

    // Combine all stdout chunks
    const combinedOutput = stdoutEvents.map((e) => e.data.chunk).join("");
    expect(combinedOutput).toContain("Line 1");
    expect(combinedOutput).toContain("Line 2");
    expect(combinedOutput).toContain("Line 3");
  });
});
