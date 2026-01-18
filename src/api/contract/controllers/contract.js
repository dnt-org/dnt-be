'use strict';

const { PDFDocument, StandardFonts } = require('pdf-lib');

module.exports = {
  async generate(ctx) {
    try {
      const { body } = ctx.request;
      const html = await strapi.service('api::contract.contract').generate(body);
      
      // Set response type to HTML
      ctx.set('Content-Type', 'text/html');
      ctx.send(html);
    } catch (err) {
      ctx.throw(500, err.message);
    }
  }
};
