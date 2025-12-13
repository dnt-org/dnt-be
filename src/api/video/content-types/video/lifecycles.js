'use strict';

const { errors } = require('@strapi/utils');
const { createFileEntry } = require('../../../../common/files-utils');

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

const beforeCreate = async (event) => {
  const { data } = event.params;

  if (data.source!=null) {
    const imageFile = await createFileEntry(data.source);
    data.source = imageFile.id;
  }

}

const beforeUpdate = async (event) => {
  const { data } = event.params;

  if (data.source!=null) {
    const imageFile = await createFileEntry(data.source);
    data.source = imageFile.id;
  }
}

module.exports = {
  beforeUpdate, beforeCreate
}; 