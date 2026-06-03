export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}


class Logger {
  private logLevel: LogLevel;

  constructor(logLevel?: LogLevel | string) {
    if (typeof logLevel === 'string') {
      this.logLevel = LogLevel[logLevel.toUpperCase() as keyof typeof LogLevel] ?? LogLevel.INFO;
    } else {
      this.logLevel = logLevel ?? LogLevel.INFO;
    }
    // Suppress unused variable warning
    void this.logLevel;
  }

  private log(_level: LogLevel, _message: string, _data?: unknown): void {
    // Disable all console output for MCP servers to prevent JSON-RPC corruption
    return;
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

export const logger = new Logger(LogLevel.INFO);