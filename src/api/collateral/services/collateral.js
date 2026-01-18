'use strict';

/**
 * collateral service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::collateral.collateral');
