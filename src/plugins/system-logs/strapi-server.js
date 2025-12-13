'use strict';

const routes = require('./server/routes');
const logsController = require('./server/controllers/logs');
const loggerService = require('./server/services/logger');
const systemLogSchema = require('./server/content-types/system-log/schema.json');

module.exports = {
  register({ strapi }) {},

  bootstrap({ strapi }) {
    // Expose logger for convenient usage across the app
    strapi.systemLogs = { logger: loggerService };
  },

  routes,

  controllers: {
    logs: logsController,
  },

  services: {
    logger: loggerService,
  },

  contentTypes: {
    'system-log': { schema: systemLogSchema },
  },
};