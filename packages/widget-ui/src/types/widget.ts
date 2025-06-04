/**
 * Widget configuration options
 */
export interface WidgetConfig {
  /**
   * The title displayed in the widget header
   */
  title: string;

  /**
   * Primary color for widget styling (hex code)
   */
  primaryColor: string;

  /**
   * Text color for elements with primary background (hex code)
   */
  primaryTextColor: string;

  /**
   * Welcome message shown when widget is opened
   */
  welcomeMessage: string;

  /**
   * Position of the widget on the screen
   */
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

  /**
   * Widget height when expanded (in pixels)
   */
  height: number;

  /**
   * Widget width when expanded (in pixels)
   */
  width: number;

  /**
   * Offset from screen edge (in pixels)
   */
  offset: number;

  /**
   * Icon to display on the toggle button
   */
  buttonIcon: 'message' | 'chat' | 'help' | 'bot';

  /**
   * Theme mode
   */
  darkMode: boolean | 'auto';

  /**
   * Whether to use rounded corners design
   */
  roundedDesign: boolean;

  /**
   * Whether to auto-open the widget after a delay
   */
  autoOpen: boolean;

  /**
   * Delay before auto-opening (in milliseconds)
   */
  autoOpenDelay: number;
}

/**
 * Widget state management
 */
export interface WidgetState {
  /**
   * Whether the widget is open
   */
  isOpen: boolean;

  /**
   * Whether the widget has been initialized
   */
  isInitialized: boolean;

  /**
   * Widget configuration
   */
  config: WidgetConfig;

  /**
   * Actions
   */
  toggleWidget: () => void;
  openWidget: () => void;
  closeWidget: () => void;
  updateConfig: (config: Partial<WidgetConfig>) => void;
  initialize: () => void;
}
