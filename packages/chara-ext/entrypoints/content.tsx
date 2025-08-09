import { onMessage } from "@/utils/messages";
import { ElementSelectorWidget } from "@chara-codes/design-system";
import ReactDOM from "react-dom/client";

export default defineContentScript({
  matches: ["<all_urls>"],
  main(ctx) {
    onMessage("selectElement", async () => {
      const ui = await createShadowRootUi(ctx, {
        name: "chara-select-element",
        position: "inline",
        anchor: "body",
        append: "first",
        onMount: (container) => {
          // Don't mount react app directly on <body>
          const wrapper = document.createElement("div");
          container.append(wrapper);
          const root = ReactDOM.createRoot(wrapper);

          return new Promise<unknown>((resolve) => {
            const handleAddingContext = (object: unknown) => {
              root.render(null);
              resolve(object);
            };
            root.render(
              <ElementSelectorWidget onAddContext={handleAddingContext} />
            );
          });
        },
        onRemove: (elements: any) => {
          elements?.root?.unmount();
          elements?.wrapper?.remove();
        },
      });
      ui.mount();
    });
  },
});
