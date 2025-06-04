"use client";

import React, { useState } from "react";
import { SendHorizontal, Lightbulb, Trash, Loader2 } from "lucide-react";
import { useChatStore } from "@frontend/core";
import { Button } from "@/components/ui/button";

export function ChatInput() {
  const [inputValue, setInputValue] = useState("");
  const [inputRows, setInputRows] = useState(1);
  const [beautifying, setBeautifying] = useState(false);

  const { sendMessage, isResponding, beautifyPrompt } = useChatStore();

  // Handle textarea input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Calculate rows based on content
    const lines = (value.match(/\n/g) || []).length + 1;
    setInputRows(Math.min(Math.max(lines, 1), 5));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim() || isResponding) return;

    sendMessage(inputValue);
    setInputValue("");
    setInputRows(1);
  };

  // Handle beautify prompt
  const handleBeautify = async () => {
    if (!inputValue.trim() || beautifying) return;

    try {
      setBeautifying(true);
      const beautified = await beautifyPrompt(inputValue);
      setInputValue(beautified);

      // Update rows based on beautified content
      const lines = (beautified.match(/\n/g) || []).length + 1;
      setInputRows(Math.min(Math.max(lines, 1), 5));
    } catch (error) {
      console.error("Error beautifying prompt:", error);
    } finally {
      setBeautifying(false);
    }
  };

  // Clear input
  const clearInput = () => {
    setInputValue("");
    setInputRows(1);
  };

  return (
    <div className="border-t bg-background p-4">
      <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
        <div className="relative">
          <textarea
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Type your message..."
            rows={inputRows}
            className="w-full p-3 pr-24 rounded-md border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            disabled={isResponding}
          />

          <div className="absolute right-2 bottom-2 flex items-center space-x-1">
            {inputValue && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={clearInput}
                title="Clear input"
              >
                <Trash className="h-4 w-4" />
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleBeautify}
              disabled={!inputValue || isResponding || beautifying}
              title="Beautify prompt"
            >
              {beautifying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Lightbulb className="h-4 w-4" />
              )}
            </Button>

            <Button
              type="submit"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={!inputValue.trim() || isResponding}
              title="Send message"
            >
              <SendHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
