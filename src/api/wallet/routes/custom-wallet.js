'use strict';

/**
 * wallet router
 */
module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/wallets/favorite-wallets', // Use plural form
      handler: 'custom-wallet.getFavoriteWallets',
      config: {
        auth: false,
        policies: [], // Add policies if needed, e.g., ['global::is-authenticated']
      },
    },
    {
      method: 'POST',
      path: '/wallets/transfer', // Use plural form
      handler: 'custom-wallet.transferBetweenWallets',
      config: {
        auth: false,
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/wallets/internal-transfer', // Use plural form
      handler: 'custom-wallet.transferToInternalAccount',
      config: {
        auth: { // Simplified auth config
          strategy: 'jwt'
        },
        policies: [],
      },
    },
    {
      method: 'GET',
      path: '/wallets/my-wallet',
      handler: 'custom-wallet.getWalletByJwt',
      config: {
        auth: false,
        policies: [],
      },
    }
  ],
};
