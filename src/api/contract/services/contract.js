'use strict';

const fs = require('fs');
const path = require('path');

module.exports = ({ strapi }) => ({
  async generate(data) {
    const templatePath = path.join(process.cwd(), 'templates', 'contract.html');
    
    if (!fs.existsSync(templatePath)) {
      throw new Error('Template not found');
    }

    let content = fs.readFileSync(templatePath, 'utf8');

    // Replace placeholders {{var-name}}
    content = content.replace(/\{\{([\w\-\.]+)\}\}/g, (match, key) => {
      const keys = key.split('.');
      let value = data;
      
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          // If key not found in data, check if it's a top-level key that wasn't found (e.g. if path is wrong)
          // For now, return match to leave it as is, or empty string?
          // Usually better to leave it if not found, or replace with empty string.
          // Let's return match (leave it) to debug, or empty string.
          // User said "consider paramenter is {{var-name}}".
          // Let's return empty string if not found to avoid ugly {{...}} in output, 
          // but strictly speaking, if data is missing, maybe keep it?
          // I'll replace with empty string if strictly not found, but "match" is safer if I'm not sure.
          // Let's try to resolve.
          return match;
        }
      }
      
      if (typeof value === 'object') {
        // If it's an object (like country), try to use .label or .value if available, or JSON stringify
        // But for a contract, [object Object] is bad.
        // If the template just says {{country}}, and country is {value, label}, what to do?
        // Maybe default to .value or .label?
        // Or just return the value if it's not object.
        return JSON.stringify(value); 
      }
      
      return value !== undefined && value !== null ? String(value) : '';
    });

    return content;
  },
});
