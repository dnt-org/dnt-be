'use strict';

/**
 * wallet controller
 */

// @ts-ignore
const { createCoreController } = require('@strapi/strapi').factories;

const getFavoriteWallets = async (ctx) => {
  // let userId; // No longer needed here
  try {
    // Reverted: Extract token from header
    const token = ctx.request.header.authorization?.split(' ')[1];
    if (!token) {
      return ctx.unauthorized('No token provided.'); // Handle missing token explicitly
    }
    // userId = ctx.state.user.id; // Reverted
    const result = await strapi.service('api::wallet.wallet').getFavoriteWallets(token); // Pass token
    return ctx.send(result);
  } catch (error) {
    // Reverted: Add back token-specific error handling if needed by service
    if (error.message === 'Invalid token') {
       return ctx.unauthorized(error.message);
    }
    if (error.message === 'User not found') {
      // Log the specific error for better debugging
      // console.error("Get Favorite Wallets Error: User not found for ID:", userId, error); // Reverted
      return ctx.notFound(error.message);
    }
    console.error("Get Favorite Wallets Error:", error);
    return ctx.internalServerError('An error occurred while fetching favorite wallets');
  }
};

const transferBetweenWallets = async (ctx) => {
  try {
    // Reverted: Extract token from header
    const token = ctx.request.header.authorization?.split(' ')[1];
     if (!token) {
      return ctx.unauthorized('No token provided.'); // Handle missing token explicitly
    }
    // const userId = ctx.state.user.id; // Reverted
    const { toWalletId, amount } = ctx.request.body;
    const result = await strapi.service('api::wallet.wallet').transferBetweenWallets(
      token, // Pass token
      toWalletId,
      amount
    );
    return ctx.send(result);
  } catch (error) {
     // Log the specific error for better debugging
    console.error("Transfer Between Wallets Error:", error);
    // Revert to simpler error message or adjust as needed
    return ctx.badRequest(error.message); // Reverted for simplicity, adjust if complex needed
  }
};

const transferToInternalAccount = async (ctx) => {
  try {
     // Reverted: Extract token from header
    const token = ctx.request.header.authorization?.split(' ')[1];
     if (!token) {
      return ctx.unauthorized('No token provided.'); // Handle missing token explicitly
    }
    // const userId = ctx.state.user.id; // Reverted
    const { accountType, amount } = ctx.request.body;
    const result = await strapi.service('api::wallet.wallet').transferToInternalAccount(
      token, // Pass token
      accountType,
      amount
    );
    return ctx.send(result);
  } catch (error) {
    // Log the specific error for better debugging
    console.error("Transfer To Internal Account Error:", error);
    // Revert to simpler error message or adjust as needed
     return ctx.badRequest(error.message); // Reverted for simplicity, adjust if complex needed
  }
};

const getWalletByJwt = async (ctx) => {
  try {
    // Extract token from header
    const token = ctx.request.header.authorization?.split(' ')[1];
    console.log(token);
    
    if (!token) {
      return ctx.unauthorized('No token provided.');
    }
    
    // Use the existing getWalletFromToken service method
    const wallet = await strapi.service('api::wallet.wallet').getWalletFromToken(token);
    return ctx.send(wallet);
  } catch (error) {
    // Handle specific errors
    if (error.message === 'Invalid token') {
      return ctx.unauthorized(error.message);
    }
    if (error.message === 'User not found') {
      return ctx.notFound(error.message);
    }
    if (error.message === 'User does not have a wallet') {
      return ctx.notFound(error.message);
    }
    
    console.error("Get Wallet By JWT Error:", error);
    return ctx.internalServerError('An error occurred while fetching wallet information');
  }
};

module.exports = {
  getFavoriteWallets,
  transferBetweenWallets,
  transferToInternalAccount,
  getWalletByJwt
};
