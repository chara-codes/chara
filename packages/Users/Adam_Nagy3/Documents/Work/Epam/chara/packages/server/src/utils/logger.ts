import * as picocolors from "picocolors";

export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  SUCCESS = "success",
  WARNING = "warning",
  ERROR = "error",
  REQUEST = "request",
  API = "api",
  EVENT = "event",
  SERVER = "server",
}

export interface TransportType {
  (level: LogLevel, message: string, metadata?: any): void;
}

export interface LoggerConfig {
  name: string;
  levels?: LogLevel[];
  transports?: Record<LogLevel, TransportType[]>;
}

// Default console transport with color formatting
export const coloredConsoleTransport: TransportType = (
  level,
  message,
  metadata,
) => {
  let formattedMessage = "";

  switch (level) {
    case LogLevel.INFO:
      formattedMessage = `${picocolors.blue("ℹ️")} ${picocolors.cyan(message)}`;
      break;
    case LogLevel.SUCCESS:
      formattedMessage = `${picocolors.green("✅")} ${picocolors.green(message)}`;
      break;
    case LogLevel.WARNING:
      formattedMessage = `${picocolors.yellow("⚠️")} ${picocolors.yellow(message)}`;
      break;
    case LogLevel.ERROR:
      formattedMessage = `${picocolors.red("⛔️")} ${picocolors.red(message)}`;
      break;
    case LogLevel.DEBUG:
      formattedMessage = `${picocolors.gray("🔍")} ${picocolors.gray(message)}`;
      break;
    case LogLevel.REQUEST:
      // For request, we assume metadata contains method and url
      if (metadata && metadata.method && metadata.url) {
        formattedMessage = `${picocolors.magenta("🔸")} ${picocolors.bold(metadata.method)} ${picocolors.cyan(metadata.url)}`;
      } else {
        formattedMessage = `${picocolors.magenta("🔸")} ${picocolors.cyan(message)}`;
      }
      break;
    case LogLevel.API:
      formattedMessage = `${picocolors.blue("🔷")} ${picocolors.cyan(message)}`;
      break;
    case LogLevel.EVENT:
      formattedMessage = `${picocolors.magenta("🔔")} ${picocolors.cyan(message)}`;
      break;
    case LogLevel.SERVER:
      formattedMessage = `${picocolors.green("🚀")} ${picocolors.bold(picocolors.green(message))}`;
      break;
    default:
      formattedMessage = message;
  }

  console.log(formattedMessage);
  if (metadata && level !== LogLevel.REQUEST) {
    console.log(metadata);
  }
};

export class Logger {
  private config: LoggerConfig;

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

  public request(method: string, url: string, metadata?: any): void {
    this.log(LogLevel.REQUEST, `${method} ${url}`, {
      method,
      url,
      ...metadata,
    });
  }

  public api(message: string, metadata?: any): void {
    this.log(LogLevel.API, message, metadata);
  }

  public event(message: string, metadata?: any): void {
    this.log(LogLevel.EVENT, message, metadata);
  }

  public server(message: string, metadata?: any): void {
    this.log(LogLevel.SERVER, message, metadata);
  }

  private log(level: LogLevel, message: string, metadata?: any): void {
    // Check if this level is enabled
    if (!this.config.levels?.includes(level)) {
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
export const myLogger = new Logger({
  name: "Server",
  levels: Object.values(LogLevel),
  transports: {
    [LogLevel.DEBUG]: [coloredConsoleTransport],
    [LogLevel.INFO]: [coloredConsoleTransport],
    [LogLevel.SUCCESS]: [coloredConsoleTransport],
    [LogLevel.WARNING]: [coloredConsoleTransport],
    [LogLevel.ERROR]: [coloredConsoleTransport],
    [LogLevel.REQUEST]: [coloredConsoleTransport],
    [LogLevel.API]: [coloredConsoleTransport],
    [LogLevel.EVENT]: [coloredConsoleTransport],
    [LogLevel.SERVER]: [coloredConsoleTransport],
  },
});
