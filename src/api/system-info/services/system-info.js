'use strict';

/**
 * system-info service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::system-info.system-info');
