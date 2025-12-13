'use strict';

const UID = 'plugin::system-logs.system-log';

// Extract caller file path (and line/column) from the stack trace
const getCallerInfo = () => {
  try {
    const stack = new Error().stack || '';
    const lines = String(stack).split('\n').slice(1);
    for (const line of lines) {
      // Skip internal/node frames and this logger file
      if (line.includes('node:internal') || line.includes('internal/') || line.includes('server/services/logger.js')) {
        continue;
      }
      // Match patterns like: at Function (path:line:column) or at path:line:column
      const m1 = line.match(/\((.*):(\d+):(\d+)\)/); // captures within parentheses
      const m2 = line.match(/at\s+(\/.*):(\d+):(\d+)/); // captures without parentheses
      const m = m1 || m2;
      if (m) {
        const file = m[1];
        const lineNum = Number(m[2]);
        const colNum = Number(m[3]);
        // Only return if looks like an absolute path
        if (file && file.startsWith('/')) {
          return { file, line: lineNum, column: colNum };
        }
      }
    }
  } catch (_) {
    // ignore errors
  }
  return undefined;
};

module.exports = {
  async log(level, message, context = {}) {
    try {
      const caller = getCallerInfo();
      const source = caller ? { file: caller.file, line: caller.line, column: caller.column } : undefined;
      await strapi.entityService.create(UID, {
        data: {
          level,
          message: typeof message === 'string' ? message : JSON.stringify(message),
          context: {
            source: source,
            tracedata: context,
          },
          timestamp: new Date(),
        },
      });
    } catch (err) {
      // fallback to console to avoid infinite loop
      // eslint-disable-next-line no-console
      console.error('System Log save error:', err);
    }
  },

  info(message, context) {
    console.info(message, context);
    return this.log('info', message, context);
  },

  warn(message, context) {
    console.warn(message, context);
    return this.log('warn', message, context);
  },

  error(message, context) {
    console.error(message, context);
    return this.log('error', message, context);
  },
};