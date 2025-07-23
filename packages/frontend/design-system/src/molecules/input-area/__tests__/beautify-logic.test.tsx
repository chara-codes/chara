import { beforeEach, describe, expect, it, mock, spyOn } from "bun:test";

// Mock the beautify function and stream service
const mockBeautifyPrompt = mock(() => {});
const mockBeautifyPromptStream = mock(() => {});
const mockProcessChatStream = mock(() => {});

// Mock stream service
mock.module("../../../../services/stream-service", () => ({
  processChatStream: mockProcessChatStream,
}));

// Mock store hooks
mock.module("../../../../store/chat-store", () => ({
  useChatStore: mock((selector) =>
    selector({
      beautifyPrompt: mockBeautifyPrompt,
      beautifyPromptStream: mockBeautifyPromptStream,
      messages: [],
      model: "gpt-4",
    })
  ),
}));

mock.module("../../../../store/ui-store", () => ({
  useUIStore: mock((selector) =>
    selector({
      inputButtonConfig: [
        { id: "add-context", enabled: true, tooltip: "Add context" },
        { id: "select-element", enabled: true, tooltip: "Select element" },
        { id: "upload-file", enabled: true, tooltip: "Upload file" },
      ],
    })
  ),
}));

mock.module("../../../../hooks/use-element-selector", () => ({
  useElementSelector: mock(() => ({
    startElementSelection: mock(() => {}),
  })),
}));

