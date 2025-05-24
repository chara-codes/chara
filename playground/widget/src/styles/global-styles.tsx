import { createGlobalStyle } from "styled-components"

const GlobalStyles = createGlobalStyle`
  /* Reset styles for the widget container */
  :host, #ai-chat-widget {
    all: initial;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    display: block;
    position: relative;
    line-height: normal;
    font-size: 16px;
    color: #333333;
    background-color: transparent;
    isolation: isolate;
    z-index: 9999;
  }
  
  /* Apply styles to all elements inside the widget */
  :host *, :host *::before, :host *::after,
  #ai-chat-widget *, #ai-chat-widget *::before, #ai-chat-widget *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: inherit;
  }
  
  /* Reset common elements inside the widget */
  :host h1, :host h2, :host h3, :host h4, :host h5, :host h6, 
  :host p, :host ul, :host ol, :host li, 
  :host button, :host input, :host textarea,
  #ai-chat-widget h1, #ai-chat-widget h2, #ai-chat-widget h3, 
  #ai-chat-widget h4, #ai-chat-widget h5, #ai-chat-widget h6, 
  #ai-chat-widget p, #ai-chat-widget ul, #ai-chat-widget ol, 
  #ai-chat-widget li, #ai-chat-widget button, 
  #ai-chat-widget input, #ai-chat-widget textarea {
    all: revert;
    font-family: inherit;
    box-sizing: border-box;
  }
  
  /* Consistent button styling */
  :host button, #ai-chat-widget button {
    background: none;
    border: none;
    cursor: pointer;
    font-family: inherit;
    padding: 0;
    color: inherit;
    outline: none;
  }
  
  /* Consistent input styling */
  :host input, :host textarea, 
  #ai-chat-widget input, #ai-chat-widget textarea {
    font-family: inherit;
    outline: none;
    border: 1px solid #ddd;
    padding: 8px;
    border-radius: 4px;
  }
  
  /* Ensure links have consistent styling */
  :host a, #ai-chat-widget a {
    color: inherit;
    text-decoration: none;
  }
  
  /* Ensure proper stacking context for overlays */
  .chat-overlay, .chat-panel {
    z-index: 10000;
  }
`

export default GlobalStyles
