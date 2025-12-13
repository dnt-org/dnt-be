'use strict';

const UID = 'plugin::system-logs.system-log';

module.exports = {
  async find(ctx) {
    const { query = {} } = ctx;
    const { sort } = query;

    // pagination params
    const limit = query['pagination[limit]'] ? Number(query['pagination[limit]']) : 50;
    const start = query['pagination[start]'] ? Number(query['pagination[start]']) : 0;
    const page = Math.floor(start / limit) + 1;

    // filters
    const where = {};
    if (query.level) where.level = query.level;
    if (query.q) where.message = { $containsi: query.q };
    if (query.from) where.timestamp = where.timestamp || {};
    if (query.from) where.timestamp.$gte = new Date(query.from);
    if (query.to) where.timestamp = where.timestamp || {};
    if (query.to) where.timestamp.$lte = new Date(query.to);

    // get data and total count
    const data = await strapi.entityService.findMany(UID, {
      limit,
      start,
      filters: where,
      sort: sort || 'timestamp:desc',
    });

    const total = await strapi.db.query(UID).count({ where });

    ctx.body = {
      data,
      meta: {
        pagination: {
          page,
          pageSize: limit,
          pageCount: Math.ceil(total / limit),
          total,
        },
      },
    };
  },

  async findOne(ctx) {
    const { id } = ctx.params;
    const entity = await strapi.entityService.findOne(UID, id);
    ctx.body = entity;
  },

  async create(ctx) {
    const { level = 'info', message = '', context = {} } = ctx.request.body;
    const entity = await strapi.entityService.create(UID, {
      data: {
        level,
        message: typeof message === 'string' ? message : JSON.stringify(message),
        context,
        timestamp: new Date(),
      },
    });
    ctx.status = 201;
    ctx.body = entity;
  },

  async delete(ctx) {
    const { id } = ctx.params;
    await strapi.entityService.delete(UID, id);
    ctx.status = 204;
  },

  async clear(ctx) {
    const { olderThanDays } = ctx.query;
    if (olderThanDays) {
      const cutoff = new Date(Date.now() - Number(olderThanDays) * 24 * 60 * 60 * 1000);
      await strapi.db.query(UID).deleteMany({ where: { timestamp: { $lt: cutoff } } });
    } else {
      await strapi.db.query(UID).deleteMany({});
    }
    ctx.status = 204;
  },
};