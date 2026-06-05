const SERVER = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

function send(level, event, data = {}) {
  console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](`[${event}]`, data);

  fetch(`${SERVER}/log`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level, event, data: { ...data, timestamp: new Date().toISOString() } }),
  }).catch(() => {});
}

const clientLogger = {
  info:  (event, data) => send('info',  event, data),
  warn:  (event, data) => send('warn',  event, data),
  error: (event, data) => send('error', event, data),
};

export default clientLogger;
