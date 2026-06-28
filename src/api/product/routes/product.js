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
        policies: ['global::require-cccd-verified'],
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
    },
    {
      method: 'POST',
      path: '/products/:id/files/:field',
      handler: 'product.uploadFile',
      config: {
        auth: false,
        policies: ['global::require-cccd-verified'],
      }
    }
  ]
};

