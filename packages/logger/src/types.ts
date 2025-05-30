// Define LogLevel enum
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

// Define LogLevelSeverity enum
export enum LogLevelSeverity {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  SUCCESS = 3,
  WARNING = 4,
  ERROR = 5,
}

export interface TransportType {
  // biome-ignore lint/style/useShorthandFunctionType: <explanation>
  (level: LogLevel, message: string, metadata?: unknown): void;
}

export interface LoggerConfig {
  name: string;
  levels?: LogLevel[];
  transports?: Record<LogLevel, TransportType[]>;
}
