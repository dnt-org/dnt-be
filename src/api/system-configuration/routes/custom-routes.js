module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/system-configuration/banks',
      handler: 'system-configuration.getBanks',
      config: {
        auth: false,
      },
    },
  ],
};
