'use strict';

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }) {
    const banks = [
      { code: "VCB", name: "Vietcombank", shortName: "VCB" },
      { code: "TCB", name: "Techcombank", shortName: "TCB" },
      { code: "MB", name: "MBBank", shortName: "MB" },
      { code: "ACB", name: "ACB", shortName: "ACB" },
      { code: "VPB", name: "VPBank", shortName: "VPB" },
      { code: "CTG", name: "VietinBank", shortName: "CTG" },
      { code: "BIDV", name: "BIDV", shortName: "BIDV" },
      { code: "TPB", name: "TPBank", shortName: "TPB" },
      { code: "STB", name: "Sacombank", shortName: "STB" },
      { code: "HDB", name: "HDBank", shortName: "HDB" },
    ];

    try {
      const systemConfig = await strapi.entityService.findMany('api::system-configuration.system-configuration');
      
      if (!systemConfig) {
        // Create if not exists
        await strapi.entityService.create('api::system-configuration.system-configuration', {
          data: {
            banks: banks,
            transactionApproveMode: 'manual mode',
            userApproveMode: 'auto mode'
          }
        });
        strapi.log.info('System configuration created with default banks.');
      } else if (!systemConfig.banks || systemConfig.banks.length === 0) {
        // Update if banks are missing
        await strapi.entityService.update('api::system-configuration.system-configuration', systemConfig.id, {
          data: {
            banks: banks
          }
        });
        strapi.log.info('System configuration updated with default banks.');
      }
    } catch (error) {
      strapi.log.error('Bootstrap error:', error);
    }
  },
};
