'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

const PRODUCT_FILE_FIELDS = [
  'videoFile',
  'livestreamVideoFile', 'livestreamCertFile',
  'advertisingVideoFile', 'advertisingCertFile',
  'regLivestreamProductProfile', 'regLivestreamCertFile',
  'regProductAdCompanyProfile', 'regProductAdCertFile',
  'regPersonalBrandProductProfile', 'regPersonalBrandCertFile',
];

const ITEM_FILE_FIELDS = ['image', 'videoFile', 'qualityInfoFile', 'warrantyPolicyFile'];

const ITEM_SCALAR_FIELDS = [
  'rowIndex', 'name', 'model', 'shape', 'size', 'color',
  'warrantyChangeDays', 'warrantyRepairDays', 'repairWarrantyRetentionPercent',
  'maxDeliveryDaysAfterAcceptance', 'handoverLocation',
  'contractDurationMultiplicity', 'contractDurationUnit',
  'directPayment', 'depositRequirementDirect',
  'paymentViaWallet', 'depositRequirementWallet',
  'vat', 'timeUserMustPayAfterDelivery', 'quantityMinimum', 'unit',
  'unitMarketPrice', 'unitAskingPrice', 'amountDesired',
  'autoAcceptPrice', 'autoRejectPrice',
];

const BOOL_FIELDS = [
  'displayPrice', 'hidePrice', 'confirmOwnership',
  'regLivestreamGoods', 'regLivestreamGoodsAI', 'regLivestreamGoodsPerson',
  'regProductAdVideo', 'regProductAdAI', 'regProductAdPerson', 'regProductAdPlatformSupport',
  'regPersonalBrandVideo', 'regPersonalBrandAI', 'regPersonalBrandPerson',
];

function getBaseUrl(ctx) {
  const configured = strapi?.config?.get?.('server.url');
  if (configured) return configured.replace(/\/$/, '');
  const host = ctx?.request?.header?.host;
  const protocol = ctx?.request?.protocol;
  if (!host || !protocol) return '';
  return `${protocol}://${host}`;
}

function normalizeUrl(baseUrl, url) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/')) return `${baseUrl}${url}`;
  return url;
}

function extractMediaUrls(media, baseUrl) {
  if (!media) return [];

  if (Array.isArray(media)) {
    return media.flatMap((m) => extractMediaUrls(m, baseUrl));
  }

  if (media.url) {
    const u = normalizeUrl(baseUrl, media.url);
    return u ? [u] : [];
  }

  if (media.data) {
    if (Array.isArray(media.data)) {
      return media.data.flatMap((d) => extractMediaUrls(d, baseUrl));
    }
    return extractMediaUrls(media.data, baseUrl);
  }

  if (media.attributes?.url) {
    const u = normalizeUrl(baseUrl, media.attributes.url);
    return u ? [u] : [];
  }

  return [];
}

function attachFileLinks(result, ctx) {
  if (!result) return result;
  const baseUrl = getBaseUrl(ctx);

  const productFiles = {};
  for (const field of PRODUCT_FILE_FIELDS) {
    const urls = extractMediaUrls(result[field], baseUrl);
    if (urls.length) productFiles[field] = urls.length === 1 ? urls[0] : urls;
  }

  const itemFiles = Array.isArray(result.productItems)
    ? result.productItems.map((it) => {
      const files = {};
      for (const field of ITEM_FILE_FIELDS) {
        const urls = extractMediaUrls(it?.[field], baseUrl);
        if (urls.length) files[field] = urls.length === 1 ? urls[0] : urls;
      }
      return {
        id: it?.id,
        rowIndex: it?.rowIndex,
        ...files,
      };
    })
    : [];

  return {
    ...result,
    fileLinks: {
      product: productFiles,
      items: itemFiles,
    },
  };
}

function parseBody(raw) {
  const data = {};
  for (const [key, val] of Object.entries(raw)) {
    if (PRODUCT_FILE_FIELDS.includes(key)) continue;
    if (key === 'items' || key === 'productItems') continue; // handled separately
    if (val === '' || val === undefined || val === null) continue;
    if (BOOL_FIELDS.includes(key)) {
      data[key] = val === true || val === 'true' || val === '1';
    } else {
      data[key] = val;
    }
  }
  return data;
}

function parseItemData(raw) {
  const data = {};
  for (const field of ITEM_SCALAR_FIELDS) {
    const val = raw[field];
    if (val === '' || val === undefined || val === null) continue;
    data[field] = val;
  }
  // Use the FE local id as rowIndex if not already set
  if (data.rowIndex === undefined && raw.id !== undefined) {
    data.rowIndex = raw.id;
  }
  return data;
}

async function uploadFile(strapi, ref, refId, field, file) {
  const [uploaded] = await strapi.plugins.upload.services.upload.upload({
    data: { ref, refId, field },
    files: Array.isArray(file) ? file : [file],
  });
  return uploaded?.id ?? null;
}

