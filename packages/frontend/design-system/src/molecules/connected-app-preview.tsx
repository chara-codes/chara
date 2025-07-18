"use client";

import type React from "react";
import { AppPreview } from "./app-preview";
import { useActiveRunnerProcess } from "../../../core/src/stores/runner-store";

interface ConnectedAppPreviewProps {
  // Props to pass through to AppPreview
  placeholder?: string;
  showControls?: boolean;
  onLoad?: () => void;
  onError?: (error: string) => void;
}

export const ConnectedAppPreview: React.FC<ConnectedAppPreviewProps> = ({
  placeholder,
  showControls = true,
  onLoad,
  onError,
}) => {
  const activeProcess = useActiveRunnerProcess();

  // Extract URL from the active process
  const url = activeProcess?.serverInfo?.serverUrl;
  const isLoading = activeProcess?.status === "starting";
  const hasError = activeProcess?.status === "error";

  // Create a more descriptive placeholder based on the runner state
  const getPlaceholder = () => {
    if (hasError) {
      return "Application failed to start. Check the terminal for details.";
    }

    if (!activeProcess) {
      return "No application is currently running. Start an application to see the preview.";
    }

    if (isLoading) {
      return "Starting application...";
    }

    if (!url) {
      return "Application is running but no URL is available yet.";
    }

    return placeholder || "App preview will be displayed here";
  };

  return (
    <AppPreview
      url={url}
      placeholder={getPlaceholder()}
      isLoading={isLoading}
      showControls={showControls}
      onLoad={onLoad}
      onError={onError}
    />
  );
};
