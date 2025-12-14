const { realtimeDB } = require('./services/firebase.js');
const logger =
  strapi.service('plugin::system-logs.logger')

const pushNotification = async (userId, templateCode) => {
  const notiTemplateService = await strapi.db.query('api::noti-template.noti-template');
  const templates = await notiTemplateService.findOne({
    where: {
      code: templateCode
    }
  });
  if (!templates) {
    logger.error(`Notification template with code ${templateCode} not found`);
    return;
  }
  return await realtimeDB.pushData(`notifications/${userId}`, {
    pushDate: Date.now(),
    templateCode: templates.code,
    message: templates.message,
    read: false
  });
}

const pushNotificationWithData = async (userId, templateCode, data) => {
  const notificationMsg = await getNotiTemplateByCode(templateCode);
  if (!notificationMsg) {
    logger.error(`Notification template with code ${templateCode} not found`);
    return;
  }
  return await realtimeDB.writeData(`notifications/`, {
    userId,
    ...notificationMsg,
    ...data
  });
}



module.exports = { pushNotification, pushNotificationWithData }
