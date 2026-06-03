export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 3] = "DEBUG";
})(LogLevel || (LogLevel = {}));
class Logger {
    constructor(logLevel) {
        if (typeof logLevel === 'string') {
            this.logLevel = LogLevel[logLevel.toUpperCase()] ?? LogLevel.INFO;
        }
        else {
            this.logLevel = logLevel ?? LogLevel.INFO;
        }
        void this.logLevel;
    }
    log(_level, _message, _data) {
        return;
    }
    error(message, data) {
        this.log(LogLevel.ERROR, message, data);
    }
    warn(message, data) {
        this.log(LogLevel.WARN, message, data);
    }
    info(message, data) {
        this.log(LogLevel.INFO, message, data);
    }
    debug(message, data) {
        this.log(LogLevel.DEBUG, message, data);
    }
}
export const logger = new Logger(LogLevel.INFO);
//# sourceMappingURL=logger.js.map