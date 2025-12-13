'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/documents/:id/sign',
      handler: 'sign.signDocument',
      config: {
        
        auth: false,
      },
    },
  ],
};