export default defineContentScript({
  matches: ["<all_urls>"],
  main() {
    console.log("Hello content.");

    // Listen for side panel toggle messages
    chrome.runtime.onMessage.addListener(
      (
        message: { action: string },
        _sender: chrome.runtime.MessageSender,
        sendResponse: (response?: any) => void,
      ) => {
        if (message.action === "toggleSidePanel") {
          toggleSidePanel();
          sendResponse({ success: true });
        }
        return true;
      },
    );

    // Function to toggle side panel
    function toggleSidePanel() {
      const existingPanel = document.querySelector(
        "#chara-extension-sidepanel",
      ) as HTMLElement | null;

      if (existingPanel) {
        // Toggle visibility
        const isVisible = existingPanel.style.transform === "translateX(0px)";
        existingPanel.style.transform = isVisible
          ? "translateX(100%)"
          : "translateX(0px)";

        if (isVisible) {
          // Remove after animation
          setTimeout(() => {
            existingPanel.remove();
          }, 300);
        }
        return;
      }

      // Create side panel container
      const panel = document.createElement("div");
      panel.id = "chara-extension-sidepanel";
      panel.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        right: 0 !important;
        width: 320px !important;
        height: 100vh !important;
        background: white !important;
        border-left: 1px solid #e0e0e0 !important;
        box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1) !important;
        z-index: 2147483647 !important;
        transform: translateX(100%) !important;
        transition: transform 0.3s ease-in-out !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif !important;
      `;

      // Create iframe for side panel content
      const iframe = document.createElement("iframe");
      iframe.src = chrome.runtime.getURL("sidepanel/index.html");
      iframe.style.cssText = `
        width: 100% !important;
        height: 100% !important;
        border: none !important;
        display: block !important;
      `;

      panel.appendChild(iframe);
      document.body.appendChild(panel);

      // Animate panel in
      requestAnimationFrame(() => {
        panel.style.transform = "translateX(0px)";
      });

      // Handle messages from iframe
      window.addEventListener("message", (event: MessageEvent) => {
        if (event.data.action === "closeSidePanel") {
          panel.style.transform = "translateX(100%)";
          setTimeout(() => {
            if (panel.parentNode) {
              panel.remove();
            }
          }, 300);
        }
      });

      // Handle escape key to close panel
      const handleEscape = (event: KeyboardEvent) => {
        if (
          event.key === "Escape" &&
          document.querySelector("#chara-extension-sidepanel")
        ) {
          panel.style.transform = "translateX(100%)";
          setTimeout(() => {
            if (panel.parentNode) {
              panel.remove();
            }
          }, 300);
          document.removeEventListener("keydown", handleEscape);
        }
      };

      document.addEventListener("keydown", handleEscape);
    }
  },
});
