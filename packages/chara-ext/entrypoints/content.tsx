import { onMessage } from "@/utils/messages";
import { ElementSelectorWidget } from "@chara-codes/design-system";
import ReactDOM from "react-dom/client";

export default defineContentScript({
  matches: ["<all_urls>"],
  main(ctx) {
    onMessage("selectElement", () => {
      // biome-ignore lint/suspicious/noAsyncPromiseExecutor: <explanation>
      return new Promise<unknown>(async (resolve) => {
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

            const handleAddingContext = (object: unknown) => {
              root.render(<></>);
              resolve(object);
            };
            root.render(
              <ElementSelectorWidget onAddContext={handleAddingContext} />
            );
            return { root, wrapper };
          },
          onRemove: (elements) => {
            elements?.root.unmount();
            elements?.wrapper.remove();
          },
        });
        ui.mount();
      });
    });
  },
});
