'use strict';

const crypto = require('crypto');
const fs = require('fs');

module.exports = {
  async verifyHash(filePath, originalHash) {
    const fileBuffer = fs.readFileSync(filePath);
    const newHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    return newHash === originalHash;
  },
};