'use strict';

const { errors } = require('@strapi/utils');
const { createFileEntry } = require('../../../../common/files-utils');
const { getUserFromToken } = require('../../../../common/services/auth-utils');

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */



const beforeUpdate = async (event) => {
  const { data } = event.params;

  const ctx = strapi.requestContext.get();
  const {originalUrl} = ctx;
  
  if (ctx && ctx.request && ctx.request.header && ctx.request.header.authorization && originalUrl.includes('/pic')) {

    try {
      // Extract token from Authorization header
      const token = ctx.request.header.authorization.split(' ')[1];
      // Get user from token
      const user = await getUserFromToken(token, strapi);

      
      // Set user information in the data
      data.personInCharge = user.id;
      // You can set additional user-related fields here if needed
      
    } catch (error) {
      console.error('Error extracting user from token:', error.message);
      // Continue with creation even if token extraction fails
    }
  } else {
    // No authorization header found in request context
  }
}

module.exports = {
  beforeUpdate
};
