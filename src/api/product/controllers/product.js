'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

// File fields that can be uploaded as multipart
const FILE_FIELDS = [
  'image', 'videoFile', 'qualityFiles',
  'livestreamVideoFile', 'livestreamCertFile',
  'advertisingVideoFile', 'advertisingCertFile',
  'regLivestreamProductProfile', 'regLivestreamCertFile',
  'regProductAdCompanyProfile', 'regProductAdCertFile',
  'regPersonalBrandProductProfile', 'regPersonalBrandCertFile',
];

// Numeric fields that need casting
const DECIMAL_FIELDS = [
  'price', 'askingPrice', 'estimatedValue', 'autoAcceptPrice', 'setPrice',
  'lowestAutoAcceptPrice', 'highestAutoAcceptPrice',
  'depositRequirementDirect', 'depositRequirementWallet',
  'repairWarrantyRetentionPercent', 'unitMarketPrice', 'unitAskingPrice',
  'amountDesired', 'eventPercentFee', 'eventFee', 'livestreamPercentFee',
  'advertisingPercent', 'advertisingFee', 'advertisingAmount',
  'regLivestreamGoodsPercent', 'regLivestreamGoodsFee',
  'regProductAdPercent', 'regProductAdFee',
  'regPersonalBrandPercent', 'regPersonalBrandFee',
  'successFee', 'totalFees', 'showOnMainPage', 'showOnVideo',
];
const INT_FIELDS = [
  'warrantyChangeDays', 'warrantyRepairDays', 'maxDeliveryDays', 'contractDuration',
  'quantityMinimum', 'mainPageViewCount',
];
const BOOL_FIELDS = [
  'displayPrice', 'hidePrice', 'confirmOwnership', 'registerForAdvertising',
  'regLivestreamGoods', 'regLivestreamGoodsAI', 'regLivestreamGoodsPerson',
  'regProductAdVideo', 'regProductAdAI', 'regProductAdPerson', 'regProductAdPlatformSupport',
  'regPersonalBrandVideo', 'regPersonalBrandAI', 'regPersonalBrandPerson',
];

function castField(key, val) {
  if (val === undefined || val === null || val === '') return undefined;
  if (DECIMAL_FIELDS.includes(key)) return parseFloat(val) || 0;
  if (INT_FIELDS.includes(key)) return parseInt(val, 10) || 0;
  if (BOOL_FIELDS.includes(key)) return val === true || val === 'true' || val === '1';
  return val;
}

module.exports = createCoreController('api::product.product', ({ strapi }) => ({

  // ── CREATE ──────────────────────────────────────────────────────────────
  async create(ctx) {
    try {
      const { user } = ctx.state;

      // Support both multipart (with files) and plain JSON
      let body = {};
      let files = {};

      if (ctx.is('multipart')) {
        body = ctx.request.body || {};
        files = ctx.request.files || {};
      } else {
        body = ctx.request.body?.data ?? ctx.request.body ?? {};
      }

      // Parse `items` JSON string if sent as text
      if (typeof body.items === 'string') {
        try { body.items = JSON.parse(body.items); } catch { body.items = []; }
      }

      // Build data payload — cast each field to its correct type
      const data = {};
      for (const [key, val] of Object.entries(body)) {
        if (FILE_FIELDS.includes(key)) continue; // handled below via files
        const cast = castField(key, val);
        if (cast !== undefined) data[key] = cast;
      }

      // Link to authenticated poster
      if (user) data.poster = user.id;

      // Set status from query param or body (draft vs pending)
      if (!data.status) data.status = 'draft';

      // Create product entity first (without files)
      const entity = await strapi.entityService.create('api::product.product', { data, populate: FILE_FIELDS });

      // Upload and attach files
      if (Object.keys(files).length > 0) {
        const fileUpdates = {};
        for (const field of FILE_FIELDS) {
          const file = files[field];
          if (!file) continue;
          const uploaded = await strapi.plugins.upload.services.upload.upload({
            data: { ref: 'api::product.product', refId: entity.id, field },
            files: Array.isArray(file) ? file : [file],
          });
          if (uploaded?.length) fileUpdates[field] = uploaded[0].id;
        }
        if (Object.keys(fileUpdates).length > 0) {
          await strapi.entityService.update('api::product.product', entity.id, {
            data: fileUpdates,
            populate: FILE_FIELDS,
          });
        }
      }

      // Re-fetch with full populate
      const result = await strapi.entityService.findOne('api::product.product', entity.id, {
        populate: [...FILE_FIELDS, 'poster'],
      });

      return { data: result };
    } catch (error) {
      strapi.log.error('product.create error:', error);
      return ctx.badRequest('Tạo hàng hóa thất bại', { error: error.message });
    }
  },

  // ── FIND (list with filters + pagination) ───────────────────────────────
  async find(ctx) {
    try {
      const {
        listingType, categoryType, conditionType, nation, province, name,
        page = 1, pageSize = 25, isEmptyPic = false
      } = ctx.query;

      const filters = {};
      if (listingType?.trim()) filters.listingType = listingType;
      if (categoryType?.trim()) filters.categoryType = categoryType;
      if (conditionType?.trim()) filters.conditionType = conditionType;
      if (nation?.trim()) filters.nation = nation;
      if (province?.trim()) filters.province = province;
      if (name?.trim()) filters.name = { $containsi: name };

      const pageNum = parseInt(page, 10);
      const pageSizeNum = parseInt(pageSize, 10);
      const start = (pageNum - 1) * pageSizeNum;

      let products = await strapi.entityService.findMany('api::product.product', {
        filters,
        populate: ['image', 'poster'],
        start,
        limit: pageSizeNum,
      });

      const total = await strapi.entityService.count('api::product.product', { filters });

      if (isEmptyPic === 'true' || isEmptyPic === true) {
        products = products.filter(p => !p.personInCharge);
      }

      return {
        data: products,
        meta: {
          pagination: {
            page: pageNum,
            pageSize: pageSizeNum,
            pageCount: Math.ceil(total / pageSizeNum),
            total,
          },
        },
      };
    } catch (error) {
      return ctx.badRequest('Error fetching products', { error: error.message });
    }
  },
}));
