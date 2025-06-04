/**
 * Chat Widget Loader Script
 * Embeds the chat widget iframe on any website
 */
(function() {
  // Widget namespace
  window.ChatWidget = {};
  
  // Default configuration
  const defaultConfig = {
    title: 'Chat Assistant',
    primaryColor: '#4F46E5',
    primaryTextColor: '#FFFFFF',
    welcomeMessage: 'Hello! How can I help you today?',
    position: 'bottom-right',
    height: 600,
    width: 400,
    offset: 20,
    buttonIcon: 'message',
    darkMode: 'auto',
    roundedDesign: true,
    autoOpen: false,
    autoOpenDelay: 5000
  };
  
  // Widget state
  let widgetState = {
    isOpen: false,
    iframe: null,
    button: null,
    config: { ...defaultConfig }
  };
  
  /**
   * Initialize the widget with custom configuration
   */
  ChatWidget.init = function(userConfig = {}) {
    // Merge user config with defaults
    widgetState.config = { ...defaultConfig, ...userConfig };
    
    // Create and append the widget elements
    createWidgetElements();
    
    // Setup event listeners
    setupEventListeners();
    
    // Auto-open if configured
    if (widgetState.config.autoOpen) {
      setTimeout(() => {
        ChatWidget.open();
      }, widgetState.config.autoOpenDelay);
    }
    
    return this;
  };
  
  /**
   * Open the widget
   */
  ChatWidget.open = function() {
    if (!widgetState.isOpen && widgetState.iframe) {
      widgetState.iframe.style.display = 'block';
      widgetState.iframe.classList.add('animate-slide-in');
      widgetState.iframe.classList.remove('animate-slide-out');
      widgetState.isOpen = true;
      
      // Update button icon
      updateButtonIcon(true);
    }
    return this;
  };
  
  /**
   * Close the widget
   */
  ChatWidget.close = function() {
    if (widgetState.isOpen && widgetState.iframe) {
      widgetState.iframe.classList.add('animate-slide-out');
      widgetState.iframe.classList.remove('animate-slide-in');
      setTimeout(() => {
        widgetState.iframe.style.display = 'none';
      }, 300);
      widgetState.isOpen = false;
      
      // Update button icon
      updateButtonIcon(false);
    }
    return this;
  };
  
  /**
   * Toggle the widget open/closed state
   */
  ChatWidget.toggle = function() {
    if (widgetState.isOpen) {
      this.close();
    } else {
      this.open();
    }
    return this;
  };
  
  /**
   * Update widget configuration
   */
  ChatWidget.updateConfig = function(newConfig) {
    widgetState.config = { ...widgetState.config, ...newConfig };
    
    // Remove existing elements
    if (widgetState.button) {
      widgetState.button.remove();
    }
    if (widgetState.iframe) {
      widgetState.iframe.remove();
    }
    
    // Re-create with new configuration
    createWidgetElements();
    setupEventListeners();
    
    return this;
  };
  
  /**
   * Create widget DOM elements
   */
  function createWidgetElements() {
    const { config } = widgetState;
    
    // Create button element
    const button = document.createElement('button');
    button.id = 'chat-widget-button';
    button.setAttribute('aria-label', 'Open chat');
    button.innerHTML = getButtonIcon(false);
    
    // Style the button
    Object.assign(button.style, {
      position: 'fixed',
      zIndex: '9999',
      width: '56px',
      height: '56px',
      borderRadius: config.roundedDesign ? '50%' : '8px',
      backgroundColor: config.primaryColor,
      color: config.primaryTextColor,
      border: 'none',
      outline: 'none',
      cursor: 'pointer',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.3s ease'
    });
    
    // Position the button
    positionElement(button, 0);
    
    // Create iframe for widget content
    const iframe = document.createElement('iframe');
    iframe.id = 'chat-widget-iframe';
    iframe.src = window.location.origin + '/widget';
    iframe.title = 'Chat Widget';
    iframe.setAttribute('aria-hidden', 'true');
    
    // Style the iframe
    Object.assign(iframe.style, {
      position: 'fixed',
      zIndex: '9998',
      width: `${config.width}px`,
      height: `${config.height}px`,
      border: 'none',
      borderRadius: config.roundedDesign ? '16px' : '8px',
      backgroundColor: '#FFFFFF',
      boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)',
      display: 'none',
      transition: 'all 0.3s ease'
    });
    
    // Position the iframe
    positionElement(iframe, 70);
    
    // Add elements to the DOM
    document.body.appendChild(button);
    document.body.appendChild(iframe);
    
    // Store references
    widgetState.button = button;
    widgetState.iframe = iframe;
  }
  
  /**
   * Position an element based on the configuration
   */
  function positionElement(element, offset) {
    const { config } = widgetState;
    const baseOffset = config.offset;
    const totalOffset = baseOffset + offset;
    
    // Reset all positions
    element.style.top = 'auto';
    element.style.right = 'auto';
    element.style.bottom = 'auto';
    element.style.left = 'auto';
    
    // Set position based on config
    switch (config.position) {
      case 'bottom-right':
        element.style.bottom = `${baseOffset}px`;
        element.style.right = `${baseOffset}px`;
        break;
      case 'bottom-left':
        element.style.bottom = `${baseOffset}px`;
        element.style.left = `${baseOffset}px`;
        break;
      case 'top-right':
        element.style.top = `${baseOffset}px`;
        element.style.right = `${baseOffset}px`;
        break;
      case 'top-left':
        element.style.top = `${baseOffset}px`;
        element.style.left = `${baseOffset}px`;
        break;
    }
  }
  
  /**
   * Setup event listeners
   */
  function setupEventListeners() {
    if (widgetState.button) {
      widgetState.button.addEventListener('click', () => {
        ChatWidget.toggle();
      });
      
      // Add hover effect
      widgetState.button.addEventListener('mouseenter', () => {
        widgetState.button.style.transform = 'scale(1.05)';
      });
      
      widgetState.button.addEventListener('mouseleave', () => {
        widgetState.button.style.transform = 'scale(1)';
      });
    }
    
    // Handle iframe messages
    window.addEventListener('message', (event) => {
      // Verify origin for security
      if (event.origin !== window.location.origin) return;
      
      // Handle messages from iframe
      if (event.data === 'close-widget') {
        ChatWidget.close();
      }
    });
  }
  
  /**
   * Update the button icon based on widget state
   */
  function updateButtonIcon(isOpen) {
    if (!widgetState.button) return;
    
    widgetState.button.innerHTML = getButtonIcon(isOpen);
  }
  
  /**
   * Get the HTML for the button icon
   */
  function getButtonIcon(isOpen) {
    if (isOpen) {
      // Close icon (X)
      return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    }
    
    // Different icons based on configuration
    switch (widgetState.config.buttonIcon) {
      case 'chat':
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 12h.01"></path><path d="M12 12h.01"></path><path d="M16 12h.01"></path></svg>`;
      case 'help':
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
      case 'bot':
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path><line x1="8" y1="16" x2="8" y2="16"></line><line x1="16" y1="16" x2="16" y2="16"></line></svg>`;
      case 'message':
      default:
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>`;
    }
  }
  
  // Add some basic CSS
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateY(100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    
    @keyframes slideOut {
      from { transform: translateY(0); opacity: 1; }
      to { transform: translateY(100%); opacity: 0; }
    }
    
    .animate-slide-in {
      animation: slideIn 0.3s ease forwards;
    }
    
    .animate-slide-out {
      animation: slideOut 0.3s ease forwards;
    }
    
    .widget-shadow {
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
    }
  `;
  document.head.appendChild(style);
})();
