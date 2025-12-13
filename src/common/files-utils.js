'use strict';

/**
 * Create a file entry in Strapi's media library
 * @param {string} url - The URL of the file
 * @param {Object} options - Additional options for file creation
 * @param {string} options.name - Custom name for the file (optional)
 * @param {string} options.provider - Provider name (default: 'cloudinary')
 * @param {string} options.mime - MIME type of the file (default: 'image/jpeg')
 * @param {string} options.ext - File extension (default: '.jpg')
 * @param {string} options.folderPath - Folder path in media library (default: '/')
 * @returns {Promise<Object>} Created file entry
 */
async function createFileEntry(url, options = {}) {
  if (!url) {
    return null;
  }

  const timestamp = Date.now();
  const defaultName = `file-${timestamp}`;

  const fileData = {
    name: options.name || defaultName,
    url: url,
    provider: options.provider || 'cloudinary',
    mime: options.mime || 'image/jpeg',
    size: options.size || 0,
    hash: options.hash || `${defaultName}`,
    ext: options.ext || '.jpg',
    folderPath: options.folderPath || '/',
  };

  try {
    const fileEntry = await strapi.db.query('plugin::upload.file').create({
      data: fileData
    });
    return fileEntry;
  } catch (error) {
    console.error('Error creating file entry:', error);
    return null;
  }
}

/**
 * Create multiple file entries in Strapi's media library
 * @param {string[]} urls - Array of file URLs
 * @param {Object} options - Additional options for file creation
 * @param {string} options.prefix - Prefix for file names (default: 'doc')
 * @param {string} options.provider - Provider name (default: 'cloudinary')
 * @param {string} options.mime - MIME type of the files (default: 'application/pdf')
 * @param {string} options.ext - File extension (default: '.pdf')
 * @param {string} options.folderPath - Folder path in media library (default: '/quality-files')
 * @returns {Promise<Object[]>} Array of created file entries
 */
async function createMultipleFileEntries(urls = [], options = {}) {
  if (!Array.isArray(urls) || urls.length === 0) {
    return [];
  }

  const timestamp = Date.now();
  const filePromises = urls.map(async (url, index) => {
    if (!url) return null;

    const fileData = {
      name: `${options.prefix || 'doc'}-${timestamp}-${index + 1}`,
      url: url,
      provider: options.provider || 'cloudinary',
      mime: options.mime || 'application/pdf',
      size: options.size || 0,
      hash: `quality-file-${timestamp}-${index + 1}`,
      ext: options.ext || '.pdf',
      folderPath: options.folderPath || '/quality-files',
    };

    try {
      return await strapi.db.query('plugin::upload.file').create({
        data: fileData
      });
    } catch (error) {
      console.error(`Error creating file entry for URL ${url}:`, error);
      return null;
    }
  });

  const results = await Promise.all(filePromises);
  return results.filter(entry => entry !== null);
}

module.exports = {
  createFileEntry,
  createMultipleFileEntries
};