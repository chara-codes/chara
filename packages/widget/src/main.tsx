import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

class CharaCodesApp extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });

    const mountPoint = document.createElement("div");
    shadow.appendChild(mountPoint);

    // Tailwind styles injected from build
    const style = document.createElement("link");
    style.setAttribute("rel", "stylesheet");
    style.setAttribute("href", "https://widget.chara-ai.dev/assets/main.css");
    shadow.appendChild(style);

    ReactDOM.createRoot(mountPoint).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  }
}

customElements.define("chara-codes", CharaCodesApp);
