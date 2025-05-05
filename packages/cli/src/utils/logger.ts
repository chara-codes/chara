import {
  blue,
  bold,
  cyan,
  gray,
  green,
  magenta,
  red,
  yellow,
} from "picocolors";

/**
 * Log levels supported by the logger
 */
export enum LogLevel {
  TRACE = "TRACE",
  DEBUG = "DEBUG",
  INFO = "INFO",
  SUCCESS = "SUCCESS",
  WARNING = "WARNING",
  ERROR = "ERROR",
  EVENT = "EVENT",
  SERVER = "SERVER",
}

/**
 * Severity levels for each log level
 * Higher value means higher severity
 */
export enum LogLevelSeverity {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  SUCCESS = 3,
  WARNING = 4,
  ERROR = 5,
}

/**
 * Metadata type with flexible properties but enforces object type
 */
export interface LogMetadata {
  [key: string]: unknown;
}

// Map LogLevel to severity
const LOG_LEVEL_SEVERITY: Record<LogLevel, LogLevelSeverity> = {
  [LogLevel.TRACE]: LogLevelSeverity.TRACE,
  [LogLevel.DEBUG]: LogLevelSeverity.DEBUG,
  [LogLevel.INFO]: LogLevelSeverity.INFO,
  [LogLevel.SUCCESS]: LogLevelSeverity.SUCCESS,
  [LogLevel.WARNING]: LogLevelSeverity.WARNING,
  [LogLevel.ERROR]: LogLevelSeverity.ERROR,
  [LogLevel.EVENT]: LogLevelSeverity.INFO, // Events are INFO level
  [LogLevel.SERVER]: LogLevelSeverity.INFO, // Server logs are INFO level
};

/**
 * Transport function type for logging
 */
export interface TransportType {
  (level: LogLevel, message: string, metadata?: LogMetadata): void;
}

/**
 * Configuration for logger instances
 */
export interface LoggerConfig {
  /** Name of the logger instance */
  name: string;
  /** Enabled log levels */
  levels?: LogLevel[];
  /** Transport functions for each level */
  transports?: Record<LogLevel, TransportType[]>;
}

/**
 * Format a message with template variables
 * @example formatMessage("Hello {name}!", { name: "World" }) // "Hello World!"
 */
function formatMessage(message: string, data?: Record<string, unknown>): string {
  if (!data) return message;
  
  return message.replace(/\{(\w+)\}/g, (match, key) => {
    return data[key] !== undefined ? String(data[key]) : match;
  });
}

/**
 * Default console transport with enhanced color formatting
 */
export const coloredConsoleTransport: TransportType = (
  level,
  message,
  metadata,
) => {
  let formattedMessage = "";
  const timestamp = new Date().toLocaleTimeString();
  const padding = "  ";

  // Format icon and color based on log level
  switch (level) {
    case LogLevel.INFO:
      formattedMessage = `${blue("ℹ")} ${gray(timestamp)}${padding}${cyan(message)}`;
      break;
    case LogLevel.SUCCESS:
      formattedMessage = `${green("✓")} ${gray(timestamp)}${padding}${green(message)}`;
      break;
    case LogLevel.WARNING:
      formattedMessage = `${yellow("⚠")} ${gray(timestamp)}${padding}${yellow(message)}`;
      break;
    case LogLevel.ERROR:
      formattedMessage = `${red("✗")} ${gray(timestamp)}${padding}${red(message)}`;
      break;
    case LogLevel.DEBUG:
      formattedMessage = `${gray("•")} ${gray(timestamp)}${padding}${gray(message)}`;
      break;
    case LogLevel.TRACE:
      formattedMessage = `${gray("⋯")} ${gray(timestamp)}${padding}${gray(message)}`;
      break;
    case LogLevel.EVENT:
      formattedMessage = `${magenta("◆")} ${gray(timestamp)}${padding}${magenta(message)}`;
      break;
    case LogLevel.SERVER:
      formattedMessage = `${green("▶")} ${gray(timestamp)}${padding}${bold(green(message))}`;
      break;
    default:
      formattedMessage = `${gray(timestamp)}${padding}${message}`;
  }

  console.log(formattedMessage);
  
  // Enhanced metadata display
  if (metadata && Object.keys(metadata).length > 0) {
    // Add indentation to make metadata visually grouped with the message
    const metadataStr = JSON.stringify(metadata, null, 2)
      .split('\n')
      .map(line => `${padding}${line}`)
      .join('\n');
      
    console.log(gray(metadataStr));
  }
};

