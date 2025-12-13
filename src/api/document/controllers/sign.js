'use strict';

const pdfGen = require('../services/pdf-generator');
const signer = require('../services/signer');
const { uploadFromBuffer } = require('../../../common/services/cloudinary');

module.exports = {
  async signDocument(ctx) {
    const { id } = ctx.params;
    const { signerInfo } = ctx.request.body || {};

    try {
      const doc = await strapi.entityService.findOne('api::document.document', id);
      if (!doc) {
        return ctx.notFound('Document not found');
      }

      // 1) Generate base PDF from template
      const basePdfBytes = await pdfGen.generateBasePDF({ title: doc.title });

      // 2) Append a signature page (placed after the template pages)
      const pdfWithSigPage = await pdfGen.appendSignaturePage(basePdfBytes, { signerInfo, title: doc.title });

      // 3) Sign the combined PDF (eSign draws on the last page; CA performs certificate signing)
      const signResult = doc.signType === 'CA'
        ? await signer.caSign(pdfWithSigPage)
        : await signer.eSign(pdfWithSigPage, signerInfo);

      // Upload signed PDF directly to Cloudinary via Strapi upload service
      const filename = `${doc.title}-signed-${Date.now()}.pdf`;
      const pdfBuffer = Buffer.isBuffer(signResult.signedPdf)
        ? signResult.signedPdf
        : Buffer.from(signResult.signedPdf);

      const file = await uploadFromBuffer(pdfBuffer, {
        filename,
        mime: 'application/pdf',
        folder: 'signed-docs',
      });

      await strapi.entityService.update('api::document.document', id, {
        data: {
          docStatus: "signed",
          pdfUrl: file.url, 
          pdfHash: signResult.hash,
        },
      });

      ctx.body = { success: true, fileUrl: file.url, hash: signResult.hash };
    } catch (err) {
      // Mark document as failed when errors occur
      try {
        await strapi.entityService.update('api::document.document', id, {
          data: { docStatus: 'failed' },
        });
      } catch (_) {}
      ctx.status = 500;
      ctx.body = { success: false, message: err.message };
    }
  },
};