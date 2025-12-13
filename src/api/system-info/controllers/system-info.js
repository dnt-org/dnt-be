'use strict';

const { pushNotification } = require('../../../common/notification');
const { realtimeDB } = require('../../../common/services/firebase');
const {data } = require('./nuoc.json');
// Use the plugin logger service; provide a safe fallback
const logger =
  strapi.service('plugin::system-logs.logger') 
/**
 * system-info controller
 */

const getMetrics = async (ctx) => {

    try {
        const metricsResults = await strapi.db.query('api::system-info.system-info').findMany({
            select: [
                'listedValue',
                'transactions',
                'accesses',
                'successfully',
                'amount',
                'duration',
                'latestBank',
                'deposited',
                'videoViews',
                'withdrawn',
                'members',
                'remaining',
                'online',
                'hasExpiry',
                'lastUpdated'
            ],
            limit: 1
        });

        const metrics = metricsResults[0] || null;
        
        // await pushNotification(1, "N1");
        //logger.error('error fetching system info metrics', metrics);
        
        return {
            data: metrics
        };  
    } catch (err) {
        ctx.throw(500, err);
    }
}

const updateMetrics = async (ctx) => {
    try {
        const {
            listedValue,
            transactions,
            accesses,
            successfully,
            amount,
            duration,
            latestBank,
            deposited,
            videoViews,
            withdrawn,
            members,
            remaining,
            online,
            hasExpiry
        } = ctx.request.body.data;

        const existingMetricsResults = await strapi.db.query('api::system-info.system-info').findMany({
            limit: 1
        }); 
        
        const existingMetrics = existingMetricsResults[0];

        const data = {
            listedValue: listedValue || existingMetrics?.listedValue,
            transactions: transactions || existingMetrics?.transactions,
            accesses: accesses || existingMetrics?.accesses,
            successfully: successfully || existingMetrics?.successfully,
            amount: amount || existingMetrics?.amount,
            duration: duration || existingMetrics?.duration,
            latestBank: latestBank || existingMetrics?.latestBank,
            deposited: deposited || existingMetrics?.deposited,
            videoViews: videoViews || existingMetrics?.videoViews,
            withdrawn: withdrawn || existingMetrics?.withdrawn,
            members: members || existingMetrics?.members,
            remaining: remaining || existingMetrics?.remaining,
            online: online || existingMetrics?.online,
            hasExpiry: hasExpiry !== undefined ? hasExpiry : existingMetrics?.hasExpiry,
            lastUpdated: new Date()
        };

        let metrics;
        if (existingMetrics) {
            metrics = await strapi.db.query('api::system-info.system-info').update({
                where: { id: existingMetrics.id },
                data
            }); 
        } else {
            metrics = await strapi.db.query('api::system-info.system-info').create({
                data
            });
        }   

        return {
            data: metrics
        };
    } catch (err) {
        ctx.throw(500, err);
    }
}   

const getCountryData = async (ctx) => {
    return data;
}

module.exports = {
    getMetrics,
    updateMetrics,
    getCountryData
}