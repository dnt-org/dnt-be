'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/business',
      handler: 'business.createOrUpdateBusiness',
      config: {
        auth: false,
        policies: [],
        description: 'Create or update business information for the authenticated user',
      },
    },
    {
      method: 'GET',
      path: '/business/me',
      handler: 'business.getMyBusiness',
      config: {
        auth: false,
        policies: [],
        description: 'Get the latest business information for the authenticated user',
      },
    },
  ],
};
