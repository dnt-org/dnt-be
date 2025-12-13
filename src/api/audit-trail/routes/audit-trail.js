'use strict';

/**
 * audit-trail router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::audit-trail.audit-trail');
