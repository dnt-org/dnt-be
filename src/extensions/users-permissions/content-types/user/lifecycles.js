'use strict';

const { errors } = require('@strapi/utils');
const { getUserApproveMode } = require('../../../../common/services/system-config');
const { ApplicationError } = errors;

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

const beforeCreate = async (event) => {
  const { data } = event.params;
  const { amount, cccd } = data;

  const userApproveMode = await getUserApproveMode(); // Default to manual mode if not set

  if (userApproveMode === 'auto mode') {
    data.confirmed = true;
  } else {
    data.confirmed = false;
  }
}

const beforeUpdate = async (event) => {
  const { data, where } = event.params;
  
  // Get the current transaction
  const transaction = await strapi.entityService.findOne('api::additional-transaction.additional-transaction', where.id);
  
  // Prevent any updates if current status is DONE or REJECTED
  if (transaction && (transaction.stt === 'DONE' || transaction.stt === 'REJECTED')) {
    throw new ApplicationError('Cannot update transaction with status DONE or REJECTED', {
      field: 'stt',
      status: 400,
      details: {
        currentStatus: transaction.stt
      }
    });
  }

  // Only proceed if status is being updated to DONE
  if (data.stt === 'DONE') {
    // Find the user's wallet by cccd
    const wallet = await strapi.db.query('api::wallet.wallet').findOne({
      where: { cccd: transaction.cccd }
    });

    if (wallet) {
      // Start a transaction to ensure data consistency
      const dbTransaction = await strapi.db.transaction();

      try {
        // Update wallet balance
        await strapi.entityService.update('api::wallet.wallet', wallet.id, {
          data: {
            total: wallet.total + transaction.amount
          }
        });

        // Create payment transaction record
        await strapi.entityService.create('api::payment-transaction.payment-transaction', {
          data: {
            amount: transaction.amount,
            from_wallet: 'system',
            to_wallet: wallet.cccd,
            comment: `Additional transaction approved for ${transaction.cccd}`,
            wallet_account_type: 'DEFAULT'
          }
        });

        await dbTransaction.commit();
      } catch (error) {
        await dbTransaction.rollback();
        throw new ApplicationError('Failed to process transaction', {
          field: 'stt',
          status: 500,
          details: {
            originalError: error.message
          }
        });
      }
    } else {
      throw new ApplicationError('Wallet not found for the given CCCD', {
        field: 'cccd',
        status: 404,
        details: {
          cccd: transaction.cccd
        }
      });
    }
  }
}

module.exports = {
  beforeUpdate, beforeCreate
}; 