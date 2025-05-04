"use client";

import type React from "react";

import { useState, useRef, FormEvent, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Send,
  Paperclip,
  X,
  Loader2,
  File,
  Terminal,
  Database,
} from "lucide-react";
import type { FileAttachment } from "../types";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface ChatInputProps {
  onSendMessage: (e: FormEvent<HTMLFormElement>, input: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [commandMenuPosition, setCommandMenuPosition] = useState({
    top: 0,
    left: 0,
  });
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [showSubComponents, setShowSubComponents] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [focusedItemIndex, setFocusedItemIndex] = useState(0);
  const [attachedContexts, setAttachedContexts] = useState<
    Array<{ source: string; component: string }>
  >([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        id: Math.random().toString(36).substring(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
      }));

      setAttachments((prev) => [...prev, ...newFiles]);
    }

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const attachment = prev.find((a) => a.id === id);
      if (attachment) {
        URL.revokeObjectURL(attachment.url); // Clean up the blob URL
      }
      return prev.filter((a) => a.id !== id);
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

    // Check if the last character is "/"
    if (value.endsWith("/") && !showCommandMenu) {
      setShowCommandMenu(true);
      setFocusedItemIndex(0); // Reset focused item
      // Calculate position for the command menu
      if (inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        setCommandMenuPosition({
          top: rect.top - 250, // Position above the input
          left: rect.left,
        });
      }
    } else if (!value.endsWith("/") && showCommandMenu && !selectedSource) {
      setShowCommandMenu(false);
    }
  };

  const handleSourceSelect = (source: string) => {
    setSelectedSource(source);
    setShowSubComponents(true);
    setFocusedItemIndex(0); // Reset focused item
  };

  const handleComponentSelect = (component: string) => {
    // Add the context to the attachedContexts array
    setAttachedContexts((prev) => [
      ...prev,
      { source: selectedSource!, component },
    ]);

    // Close the command menu
    setShowCommandMenu(false);
    setSelectedSource(null);
    setShowSubComponents(false);

    // Remove the "/" from the input
    setInput((prev) => prev.slice(0, -1));

    // Focus back on the input
    inputRef.current?.focus();
  };

  const closeCommandMenu = () => {
    setShowCommandMenu(false);
    setSelectedSource(null);
    setShowSubComponents(false);
    setFocusedItemIndex(0); // Reset focused item
  };

  const removeContext = (index: number) => {
    setAttachedContexts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = (e: FormEvent<HTMLFormElement>) => {
    if (
      (input.trim() || attachments.length > 0 || attachedContexts.length > 0) &&
      !isLoading
    ) {
      // Format the message content with attached contexts
      let messageContent = input;

      // Add contexts at the beginning of the message if there are any
      if (attachedContexts.length > 0) {
        const contextStrings = attachedContexts.map(
          (ctx) => `[${ctx.source}:${ctx.component}]`,
        );
        messageContent = contextStrings.join("\n") + "\n\n" + messageContent;
      }

      // Call the parent's onSendMessage function
      onSendMessage(e, input);

      // Clear input, attachments, and contexts
      setInput("");
      setAttachments([]);
      setAttachedContexts([]);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (showCommandMenu) {
      const items = selectedSource
        ? selectedSource === "file"
          ? 3
          : selectedSource === "console"
            ? 2
            : 3 // Number of items in each category
        : 3; // Number of sources

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          setFocusedItemIndex((prev) => (prev > 0 ? prev - 1 : items - 1));
          break;
        case "ArrowDown":
          e.preventDefault();
          setFocusedItemIndex((prev) => (prev < items - 1 ? prev + 1 : 0));
          break;
        case "Enter":
          e.preventDefault();
          if (!selectedSource) {
            // Select source based on focused index
            const sources = ["file", "console", "mcp"];
            handleSourceSelect(sources[focusedItemIndex]);
          } else {
            // Select component based on focused index
            let components: string[] = [];
            if (selectedSource === "file") {
              components = ["app.js", "index.js", "styles.css"];
            } else if (selectedSource === "console") {
              components = ["error", "output"];
            } else if (selectedSource === "mcp") {
              components = ["dashboard", "settings", "users"];
            }
            handleComponentSelect(components[focusedItemIndex]);
          }
          break;
        case "Escape":
          closeCommandMenu();
          break;
        case "Tab":
          e.preventDefault();
          if (!selectedSource) {
            // Select source based on focused index
            const sources = ["file", "console", "mcp"];
            handleSourceSelect(sources[focusedItemIndex]);
          } else {
            // Select component based on focused index
            let components: string[] = [];
            if (selectedSource === "file") {
              components = ["app.js", "index.js", "styles.css"];
            } else if (selectedSource === "console") {
              components = ["error", "output"];
            } else if (selectedSource === "mcp") {
              components = ["dashboard", "settings", "users"];
            }
            handleComponentSelect(components[focusedItemIndex]);
          }
          break;
      }
    }
  };

  return (
    <form onSubmit={handleSendMessage}>
      <div>
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachments.map((file) => (
              <div
                key={file.id}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center"
              >
                <span className="truncate max-w-[150px]">{file.name}</span>
                <button
                  onClick={() => removeAttachment(file.id)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        {attachedContexts.length > 0 && (
          <div className="mb-2 flex flex-row flex-wrap gap-2">
            {attachedContexts.map((ctx, index) => (
              <div
                key={index}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center"
              >
                <span className="font-medium">
                  [{ctx.source}:{ctx.component}]
                </span>
                <button
                  onClick={() => removeContext(index)}
                  className="ml-2 text-blue-600 hover:text-blue-800 p-0.5 rounded-full hover:bg-blue-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message... (Type / for context)"
              disabled={isLoading}
              className="pr-10"
            />
            {showCommandMenu && (
              <div
                className="absolute z-50 w-64 bg-white rounded-md shadow-lg border border-gray-200"
                style={{
                  bottom: "100%",
                  left: "0",
                  marginBottom: "8px",
                }}
              >
                {!selectedSource ? (
                  <Command>
                    <CommandInput placeholder="Search context source..." />
                    <CommandList>
                      <CommandEmpty>No results found.</CommandEmpty>
                      <CommandGroup heading="Context Sources">
                        <CommandItem
                          onSelect={() => handleSourceSelect("file")}
                          className={
                            focusedItemIndex === 0 ? "bg-blue-100" : ""
                          }
                        >
                          <File className="mr-2 h-4 w-4" />
                          <span>File</span>
                        </CommandItem>
                        <CommandItem
                          onSelect={() => handleSourceSelect("console")}
                          className={
                            focusedItemIndex === 1 ? "bg-blue-100" : ""
                          }
                        >
                          <Terminal className="mr-2 h-4 w-4" />
                          <span>Console</span>
                        </CommandItem>
                        <CommandItem
                          onSelect={() => handleSourceSelect("mcp")}
                          className={
                            focusedItemIndex === 2 ? "bg-blue-100" : ""
                          }
                        >
                          <Database className="mr-2 h-4 w-4" />
                          <span>MCP</span>
                        </CommandItem>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                ) : (
                  <Command>
                    <CommandInput
                      placeholder={`Search ${selectedSource} components...`}
                    />
                    <CommandList>
                      <CommandEmpty>No results found.</CommandEmpty>
                      <CommandGroup
                        heading={`${selectedSource.charAt(0).toUpperCase() + selectedSource.slice(1)} Components`}
                      >
                        {selectedSource === "file" && (
                          <>
                            <CommandItem
                              onSelect={() => handleComponentSelect("app.js")}
                              className={
                                focusedItemIndex === 0 ? "bg-blue-100" : ""
                              }
                            >
                              <span>app.js</span>
                            </CommandItem>
                            <CommandItem
                              onSelect={() => handleComponentSelect("index.js")}
                              className={
                                focusedItemIndex === 1 ? "bg-blue-100" : ""
                              }
                            >
                              <span>index.js</span>
                            </CommandItem>
                            <CommandItem
                              onSelect={() =>
                                handleComponentSelect("styles.css")
                              }
                              className={
                                focusedItemIndex === 2 ? "bg-blue-100" : ""
                              }
                            >
                              <span>styles.css</span>
                            </CommandItem>
                          </>
                        )}
                        {selectedSource === "console" && (
                          <>
                            <CommandItem
                              onSelect={() => handleComponentSelect("error")}
                              className={
                                focusedItemIndex === 0 ? "bg-blue-100" : ""
                              }
                            >
                              <span>Error Log</span>
                            </CommandItem>
                            <CommandItem
                              onSelect={() => handleComponentSelect("output")}
                              className={
                                focusedItemIndex === 1 ? "bg-blue-100" : ""
                              }
                            >
                              <span>Output</span>
                            </CommandItem>
                          </>
                        )}
                        {selectedSource === "mcp" && (
                          <>
                            <CommandItem
                              onSelect={() =>
                                handleComponentSelect("dashboard")
                              }
                              className={
                                focusedItemIndex === 0 ? "bg-blue-100" : ""
                              }
                            >
                              <span>Dashboard</span>
                            </CommandItem>
                            <CommandItem
                              onSelect={() => handleComponentSelect("settings")}
                              className={
                                focusedItemIndex === 1 ? "bg-blue-100" : ""
                              }
                            >
                              <span>Settings</span>
                            </CommandItem>
                            <CommandItem
                              onSelect={() => handleComponentSelect("users")}
                              className={
                                focusedItemIndex === 2 ? "bg-blue-100" : ""
                              }
                            >
                              <span>Users</span>
                            </CommandItem>
                          </>
                        )}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                )}
              </div>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            multiple
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Attach files</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button size="icon" type="submit" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