/**
 * Advanced logging utility with support for colored output, 
 * log levels, and multiple transports
 */
export class Logger {
  private config: LoggerConfig;
  private currentLogLevelSeverity: LogLevelSeverity = LogLevelSeverity.INFO;
  private contextMetadata: LogMetadata = {};

  /**
   * Create a new logger instance
   */
  constructor(config: LoggerConfig) {
    this.config = {
      ...config,
      levels: config.levels || Object.values(LogLevel),
      transports: config.transports || this.getDefaultTransports(),
    };
  }

  /**
   * Get default transport configuration
   */
  private getDefaultTransports(): Record<LogLevel, TransportType[]> {
    const transports: Record<LogLevel, TransportType[]> = {} as Record<
      LogLevel,
      TransportType[]
    >;

    Object.values(LogLevel).forEach((level) => {
      transports[level] = [coloredConsoleTransport];
    });

    return transports;
  }

  /**
   * Add persistent context metadata to all subsequent log messages
   */
  public withContext(metadata: LogMetadata): Logger {
    this.contextMetadata = { ...this.contextMetadata, ...metadata };
    return this;
  }

  /**
   * Clear all context metadata
   */
  public clearContext(): Logger {
    this.contextMetadata = {};
    return this;
  }

  /**
   * Create a new logger instance with the same config but isolated context
   */
  public createChildLogger(name: string): Logger {
    const childLogger = new Logger({
      ...this.config,
      name: `${this.config.name}:${name}`,
    });
    
    childLogger.setLevel(this.getLevel());
    return childLogger;
  }

  /**
   * Log a debug message
   * @param message Message text, can contain {placeholders}
   * @param templateData Data for template placeholders
   * @param metadata Additional structured metadata
   */
  public debug(
    message: string, 
    templateData?: Record<string, unknown>,
    metadata?: LogMetadata
  ): void {
    this.log(
      LogLevel.DEBUG, 
      formatMessage(message, templateData), 
      this.mergeMetadata(metadata)
    );
  }

  /**
   * Log an informational message
   * @param message Message text, can contain {placeholders}
   * @param templateData Data for template placeholders
   * @param metadata Additional structured metadata
   */
  public info(
    message: string, 
    templateData?: Record<string, unknown>,
    metadata?: LogMetadata
  ): void {
    this.log(
      LogLevel.INFO, 
      formatMessage(message, templateData), 
      this.mergeMetadata(metadata)
    );
  }

  /**
   * Log a success message
   * @param message Message text, can contain {placeholders}
   * @param templateData Data for template placeholders
   * @param metadata Additional structured metadata
   */
  public success(
    message: string, 
    templateData?: Record<string, unknown>,
    metadata?: LogMetadata
  ): void {
    this.log(
      LogLevel.SUCCESS, 
      formatMessage(message, templateData), 
      this.mergeMetadata(metadata)
    );
  }

  /**
   * Log a warning message
   * @param message Message text, can contain {placeholders}
   * @param templateData Data for template placeholders
   * @param metadata Additional structured metadata
   */
  public warning(
    message: string, 
    templateData?: Record<string, unknown>,
    metadata?: LogMetadata
  ): void {
    this.log(
      LogLevel.WARNING, 
      formatMessage(message, templateData), 
      this.mergeMetadata(metadata)
    );
  }

