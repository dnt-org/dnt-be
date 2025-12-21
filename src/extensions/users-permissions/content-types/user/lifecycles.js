'use strict';

const { errors } = require('@strapi/utils');
const { getUserApproveMode } = require('../../../../common/services/system-config');

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

const beforeCreate = async (event) => {
  const { data } = event.params;

  const userApproveMode = await getUserApproveMode(); // Default to manual mode if not set

  if (userApproveMode === 'auto mode') {
    data.confirmed = true;
  } else {
    data.confirmed = false;
  }
}

module.exports = {
  beforeCreate
}; 
