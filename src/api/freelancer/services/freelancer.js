'use strict';

/**
 * freelancer service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::freelancer.freelancer');
