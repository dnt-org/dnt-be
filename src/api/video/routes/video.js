'use strict';

/**
 * video router
 */


module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/videos',
      handler: 'video.find',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/videos/:id',
      handler: 'video.findOne',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/videos',
      handler: 'video.create',
      config: {
        auth: false,
      },
    },
    {
      method: 'PUT',
      path: '/videos/:id',
      handler: 'video.update',
      config: {
        auth: false,
      },
    },
    {
      method: 'DELETE',
      path: '/videos/:id',
      handler: 'video.delete',
      config: {
        auth: false,
      },
    },
  ],
};

