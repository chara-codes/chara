import r2wc from "react-to-webcomponent";

import React from "react";
import ReactDOM from "react-dom/client"; // if using React 18

import { CharaWeb } from ".";

const CharaCodesWeb = r2wc(CharaWeb, React, ReactDOM, {
  props: {
    defaultOpen: "boolean",
    position: "string",
    enabledInputButtons: "string",
  },
});

customElements.define("chara-codes", CharaCodesWeb);
