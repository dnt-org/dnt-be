'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/collaterals/download/:code',
      handler: 'collateral.downloadByCode',
      config: {
        auth: false,
      },
    },
  ],
};

