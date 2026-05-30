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
      documents, // [{ type: string, file_ids: number[] }]
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

    // Upsert user-document records if documents were provided
    const savedDocuments = [];
    if (Array.isArray(documents) && documents.length > 0) {
      for (const doc of documents) {
        if (!doc.type) continue;

        const fileConnections = Array.isArray(doc.file_ids)
          ? doc.file_ids.map((id) => ({ id }))
          : [];

        // Check if a user_document with the same type + user_id already exists
        const existing = await strapi.entityService.findMany(
          'api::user-document.user-document',
          {
            filters: { type: doc.type, user_id: user.id },
            limit: 1,
          }
        );

        let savedDoc;
        if (existing && existing.length > 0) {
          // Update existing document record
          savedDoc = await strapi.entityService.update(
            'api::user-document.user-document',
            existing[0].id,
            {
              data: {
                type: doc.type,
                business_id: business.id,
                file: fileConnections,
              },
            }
          );
        } else {
          // Create new document record
          savedDoc = await strapi.entityService.create(
            'api::user-document.user-document',
            {
              data: {
                type: doc.type,
                user_id: user.id,
                business_id: business.id,
                file: fileConnections,
                publishedAt: new Date(),
              },
            }
          );
        }

        savedDocuments.push(savedDoc);
      }
    }

    return ctx.send({
      success: true,
      message: existingBusiness ? 'Business updated successfully' : 'Business created successfully',
      data: business,
      documents: savedDocuments,
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

/**
 * Verify business for the authenticated user.
 * Looks up user-document records by user_id.
 * If documents exist → marks business status as 'verified' and returns pass.
 * If no documents found → returns fail.
 */
const verifyBusiness = async (ctx) => {
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


    // Find user-documents by user_id
    const userDocuments = await strapi.entityService.findMany(
      'api::user-document.user-document',
      {
        filters: { user_id: user.id },
        populate: ['file'],
      }
    );

    if (!userDocuments || userDocuments.length === 0) {
      return ctx.send({
        success: false,
        verified: false,
        message: 'Verification failed: no documents found for this user',
      });
    }

    // Persist verified status on the business record
    const business = await strapi.db.connection('businesses')
      .where({ user_id: user.id })
      .orderBy('id', 'desc')
      .first();

    if (business) {
      await strapi.db.connection('businesses')
        .where({ id: business.id })
        .update({ status: 'verified', updated_at: new Date() });
    }

    return ctx.send({
      success: true,
      verified: true,
      message: 'Business verified successfully',
    });

  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return ctx.unauthorized('Invalid token');
    }
    console.error('Verify business error:', err);
    return ctx.internalServerError('An error occurred while verifying business');
  }
};

module.exports = {
  createOrUpdateBusiness,
  getMyBusiness,
  verifyBusiness,
};
