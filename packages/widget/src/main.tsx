import r2wc from "@r2wc/react-to-web-component";
import App from "./App";

const CharaCodes = r2wc(App);

customElements.define("chara-codes", CharaCodes);
