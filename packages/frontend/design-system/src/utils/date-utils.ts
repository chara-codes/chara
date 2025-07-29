import { format, isValid } from "date-fns";

export function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  // Less than 1 minute
  if (diffInMinutes < 1) {
    return "just now";
  }

  // Less than 1 hour
  if (diffInMinutes < 60) {
    return diffInMinutes === 1
      ? "1 minute ago"
      : `${diffInMinutes} minutes ago`;
  }

  // Less than 24 hours
  if (diffInHours < 24) {
    return diffInHours === 1 ? "1 hour ago" : `${diffInHours} hours ago`;
  }

  // Less than 7 days
  if (diffInDays < 7) {
    return diffInDays === 1 ? "1 day ago" : `${diffInDays} days ago`;
  }

  // More than 7 days - show formatted date
  const currentYear = now.getFullYear();
  const dateYear = date.getFullYear();

  // Same year - show month and day
  if (currentYear === dateYear) {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  // Different year - show month, day, and year
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Helper function to format chat time with error handling
export function formatChatTime(timestamp: string | number | Date): string {
  try {
    // Handle different timestamp formats
    const date =
      timestamp instanceof Date ? timestamp : new Date(timestamp || Date.now());

    // Check if the date is valid before formatting
    if (!isValid(date)) {
      return "Unknown time";
    }

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // Normalize dates for comparison (remove time)
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    const todayOnly = new Date(today);
    todayOnly.setHours(0, 0, 0, 0);
    const yesterdayOnly = new Date(yesterday);
    yesterdayOnly.setHours(0, 0, 0, 0);

    if (dateOnly.getTime() === todayOnly.getTime()) {
      // Today: show time only
      return format(date, "h:mm a");
    } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
      // Yesterday: show time only
      return format(date, "h:mm a");
    } else {
      // Older: show full date
      const currentYear = today.getFullYear();
      const dateYear = date.getFullYear();

      if (currentYear === dateYear) {
        // Same year: show month, day, and time
        return format(date, "MMM d, h:mm a");
      } else {
        // Different year: show month, day, year, and time
        return format(date, "MMM d, yyyy, h:mm a");
      }
    }
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Unknown time";
  }
}
