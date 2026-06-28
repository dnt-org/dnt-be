'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/product-items',
      handler: 'product-item.find',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/product-items/:id',
      handler: 'product-item.findOne',
      config: { auth: false },
    },
    {
      method: 'PUT',
      path: '/product-items/:id',
      handler: 'product-item.update',
      config: { auth: false },
    },
    {
      method: 'DELETE',
      path: '/product-items/:id',
      handler: 'product-item.delete',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/product-items/:id/files/:field',
      handler: 'product-item.uploadFile',
      config: {
        auth: false,
        policies: ['global::require-cccd-verified'],
      },
    },
  ],
};
