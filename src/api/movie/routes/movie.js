'use strict';

/**
 * movie router
 */

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/movies',
      handler: 'movie.find',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/movies/:id',
      handler: 'movie.findOne',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/movies',
      handler: 'movie.create',
      config: {
        auth: false,
      },
    },
    {
      method: 'PUT',
      path: '/movies/:id',
      handler: 'movie.update',
      config: {
        auth: false,
      },
    },
    {
      method: 'DELETE',
      path: '/movies/:id',
      handler: 'movie.delete',
      config: {
        auth: false,
      },
    },
  ],
};

