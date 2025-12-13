'use strict';

/**
 * additional-transaction service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::additional-transaction.additional-transaction', ({ strapi }) => ({
  // Get all additional transactions with pagination
  async findAll(params = {}) {
    const { page = 1, pageSize = 10, ...restParams } = params;
    
    return await strapi.entityService.findMany('api::additional-transaction.additional-transaction', {
      sort: { createdAt: 'desc' },
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      },
      populate: ['bill'],
      ...restParams
    });
  },

  // Get additional transaction by ID
  async findById(id, params = {}) {
    return await strapi.entityService.findOne(
      'api::additional-transaction.additional-transaction', 
      id, 
      {
        populate: ['bill'],
        ...params
      }
    );
  },

  // Create new additional transaction
  async create(data) {
    return await strapi.entityService.create('api::additional-transaction.additional-transaction', {
      data
    });
  },

  // Update existing additional transaction
  async update(id, data) {
    return await strapi.entityService.update('api::additional-transaction.additional-transaction', id, {
      data
    });
  },

  // Save or update additional transaction
  async saveOrUpdate(data, id = null) {
    if (id) {
      return await this.update(id, data);
    }
    return await this.create(data);
  }
}));