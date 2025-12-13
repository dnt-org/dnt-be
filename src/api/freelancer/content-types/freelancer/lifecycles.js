'use strict';

const { errors } = require('@strapi/utils');
const { createFileEntry } = require('../../../../common/files-utils');
const { getUserFromToken } = require('../../../../common/services/auth-utils');

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

const beforeCreate = async (event) => {
  const { data } = event.params;
  
  // Access the request context to get the token
  const ctx = strapi.requestContext.get();
  
  if (ctx && ctx.request && ctx.request.header && ctx.request.header.authorization) {
    try {
      // Extract token from Authorization header
      const token = ctx.request.header.authorization.split(' ')[1];
      
      // Get user from token
      const user = await getUserFromToken(token, strapi);
      
      // Set user information in the data
      data.create_user = user.id;
      // You can set additional user-related fields here if needed
      
      console.log('User extracted from token:', user.id);
    } catch (error) {
      console.error('Error extracting user from token:', error.message);
      // Continue with creation even if token extraction fails
    }
  } else {
    console.log('No authorization header found in request context');
  }
}

const beforeUpdate = async (event) => {
  const { data } = event.params;

  const ctx = strapi.requestContext.get();
  const {originalUrl} = ctx;
  
  if (ctx && ctx.request && ctx.request.header && ctx.request.header.authorization && originalUrl.includes('/pic')) {

    try {
      // Extract token from Authorization header
      const token = ctx.request.header.authorization.split(' ')[1];
      console.log('token', token);
      // Get user from token
      const user = await getUserFromToken(token, strapi);
      console.log('user', user);

      
      // Set user information in the data
      data.pic = user.id;
      // You can set additional user-related fields here if needed
      
      console.log('User extracted from token:', user.id);
    } catch (error) {
      console.error('Error extracting user from token:', error.message);
      // Continue with creation even if token extraction fails
    }
  } else {
    console.log('No authorization header found in request context');
  }
}

module.exports = {
  beforeUpdate, beforeCreate
};