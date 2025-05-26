import { createGlobalStyle } from "styled-components"

const GlobalStyles = createGlobalStyle`
  /* Reset styles outside the widget to prevent leaking */
  :host, #ai-chat-widget {
    all: initial;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }
  
  /* Scope all styles to the widget container */
  :host *, #ai-chat-widget * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: inherit;
  }
  
  /* Ensure widget has its own stacking context */
  :host, #ai-chat-widget {
    isolation: isolate;
    position: relative;
    line-height: normal;
    font-size: 16px;
    color: #333333;
    background-color: transparent;
  }
  
  /* Reset common elements that might be affected by host page */
  :host h1, :host h2, :host h3, :host h4, :host h5, :host h6, :host p, :host ul, :host ol, :host li, :host button, :host input, :host textarea,
  #ai-chat-widget h1, #ai-chat-widget h2, #ai-chat-widget h3, #ai-chat-widget h4, #ai-chat-widget h5, #ai-chat-widget h6, #ai-chat-widget p, #ai-chat-widget ul, #ai-chat-widget ol, #ai-chat-widget li, #ai-chat-widget button, #ai-chat-widget input, #ai-chat-widget textarea {
    all: revert;
    font-family: inherit;
    box-sizing: border-box;
  }
  
  /* Ensure buttons have consistent styling */
  :host button, #ai-chat-widget button {
    background: none;
    border: none;
    cursor: pointer;
    font-family: inherit;
    padding: 0;
    color: inherit;
  }
  
  /* Ensure inputs have consistent styling */
  :host input, :host textarea, #ai-chat-widget input, #ai-chat-widget textarea {
    font-family: inherit;
    outline: none;
  }
`

export default GlobalStyles
