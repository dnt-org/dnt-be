'use strict';

const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

module.exports = {
  /**
   * Generate a PDF using a system template if available.
   * If `templatePath` is provided (or `PDF_TEMPLATE_PATH` env is set), load it and overlay title text.
   * Otherwise, create a fresh PDF and draw the title.
   *
   * @param {Object} content
   * @param {string} [content.title] - Title text to draw on the PDF
   * @param {string} [content.templatePath] - Absolute/relative path to a template PDF
   * @returns {Promise<Uint8Array>} PDF bytes
   */
  async generateBasePDF(content = {}) {
    const { title = '', templatePath } = content;
    const envTemplate = process.env.PDF_TEMPLATE_PATH;

    const candidatePath = templatePath || envTemplate || null;
    let pdf;

    if (candidatePath) {
      const resolved = path.resolve(candidatePath);
      if (!fs.existsSync(resolved)) {
        // Fallback to a new PDF if the template path is invalid
        pdf = await PDFDocument.create();
        pdf.addPage();
      } else {
        const templateBytes = fs.readFileSync(resolved);
        pdf = await PDFDocument.load(templateBytes);
        // Ensure there is at least one page
        if (pdf.getPages().length === 0) {
          pdf.addPage();
        }
      }
    } else {
      pdf = await PDFDocument.create();
      pdf.addPage();
    }

    const page = pdf.getPages()[0];
    const { width, height } = page.getSize();
    if (title) {
      page.drawText(title, { x: 50, y: height - 50, size: 18, color: rgb(0, 0, 0) });
    }
    const pdfBytes = await pdf.save();
    return pdfBytes;
  },

  /**
   * Append a signature page to an existing PDF.
   * @param {Uint8Array|Buffer} pdfBuffer - Existing PDF bytes
   * @param {Object} options
   * @param {Object} [options.signerInfo] - Info about the signer { name }
   * @param {string} [options.title] - Optional title to draw on the signature page
   * @returns {Promise<Uint8Array>} New PDF bytes with the appended page
   */
  async appendSignaturePage(pdfBuffer, options = {}) {
    const { signerInfo = {}, title = '' } = options;
    const pdf = await PDFDocument.load(Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer));
    const page = pdf.addPage();
    const { width, height } = page.getSize();
    const now = new Date();
    const yStart = height - 60;
    page.drawText('Signature Page', { x: 50, y: yStart, size: 16, color: rgb(0, 0, 0) });
    if (title) {
      page.drawText(`Document: ${title}`, { x: 50, y: yStart - 30, size: 12, color: rgb(0, 0, 0) });
    }
    page.drawText(`Signed by: ${signerInfo.name || 'Unknown'}`, { x: 50, y: yStart - 55, size: 12, color: rgb(0, 0.2, 0.6) });
    page.drawText(`Date: ${now.toISOString()}`, { x: 50, y: yStart - 80, size: 12, color: rgb(0, 0, 0) });

    const out = await pdf.save();
    return out;
  },
};