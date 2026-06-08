export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

const LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.DEBUG]: 'DEBUG',
};

export class Logger {
  private logLevel: LogLevel;

  constructor(logLevel?: LogLevel | string) {
    if (typeof logLevel === 'string') {
      const key = logLevel.toUpperCase();
      this.logLevel =
        key in LogLevel
          ? LogLevel[key as keyof typeof LogLevel]
          : LogLevel.INFO;
    } else {
      this.logLevel = logLevel ?? LogLevel.INFO;
    }
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    if (level > this.logLevel) {
      return;
    }
    const line =
      data !== undefined
        ? `[${LEVEL_NAMES[level]}] ${message} ${formatData(data)}`
        : `[${LEVEL_NAMES[level]}] ${message}`;
    // stdout is reserved for MCP JSON-RPC traffic; logs go to stderr.
    process.stderr.write(line + '\n');
  }

  error(message: string, data?: unknown): void {
    this.log(LogLevel.ERROR, message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log(LogLevel.WARN, message, data);
  }

  info(message: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, data);
  }

  debug(message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, data);
  }
}

function formatData(value: unknown): string {
  if (value instanceof Error) {
    return value.stack
      ? `${value.name}: ${value.message}\n${value.stack}`
      : `${value.name}: ${value.message}`;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export const logger = new Logger(process.env.LOG_LEVEL);
