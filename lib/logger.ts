type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

class Logger {
  private formatLog(level: LogLevel, message: string, context?: Record<string, unknown>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };
  }

  info(message: string, context?: Record<string, unknown>): void {
    const log = this.formatLog('info', message, context);
    process.stdout.write(JSON.stringify(log) + '\n');
  }

  warn(message: string, context?: Record<string, unknown>): void {
    const log = this.formatLog('warn', message, context);
    process.stderr.write(JSON.stringify(log) + '\n');
  }

  error(message: string, error?: Error | unknown, context?: Record<string, unknown>): void {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
    };
    const log = this.formatLog('error', message, errorContext);
    process.stderr.write(JSON.stringify(log) + '\n');
  }
}

export const logger = new Logger();
