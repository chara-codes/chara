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
import {
  LogLevel,
  LogLevelSeverity,
  type TransportType,
  type LoggerConfig,
} from "../types/logger.types";

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

// Default console transport with color formatting
export const coloredConsoleTransport: TransportType = (
  level,
  message,
  metadata,
) => {
  let formattedMessage = "";
  const timestamp = new Date().toLocaleTimeString();

  switch (level) {
    case LogLevel.INFO:
      formattedMessage = `${blue("ℹ")} ${gray(timestamp)} ${cyan(message)}`;
      break;
    case LogLevel.SUCCESS:
      formattedMessage = `${green("✓")} ${gray(timestamp)} ${green(message)}`;
      break;
    case LogLevel.WARNING:
      formattedMessage = `${yellow("⚠")} ${gray(timestamp)} ${yellow(message)}`;
      break;
    case LogLevel.ERROR:
      formattedMessage = `${red("✗")} ${gray(timestamp)} ${red(message)}`;
      break;
    case LogLevel.DEBUG:
      formattedMessage = `${gray("•")} ${gray(timestamp)} ${gray(message)}`;
      break;
    case LogLevel.TRACE:
      formattedMessage = `${gray("⋯")} ${gray(timestamp)} ${gray(message)}`;
      break;
    case LogLevel.EVENT:
      formattedMessage = `${magenta("◆")} ${gray(timestamp)} ${magenta(message)}`;
      break;
    case LogLevel.SERVER:
      formattedMessage = `${green("▶")} ${gray(timestamp)} ${bold(green(message))}`;
      break;
    default:
      formattedMessage = `${gray(timestamp)} ${message}`;
  }

  console.log(formattedMessage);
  if (metadata && Object.keys(metadata).length > 0) {
    console.log(gray(JSON.stringify(metadata, null, 2)));
  }
};

export class Logger {
  private config: LoggerConfig;
  private currentLogLevelSeverity: LogLevelSeverity = LogLevelSeverity.INFO;

  constructor(config: LoggerConfig) {
    this.config = {
      ...config,
      levels: config.levels || Object.values(LogLevel),
      transports: config.transports || this.getDefaultTransports(),
    };
  }

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

  public debug(message: string, metadata?: any): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  public info(message: string, metadata?: any): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  public success(message: string, metadata?: any): void {
    this.log(LogLevel.SUCCESS, message, metadata);
  }

  public warning(message: string, metadata?: any): void {
    this.log(LogLevel.WARNING, message, metadata);
  }

  public error(message: string, metadata?: any): void {
    this.log(LogLevel.ERROR, message, metadata);
  }

  public event(message: string, metadata?: any): void {
    this.log(LogLevel.EVENT, message, metadata);
  }

  public server(message: string, metadata?: any): void {
    this.log(LogLevel.SERVER, message, metadata);
  }

  public trace(message: string, metadata?: any): void {
    this.log(LogLevel.TRACE, message, metadata);
  }

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

  public getLevel(): string {
    for (const [levelName, severity] of Object.entries(LOG_LEVEL_SEVERITY)) {
      if (severity === this.currentLogLevelSeverity) {
        return levelName;
      }
    }
    return LogLevel.INFO;
  }

  private log(level: LogLevel, message: string, metadata?: any): void {
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
      console.log(message, metadata);
    }
  }
}

// Create default logger instance with all levels enabled
export const logger = new Logger({
  name: "CLI",
  levels: Object.values(LogLevel),
});
