import r2wc from "react-to-webcomponent";

import React from "react";
import ReactDOM from "react-dom/client"; // if using React 18

import { CharaWidgetPanel } from ".";

const CharaCodesWidget = r2wc(CharaWidgetPanel, React, ReactDOM, {
  props: {
    defaultOpen: "boolean",
    position: "string",
  },
});

customElements.define("chara-codes", CharaCodesWidget);