  /**
   * Log an error message
   * @param message Message text, can contain {placeholders}
   * @param templateData Data for template placeholders
   * @param metadata Additional structured metadata
   */
  public error(
    message: string, 
    templateData?: Record<string, unknown>,
    metadata?: LogMetadata
  ): void {
    this.log(
      LogLevel.ERROR, 
      formatMessage(message, templateData), 
      this.mergeMetadata(metadata)
    );
  }

  /**
   * Log an event message
   * @param message Message text, can contain {placeholders}
   * @param templateData Data for template placeholders
   * @param metadata Additional structured metadata
   */
  public event(
    message: string, 
    templateData?: Record<string, unknown>,
    metadata?: LogMetadata
  ): void {
    this.log(
      LogLevel.EVENT, 
      formatMessage(message, templateData), 
      this.mergeMetadata(metadata)
    );
  }

  /**
   * Log a server message
   * @param message Message text, can contain {placeholders}
   * @param templateData Data for template placeholders
   * @param metadata Additional structured metadata
   */
  public server(
    message: string, 
    templateData?: Record<string, unknown>,
    metadata?: LogMetadata
  ): void {
    this.log(
      LogLevel.SERVER, 
      formatMessage(message, templateData), 
      this.mergeMetadata(metadata)
    );
  }

  /**
   * Log a trace message
   * @param message Message text, can contain {placeholders}
   * @param templateData Data for template placeholders
   * @param metadata Additional structured metadata
   */
  public trace(
    message: string, 
    templateData?: Record<string, unknown>,
    metadata?: LogMetadata
  ): void {
    this.log(
      LogLevel.TRACE, 
      formatMessage(message, templateData), 
      this.mergeMetadata(metadata)
    );
  }

  /**
   * Set the minimum log level
   */
  public setLevel(level: keyof typeof LogLevel | string): void {
    const logLevel = level.toUpperCase() as keyof typeof LogLevel;

    if (logLevel in LogLevel) {
      this.currentLogLevelSeverity =
        LOG_LEVEL_SEVERITY[LogLevel[logLevel]] || LogLevelSeverity.INFO;
    } else {
      console.warn(`Unknown log level: ${level}. Setting to INFO.`);
      this.currentLogLevelSeverity = LogLevelSeverity.INFO;
    }
  }

  /**
   * Get the current log level name
   */
  public getLevel(): string {
    // Find the level name that matches the current severity
    for (const [level, severity] of Object.entries(LOG_LEVEL_SEVERITY)) {
      if (severity === this.currentLogLevelSeverity) {
        // Return the first match (lowest level for the current severity)
        return level;
      }
    }
    // Fallback to INFO if no match found
    return LogLevel.INFO;
  }

  /**
   * Merge provided metadata with context metadata
   */
  private mergeMetadata(metadata?: LogMetadata): LogMetadata | undefined {
    if (!metadata && Object.keys(this.contextMetadata).length === 0) {
      return undefined;
    }
    
    return {
      ...this.contextMetadata,
      ...(metadata || {}),
    };
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, metadata?: LogMetadata): void {
    // Check if this level is enabled in configuration
    if (!this.config.levels?.includes(level)) {
      return;
    }

    // Check if this level meets the current severity threshold
    const levelSeverity = LOG_LEVEL_SEVERITY[level] || LogLevelSeverity.INFO;
    if (levelSeverity < this.currentLogLevelSeverity) {
      return;
    }

    const transports = this.config.transports?.[level];

    if (transports && transports.length > 0) {
      transports.forEach((transport) => {
        transport(level, message, metadata);
      });
    } else {
      // Fallback to console if no transports are configured
      console.log(message, metadata ? metadata : '');
    }
  }
}

/**
 * Create default logger instance with all levels enabled
 */
export const logger = new Logger({
  name: "CLI",
  levels: Object.values(LogLevel),
});
