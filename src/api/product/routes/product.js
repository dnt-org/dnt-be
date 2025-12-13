'use strict';

/**
 * product router
 */

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/products',
      handler: 'product.find',
      config: {
        auth: false,
        policies: [],
      }
    },
    {
      method: 'GET',
      path: '/products/:id',
      handler: 'product.findOne',
      config: {
        auth: false,
        policies: [],
      }
    },
    {
      method: 'POST',
      path: '/products',
      handler: 'product.create',
      config: {
        auth: false,
        policies: [],
      }
    },
    {
      method: 'PUT',
      path: '/products/:id',
      handler: 'product.update',
      config: {
        auth: false,
        policies: [],
      }
    },
    {
      method: 'PUT',
      path: '/products/:id/pic',
      handler: 'product.update',
      config: {
        auth: false,
      },
    },
    {
      method: 'DELETE',
      path: '/products/:id',
      handler: 'product.delete',
      config: {
        auth: false,
        policies: [],
      }
    }
  ]
};

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::product.product');
