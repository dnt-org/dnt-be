'use strict';

/**
 * payment-transaction service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::payment-transaction.payment-transaction');
