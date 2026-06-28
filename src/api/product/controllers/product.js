'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

const FILE_FIELDS = [
  'videoFile',
  'livestreamVideoFile', 'livestreamCertFile',
  'advertisingVideoFile', 'advertisingCertFile',
  'regLivestreamProductProfile', 'regLivestreamCertFile',
  'regProductAdCompanyProfile', 'regProductAdCertFile',
  'regPersonalBrandProductProfile', 'regPersonalBrandCertFile',
];

// Schema-level string keys that hold boolean values when sent as form strings
const BOOL_FIELDS = [
  'displayPrice', 'hidePrice', 'confirmOwnership',
  'regLivestreamGoods', 'regLivestreamGoodsAI', 'regLivestreamGoodsPerson',
  'regProductAdVideo', 'regProductAdAI', 'regProductAdPerson', 'regProductAdPlatformSupport',
  'regPersonalBrandVideo', 'regPersonalBrandAI', 'regPersonalBrandPerson',
];

function parseBody(raw) {
  const data = {};
  for (const [key, val] of Object.entries(raw)) {
    if (FILE_FIELDS.includes(key)) continue;
    if (val === '' || val === undefined || val === null) continue;
    if (BOOL_FIELDS.includes(key)) {
      data[key] = val === true || val === 'true' || val === '1';
    } else {
      data[key] = val;
    }
  }
  return data;
}

module.exports = createCoreController('api::product.product', ({ strapi }) => ({

  async create(ctx) {
    try {
      const { user } = ctx.state;

      const rawBody = ctx.is('multipart')
        ? ctx.request.body || {}
        : ctx.request.body?.data ?? ctx.request.body ?? {};

      if (typeof rawBody.items === 'string') {
        try { rawBody.items = JSON.parse(rawBody.items); } catch { rawBody.items = []; }
      }

      const data = {
        ...parseBody(rawBody),
        status: rawBody.status || 'draft',
        poster: user?.id ?? null,
      };

      const entity = await strapi.entityService.create('api::product.product', {
        data,
        populate: FILE_FIELDS,
      });

      // Attach uploaded files (multipart only)
      if (ctx.is('multipart') && ctx.request.files) {
        const fileUpdates = {};
        for (const field of FILE_FIELDS) {
          const file = ctx.request.files[field];
          if (!file) continue;
          const [uploaded] = await strapi.plugins.upload.services.upload.upload({
            data: { ref: 'api::product.product', refId: entity.id, field },
            files: Array.isArray(file) ? file : [file],
          });
          if (uploaded) fileUpdates[field] = uploaded.id;
        }
        if (Object.keys(fileUpdates).length) {
          await strapi.entityService.update('api::product.product', entity.id, {
            data: fileUpdates,
          });
        }
      }

      const result = await strapi.entityService.findOne('api::product.product', entity.id, {
        populate: [...FILE_FIELDS, 'poster'],
      });

      return { data: result };
    } catch (err) {
      strapi.log.error('product.create:', err);
      return ctx.badRequest('Tạo hàng hóa thất bại', { error: err.message });
    }
  },

  async find(ctx) {
    try {
      const {
        listingType, categoryType, conditionType, nation, province, name,
        page = 1, pageSize = 25, isEmptyPic = false,
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

      let products = await strapi.entityService.findMany('api::product.product', {
        filters,
        populate: ['videoFile', 'poster'],
        start: (pageNum - 1) * pageSizeNum,
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
    } catch (err) {
      return ctx.badRequest('Error fetching products', { error: err.message });
    }
  },
}));
