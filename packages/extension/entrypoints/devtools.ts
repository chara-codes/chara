export default defineUnlistedScript(() => {
  // Create and register the devtools panel
  browser.devtools.panels.create(
    'Chara', // Panel title
    '/icon/32.png', // Panel icon (uses existing icon)
    '/devtools-panel.html', // Panel HTML file
    (panel) => {
      console.log('Chara devtools panel created', panel);
    }
  );
});
