const pino = require('pino');

const isDev = process.env.NODE_ENV !== 'production';

const transport = isDev
  ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' } }
  : undefined;

const baseLogger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport,
});

// Wrapper keeps existing call sites unchanged: logger.info('EVENT', { key: val })
const logger = {
  info:  (event, data = {}) => baseLogger.info({ event, ...data }),
  warn:  (event, data = {}) => baseLogger.warn({ event, ...data }),
  error: (event, data = {}) => baseLogger.error({ event, ...data }),
  debug: (event, data = {}) => baseLogger.debug({ event, ...data }),
  fatal: (event, data = {}) => baseLogger.fatal({ event, ...data }),
  child: (bindings) => {
    const child = baseLogger.child(bindings);
    return {
      info:  (event, data = {}) => child.info({ event, ...data }),
      warn:  (event, data = {}) => child.warn({ event, ...data }),
      error: (event, data = {}) => child.error({ event, ...data }),
      debug: (event, data = {}) => child.debug({ event, ...data }),
      fatal: (event, data = {}) => child.fatal({ event, ...data }),
    };
  },
};

module.exports = logger;
