# Firebase Realtime Database Integration

This document explains how to use the Firebase Realtime Database integration in your Strapi CMS service.

## Overview

The Firebase service has been enhanced with Realtime Database functionality, providing real-time data synchronization capabilities for your application.

## Setup

### 1. Enable Realtime Database in Firebase Console

1. Go to your Firebase Console (https://console.firebase.google.com/)
2. Select your project (`dnts-bd247`)
3. Navigate to "Realtime Database" in the left sidebar
4. Click "Create Database"
5. Choose your security rules (start in test mode for development)

### 2. Security Rules

For development, you can use these basic rules:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

For production, implement more specific rules based on your data structure.

## Usage

### Import the Service

```javascript
import { realtimeDB } from '../common/services/firebase.js';
```

### Available Methods

#### 1. Write Data

Write data to a specific path:

```javascript
const result = await realtimeDB.writeData('users/123', {
  name: 'John Doe',
  email: 'john@example.com',
  timestamp: Date.now()
});

if (result.success) {
  console.log('Data written successfully');
} else {
  console.error('Error:', result.error);
}
```

#### 2. Read Data

Read data once from a specific path:

```javascript
const result = await realtimeDB.readData('users/123');

if (result.success) {
  if (result.data) {
    console.log('User data:', result.data);
  } else {
    console.log('No data found');
  }
} else {
  console.error('Error:', result.error);
}
```

#### 3. Push Data

Add data with an auto-generated key:

```javascript
const result = await realtimeDB.pushData('messages', {
  text: 'Hello World',
  userId: '123',
  timestamp: Date.now()
});

if (result.success) {
  console.log('Message added with key:', result.key);
}
```

#### 4. Update Data

Update specific fields:

```javascript
const result = await realtimeDB.updateData('users/123', {
  lastLogin: Date.now(),
  status: 'online'
});

if (result.success) {
  console.log('User updated successfully');
}
```

#### 5. Delete Data

Remove data from a path:

```javascript
const result = await realtimeDB.deleteData('users/123');

if (result.success) {
  console.log('User deleted successfully');
}
```

#### 6. Listen to Real-time Changes

Listen for real-time updates:

```javascript
const dataRef = realtimeDB.listenToData('users/123', (data) => {
  if (data) {
    console.log('User data updated:', data);
  } else {
    console.log('User data deleted');
  }
});

// Stop listening when component unmounts or when no longer needed
realtimeDB.stopListening(dataRef);
```

#### 7. Get Database Reference

Get a direct reference for advanced operations:

```javascript
const userRef = realtimeDB.getRef('users/123');
// Use with other Firebase methods as needed
```

## Common Use Cases

### 1. Real-time Chat

```javascript
// Send message
const sendMessage = async (chatId, message) => {
  return await realtimeDB.pushData(`chats/${chatId}/messages`, {
    text: message.text,
    userId: message.userId,
    timestamp: Date.now()
  });
};

// Listen to new messages
const listenToMessages = (chatId, callback) => {
  return realtimeDB.listenToData(`chats/${chatId}/messages`, callback);
};
```

### 2. User Presence

```javascript
// Set user online
const setUserOnline = async (userId) => {
  return await realtimeDB.updateData(`presence/${userId}`, {
    status: 'online',
    lastSeen: Date.now()
  });
};

// Listen to user presence
const listenToPresence = (userId, callback) => {
  return realtimeDB.listenToData(`presence/${userId}`, callback);
};
```

### 3. Real-time Notifications

```javascript
// Send notification
const sendNotification = async (userId, notification) => {
  return await realtimeDB.pushData(`notifications/${userId}`, {
    title: notification.title,
    message: notification.message,
    type: notification.type,
    read: false,
    timestamp: Date.now()
  });
};

// Listen to user notifications
const listenToNotifications = (userId, callback) => {
  return realtimeDB.listenToData(`notifications/${userId}`, callback);
};
```

## Integration with Strapi

### In Controllers

```javascript
// src/api/chat/controllers/chat.js
const { realtimeDB } = require('../../../common/services/firebase');

module.exports = {
  async sendMessage(ctx) {
    try {
      const { chatId, message } = ctx.request.body;
      
      // Save to Strapi database
      const strapiMessage = await strapi.entityService.create('api::message.message', {
        data: message
      });
      
      // Also save to Firebase for real-time updates
      const firebaseResult = await realtimeDB.pushData(`chats/${chatId}/messages`, {
        ...message,
        strapiId: strapiMessage.id,
        timestamp: Date.now()
      });
      
      ctx.body = {
        success: true,
        data: strapiMessage,
        firebaseKey: firebaseResult.key
      };
    } catch (error) {
      ctx.throw(500, error);
    }
  }
};
```

### In Services

```javascript
// src/api/notification/services/notification.js
const { realtimeDB } = require('../../../common/services/firebase');

module.exports = {
  async createAndBroadcast(data) {
    try {
      // Create in Strapi
      const notification = await strapi.entityService.create('api::notification.notification', {
        data
      });
      
      // Broadcast via Firebase Realtime DB
      await realtimeDB.pushData(`notifications/${data.userId}`, {
        ...notification,
        timestamp: Date.now()
      });
      
      return notification;
    } catch (error) {
      throw error;
    }
  }
};
```

## Best Practices

1. **Structure your data efficiently**: Design your database structure to minimize the amount of data downloaded
2. **Use listeners wisely**: Always clean up listeners to prevent memory leaks
3. **Handle offline scenarios**: Firebase automatically handles offline/online scenarios
4. **Implement proper security rules**: Never leave your database open in production
5. **Combine with Strapi**: Use Firebase for real-time features and Strapi for complex queries and business logic

## Error Handling

All methods return a consistent response format:

```javascript
// Success
{ success: true, data?: any, key?: string }

// Error
{ success: false, error: FirebaseError }
```

Always check the `success` property before using the result.

## Troubleshooting

### Common Issues

1. **Permission denied**: Check your Firebase security rules
2. **Network errors**: Ensure internet connectivity
3. **Invalid data**: Firebase has specific data type requirements
4. **Quota exceeded**: Monitor your Firebase usage

### Debug Mode

Enable Firebase debug logging:

```javascript
import { getDatabase } from 'firebase/database';

// Enable logging
getDatabase().goOffline();
getDatabase().goOnline();
```

## Resources

- [Firebase Realtime Database Documentation](https://firebase.google.com/docs/database)
- [Firebase Security Rules](https://firebase.google.com/docs/database/security)
- [Firebase JavaScript SDK Reference](https://firebase.google.com/docs/reference/js/database)