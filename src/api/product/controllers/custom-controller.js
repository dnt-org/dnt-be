'use strict';
const { createFileEntry, createMultipleFileEntries } = require('../../../common/files-utils');


const createProduct = async (ctx) => {
  const { 
    name, model, size, color, price, askingPrice, displayPrice, hidePrice, 
    location, address, description, estimatedValue, image, qualityFiles, 
    deliveryDate, depositRequirement, autoAcceptPrice, unit, marketPrice,
    lowestUnitAskingPrice, highestUnitAskingPrice, deliveryDays, endPostTime,
    lowestAmount, highestAmount, lowestAutoAcceptPrice, highestAutoAcceptPrice,
    contractDuration, personInCharge, phoneNumber, email, confirmOwnership,
    eventFeePercentage, livestreamFee, advertisingAmount, showOnMainPage,
    showOnVideo, advertisingUrl, registerForAdvertising, successFee, totalFees,
    listingType, categoryType, conditionType, nation, province
  } = ctx.request.body;

  const imageFile = await createFileEntry(image);
  const qualityFilesFiles = await createMultipleFileEntries(qualityFiles);

  const listingTypeMap = {
    sell: 'B',
    buy: 'M',
    rent: 'T',
    forRent: 'CT',
    service: 'DV',
  }

  const categoryTypeMap = {
    goods: "HH",
    land: "BDS",
    vehicle: "PT",
    manpower: "NL",
    importExport: "XNK",
  }

  const conditionTypeMap = {
    scrap: "PL",
    new: "M",
    old: "C",
    unused: "CSD",
  }

  const generateCustomId = async (listingType, categoryType, conditionType) => {
    const count = await strapi.entityService.count('api::product.product');
    const year = new Date().getFullYear();
    const listingTypePrefix = listingTypeMap[listingType] || '';
    const categoryTypePrefix = categoryTypeMap[categoryType] || '';
    const conditionTypePrefix = conditionTypeMap[conditionType] || '';

    return `${listingTypePrefix}-${categoryTypePrefix}-${conditionTypePrefix}-${year}-${count+1}`;

  };

  const customId = await generateCustomId(listingType, categoryType, conditionType);

  try {
    // Create the product entry
    const entry = await strapi.entityService.create('api::product.product', {
      data: {
        name,
        model,
        size,
        color,
        price,
        askingPrice,
        displayPrice: displayPrice ?? true,
        hidePrice: hidePrice ?? false,
        location,
        address,
        description,
        estimatedValue,
        image: imageFile ? imageFile.id : null,
        qualityFiles: qualityFilesFiles ? qualityFilesFiles.map(file => file.id) : null,
        deliveryDate,
        depositRequirement,
        autoAcceptPrice,
        unit,
        marketPrice,
        lowestUnitAskingPrice,
        highestUnitAskingPrice,
        deliveryDays,
        endPostTime,
        lowestAmount,
        highestAmount,
        lowestAutoAcceptPrice,
        highestAutoAcceptPrice,
        contractDuration,
        personInCharge,
        phoneNumber,
        email,
        confirmOwnership: confirmOwnership ?? false,
        eventFeePercentage,
        livestreamFee,
        advertisingAmount,
        showOnMainPage: showOnMainPage ?? false,
        showOnVideo: showOnVideo ?? false,
        advertisingUrl,
        registerForAdvertising: registerForAdvertising ?? false,
        successFee,
        totalFees,
        publishedAt: new Date(),
        custom_id: customId,
        listingType: listingType ?? 'sell',
        categoryType: categoryType ?? 'goods',
        conditionType: conditionType ?? 'new',
        nation: nation ?? 'Vietnam',
        province: province ?? 'HCM'
      }
    });
    return entry;
  } catch (error) {
    console.log(error.details);
    
    return ctx.badRequest('Failed to create product', { error: error.details[0].message });
  }
};

const updateProductPic = async (ctx) => {
  const { id } = ctx.params;
  const { setPrice, depositRequirement } = ctx.request.body;

  try {
    // Update only setPrice and depositRequirement fields
    const entry = await strapi.entityService.update('api::product.product', id, {
      data: {
        setPrice,
        depositRequirement
      }
    });
    
    return entry;
  } catch (error) {
    console.log(error.details);
    
    return ctx.badRequest('Failed to update product', { error: error.details?.[0]?.message || error.message });
  }
};


module.exports = {
  createProduct,
  updateProductPic
};
