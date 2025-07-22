import React from "react";
import ReactDOM from "react-dom/client";
import "./style.css";
import { CharaWidgetPanel } from "./CharaWidgetPanel";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <CharaWidgetPanel />
  </React.StrictMode>
);
