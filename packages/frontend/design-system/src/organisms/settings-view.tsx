"use client";

import type React from "react";
import { useState, useCallback, useEffect, useContext } from "react";
import styled from "styled-components";
import ViewNavigation from "../molecules/view-navigation";
import {
  useUIStore,
  type KeyboardShortcut,
  UIStoreContext,
} from '@chara/core';
import { ChevronDownIcon } from "../atoms/icons";

const SettingsContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background-color: #f9fafb;
`;

const SettingsContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 12px;
`;

const SettingsGroup = styled.div`
  margin-bottom: 16px;
  border-radius: 6px;
  background-color: white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  overflow: hidden;
`;

const SettingsGroupHeader = styled.div<{ $isOpen?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background-color: white;
  border-bottom: ${(props) => (props.$isOpen ? "1px solid #e5e7eb" : "none")};
  cursor: pointer;

  &:hover {
    background-color: #f9fafb;
  }
`;

const SettingsGroupTitle = styled.h3`
  font-size: 14px;
  font-weight: 500;
  color: #111827;
  margin: 0;
`;

const SettingsGroupIcon = styled.div<{ $isOpen?: boolean }>`
  transform: ${(props) => (props.$isOpen ? "rotate(180deg)" : "rotate(0)")};
  transition: transform 0.2s ease;
  color: #6b7280;
`;

const SettingsGroupContent = styled.div<{ $isOpen?: boolean }>`
  display: ${(props) => (props.$isOpen ? "block" : "none")};
`;

const SettingItem = styled.div`
  display: flex;
  align-items: flex-start;
  padding: 10px 12px;
  border-bottom: 1px solid #f3f4f6;

  &:last-child {
    border-bottom: none;
  }
`;

const SettingInfo = styled.div`
  flex: 1;
`;

const SettingTitle = styled.h4`
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  margin: 0 0 2px 0;
`;

const SettingDescription = styled.p`
  font-size: 12px;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
`;

const SettingControl = styled.div`
  margin-left: 12px;
  display: flex;
  align-items: center;
`;

const NoSettingsResults = styled.div`
  padding: 16px;
  text-align: center;
  color: #6b7280;
  font-style: italic;
  background-color: white;
  border-radius: 6px;
  margin-top: 12px;
`;

const KeyboardShortcutInput = styled.input`
  width: 60px;
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
  text-align: center;
  font-family: monospace;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
  }