module.exports = createCoreController('api::product.product', ({ strapi }) => ({

  async create(ctx) {
    try {
      const { user } = ctx.state;

      const rawBody = ctx.is('multipart')
        ? ctx.request.body || {}
        : ctx.request.body?.data ?? ctx.request.body ?? {};

      // Parse items — may come as JSON string (multipart) or array (JSON body)
      let rawItems = rawBody.items ?? rawBody.productItems ?? [];
      if (typeof rawItems === 'string') {
        try { rawItems = JSON.parse(rawItems); } catch { rawItems = []; }
      }
      if (!Array.isArray(rawItems)) rawItems = [];

      // Build product-level data
      const productData = {
        ...parseBody(rawBody),
        status: rawBody.status || 'draft',
        poster: user?.id ?? null,
      };

      // Create product (no items yet)
      const product = await strapi.entityService.create('api::product.product', {
        data: productData,
      });

      // Attach product-level files
      if (ctx.is('multipart') && ctx.request.files) {
        const fileUpdates = {};
        for (const field of PRODUCT_FILE_FIELDS) {
          const file = ctx.request.files[field];
          if (!file) continue;
          const id = await uploadFile(strapi, 'api::product.product', product.id, field, file);
          if (id) fileUpdates[field] = id;
        }
        if (Object.keys(fileUpdates).length) {
          await strapi.entityService.update('api::product.product', product.id, { data: fileUpdates });
        }
      }

      // Create each product-item
      for (let i = 0; i < rawItems.length; i++) {
        const rawItem = rawItems[i];
        const itemData = {
          ...parseItemData(rawItem),
          product: product.id,
        };

        const item = await strapi.entityService.create('api::product-item.product-item', {
          data: itemData,
        });

        // Attach item-level files (multipart only, keyed as items[0][image] etc.)
        if (ctx.is('multipart') && ctx.request.files) {
          const fileUpdates = {};
          for (const field of ITEM_FILE_FIELDS) {
            const file = ctx.request.files[`items[${i}][${field}]`]
              || ctx.request.files[`items.${i}.${field}`];
            if (!file) continue;
            const id = await uploadFile(strapi, 'api::product-item.product-item', item.id, field, file);
            if (id) fileUpdates[field] = id;
          }
          if (Object.keys(fileUpdates).length) {
            await strapi.entityService.update('api::product-item.product-item', item.id, { data: fileUpdates });
          }
        }
      }

      // Return product with items populated
      const populate = {
        poster: true,
        productItems: {
          populate: ITEM_FILE_FIELDS,
          sort: ['rowIndex:asc'],
        },
      };
      for (const field of PRODUCT_FILE_FIELDS) {
        populate[field] = true;
      }

      const result = await strapi.entityService.findOne('api::product.product', product.id, { populate });

      return { data: attachFileLinks(result, ctx) };
    } catch (err) {
      strapi.log.error('product.create:', err);
      return ctx.badRequest('Tạo hàng hóa thất bại', { error: err.message });
    }
  },

  async findOne(ctx) {
    try {
      const { id } = ctx.params;

      const populate = {
        poster: true,
        productItems: {
          populate: ITEM_FILE_FIELDS,
          sort: ['rowIndex:asc'],
        },
      };
      for (const field of PRODUCT_FILE_FIELDS) {
        populate[field] = true;
      }

      const asNumber = Number(id);
      const isNumericId = Number.isInteger(asNumber) && String(asNumber) === String(id);

      let result = null;
      if (isNumericId) {
        result = await strapi.entityService.findOne('api::product.product', asNumber, { populate });
      } else {
        let found = [];
        try {
          found = await strapi.entityService.findMany('api::product.product', {
            filters: { $or: [{ custom_id: id }, { documentId: id }] },
            limit: 1,
            populate,
          });
        } catch (_) {
          const dbFound = await strapi.db.query('api::product.product').findMany({
            where: { $or: [{ custom_id: id }, { documentId: id }] },
            limit: 1,
            populate,
          });
          found = dbFound;
        }
        result = Array.isArray(found) ? found[0] : null;
      }

      if (!result) return ctx.notFound();
      return { data: attachFileLinks(result, ctx) };
    } catch (err) {
      return ctx.badRequest('Error fetching product', { error: err.message });
    }
  },

  async uploadFile(ctx) {
    const { id, field } = ctx.params;
    if (!PRODUCT_FILE_FIELDS.includes(field)) {
      return ctx.badRequest('Invalid field name');
    }
    const file = ctx.request.files?.file;
    if (!file) return ctx.badRequest('No file provided');

    const job = await strapi.entityService.create('api::upload-job.upload-job', {
      data: {
        product: id,
        fieldName: field,
        fileName: file.name || file.originalFilename,
        fileSize: file.size,
        status: 'uploading',
      },
    });

    try {
      const [uploaded] = await strapi.plugins.upload.services.upload.upload({
        data: { ref: 'api::product.product', refId: id, field },
        files: [file],
      });
      await strapi.entityService.update('api::product.product', id, {
        data: { [field]: uploaded.id },
      });
      await strapi.entityService.update('api::upload-job.upload-job', job.id, {
        data: { status: 'done' },
      });
      return { data: { jobId: job.id, status: 'done', fileId: uploaded.id } };
    } catch (err) {
      await strapi.entityService.update('api::upload-job.upload-job', job.id, {
        data: { status: 'failed', error: err.message },
      });
      strapi.log.error('product.uploadFile:', err);
      return ctx.badRequest('Upload failed', { error: err.message });
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
        populate: (() => {
          const populate = {
            poster: true,
            productItems: {
              populate: ITEM_FILE_FIELDS,
              sort: ['rowIndex:asc'],
            },
          };
          for (const field of PRODUCT_FILE_FIELDS) {
            populate[field] = true;
          }
          return populate;
        })(),
        start: (pageNum - 1) * pageSizeNum,
        limit: pageSizeNum,
      });

      const total = await strapi.entityService.count('api::product.product', { filters });

      if (isEmptyPic === 'true' || isEmptyPic === true) {
        products = products.filter(p => !p.personInCharge);
      }

      return {
        data: (products || []).map((p) => attachFileLinks(p, ctx)),
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
