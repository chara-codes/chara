export default defineBackground(() => {
  console.log("Hello background!", { id: browser.runtime.id });
  // Set up side panel (if API is available)

  setInterval(async () => {
    console.log("Send ololo");
    const queryOptions = { active: true, lastFocusedWindow: true };
    const [tab] = await chrome.tabs.query(queryOptions);
    const ololo = await sendMessage("ololo", null, tab.id);
    console.log("Received: ", ololo);
  }, 3000);

  if (browser.sidePanel) {
    browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  }
});
