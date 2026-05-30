'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/user-document/my',
      handler: 'upload.getMyDocuments',
      config: {
        auth: false,
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/user-document/upload',
      handler: 'upload.uploadDocument',
      config: {
        auth: false,
        policies: [],
      },
    },
  ],
};
