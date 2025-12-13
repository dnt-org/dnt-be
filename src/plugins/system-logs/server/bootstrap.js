'use strict';

module.exports = async ({ strapi }) => {
  // optionally expose logger on strapi.service
  const loggerService = strapi.plugin('system-logs')?.service('logger') || require('./services/logger');
  strapi.systemLogs = { logger: loggerService };
};