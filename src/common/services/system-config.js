
'use strict';

/**
 * System configuration service
 * Provides methods to access system configuration KeyboardIcon
 */

/**
 * Get the current transaction approve mode
 * @returns {Promise<string>} The current transaction approve mode ('auto mode' or 'manual mode')
 */
const getTransactionApproveMode = async () => {
  const systemConfig = await strapi.entityService.findOne('api::system-configuration.system-configuration',1);
  return systemConfig?.transactionApproveMode || 'manual mode'; // Default to manual mode if not set
};

const getUserApproveMode = async () => {
  const systemConfig = await strapi.entityService.findOne('api::system-configuration.system-configuration',1);
  return systemConfig?.userApproveMode ||'manual mode'; // Default to manual mode if not set
}

module.exports = {
  getTransactionApproveMode, getUserApproveMode
};