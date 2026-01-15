'use strict';

/**
 * system-configuration controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::system-configuration.system-configuration', ({ strapi }) => ({
  async getBanks(ctx) {
    try {
      const entity = await strapi.entityService.findMany('api::system-configuration.system-configuration');
      const banks = entity ? entity.banks : [];
      
      return {
        success: true,
        data: banks || [],
      };
    } catch (err) {
      ctx.badRequest('Error fetching banks', { moreDetails: err });
    }
  },
}));
