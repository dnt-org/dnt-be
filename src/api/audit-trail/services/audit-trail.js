'use strict';

/**
 * audit-trail service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::audit-trail.audit-trail');
