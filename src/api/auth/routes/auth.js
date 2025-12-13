'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/auth/register',
      handler: 'auth.register',
      config: {
        auth: false,
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/auth/login',
      handler: 'auth.login',
      config: {
        auth: false,
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/auth/change-password',
      handler: 'auth.changePassword',
      config: {
        auth: false,
        policies: [],
      },
    },
    {
      method: 'GET',
      path: '/auth/me',
      handler: 'auth.getMe',
      config: {
        auth: false,
        policies: [],
      },
    },
    {
      method: 'PUT',
      path: '/auth/update',
      handler: 'auth.updateUser',
      config: {
        auth: false,
        policies: [],
      },
    },
    {
      method: 'GET',
      path: '/auth/search',
      handler: 'auth.searchByCCCD',
      config: {
        auth: false,
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/auth/generate-qr',
      handler: 'auth.generateQR',
      config: {
        auth: false,
        policies: [],
      },
    },
       {
      method: 'POST',
      path: '/auth/generate-qr-info',
      handler: 'auth.generateQRinfo',
      config: {
        auth: false,
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/auth/verify-qr',
      handler: 'auth.verifyQR',
      config: {
        auth: false,
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/auth/qr-login',
      handler: 'auth.qrLogin',
      config: {
        auth: false,
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/auth/verify-bank-number',
      handler: 'auth.verifyBankNumber',
      config: {
        auth: false,
        policies: [],
      },
    },
  ],
};
