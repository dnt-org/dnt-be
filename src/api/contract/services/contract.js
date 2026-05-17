'use strict';

const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const https = require('https');
const http = require('http');

// Helper to download remote file into buffer
const downloadFile = (url) => {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download template, status code: ${res.statusCode}`));
      }
      const data = [];
      res.on('data', (chunk) => data.push(chunk));
      res.on('end', () => resolve(Buffer.concat(data)));
    }).on('error', (err) => reject(err));
  });
};

module.exports = ({ strapi }) => ({
  async generate(data) {
    let collateral;
    
    // Find collateral by code or id
    if (data.collateralCode) {
      const collaterals = await strapi.entityService.findMany('api::collateral.collateral', {
        filters: { code: data.collateralCode },
        populate: { file: true },
        limit: 1,
      });
      collateral = collaterals[0];
    } else {
      const collateralId = typeof data.collateral === 'object' && data.collateral !== null 
        ? data.collateral.id 
        : (data.collateral || data.collateralId || data.collateral_id);
        
      if (!collateralId) {
        throw new Error('collateral ID or collateralCode is missing from data');
      }
      
      collateral = await strapi.entityService.findOne('api::collateral.collateral', collateralId, {
        populate: { file: true }
      });
    }

    if (!collateral || !collateral.file || collateral.file.length === 0) {
      throw new Error('Collateral or template file not found');
    }

    // Get the first file's URL
    const fileMeta = collateral.file[0];
    const fileUrl = fileMeta.url;
    
    // Load template buffer (local or remote)
    let contentBuffer;
    if (fileUrl.startsWith('http')) {
      contentBuffer = await downloadFile(fileUrl);
    } else {
      const filePath = path.join(process.cwd(), 'public', fileUrl);
      if (!fs.existsSync(filePath)) {
        throw new Error('Local template file not found: ' + filePath);
      }
      contentBuffer = fs.readFileSync(filePath);
    }

    // Process docx template
    const zip = new PizZip(contentBuffer);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Replace fields
    doc.render(data);

    // Return the generated docx buffer
    const buf = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    return buf;
  },
});
