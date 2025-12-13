'use strict';

const { PDFDocument, rgb } = require('pdf-lib');
const crypto = require('crypto');
const fs = require('fs');
let nodeSignpdf;
try {
  nodeSignpdf = require('node-signpdf').default;
} catch (e) {
  nodeSignpdf = null;
}

module.exports = {
  async eSign(pdfBuffer, signerInfo) {
    const pdf = await PDFDocument.load(pdfBuffer);
    const pages = pdf.getPages();
    const targetPage = pages[pages.length - 1];
    targetPage.drawText(`Signed by: ${signerInfo?.name || 'Unknown'}`, {
      x: 50,
      y: 50,
      size: 10,
      color: rgb(0, 0.2, 0.6),
    });

    const signedPdf = await pdf.save();
    const hash = crypto.createHash('sha256').update(signedPdf).digest('hex');
    return { signedPdf, hash };
  },

  async caSign(pdfBuffer) {
    if (!nodeSignpdf) {
      throw new Error('node-signpdf is not installed. Please install it to use CA signing.');
    }

    const certPath = process.env.CERT_P12_PATH || '/path/to/cert.p12';
    const passphrase = process.env.CERT_PASS || '';

    if (!fs.existsSync(certPath)) {
      throw new Error('P12 certificate not found. Set CERT_P12_PATH env var to a valid file.');
    }

    // node-signpdf requires a placeholder; real implementation should add it.
    // Here we attempt to sign and surface a clear error if placeholder is missing.
    const p12Buffer = fs.readFileSync(certPath);
    let signedPdf;
    try {
      signedPdf = nodeSignpdf.sign(pdfBuffer, p12Buffer, { passphrase });
    } catch (err) {
      throw new Error(`CA signing failed: ${err.message}`);
    }

    const hash = crypto.createHash('sha256').update(signedPdf).digest('hex');
    return { signedPdf, hash };
  },
};