'use strict';

/**
 * product controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::product.product', ({ strapi }) => ({
  async find(ctx) {
    try {
      // Get user from context and query parameters
      const { user } = ctx.state;
      const { 
        listingType, 
        categoryType, 
        conditionType, 
        nation, 
        province, 
        name,
        page = 1,
        pageSize = 25,
        isEmptyPic = false
      } = ctx.query;
      
      // Build filters object, only including non-null and non-empty values
      const filters = {};
    
      
      // Only add filters for non-null, non-empty values
      if (listingType && listingType.trim() !== '') {
        filters.listingType = listingType;
      }
      
      if (categoryType && categoryType.trim() !== '') {
        filters.categoryType = categoryType;
      }
      
      if (conditionType && conditionType.trim() !== '') {
        filters.conditionType = conditionType;
      }
      
      if (nation && nation.trim() !== '') {
        filters.nation = nation;
      }
      
      if (province && province.trim() !== '') {
        filters.province = province;
      }
      
      if (name && name.trim() !== '') {
        filters.name = { $containsi: name };
      }
      
      // Convert page and pageSize to numbers and calculate start
      const pageNum = parseInt(page, 10);
      const pageSizeNum = parseInt(pageSize, 10);
      const start = (pageNum - 1) * pageSizeNum;



      // Query the database with our filters and pagination
      let products = await strapi.entityService.findMany('api::product.product', {
        filters,
        populate: ['image'],
        start,
        limit: pageSizeNum
      });

      // Get total count for pagination metadata
      const count = await strapi.entityService.count('api::product.product', {
        filters
      });

      if(isEmptyPic){
       products = products.filter(product => product.personInCharge=="" || product.personInCharge==null)
      }

      // Return paginated response
      return {
        data: products,
        meta: {
          pagination: {
            page: pageNum,
            pageSize: pageSizeNum,
            pageCount: Math.ceil(products?.length / pageSizeNum),
            total: products?.length
          }
        }
      };
    } catch (error) {
      return ctx.badRequest('Error fetching products', { error: error.message });
    }
  }
}));
