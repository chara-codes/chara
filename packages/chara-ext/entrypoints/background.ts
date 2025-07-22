export default defineBackground(() => {
  console.log("Hello background!", { id: browser.runtime.id });

  // Handle extension icon click to open side panel
  chrome.action.onClicked.addListener(async (tab: chrome.tabs.Tab) => {
    if (!tab.id) return;

    try {
      // Check if side panel API is available (Chrome 114+)
      if (chrome.sidePanel) {
        // Open the side panel
        await chrome.sidePanel.open({ tabId: tab.id });
      } else {
        // Fallback: inject content script to show side panel
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            // Check if side panel already exists
            const existingPanel = document.querySelector(
              "#chara-extension-sidepanel",
            ) as HTMLElement | null;

            if (existingPanel) {
              // Toggle visibility
              const isHidden = existingPanel.style.display === "none";
              existingPanel.style.display = isHidden ? "block" : "none";
              return;
            }

            // Create and inject side panel
            const panel = document.createElement("div");
            panel.id = "chara-extension-sidepanel";
            panel.style.cssText = `
              position: fixed;
              top: 0;
              right: 0;
              width: 320px;
              height: 100vh;
              background: white;
              border-left: 1px solid #e0e0e0;
              box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
              z-index: 10000;
              transform: translateX(100%);
              transition: transform 0.3s ease-in-out;
            `;

            // Create iframe to load side panel content
            const iframe = document.createElement("iframe");
            iframe.src = chrome.runtime.getURL("sidepanel/index.html");
            iframe.style.cssText = `
              width: 100%;
              height: 100%;
              border: none;
            `;

            panel.appendChild(iframe);
            document.body.appendChild(panel);

            // Animate panel in
            setTimeout(() => {
              panel.style.transform = "translateX(0)";
            }, 10);

            // Handle close button (will be handled by iframe content)
            window.addEventListener("message", (event: MessageEvent) => {
              if (event.data.action === "closeSidePanel") {
                panel.style.transform = "translateX(100%)";
                setTimeout(() => {
                  panel.remove();
                }, 300);
              }
            });
          },
        });
      }
    } catch (error) {
      console.error("Error opening side panel:", error);
    }
  });

  // Handle messages from content scripts and side panel
  chrome.runtime.onMessage.addListener(
    (
      message: any,
      _sender: chrome.runtime.MessageSender,
      _sendResponse: (response?: any) => void,
    ) => {
      if (message.action === "toggleSidePanel") {
        // Forward message to active tab
        chrome.tabs.query(
          { active: true, currentWindow: true },
          (tabs: chrome.tabs.Tab[]) => {
            if (tabs[0]?.id) {
              chrome.tabs.sendMessage(tabs[0].id, message);
            }
          },
        );
      }

      return true;
    },
  );

  // Set up side panel (if API is available)
  if (chrome.sidePanel) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  }
});
