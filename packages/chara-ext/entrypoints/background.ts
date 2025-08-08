export default defineBackground(() => {
  // Set up side panel (if API is available)
  if (browser.sidePanel) {
    browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  }
});
