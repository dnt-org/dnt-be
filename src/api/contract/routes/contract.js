module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/contract/generate',
      handler: 'contract.generate',
      config: {
        auth: false,
      },
    },
  ],
};
