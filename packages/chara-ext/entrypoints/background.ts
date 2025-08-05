export default defineBackground(() => {
  console.log("Hello background!", { id: browser.runtime.id });
  // Set up side panel (if API is available)
  if (browser.sidePanel) {
    browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  }
});