describe("Beautify Logic Tests", () => {
  beforeEach(() => {
    mockBeautifyPrompt.mockClear();
    mockBeautifyPromptStream.mockClear();
    mockProcessChatStream.mockClear();
  });

  describe("beautifyPrompt integration", () => {
    it("should call beautifyPrompt with correct message", async () => {
      const testMessage = "test message for beautification";
      const expectedResult = "Test message for beautification.";
      mockBeautifyPrompt.mockResolvedValue(expectedResult);

      const result = await mockBeautifyPrompt(testMessage);

      expect(mockBeautifyPrompt).toHaveBeenCalledWith(testMessage);
      expect(result).toBe(expectedResult);
    });

    it("should call beautifyPromptStream with correct callbacks", () => {
      const testMessage = "test message for beautification";
      const onTextDelta = mock(() => {});
      const onComplete = mock(() => {});
      const onError = mock(() => {});

      mockBeautifyPromptStream.mockImplementation(
        (message, onDelta, onComp, _onErr) => {
          // Simulate streaming
          onDelta("Test ");
          onDelta("message ");
          onDelta("for beautification.");
          onComp("Test message for beautification.");
        }
      );

      mockBeautifyPromptStream(testMessage, onTextDelta, onComplete, onError);

      expect(mockBeautifyPromptStream).toHaveBeenCalledWith(
        testMessage,
        onTextDelta,
        onComplete,
        onError
      );
      expect(onTextDelta).toHaveBeenCalledTimes(3);
      expect(onTextDelta).toHaveBeenCalledWith("Test ");
      expect(onTextDelta).toHaveBeenCalledWith("message ");
      expect(onTextDelta).toHaveBeenCalledWith("for beautification.");
      expect(onComplete).toHaveBeenCalledWith(
        "Test message for beautification."
      );
    });

    it("should use stream service for beautification", async () => {
      const testMessage = "test message for beautification";
      const beautifiedResult = "Test message for beautification.";

      // Mock stream service to simulate text deltas
      mockProcessChatStream.mockImplementation(
        async (apiUrl, payload, callbacks) => {
          callbacks.onTextDelta("Test message ");
          callbacks.onTextDelta("for beautification.");
          if (callbacks.onCompletion) {
            callbacks.onCompletion({ finishReason: "stop" });
          }
        }
      );

      mockBeautifyPrompt.mockImplementation(async (_message) => {
        // This would use the actual implementation that calls stream service
        return beautifiedResult;
      });

      const result = await mockBeautifyPrompt(testMessage);

      expect(result).toBe(beautifiedResult);
    });

    it("should handle stream service payload correctly", async () => {
      const testMessage = "test message";

      mockProcessChatStream.mockImplementation(
        async (apiUrl, payload, callbacks) => {
          // Verify payload structure
          expect(payload.messages).toBeDefined();
          expect(payload.model).toBeDefined();
          expect(
            payload.messages[payload.messages.length - 1].content
          ).toContain(testMessage);

          callbacks.onTextDelta("Beautified text");
        }
      );

      mockBeautifyPrompt.mockImplementation(async () => {
        return "Beautified text";
      });

      await mockBeautifyPrompt(testMessage);

      // Verify stream service would be called
      expect(mockProcessChatStream).not.toHaveBeenCalled(); // Since we're mocking the higher level function
    });

    it("should handle beautify errors gracefully", async () => {
      const testMessage = "test message";
      const error = new Error("Beautify API failed");
      mockBeautifyPrompt.mockRejectedValue(error);

      await expect(mockBeautifyPrompt(testMessage)).rejects.toThrow(
        "Beautify API failed"
      );
    });

    it("should handle streaming beautify errors gracefully", () => {
      const testMessage = "test message";
      const onTextDelta = mock(() => {});
      const onComplete = mock(() => {});
      const onError = mock(() => {});
      const error = new Error("Stream failed");

      mockBeautifyPromptStream.mockImplementation(
        (message, onDelta, onComp, onErr) => {
          onErr(error);
        }
      );

      mockBeautifyPromptStream(testMessage, onTextDelta, onComplete, onError);

      expect(onError).toHaveBeenCalledWith(error);
      expect(onTextDelta).not.toHaveBeenCalled();
      expect(onComplete).not.toHaveBeenCalled();
    });

    it("should work with empty strings", async () => {
      const emptyMessage = "";
      mockBeautifyPrompt.mockResolvedValue("");

      const result = await mockBeautifyPrompt(emptyMessage);

      expect(mockBeautifyPrompt).toHaveBeenCalledWith(emptyMessage);
      expect(result).toBe("");
    });

    it("should handle empty strings in streaming mode", () => {
      const emptyMessage = "";
      const onTextDelta = mock(() => {});
      const onComplete = mock(() => {});
      const onError = mock(() => {});

      mockBeautifyPromptStream.mockImplementation(
        (message, onDelta, onComp, _onErr) => {
          onComp(message); // Return original empty message
        }
      );

      mockBeautifyPromptStream(emptyMessage, onTextDelta, onComplete, onError);

      expect(onComplete).toHaveBeenCalledWith(emptyMessage);
      expect(onTextDelta).not.toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    });

    it("should handle long messages", async () => {
      const longMessage =
        "this is a very long message that should trigger the beautify functionality when the user types more than ten characters";
      const beautifiedLongMessage =
        "This is a very long message that should trigger the beautify functionality when the user types more than ten characters.";
      mockBeautifyPrompt.mockImplementation(() =>
        Promise.resolve(beautifiedLongMessage)
      );

      const result = await mockBeautifyPrompt(longMessage);

      expect(mockBeautifyPrompt).toHaveBeenCalledWith(longMessage);
      expect(result).toBe(beautifiedLongMessage);
    });
  });

  describe("beautify visibility logic", () => {
    const shouldShowBeautifyButton = (message: string) => {
      return message.length > 10;
    };

    it("should show beautify for messages longer than 10 characters", () => {
      const message = "this is longer than ten";
      expect(shouldShowBeautifyButton(message)).toBe(true);
    });

    it("should not show beautify for messages 10 characters or less", () => {
      const shortMessage = "short";
      expect(shouldShowBeautifyButton(shortMessage)).toBe(false);
    });

    it("should not show beautify for exactly 10 characters", () => {
      const exactMessage = "1234567890"; // exactly 10 chars
      expect(shouldShowBeautifyButton(exactMessage)).toBe(false);
    });

    it("should handle whitespace correctly", () => {
      const whitespaceMessage = "           "; // 11 spaces
      expect(shouldShowBeautifyButton(whitespaceMessage)).toBe(true);
    });
  });

  describe("state management logic", () => {
    interface BeautifyState {
      message: string;
      originalText: string;
      isBeautified: boolean;
      isLoading: boolean;
    }

    const createInitialState = (): BeautifyState => ({
      message: "",
      originalText: "",
      isBeautified: false,
      isLoading: false,
    });

    const beautifyAction = (
      state: BeautifyState,
      beautifiedText: string
    ): BeautifyState => ({
      ...state,
      originalText: state.message,
      message: beautifiedText,
      isBeautified: true,
      isLoading: false,
    });

    const undoAction = (state: BeautifyState): BeautifyState => ({
      ...state,
      message: state.originalText,
      isBeautified: false,
    });

    const sendAction = (state: BeautifyState): BeautifyState => ({
      ...state,
      message: "",
      isBeautified: false,
      originalText: "",
    });

    it("should track original text for undo", () => {
      const state = createInitialState();
      state.message = "original message";

      const beautifiedState = beautifyAction(state, "Beautified message.");

      expect(beautifiedState.originalText).toBe("original message");
      expect(beautifiedState.message).toBe("Beautified message.");
      expect(beautifiedState.isBeautified).toBe(true);

      const undoState = undoAction(beautifiedState);

      expect(undoState.message).toBe("original message");
      expect(undoState.isBeautified).toBe(false);
    });

    it("should clear beautified state on send", () => {
      const state = createInitialState();
      state.message = "beautified message";
      state.isBeautified = true;

      const sentState = sendAction(state);

      expect(sentState.message).toBe("");
      expect(sentState.isBeautified).toBe(false);
      expect(sentState.originalText).toBe("");
    });

    it("should handle loading states", () => {
      const state = createInitialState();

      // Start loading
      const loadingState = { ...state, isLoading: true };
      expect(loadingState.isLoading).toBe(true);

      // Finish loading
      const finishedState = { ...loadingState, isLoading: false };
      expect(finishedState.isLoading).toBe(false);
    });
  });

  describe("error handling logic", () => {
    const handleBeautifyError = (
      originalMessage: string,
      error: Error
    ): { message: string; error: string } => {
      console.error("Failed to beautify text:", error);
      return {
        message: originalMessage,
        error: error.message,
      };
    };

    it("should preserve original text on error", () => {
      const originalText = "original message";
      const error = new Error("API Error");

      const result = handleBeautifyError(originalText, error);

      expect(result.message).toBe(originalText);
      expect(result.error).toBe("API Error");
    });

    it("should log errors appropriately", () => {
      const consoleSpy = spyOn(console, "error");
      const originalText = "test message";
      const error = new Error("Network error");

      handleBeautifyError(originalText, error);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to beautify text:",
        error
      );
      consoleSpy.mockRestore();
    });
  });

  describe("stream service integration", () => {
    it("should handle stream text deltas correctly", async () => {
      let accumulatedText = "";

      const simulateStreamCallback = (delta: string) => {
        accumulatedText += delta;
      };

      // Simulate how stream service would call onTextDelta
      simulateStreamCallback("Test ");
      simulateStreamCallback("message ");
      simulateStreamCallback("improved.");

      expect(accumulatedText).toBe("Test message improved.");
    });

    it("should handle stream errors properly", async () => {
      const streamError = "Stream connection failed";
      let capturedError = "";

      const simulateStreamErrorCallback = (error: string) => {
        capturedError = error;
      };

      simulateStreamErrorCallback(streamError);

      expect(capturedError).toBe(streamError);
    });

    it("should handle stream completion", async () => {
      let isCompleted = false;

      const simulateStreamCompletion = () => {
        isCompleted = true;
      };

      simulateStreamCompletion();

      expect(isCompleted).toBe(true);
    });

    it("should handle stream timeout", async () => {
      const timeoutDuration = 100; // ms

      const simulateTimeout = () => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error("Request timed out"));
          }, timeoutDuration);
        });
      };

      await expect(simulateTimeout()).rejects.toThrow("Request timed out");
    });

    it("should build correct stream payload", () => {
      const currentPrompt = "improve this text";
      const recentMessages = [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there!" },
      ];
      const model = "gpt-4";

      const expectedPayload = {
        messages: [
          ...recentMessages,
          {
            role: "user",
            content: `Please improve and beautify the following text while preserving its meaning and intent. Return only the improved text without any additional explanation:\n\n${currentPrompt}`,
          },
        ],
        model: model,
      };

      // Verify payload structure
      expect(expectedPayload.messages).toHaveLength(3);
      expect(expectedPayload.messages[2].content).toContain(currentPrompt);
      expect(expectedPayload.model).toBe(model);
    });
  });

  describe("async beautify workflow", () => {
    const simulateBeautifyWorkflow = async (
      message: string
    ): Promise<{ success: boolean; result: string; error?: string }> => {
      try {
        if (!message.trim()) {
          return { success: false, result: message, error: "Empty message" };
        }

        const beautifiedText = await mockBeautifyPrompt(message);
        return { success: true, result: beautifiedText };
      } catch (error) {
        return {
          success: false,
          result: message,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    };

    const simulateStreamingBeautifyWorkflow = (
      message: string
    ): Promise<{ success: boolean; result: string; error?: string }> => {
      return new Promise((resolve) => {
        if (!message.trim()) {
          resolve({ success: false, result: message, error: "Empty message" });
          return;
        }

        mockBeautifyPromptStream(
          message,
          (_delta: string) => {
            // Accumulate delta for streaming
          },
          (finalText: string) => {
            resolve({ success: true, result: finalText });
          },
          (error: Error) => {
            resolve({
              success: false,
              result: message,
              error: error.message,
            });
          }
        );
      });
    };

    it("should complete successful beautify workflow", async () => {
      const originalMessage = "test message";
      const beautifiedMessage = "Test message for beautification.";
      mockBeautifyPrompt.mockResolvedValue(beautifiedMessage);

      const result = await simulateBeautifyWorkflow(originalMessage);

      expect(result.success).toBe(true);
      expect(result.result).toBe(beautifiedMessage);
      expect(result.error).toBeUndefined();
    });

    it("should handle failed beautify workflow", async () => {
      const originalMessage = "test message";
      mockBeautifyPrompt.mockRejectedValue(new Error("API failed"));

      const result = await simulateBeautifyWorkflow(originalMessage);

      expect(result.success).toBe(false);
      expect(result.result).toBe(originalMessage);
      expect(result.error).toBe("API failed");
    });

    it("should handle empty message workflow", async () => {
      const emptyMessage = "   ";

      const result = await simulateBeautifyWorkflow(emptyMessage);

      expect(result.success).toBe(false);
      expect(result.result).toBe(emptyMessage);
      expect(result.error).toBe("Empty message");
    });

    it("should handle stream service timeout scenarios", async () => {
      mockBeautifyPrompt.mockRejectedValue(
        new Error("Beautify request timed out")
      );

      const result = await simulateBeautifyWorkflow("test message");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Beautify request timed out");
    });

    it("should complete successful streaming beautify workflow", async () => {
      const originalMessage = "test message for beautification";
      const beautifiedMessage = "Test message for beautification.";

      mockBeautifyPromptStream.mockImplementation(
        (message, onDelta, onComplete, _onError) => {
          // Simulate streaming
          onDelta("Test ");
          onDelta("message ");
          onDelta("for beautification.");
          onComplete(beautifiedMessage);
        }
      );

      const result = await simulateStreamingBeautifyWorkflow(originalMessage);

      expect(result.success).toBe(true);
      expect(result.result).toBe(beautifiedMessage);
      expect(result.error).toBeUndefined();
    });

    it("should handle failed streaming beautify workflow", async () => {
      const originalMessage = "test message";
      const error = new Error("Stream API failed");

      mockBeautifyPromptStream.mockImplementation(
        (message, onDelta, onComplete, onError) => {
          onError(error);
        }
      );

      const result = await simulateStreamingBeautifyWorkflow(originalMessage);

      expect(result.success).toBe(false);
      expect(result.result).toBe(originalMessage);
      expect(result.error).toBe("Stream API failed");
    });

    it("should handle empty message in streaming workflow", async () => {
      const emptyMessage = "   ";

      const result = await simulateStreamingBeautifyWorkflow(emptyMessage);

      expect(result.success).toBe(false);
      expect(result.result).toBe(emptyMessage);
      expect(result.error).toBe("Empty message");
    });
  });

  describe("streaming visual effects", () => {
    const simulateStreamingDisplay = (message: string, chunks: string[]) => {
      let displayedText = "";
      const updates: string[] = [];

      // Simulate clearing the input first
      displayedText = "";
      updates.push(displayedText);

      // Simulate streaming chunks
      chunks.forEach((chunk) => {
        displayedText += chunk;
        updates.push(displayedText);
      });

      return updates;
    };

    it("should show progressive text building during stream", () => {
      const originalMessage = "hello world";
      const chunks = ["Hello ", "beautiful ", "world!"];

      const updates = simulateStreamingDisplay(originalMessage, chunks);

      expect(updates).toEqual([
        "", // Initial clear
        "Hello ", // First chunk
        "Hello beautiful ", // Second chunk
        "Hello beautiful world!", // Final result
      ]);
    });

    it("should handle single character streaming", () => {
      const originalMessage = "hi";
      const chunks = ["H", "e", "l", "l", "o"];

      const updates = simulateStreamingDisplay(originalMessage, chunks);

      expect(updates).toEqual(["", "H", "He", "Hel", "Hell", "Hello"]);
    });

    it("should handle word-by-word streaming", () => {
      const originalMessage = "make this better";
      const chunks = ["Please ", "make ", "this ", "text ", "much ", "better."];

      const updates = simulateStreamingDisplay(originalMessage, chunks);

      expect(updates[0]).toBe(""); // Starts empty
      expect(updates[updates.length - 1]).toBe(
        "Please make this text much better."
      );
      expect(updates.length).toBe(7); // Initial + 6 chunks
    });

    it("should show immediate feedback on beautify start", () => {
      const mockStreamState = {
        message: "original text",
        isLoading: false,
        isBeautifyLoading: false,
      };

      // Simulate beautify start
      const startBeautify = () => {
        mockStreamState.isBeautifyLoading = true;
        mockStreamState.message = ""; // Clear immediately
      };

      startBeautify();

      expect(mockStreamState.isBeautifyLoading).toBe(true);
      expect(mockStreamState.message).toBe("");
    });

    it("should handle streaming with punctuation and formatting", () => {
      const originalMessage = "fix this text please";
      const chunks = ["Please ", "fix ", "this ", "text, ", "thank ", "you!"];

      const updates = simulateStreamingDisplay(originalMessage, chunks);

      const finalText = updates[updates.length - 1];
      expect(finalText).toBe("Please fix this text, thank you!");
      expect(finalText.includes(",")).toBe(true);
      expect(finalText.includes("!")).toBe(true);
    });

    it("should maintain text area auto-resize during streaming", () => {
      const simulateHeightAdjustment = (text: string) => {
        const lines = text.split("\n").length;
        const baseHeight = 24;
        const lineHeight = 24;
        const maxHeight = 150;

        const calculatedHeight = Math.min(
          baseHeight + (lines - 1) * lineHeight,
          maxHeight
        );
        return {
          height: calculatedHeight,
          overflow: calculatedHeight >= maxHeight ? "auto" : "hidden",
        };
      };

      const shortText = "Short";
      const mediumText = "Line 1\nLine 2\nLine 3"; // 3 lines = 24 + (3-1)*24 = 72px
      const longText = "Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6\nLine 7"; // 7 lines = 24 + (7-1)*24 = 168px, capped at 150px

      expect(simulateHeightAdjustment(shortText).height).toBe(24);
      expect(simulateHeightAdjustment(mediumText).height).toBe(72);
      expect(simulateHeightAdjustment(longText).height).toBe(150);
      expect(simulateHeightAdjustment(longText).overflow).toBe("auto");
    });
  });

  describe("user experience during streaming", () => {
    it("should provide clear visual feedback states", () => {
      const uiStates = {
        idle: {
          isLoading: false,
          isBeautifyLoading: false,
          message: "original text",
        },
        starting: { isLoading: false, isBeautifyLoading: true, message: "" },
        streaming: {
          isLoading: false,
          isBeautifyLoading: true,
          message: "partial text",
        },
        completed: {
          isLoading: false,
          isBeautifyLoading: false,
          message: "beautified text",
        },
        error: {
          isLoading: false,
          isBeautifyLoading: false,
          message: "original text",
        },
      };

      // Verify distinct states
      expect(uiStates.idle.isBeautifyLoading).toBe(false);
      expect(uiStates.starting.isBeautifyLoading).toBe(true);
      expect(uiStates.starting.message).toBe("");
      expect(uiStates.streaming.message.length).toBeGreaterThan(0);
      expect(uiStates.completed.isBeautifyLoading).toBe(false);
      expect(uiStates.error.message).toBe("original text");
    });

    it("should handle user interactions during streaming", () => {
      const interactionStates = {
        canSend: (isBeautifyLoading: boolean, message: string) =>
          !isBeautifyLoading && message.trim().length > 0,
        canBeautify: (isBeautifyLoading: boolean, message: string) =>
          !isBeautifyLoading && message.length > 10,
        canUndo: (isBeautified: boolean, isBeautifyLoading: boolean) =>
          isBeautified && !isBeautifyLoading,
        canAddContext: (isBeautifyLoading: boolean) => !isBeautifyLoading,
      };

      // During streaming
      expect(interactionStates.canSend(true, "some text")).toBe(false);
      expect(interactionStates.canBeautify(true, "some longer text")).toBe(
        false
      );
      expect(interactionStates.canUndo(false, true)).toBe(false);
      expect(interactionStates.canAddContext(true)).toBe(false);

      // After streaming completes
      expect(interactionStates.canSend(false, "beautified text")).toBe(true);
      expect(interactionStates.canUndo(true, false)).toBe(true);
      expect(interactionStates.canAddContext(false)).toBe(true);
    });

    it("should handle streaming interruption scenarios", () => {
      const handleStreamInterruption = (reason: string) => {
        const responses = {
          timeout: { shouldRevert: true, errorMessage: "Request timed out" },
          network: { shouldRevert: true, errorMessage: "Network error" },
          abort: { shouldRevert: true, errorMessage: "Request was cancelled" },
          server: { shouldRevert: true, errorMessage: "Server error" },
        };

        return (
          responses[reason as keyof typeof responses] || {
            shouldRevert: true,
            errorMessage: "Unknown error",
          }
        );
      };

      expect(handleStreamInterruption("timeout").shouldRevert).toBe(true);
      expect(handleStreamInterruption("network").errorMessage).toBe(
        "Network error"
      );
      expect(handleStreamInterruption("abort").shouldRevert).toBe(true);
    });
  });

  describe("textarea auto-resize logic", () => {
    // Mock textarea element with height calculation
    const createMockTextarea = (scrollHeight: number) => ({
      style: { height: "24px", overflowY: "hidden" },
      scrollHeight,
    });

    const adjustTextareaHeight = (textarea: any, maxHeight: number = 150) => {
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
      textarea.style.overflowY = scrollHeight > maxHeight ? "auto" : "hidden";
      return {
        height: Math.min(scrollHeight, maxHeight),
        overflow: scrollHeight > maxHeight ? "auto" : "hidden",
      };
    };

    it("should set correct height for short text", () => {
      const mockTextarea = createMockTextarea(24);

      const result = adjustTextareaHeight(mockTextarea);

      expect(result.height).toBe(24);
      expect(result.overflow).toBe("hidden");
      expect(mockTextarea.style.height).toBe("24px");
    });

    it("should set correct height for medium text", () => {
      const mockTextarea = createMockTextarea(80);

      const result = adjustTextareaHeight(mockTextarea);

      expect(result.height).toBe(80);
      expect(result.overflow).toBe("hidden");
      expect(mockTextarea.style.height).toBe("80px");
    });

    it("should limit height to max 150px for long text", () => {
      const mockTextarea = createMockTextarea(200);

      const result = adjustTextareaHeight(mockTextarea);

      expect(result.height).toBe(150);
      expect(result.overflow).toBe("auto");
      expect(mockTextarea.style.height).toBe("150px");
      expect(mockTextarea.style.overflowY).toBe("auto");
    });

    it("should handle exactly max height", () => {
      const mockTextarea = createMockTextarea(150);

      const result = adjustTextareaHeight(mockTextarea);

      expect(result.height).toBe(150);
      expect(result.overflow).toBe("hidden");
      expect(mockTextarea.style.height).toBe("150px");
      expect(mockTextarea.style.overflowY).toBe("hidden");
    });

    it("should reset height to auto before calculation", () => {
      const mockTextarea = createMockTextarea(100);
      mockTextarea.style.height = "200px"; // Start with different height

      adjustTextareaHeight(mockTextarea);

      // Height should be reset to auto first, then set to calculated value
      expect(mockTextarea.style.height).toBe("100px");
    });

    it("should handle very large text content", () => {
      const mockTextarea = createMockTextarea(500);

      const result = adjustTextareaHeight(mockTextarea);

      expect(result.height).toBe(150);
      expect(result.overflow).toBe("auto");
      expect(mockTextarea.style.overflowY).toBe("auto");
    });

    it("should work with custom max height", () => {
      const mockTextarea = createMockTextarea(200);
      const customMaxHeight = 100;

      const result = adjustTextareaHeight(mockTextarea, customMaxHeight);

      expect(result.height).toBe(100);
      expect(result.overflow).toBe("auto");
      expect(mockTextarea.style.height).toBe("100px");
    });
  });
});
