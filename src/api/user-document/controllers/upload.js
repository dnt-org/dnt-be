'use strict';

const jwt = require('jsonwebtoken');
const fs = require('fs');
const os = require('os');
const path = require('path');

module.exports = {
  async getMyDocuments(ctx) {
    const token = ctx.request.header.authorization?.split(' ')[1];
    if (!token) return ctx.unauthorized('No token provided');

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return ctx.unauthorized('Invalid token');
    }

    const docs = await strapi.entityService.findMany('api::user-document.user-document', {
      filters: { user_id: decoded.id },
      populate: ['file'],
    });

    return ctx.send({ data: docs });
  },

  async uploadDocument(ctx) {
    const token = ctx.request.header.authorization?.split(' ')[1];
    if (!token) return ctx.unauthorized('No token provided');

    try {
      jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return ctx.unauthorized('Invalid token');
    }

    const { imageBase64, type } = ctx.request.body;
    if (!imageBase64) return ctx.badRequest('No image data provided');

    const docType = type || 'document';
    const filename = `${docType}_${Date.now()}.png`;

    // Strip data URL prefix and decode to buffer
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const tmpPath = path.join(os.tmpdir(), filename);
    fs.writeFileSync(tmpPath, buffer);

    try {
      const uploadService = strapi.plugin('upload').service('upload');
      const [uploaded] = await uploadService.upload({
        data: {
          fileInfo: { name: filename, alternativeText: docType },
        },
        files: {
          filepath: tmpPath,
          originalFilename: filename,
          mimetype: 'image/png',
          size: buffer.length,
        },
      });

      return ctx.send({ success: true, file: uploaded });
    } catch (err) {
      return ctx.internalServerError(err?.message || 'Upload failed');
    } finally {
      try { fs.unlinkSync(tmpPath); } catch (_) {}
    }
  },
};
