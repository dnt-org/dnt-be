'use strict';

/**
 * audit-trail controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::audit-trail.audit-trail');
