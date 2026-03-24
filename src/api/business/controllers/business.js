// Path: ./src/api/business/controllers/business.js

'use strict';

const jwt = require('jsonwebtoken');

/**
 * Create or update business information for the authenticated user.
 * After creating a new business record, updates up_users.business_id to the latest business id.
 */
const createOrUpdateBusiness = async (ctx) => {
  try {
    const token = ctx.request.header.authorization?.split(' ')[1];
    if (!token) {
      return ctx.unauthorized('No token provided');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: decoded.id },
    });

    if (!user) {
      return ctx.notFound('User not found');
    }

    const {
      business_fullname,
      tax_code,
      headquarters_address,
      headquarters_address_province_code,
      headquarters_address_nation_code,
      current_address,
      current_address_province_code,
      current_address_nation_code,
      current_address_map,
      status,
    } = ctx.request.body;

    // Check if user already has a business record (get the latest one)
    const existingBusiness = await strapi.db.connection('businesses')
      .where({ user_id: user.id })
      .orderBy('id', 'desc')
      .first();

    let business;

    if (existingBusiness) {
      // Update existing latest business record
      await strapi.db.connection('businesses')
        .where({ id: existingBusiness.id })
        .update({
          business_fullname: business_fullname !== undefined ? business_fullname : existingBusiness.business_fullname,
          tax_code: tax_code !== undefined ? tax_code : existingBusiness.tax_code,
          headquarters_address: headquarters_address !== undefined ? headquarters_address : existingBusiness.headquarters_address,
          headquarters_address_province_code: headquarters_address_province_code !== undefined ? headquarters_address_province_code : existingBusiness.headquarters_address_province_code,
          headquarters_address_nation_code: headquarters_address_nation_code !== undefined ? headquarters_address_nation_code : existingBusiness.headquarters_address_nation_code,
          current_address: current_address !== undefined ? current_address : existingBusiness.current_address,
          current_address_province_code: current_address_province_code !== undefined ? current_address_province_code : existingBusiness.current_address_province_code,
          current_address_nation_code: current_address_nation_code !== undefined ? current_address_nation_code : existingBusiness.current_address_nation_code,
          current_address_map: current_address_map !== undefined ? current_address_map : existingBusiness.current_address_map,
          status: status !== undefined ? status : existingBusiness.status,
          updated_at: new Date(),
        });

      // Fetch the updated record
      business = await strapi.db.connection('businesses')
        .where({ id: existingBusiness.id })
        .first();
    } else {
      // Create new business record
      const [insertedId] = await strapi.db.connection('businesses')
        .insert({
          business_fullname: business_fullname || null,
          user_id: user.id,
          tax_code: tax_code || null,
          headquarters_address: headquarters_address || null,
          headquarters_address_province_code: headquarters_address_province_code || null,
          headquarters_address_nation_code: headquarters_address_nation_code || null,
          current_address: current_address || null,
          current_address_province_code: current_address_province_code || null,
          current_address_nation_code: current_address_nation_code || null,
          current_address_map: current_address_map || null,
          status: status || 'active',
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning('id');

      const newId = typeof insertedId === 'object' ? insertedId.id : insertedId;

      // Fetch the newly created record
      business = await strapi.db.connection('businesses')
        .where({ id: newId })
        .first();
    }

    // Always update up_users.business_id to the latest business id
    await strapi.db.query('plugin::users-permissions.user').update({
      where: { id: user.id },
      data: { business_id: business.id },
    });

    return ctx.send({
      success: true,
      message: existingBusiness ? 'Business updated successfully' : 'Business created successfully',
      data: business,
    });
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return ctx.unauthorized('Invalid token');
    }
    console.error('Create/Update business error:', err);
    return ctx.internalServerError('An error occurred while saving business information');
  }
};

/**
 * Get the latest business information for the authenticated user.
 */
const getMyBusiness = async (ctx) => {
  try {
    const token = ctx.request.header.authorization?.split(' ')[1];
    if (!token) {
      return ctx.unauthorized('No token provided');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: decoded.id },
    });

    if (!user) {
      return ctx.notFound('User not found');
    }

    // Get the latest business record for this user
    const business = await strapi.db.connection('businesses')
      .where({ user_id: user.id })
      .orderBy('id', 'desc')
      .first();

    if (!business) {
      return ctx.send({
        success: true,
        data: null,
        message: 'No business information found',
      });
    }

    return ctx.send({
      success: true,
      data: business,
    });
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return ctx.unauthorized('Invalid token');
    }
    console.error('Get business error:', err);
    return ctx.internalServerError('An error occurred while fetching business information');
  }
};

module.exports = {
  createOrUpdateBusiness,
  getMyBusiness,
};
