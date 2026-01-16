const { realtimeDB } = require('./services/firebase.js');

/**
 * Get logger instance - lazy loaded to ensure strapi is available
 */
const getLogger = () => {
  try {
    return strapi.service('plugin::system-logs.logger');
  } catch (error) {
    // Fallback to console if logger service is not available
    return {
      error: (...args) => console.error('[Notification]', ...args),
      info: (...args) => console.log('[Notification]', ...args),
    };
  }
};

const pushNotification = async (userId, templateCode) => {
  try {
    const notiTemplateService = await strapi.db.query('api::noti-template.noti-template');
    const templates = await notiTemplateService.findOne({
      where: {
        code: templateCode
      }
    });
    if (!templates) {
      const logger = getLogger();
      logger.error(`Notification template with code ${templateCode} not found`);
      return;
    }
    return await realtimeDB.pushData(`notifications/${userId}`, {
      pushDate: Date.now(),
      templateCode: templates.code,
      message: templates.message,
      read: false
    });
  } catch (error) {
    console.error('[Notification] pushNotification error:', error);
    // Don't throw - notification failure shouldn't break registration
    return null;
  }
}

const pushNotificationWithData = async (userId, templateCode, data) => {
  try {
    const notificationMsg = await getNotiTemplateByCode(templateCode);
    if (!notificationMsg) {
      const logger = getLogger();
      logger.error(`Notification template with code ${templateCode} not found`);
      return;
    }
    return await realtimeDB.writeData(`notifications/`, {
      userId,
      ...notificationMsg,
      ...data
    });
  } catch (error) {
    console.error('[Notification] pushNotificationWithData error:', error);
    return null;
  }
}



module.exports = { pushNotification, pushNotificationWithData }

