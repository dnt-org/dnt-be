'use strict';

/**
 * collateral controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::collateral.collateral', ({ strapi }) => ({
  async downloadByCode(ctx) {
    try {
      const { code } = ctx.params;

      const entry = await strapi.db.query('api::collateral.collateral').findOne({
        where: { code },
        populate: ['file'],
      });

      if (!entry) {
        return ctx.notFound('Collateral not found');
      }

      const files = entry.file ? entry.file.map(f => f.url) : [];

      ctx.send({
        code: entry.code,
        files
      });
    } catch (err) {
      ctx.throw(500, err);
    }
  }
}));
