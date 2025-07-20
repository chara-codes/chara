import { useState, useEffect } from "react";

interface TabInfo {
  id: number;
  url: string;
  title: string;
}

function DevToolsPanel() {
  const [tabInfo, setTabInfo] = useState<TabInfo | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Get current tab information
    if (browser.devtools?.inspectedWindow) {
      setTabInfo({
        id: browser.devtools.inspectedWindow.tabId,
        url: window.location.href,
        title: document.title,
      });
      setIsConnected(true);
    }

    // Listen for navigation changes in the inspected window
    const handleNavigated = (url: string) => {
      setTabInfo((prev) => (prev ? { ...prev, url } : null));
    };

    if (browser.devtools?.network?.onNavigated) {
      browser.devtools.network.onNavigated.addListener(handleNavigated);
    }

    return () => {
      if (browser.devtools?.network?.onNavigated) {
        browser.devtools.network.onNavigated.removeListener(handleNavigated);
      }
    };
  }, []);

  const executeScript = () => {
    if (browser.devtools?.inspectedWindow) {
      browser.devtools.inspectedWindow.eval(
        'console.log("Hello from Chara DevTools!")',
        (_result, error) => {
          if (error) {
            console.error("Script execution error:", error);
          } else {
            console.log("Script executed successfully");
          }
        }
      );
    }
  };

  const inspectElement = () => {
    if (browser.devtools?.inspectedWindow) {
      browser.devtools.inspectedWindow.eval(
        "inspect(document.body)",
        (_result, error) => {
          if (error) {
            console.error("Inspect error:", error);
          }
        }
      );
    }
  };

  return (
    <div className="devtools-panel">
      <header className="panel-header">
        <h1>🎭 Chara DevTools</h1>
        <div className="connection-status">
          <span
            className={`status-indicator ${
              isConnected ? "connected" : "disconnected"
            }`}
          ></span>
          {isConnected ? "Connected" : "Disconnected"}
        </div>
      </header>

      <main className="panel-content">
        <section className="tab-info">
          <h2>Current Tab</h2>
          {tabInfo ? (
            <div className="info-grid">
              <div className="info-item">
                <span>Tab ID:</span>
                <span>{tabInfo.id}</span>
              </div>
              <div className="info-item">
                <span>URL:</span>
                <span className="url-text">{tabInfo.url}</span>
              </div>
              <div className="info-item">
                <span>Title:</span>
                <span>{tabInfo.title}</span>
              </div>
            </div>
          ) : (
            <p>No tab information available</p>
          )}
        </section>

        <section className="actions">
          <h2>Actions</h2>
          <div className="button-group">
            <button
              type="button"
              onClick={executeScript}
              className="action-button primary"
            >
              Execute Test Script
            </button>
            <button
              type="button"
              onClick={inspectElement}
              className="action-button secondary"
            >
              Inspect Body Element
            </button>
          </div>
        </section>

        <section className="features">
          <h2>Features</h2>
          <div className="feature-list">
            <div className="feature-item">
              <h3>🔍 Page Analysis</h3>
              <p>Analyze the current page structure and content</p>
            </div>
            <div className="feature-item">
              <h3>🎨 Character Detection</h3>
              <p>Detect and highlight character-related elements</p>
            </div>
            <div className="feature-item">
              <h3>⚡ Performance Monitoring</h3>
              <p>Monitor page performance and optimization opportunities</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default DevToolsPanel;
