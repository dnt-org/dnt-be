'use strict';

/**
 * system-configuration service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::system-configuration.system-configuration');
