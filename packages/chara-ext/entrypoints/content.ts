import { onMessage } from "@/utils/messages";

export default defineContentScript({
  matches: ["<all_urls>"],
  main(ctx) {
    console.log("Content:", ctx);
    onMessage("ololo", () => {
      console.log("Ololo message");
      return "ololo";
    });
  },
});
