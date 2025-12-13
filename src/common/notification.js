const { realtimeDB } = require('./services/firebase.js');

const pushNotification = async (userId, templateCode) => {
    const notiTemplateService = await strapi.db.query('api::noti-template.noti-template');
    const templates = await notiTemplateService.findOne({
      where: {
        code: templateCode
      }
    });
    if (!templates) {
      throw new Error(`Notification template with code ${templateCode} not found`);
    }
    return await realtimeDB.pushData(`notifications/${userId}`, {
        pushDate: Date.now(),
        templateCode: templates.code,
        message: templates.message,
        read: false
    });
}

const pushNotificationWithData = async (userId, templateId, data) => {
    const notificationMsg = await getNotiTemplateByCode(templateId);
  return await realtimeDB.writeData(`notifications/`, {
    userId,
    ...notificationMsg,
    ...data
  });
}



module.exports = {pushNotification, pushNotificationWithData}