`;

const ShortcutToggle = styled.div<{ $enabled: boolean }>`
  width: 36px;
  height: 20px;
  background-color: ${(props) => (props.$enabled ? "#3b82f6" : "#e5e7eb")};
  border-radius: 10px;
  position: relative;
  cursor: pointer;
  transition: background-color 0.2s ease;
  margin-right: 8px;

  &::after {
    content: "";
    position: absolute;
    width: 16px;
    height: 16px;
    background-color: white;
    border-radius: 50%;
    top: 2px;
    left: ${(props) => (props.$enabled ? "calc(100% - 18px)" : "2px")};
    transition: left 0.2s ease;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
`;

const ShortcutControls = styled.div`
  display: flex;
  align-items: center;
`;

// Settings data structure
const settingsData = [
  {
    id: "general",
    title: "General",
    items: [
      {
        id: "theme",
        title: "Theme",
        description: "Choose between light and dark mode",
        control: "toggle",
      },
      {
        id: "notifications",
        title: "Notifications",
        description: "Enable or disable notifications",
        control: "toggle",
      },
      {
        id: "sounds",
        title: "Sound Effects",
        description: "Play sounds for messages and actions",
        control: "toggle",
      },
    ],
  },
  {
    id: "keyboard-shortcuts",
    title: "Keyboard Shortcuts",
    items: [
      {
        id: "toggle-chat-overlay",
        title: "Toggle Chat Overlay",
        description: "Show or hide the chat panel with a keyboard shortcut",
        control: "shortcut",
        action: "toggleChatOverlay",
      },
    ],
  },
  {
    id: "models",
    title: "AI Models",
    items: [
      {
        id: "default-model",
        title: "Default Model",
        description: "Set your preferred AI model",
        control: "select",
      },
      {
        id: "temperature",
        title: "Temperature",
        description: "Control the randomness of responses",
        control: "slider",
      },
      {
        id: "context-length",
        title: "Context Length",
        description: "Maximum tokens to include in context",
        control: "input",
      },
    ],
  },
  {
    id: "privacy",
    title: "Privacy & Data",
    items: [
      {
        id: "history",
        title: "Conversation History",
        description: "Store conversations for future reference",
        control: "toggle",
      },
      {
        id: "data-collection",
        title: "Data Collection",
        description: "Allow anonymous usage data collection",
        control: "toggle",
      },
      {
        id: "auto-delete",
        title: "Auto-Delete",
        description: "Automatically delete conversations after 30 days",
        control: "toggle",
      },
    ],
  },
  {
    id: "appearance",
    title: "Appearance",
    items: [
      {
        id: "font-size",
        title: "Font Size",
        description: "Adjust the text size throughout the app",
        control: "select",
      },
      {
        id: "density",
        title: "Interface Density",
        description: "Control the spacing and density of UI elements",
        control: "select",
      },
      {
        id: "animations",
        title: "Animations",
        description: "Enable or disable UI animations",
        control: "toggle",
      },
    ],
  },
  {
    id: "advanced",
    title: "Advanced",
    items: [
      {
        id: "keyboard-shortcuts",
        title: "Keyboard Shortcuts",
        description: "Enable keyboard shortcuts for faster navigation",
        control: "toggle",
      },
      {
        id: "developer-mode",
        title: "Developer Mode",
        description: "Enable additional developer features",
        control: "toggle",
      },
      {
        id: "reset",
        title: "Reset All Settings",
        description: "Restore all settings to their default values",
        control: "button",
      },
    ],
  },
];

interface SettingsItemWithAction {
  id: string;
  title: string;
  description: string;
  control: string;
  action: string;
}

interface SettingsViewProps {
  onBack: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onBack }) => {
  // Get UI store state
  const keyboardShortcuts = useUIStore((state) => state.keyboardShortcuts);

  // Get UI store actions using getState to avoid subscription issues
  const storeApi = useContext(UIStoreContext);
  if (!storeApi) {
    // This should not happen if `useUIStore` above works, as both rely on the same context.
    // However, it's a good safeguard.
    throw new Error("SettingsView must be used within a UIStoreProvider");
  }

  const [settingsSearchQuery, setSettingsSearchQuery] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    general: true,
    "keyboard-shortcuts": true,
    models: true,
    privacy: true,
    appearance: true,
    advanced: true,
  });
  const [recordingShortcut, setRecordingShortcut] = useState<string | null>(
    null,
  );

  // Toggle group open/closed state
  const toggleGroup = useCallback((groupId: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  }, []);

  // Handle shortcut key recording
  const startRecordingShortcut = useCallback((action: string) => {
    setRecordingShortcut(action);
  }, []);

  // Get shortcut by action
  const getShortcutByAction = useCallback(
    (action: string): KeyboardShortcut | undefined => {
      return keyboardShortcuts.find((shortcut) => shortcut.action === action);
    },
    [keyboardShortcuts],
  );

  // Toggle shortcut enabled state
  const toggleShortcutEnabled = useCallback(
    (action: string) => {
      const shortcut = getShortcutByAction(action);
      if (shortcut) {
        storeApi.store
          .getState()
          .updateKeyboardShortcut(action, { enabled: !shortcut.enabled });
      }
    },
    [getShortcutByAction, storeApi],
  );

  // Handle key press during recording
  useEffect(() => {
    if (!recordingShortcut) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();

      // Get the key or key combination
      let key = e.key;

      // Don't allow modifier keys alone
      if (["Control", "Alt", "Shift", "Meta"].includes(key)) {
        return;
      }

      // Add modifiers if pressed
      if (e.ctrlKey) key = `Ctrl+${key}`;
      if (e.altKey) key = `Alt+${key}`;
      if (e.shiftKey) key = `Shift+${key}`;
      if (e.metaKey) key = `Meta+${key}`;

      // Update the shortcut
      storeApi.store
        .getState()
        .updateKeyboardShortcut(recordingShortcut, { key });
      setRecordingShortcut(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [recordingShortcut, storeApi]);

  // Handle search query change
  const handleSearchChange = useCallback((value: string) => {
    setSettingsSearchQuery(value);
  }, []);

  // Filter settings based on search query
  const filteredSettings =
    settingsSearchQuery.trim() === ""
      ? settingsData
      : settingsData
          .map((group) => ({
            ...group,
            items: group.items.filter(
              (item) =>
                item.title
                  .toLowerCase()
                  .includes(settingsSearchQuery.toLowerCase()) ||
                item.description
                  .toLowerCase()
                  .includes(settingsSearchQuery.toLowerCase()),
            ),
          }))
          .filter((group) => group.items.length > 0);

  return (
    <SettingsContainer>
      <ViewNavigation
        onBack={onBack}
        searchQuery={settingsSearchQuery}
        onSearchChange={handleSearchChange}
        placeholder="Search settings..."
      />

      <SettingsContent>
        {filteredSettings.length > 0 ? (
          filteredSettings.map((group) => (
            <SettingsGroup key={group.id}>
              <SettingsGroupHeader
                $isOpen={openGroups[group.id]}
                onClick={() => toggleGroup(group.id)}
              >
                <SettingsGroupTitle>{group.title}</SettingsGroupTitle>
                <SettingsGroupIcon $isOpen={openGroups[group.id]}>
                  <ChevronDownIcon width={16} height={16} />
                </SettingsGroupIcon>
              </SettingsGroupHeader>
              <SettingsGroupContent $isOpen={openGroups[group.id]}>
                {group.items.map((item) => (
                  <SettingItem key={item.id}>
                    <SettingInfo>
                      <SettingTitle>{item.title}</SettingTitle>
                      <SettingDescription>
                        {item.description}
                      </SettingDescription>
                    </SettingInfo>
                    <SettingControl>
                      {item.control === "toggle" && (
                        <div
                          style={{
                            width: "36px",
                            height: "20px",
                            backgroundColor: "#e5e7eb",
                            borderRadius: "10px",
                            position: "relative",
                          }}
                        >
                          <div
                            style={{
                              width: "16px",
                              height: "16px",
                              backgroundColor: "white",
                              borderRadius: "50%",
                              position: "absolute",
                              top: "2px",
                              left: "2px",
                            }}
                          />
                        </div>
                      )}
                      {item.control === "shortcut" &&
                        (item as SettingsItemWithAction).action && (
                          <ShortcutControls>
                            <ShortcutToggle
                              $enabled={
                                getShortcutByAction(
                                  (item as SettingsItemWithAction).action,
                                )?.enabled || false
                              }
                              onClick={() =>
                                toggleShortcutEnabled(
                                  (item as SettingsItemWithAction).action,
                                )
                              }
                            />
                            <KeyboardShortcutInput
                              value={
                                recordingShortcut ===
                                (item as SettingsItemWithAction).action
                                  ? "Press key..."
                                  : getShortcutByAction(
                                      (item as SettingsItemWithAction).action,
                                    )?.key || ""
                              }
                              onFocus={() =>
                                startRecordingShortcut(
                                  (item as SettingsItemWithAction).action,
                                )
                              }
                              readOnly
                              placeholder="Press key"
                            />
                          </ShortcutControls>
                        )}
                      {item.control === "select" && (
                        <select
                          style={{
                            padding: "4px 8px",
                            fontSize: "12px",
                            borderRadius: "4px",
                            border: "1px solid #e5e7eb",
                          }}
                        >
                          <option>Select...</option>
                        </select>
                      )}
                      {item.control === "slider" && (
                        <input
                          type="range"
                          min="0"
                          max="100"
                          defaultValue="50"
                          style={{ width: "80px" }}
                        />
                      )}
                      {item.control === "input" && (
                        <input
                          type="text"
                          style={{
                            padding: "4px 8px",
                            fontSize: "12px",
                            borderRadius: "4px",
                            border: "1px solid #e5e7eb",
                            width: "60px",
                          }}
                        />
                      )}
                      {item.control === "button" && (
                        <button
                          type="button"
                          style={{
                            padding: "4px 8px",
                            fontSize: "12px",
                            borderRadius: "4px",
                            border: "1px solid #e5e7eb",
                            backgroundColor: "#f3f4f6",
                          }}
                        >
                          Reset
                        </button>
                      )}
                    </SettingControl>
                  </SettingItem>
                ))}
              </SettingsGroupContent>
            </SettingsGroup>
          ))
        ) : (
          <NoSettingsResults>
            No settings found for &quot;{settingsSearchQuery}&quot;. Try a
            different search term.
          </NoSettingsResults>
        )}
      </SettingsContent>
    </SettingsContainer>
  );
};

export default SettingsView;
