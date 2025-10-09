import { onMessage } from "@/utils/messages";
import { ElementSelectorWidget } from "@chara-codes/design-system";
import { getAppliedCss } from "@chara-codes/element-selector";
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
              console.log(object);
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

    onMessage("select", async (payload) => {
      const { selector } = payload?.data;
      const elements = document.querySelectorAll(selector);

      const res = [...elements].map((el) => {
        return {
          html: el.outerHTML,
          styles: getAppliedCss(el),
          content: el.innerText,
          url: window.location.href,
        };
      });

      return await {
        selector: selector,
        result: res,
        test: "test1",
      };
    });
  },
});
