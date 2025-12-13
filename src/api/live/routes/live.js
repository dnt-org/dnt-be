'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/lives',
      handler: 'live.find',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/lives/:id',
      handler: 'live.findOne',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/lives',
      handler: 'live.create',
      config: {
        auth: false,
      },
    },
    {
      method: 'PUT',
      path: '/lives/:id',
      handler: 'live.update',
      config: {
        auth: false,
      },
    },
    {
      method: 'DELETE',
      path: '/lives/:id',
      handler: 'live.delete',
      config: {
        auth: false,
      },
    },
  ],
};
