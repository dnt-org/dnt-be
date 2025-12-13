'use strict';

/**
 * freelancer router
 */
'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/freelancers',
      handler: 'freelancer.find',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/freelancers/:id',
      handler: 'freelancer.findOne',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/freelancers',
      handler: 'freelancer.create'
    },
    {
      method: 'PUT',
      path: '/freelancers/:id',
      handler: 'freelancer.update',
      config: {
        auth: false,
      },
    },
    {
      method: 'PUT',
      path: '/freelancers/:id/pic',
      handler: 'freelancer.update',
      config: {
        auth: false,
      },
    },
    {
      method: 'DELETE',
      path: '/freelancers/:id',
      handler: 'freelancer.delete',
      config: {
        auth: false,
      },
    },
  ],
};

