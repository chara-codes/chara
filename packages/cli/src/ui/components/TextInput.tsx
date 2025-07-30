import { Box, Text, useInput } from "ink";
import { useEffect, useState } from "react";

interface TextInputProps {
  onSubmit?: (message: string) => void;
  placeholder?: string;
  isDisabled?: boolean;
  currentFolder?: string;
  currentModel?: string;
  showTips?: boolean;
}

const TextInput = ({
  onSubmit,
  placeholder = "Type your message...",
  isDisabled = false,
  currentFolder = "./project",
  currentModel = "gpt-4",
  showTips = true,
}: TextInputProps) => {
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(true);

  useInput((input, key) => {
    if (isDisabled) return;

    if (key.return) {
      if (input.trim()) {
        onSubmit?.(input.trim());
        setInput("");
      }
      return;
    }

    if (key.backspace || key.delete) {
      setInput((prev) => prev.slice(0, -1));
      return;
    }

    if (key.ctrl && input === "c") {
      process.exit(0);
    }

    if (input.length === 1 && !key.ctrl && !key.meta) {
      setInput((prev) => prev + input);
    }
  });

  const tips = [
    "Press Enter to send",
    "Ctrl+C to exit",
    "Type 'help' for commands",
  ];

  return (
    <Box flexDirection="column" width="100%">
      {/* Status bar */}
      <Box justifyContent="space-between" paddingX={1} marginBottom={1}>
        <Box>
          <Text color="gray">folder: </Text>
          <Text color="cyan">{currentFolder}</Text>
        </Box>
        <Box>
          <Text color="gray">current model: </Text>
          <Text color="green">{currentModel}</Text>
        </Box>
        {showTips && (
          <Box>
            <Text color="gray">tips: </Text>
            <Text color="yellow">?</Text>
          </Box>
        )}
      </Box>

      {/* Input field */}
      <Box
        borderStyle="single"
        borderColor={isFocused ? "blue" : "gray"}
        paddingX={1}
        paddingY={0}
        height={3}
      >
        <Text color="gray">Text Input</Text>
      </Box>

      {/* Input area simulation */}
      <Box
        borderStyle="single"
        borderColor={isFocused ? "blue" : "gray"}
        paddingX={1}
        paddingY={1}
        marginTop={-3}
      >
        <Box width="100%">
          <Text color={input ? "white" : "gray"}>{input || placeholder}</Text>
          {isFocused && <Text color="blue">|</Text>}
        </Box>
      </Box>

      {/* Tips section */}
      {showTips && (
        <Box marginTop={1} paddingX={1}>
          <Text color="gray" dimColor>
            {tips.join(" • ")}
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default TextInput;
