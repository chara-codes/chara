import { createRoot } from "react-dom/client"
import ChatOverlayPanel from "../components/templates/chat-overlay-panel"

// Example of direct usage in a React app
const App = () => {
  return (
    <div>
      <h1>My Website</h1>
      <p>This is my website content</p>

      {/* Embed the chat widget directly */}
      <ChatOverlayPanel />
    </div>
  )
}

const root = createRoot(document.getElementById("root")!)
root.render(<App />)

// Example of script tag usage
/*
<script src="https://cdn.example.com/ai-chat-widget.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', function() {
    // Initialize the widget
    ChatOverlayPanel.init({
      apiKey: 'your-api-key',
      apiEndpoint: 'https://api.example.com/chat',
      widgetTitle: 'Customer Support'
    });
    
    // You can also control the widget programmatically
    document.getElementById('show-chat').addEventListener('click', function() {
      ChatOverlayPanel.show();
    });
    
    document.getElementById('hide-chat').addEventListener('click', function() {
      ChatOverlayPanel.hide();
    });
  });
</script>
*/
