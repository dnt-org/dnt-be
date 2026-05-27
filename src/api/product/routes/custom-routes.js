'use strict';

/**
 * products router
 */

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/products/create',
      handler: 'custom-controller.createProduct',
      config: {
        auth: false,
        policies: ['global::require-cccd-verified'],
      }
    },
     {
      method: 'POST',
      path: '/products/:id/pic',
      handler: 'custom-controller.updateProductPic',
      config: {
        auth: false,
      },
    },
  ]
};