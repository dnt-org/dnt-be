'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

const ITEM_FILE_FIELDS = ['image', 'videoFile', 'qualityInfoFile', 'warrantyPolicyFile'];

module.exports = createCoreController('api::product-item.product-item', ({ strapi }) => ({

  async uploadFile(ctx) {
    const { id, field } = ctx.params;
    if (!ITEM_FILE_FIELDS.includes(field)) {
      return ctx.badRequest('Invalid field name');
    }
    const file = ctx.request.files?.file;
    if (!file) return ctx.badRequest('No file provided');

    const job = await strapi.entityService.create('api::upload-job.upload-job', {
      data: {
        productItem: id,
        fieldName: field,
        fileName: file.name || file.originalFilename,
        fileSize: file.size,
        status: 'uploading',
      },
    });

    try {
      const [uploaded] = await strapi.plugins.upload.services.upload.upload({
        data: { ref: 'api::product-item.product-item', refId: id, field },
        files: [file],
      });
      await strapi.entityService.update('api::product-item.product-item', id, {
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
      strapi.log.error('product-item.uploadFile:', err);
      return ctx.badRequest('Upload failed', { error: err.message });
    }
  },

}));
