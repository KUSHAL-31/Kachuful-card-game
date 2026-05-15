const pino = require('pino');
const path = require('path');

const isDev = process.env.NODE_ENV !== 'production';
const ROOT = path.resolve(__dirname, '../..');

const transport = isDev
  ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' } }
  : undefined;

const baseLogger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport,
});

// Parses the V8 stack and returns the first frame outside this file.
// Result format: "server/routes/roomRoutes.js:14"
function getCallerLocation() {
  const err = new Error();
  const frames = err.stack.split('\n');
  for (let i = 1; i < frames.length; i++) {
    const frame = frames[i];
    if (frame.includes(__filename)) continue;
    const match = frame.match(/\((.+):(\d+):\d+\)/) || frame.match(/at (.+):(\d+):\d+/);
    if (!match) continue;
    const filePath = match[1];
    if (filePath.includes('node_modules') || filePath.startsWith('node:')) continue;
    return `${path.relative(ROOT, filePath)}:${match[2]}`;
  }
  return undefined;
}

function log(pinoMethod, event, data = {}) {
  pinoMethod({ event, ...data });
}

function logWithCaller(pinoMethod, event, data = {}) {
  const caller = getCallerLocation();
  pinoMethod({ event, ...(caller ? { caller } : {}), ...data });
}

const logger = {
  debug: (event, data) => log(baseLogger.debug.bind(baseLogger), event, data),
  info:  (event, data) => log(baseLogger.info.bind(baseLogger), event, data),
  warn:  (event, data) => logWithCaller(baseLogger.warn.bind(baseLogger), event, data),
  error: (event, data) => logWithCaller(baseLogger.error.bind(baseLogger), event, data),
  fatal: (event, data) => logWithCaller(baseLogger.fatal.bind(baseLogger), event, data),
};

module.exports = logger;
