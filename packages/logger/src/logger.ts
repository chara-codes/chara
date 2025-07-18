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
import { Dumper, type DumpOptions } from "./dumper";
import {
  type LoggerConfig,
  LogLevel,
  LogLevelSeverity,
  type TransportType,
} from "./types";

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
  metadata
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
      formattedMessage = `${magenta("◆")} ${gray(timestamp)} ${magenta(
        message
      )}`;
      break;
    case LogLevel.SERVER:
      formattedMessage = `${green("▶")} ${gray(timestamp)} ${bold(
        green(message)
      )}`;
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

    for (const level of Object.values(LogLevel)) {
      transports[level] = [coloredConsoleTransport];
    }

    return transports;
  }

  public dump(data: unknown, label?: string, options?: DumpOptions): void {
    const dumper = new Dumper(options);
    const formattedOutput = dumper.dump(data, label);
    this.log(LogLevel.INFO, formattedOutput);
  }

  public dumpError(data: unknown, label?: string): void {
    const dumper = new Dumper({ colors: true, maxDepth: 3 });
    const formattedOutput = dumper.dump(data, label);
    this.log(LogLevel.ERROR, formattedOutput);
  }

  public dumpDebug(data: unknown, label?: string): void {
    const dumper = new Dumper({
      colors: true,
      compact: true,
      showTypes: false,
    });
    const formattedOutput = dumper.dump(data, label);
    this.log(LogLevel.DEBUG, formattedOutput);
  }

  public dumpCompact(data: unknown, label?: string): void {
    const dumper = new Dumper({
      colors: true,
      compact: true,
      maxDepth: 2,
      showTypes: false,
      maxArrayLength: 10,
      maxStringLength: 50,
    });
    const formattedOutput = dumper.dump(data, label);
    this.log(LogLevel.INFO, formattedOutput);
  }

  public debug(message: string, metadata?: unknown): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  public info(message: string, metadata?: unknown): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  public success(message: string, metadata?: unknown): void {
    this.log(LogLevel.SUCCESS, message, metadata);
  }

  public warning(message: string, metadata?: unknown): void {
    this.log(LogLevel.WARNING, message, metadata);
  }

  public warn(message: string, metadata?: unknown): void {
    this.log(LogLevel.WARNING, message, metadata);
  }

  public error(message: string, metadata?: unknown): void {
    this.log(LogLevel.ERROR, message, metadata);
  }

  public err(message: string, metadata?: unknown): void {
    this.log(LogLevel.ERROR, message, metadata);
  }

  public event(message: string, metadata?: unknown): void {
    this.log(LogLevel.EVENT, message, metadata);
  }

  public server(message: string, metadata?: unknown): void {
    this.log(LogLevel.SERVER, message, metadata);
  }

  public trace(message: string, metadata?: unknown): void {
    this.log(LogLevel.TRACE, message, metadata);
  }

  public setLevel(level: keyof typeof LogLevel | string): void {
    const logLevel = level.toUpperCase() as keyof typeof LogLevel;

    if (logLevel in LogLevel) {
      const severityValue = LOG_LEVEL_SEVERITY[LogLevel[logLevel]];
      this.currentLogLevelSeverity = severityValue ?? LogLevelSeverity.INFO;
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

  private log(level: LogLevel, message: string, metadata?: unknown): void {
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
      for (const transport of transports) {
        transport(level, message, metadata);
      }
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
