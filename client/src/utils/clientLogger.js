const SERVER = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

function send(level, event, data = {}) {
  // Always log to browser console too
  console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](`[${event}]`, data);

  try {
    navigator.sendBeacon(`${SERVER}/log`, new Blob(
      [JSON.stringify({ level, event, data: { ...data, timestamp: new Date().toISOString() } })],
      { type: 'application/json' },
    ));
  } catch {
    // sendBeacon not available — fall back to fire-and-forget fetch
    fetch(`${SERVER}/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, event, data: { ...data, timestamp: new Date().toISOString() } }),
      keepalive: true,
    }).catch(() => {});
  }
}

const clientLogger = {
  info:  (event, data) => send('info',  event, data),
  warn:  (event, data) => send('warn',  event, data),
  error: (event, data) => send('error', event, data),
};

export default clientLogger;
