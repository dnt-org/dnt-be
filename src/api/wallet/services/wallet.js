'use strict';

/**
 * wallet service
 */

// @ts-ignore
const { createCoreService } = require('@strapi/strapi').factories;
// const jwt = require('jsonwebtoken'); // No longer needed here
const { getUserFromToken } = require('../../../common/services/auth-utils'); // Corrected path again

module.exports = createCoreService('api::wallet.wallet', ({ strapi }) => ({
  
  // Simplified using common auth util
  async getFavoriteWallets(token) {
    try {
      // Use the common function to get the user directly from the token
      const user = await getUserFromToken(token, strapi);

      // User object already has favorite_wallets populated by getUserFromPayload
      const wallets = user.favorite_wallets.map(wallet => ({
        id: wallet.id,
        cccd: wallet.cccd
      }));

      return {
        count: wallets.length,
        wallets: wallets
      };
    } catch (err) {
      // Errors like 'No token provided', 'Invalid token', 'User not found' 
      // are thrown by getUserFromToken and will be caught here.
      console.error(`Error in getFavoriteWallets service: ${err.message}`);
      throw err; // Re-throw the specific error for the controller to handle
    }
  },

  // Simplified using common auth util
  async getWalletFromToken(token) { 
    try {
      // Use the common function to get the user directly from the token
      const user = await getUserFromToken(token, strapi);
      // User object already has wallet populated by getUserFromPayload
      if (!user.wallet) {
        throw new Error('User does not have a wallet'); // Keep this specific check
      }

      return user.wallet;
    } catch (err) {
      // Errors like 'No token provided', 'Invalid token', 'User not found' 
      // are thrown by getUserFromToken and will be caught here.
      console.error(`Error in getWalletFromToken service: ${err.message}`); 
      throw err; // Re-throw the specific error
    }
  },

  // Updated to use the simplified getWalletFromToken
  async transferBetweenWallets(token, toWalletId, amount) {
    if (!token || !toWalletId || !amount) {
      // Keep basic parameter check, although token validity is checked deeper now
      throw new Error('Missing required parameters');
    }

    if (amount <= 0) {
      throw new Error('Transfer amount must be greater than 0');
    }

    // Start transaction early to wrap all checks and operations
    const transaction = await strapi.db.transaction();
    try {
      // Get sender's wallet using the updated method (which now uses getUserFromToken)
      const fromWallet = await this.getWalletFromToken(token);
      
      // Fetch receiver's wallet within the transaction for consistency
      const toWallet = await strapi.entityService.findOne('api::wallet.wallet', toWalletId);

      if (!toWallet) {
        throw new Error('Destination wallet not found');
      }

      if (fromWallet.id === toWallet.id) {
        throw new Error('Cannot transfer to your own wallet. Use internal transfer instead.');
      }

      if (fromWallet.total < amount) {
        throw new Error('Insufficient funds');
      }

      // Perform updates within the transaction
      await strapi.entityService.update('api::wallet.wallet', fromWallet.id, {
        data: { total: fromWallet.total - amount },
        transaction,
      });
      await strapi.entityService.update('api::wallet.wallet', toWalletId, {
        data: { total: toWallet.total + amount },
        transaction,
      });
      await strapi.entityService.create('api::payment-transaction.payment-transaction', {
        data: {
          amount,
          from_wallet: fromWallet.cccd,
          to_wallet: toWallet.cccd,
          comment: `Transfer from wallet ${fromWallet.cccd} to wallet ${toWallet.cccd}`,
          wallet_account_type: 'DEFAULT'
        },
        transaction,
      });

      await transaction.commit();

      return {
        success: true,
        message: 'Transfer completed successfully'
      };
    } catch (error) {
      await transaction.rollback();
      // Log the specific error encountered during the process
      console.error(`Error during wallet transfer: ${error.message}`); 
      // Re-throw the original error (could be from getWalletFromToken, findOne, update, create)
      throw error; 
    }
  },

  // Updated to use the simplified getWalletFromToken
  async transferToInternalAccount(token, accountType, amount) {
    if (!token || !accountType || !amount) {
      throw new Error('Missing required parameters');
    }
    if (amount <= 0) {
      throw new Error('Transfer amount must be greater than 0');
    }

    const validAccountTypes = ['account_of_goods', 'account_of_freelancer', 'account_of_ailive'];
    if (!validAccountTypes.includes(accountType)) {
      throw new Error('Invalid account type');
    }

    const accountTypeMap = {
      'account_of_goods': 'GOODS_ACCOUNT',
      'account_of_freelancer': 'FREELANCER_ACCOUNT',
      'account_of_ailive': 'AI_LIVE_ACCOUNT'
    };

    // Start transaction early
    const transaction = await strapi.db.transaction();
    try {
      // Get wallet using the updated method
      const wallet = await this.getWalletFromToken(token);

      if (wallet.total < amount) {
        throw new Error('Insufficient funds');
      }

      // Perform updates within the transaction
      await strapi.entityService.update('api::wallet.wallet', wallet.id, {
        data: {
          total: wallet.total - amount,
          [accountType]: wallet[accountType] + amount
        },
        transaction,
      });
      await strapi.entityService.create('api::payment-transaction.payment-transaction', {
        data: {
          amount,
          from_wallet: wallet.cccd,
          to_wallet: wallet.cccd,
          comment: `Internal transfer to ${accountType} in wallet ${wallet.cccd}`,
          wallet_account_type: accountTypeMap[accountType]
        },
        transaction,
      });

      await transaction.commit();

      return {
        success: true,
        message: 'Internal transfer completed successfully'
      };
    } catch (error) {
      await transaction.rollback();
      // Log the specific error
      console.error(`Error during internal account transfer: ${error.message}`);
      // Re-throw the original error
      throw error;
    }
  }
}));
