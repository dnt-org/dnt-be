'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function ensureEnv() {
  const missing = [];
  if (!process.env.CLOUDINARY_NAME) missing.push('CLOUDINARY_NAME');
  if (!process.env.CLOUDINARY_KEY) missing.push('CLOUDINARY_KEY');
  if (!process.env.CLOUDINARY_SECRET) missing.push('CLOUDINARY_SECRET');
  if (missing.length) {
    throw new Error(`Cloudinary env missing: ${missing.join(', ')}`);
  }
}

function makeSignature(params, apiSecret) {
  const keys = Object.keys(params).sort();
  const toSign = keys
    .filter((k) => params[k] !== undefined && params[k] !== null && k !== 'file' && k !== 'api_key')
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return crypto.createHash('sha1').update(`${toSign}${apiSecret}`).digest('hex');
}

/**
 * Upload a buffer to Cloudinary via REST API using signed uploads
 * @param {Buffer} buffer - File data to upload
 * @param {Object} options
 * @param {string} [options.filename] - Desired filename in media library
 * @param {string} [options.mime] - MIME type (e.g., 'application/pdf')
 * @param {string} [options.folder] - Target folder (defaults to CLOUDINARY_FOLDER or 'strapi-uploads')
 * @returns {Promise<Object>} Normalized file object { url, secure_url, public_id, bytes, resource_type }
 */
async function uploadFromBuffer(buffer, options = {}) {
  ensureEnv();

  const {
    folder = process.env.CLOUDINARY_FOLDER || 'strapi-uploads',
    filename = `file-${Date.now()}`,
    mime = 'application/octet-stream',
  } = options;

  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error('uploadFromBuffer: buffer is required and must be a Buffer');
  }

  const cloudName = process.env.CLOUDINARY_NAME;
  const apiKey = process.env.CLOUDINARY_KEY;
  const apiSecret = process.env.CLOUDINARY_SECRET;

  const timestamp = Math.floor(Date.now() / 1000);
  const public_id = filename.replace(/\.[^/.]+$/, '');

  const params = { timestamp, folder, public_id };
  const signature = makeSignature(params, apiSecret);

  const form = new FormData();
  const blob = new Blob([buffer], { type: mime });
  form.append('file', blob, filename);
  form.append('api_key', apiKey);
  form.append('timestamp', String(timestamp));
  form.append('signature', signature);
  form.append('folder', folder);
  form.append('public_id', public_id);

  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
  const res = await fetch(endpoint, { method: 'POST', body: form });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloudinary upload failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  return {
    url: data.secure_url || data.url,
    secure_url: data.secure_url,
    public_id: data.public_id,
    bytes: data.bytes,
    resource_type: data.resource_type,
    original: data,
  };
}

/**
 * Upload a local file (by path) to Cloudinary via REST API
 * @param {string} filePath - Absolute or relative path to the file on disk
 * @param {Object} options
 * @param {string} [options.filename] - Desired filename in media library (defaults to basename)
 * @param {string} [options.mime] - MIME type (auto-detected by extension if not provided)
 * @param {string} [options.folder] - Target folder (defaults to CLOUDINARY_FOLDER or 'strapi-uploads')
 * @returns {Promise<Object>} Normalized file object { url, secure_url, public_id, bytes, resource_type }
 */
async function uploadFromPath(filePath, options = {}) {
  if (!filePath) throw new Error('uploadFromPath: filePath is required');

  const filename = options.filename || path.basename(filePath);
  const mime = options.mime || getMimeFromExt(filePath) || 'application/octet-stream';
  const buffer = fs.readFileSync(filePath);
  return uploadFromBuffer(buffer, { ...options, filename, mime });
}

function getMimeFromExt(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    case '.pdf':
      return 'application/pdf';
    case '.mp4':
      return 'video/mp4';
    default:
      return null;
  }
}

module.exports = {
  uploadFromBuffer,
  uploadFromPath,
};