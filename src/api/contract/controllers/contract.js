'use strict';

module.exports = {
  async generate(ctx) {
    try {
      const { body } = ctx.request;
      const docxBuffer = await strapi.service('api::contract.contract').generate(body);
      
      // Set response type to docx
      ctx.set('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      ctx.set('Content-Disposition', 'attachment; filename="contract.docx"');
      ctx.send(docxBuffer);
    } catch (err) {
      ctx.throw(500, err.message);
    }
  }
};
