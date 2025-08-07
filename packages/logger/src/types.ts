import type { Logger as PinoLogger } from 'pino';

// Define LogLevel enum
export enum LogLevel {
  TRACE = "trace",
  DEBUG = "debug",
  INFO = "info",
  SUCCESS = "info", // Map to info level in Pino
  WARNING = "warn",
  ERROR = "error",
  EVENT = "info", // Map to info level in Pino
  SERVER = "info", // Map to info level in Pino
}

// Define LogLevelSeverity enum
export enum LogLevelSeverity {
  TRACE = 10,
  DEBUG = 20,
  INFO = 30,
  SUCCESS = 30,
  WARNING = 40,
  ERROR = 50,
}

export type TransportType = 'console' | 'browser' | 'file';

export interface LoggerTransportConfig {
  type: TransportType;
  options?: {
    // Console transport options
    colorize?: boolean;
    translateTime?: boolean | string;
    
    // File transport options
    destination?: string;
    mkdir?: boolean;
    
    // Browser transport options
    asObject?: boolean;
  };
}

export interface LoggerConfig {
  name: string;
  level?: keyof typeof LogLevel | string;
  transports?: LoggerTransportConfig[];
  // Pino-specific options
  formatters?: {
    level?: (label: string, number: number) => object;
    log?: (object: object) => object;
  };
  serializers?: Record<string, (value: any) => any>;
  redact?: string[] | { paths: string[]; censor?: string };
}

export interface DumpOptions {
  shallow?: boolean;
  maxDepth?: number;
  color?: boolean;
}

export interface CharaLogger extends PinoLogger {
  // Custom methods for Chara-specific log levels
  success(message: string, ...args: any[]): void;
  success(obj: object, message?: string, ...args: any[]): void;
  
  event(message: string, ...args: any[]): void;
  event(obj: object, message?: string, ...args: any[]): void;
  
  server(message: string, ...args: any[]): void;
  server(obj: object, message?: string, ...args: any[]): void;
  
  // Dumper methods
  dump(data: unknown, label?: string, options?: DumpOptions): void;
  dumpError(data: unknown, label?: string): void;
  dumpDebug(data: unknown, label?: string): void;
  dumpCompact(data: unknown, label?: string): void;
}
