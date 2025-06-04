import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine multiple class names with Tailwind CSS support
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convert hex color to RGB values
 */
export function hexToRgb(hex: string) {
  // Remove the hash if it exists
  hex = hex.replace('#', '');
  
  // Parse the hexadecimal values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return { r, g, b };
}

/**
 * Generate a contrast color (black or white) based on background color
 */
export function getContrastColor(hexColor: string) {
  const rgb = hexToRgb(hexColor);
  
  // Calculate the perceived brightness
  // Formula: (R * 0.299 + G * 0.587 + B * 0.114)
  const brightness = (rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114);
  
  // Return black for light backgrounds, white for dark backgrounds
  return brightness > 150 ? '#000000' : '#FFFFFF';
}

/**
 * Generate script to embed the widget
 */
export function generateEmbedScript(config: Record<string, any>) {
  const configString = JSON.stringify(config);
  
  return `<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${window.location.origin}/widget.js';
    script.async = true;
    script.onload = function() {
      window.ChatWidget.init(${configString});
    };
    document.head.appendChild(script);
  })();
</script>`;
}
