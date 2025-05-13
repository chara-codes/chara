import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import tailwindStyles from "./index.css?inline";

class CharaCodesApp extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });

    const mountPoint = document.createElement("div");
    shadow.appendChild(mountPoint);

    // Inject CSS string directly
    const style = document.createElement("style");
    style.textContent = tailwindStyles;
    shadow.appendChild(style);

    ReactDOM.createRoot(mountPoint).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  }
}

customElements.define("chara-codes", CharaCodesApp);
