# Firebase Notification API Documentation

This document describes the Firebase push notification functionality implemented in the Strapi CMS service.

## Overview

The notification system provides the following features:
- Send push notifications using Firebase Cloud Messaging (FCM)
- Store notification records in the database
- Retrieve notifications by user ID
- Update notification status to "seen"
- Get unread notification counts
- Send multicast notifications to multiple users

## Setup

### 1. Install Dependencies

```bash
npm install firebase-admin
```

### 2. Firebase Configuration

Add the following environment variables to your `.env` file:

```env
# Firebase Configuration
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project.iam.gserviceaccount.com
```

### 3. Get Firebase Service Account Key

1. Go to Firebase Console → Project KeyboardIcon → Service Accounts
2. Click "Generate New Private Key"
3. Download the JSON file
4. Extract the values and add them to your `.env` file

## API Endpoints

### 1. Send Push Notification

**POST** `/api/notifications/send`

```json
{
  "userId": "user123",
  "title": "New Message",
  "message": "You have received a new message",
  "type": "info",
  "fcmToken": "user_fcm_token_here",
  "data": {
    "messageId": "msg123",
    "senderId": "sender456"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "notification": {
      "id": 1,
      "userId": "user123",
      "title": "New Message",
      "message": "You have received a new message",
      "status": "unread",
      "type": "info",
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "pushResult": {
      "success": true,
      "messageId": "projects/your-project/messages/0:1234567890"
    }
  }
}
```

### 2. Get All Notifications by User ID

**GET** `/api/notifications/user/:userId?page=1&pageSize=20`

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": 1,
        "userId": "user123",
        "title": "New Message",
        "message": "You have received a new message",
        "status": "unread",
        "type": "info",
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "meta": {
      "pagination": {
        "page": 1,
        "pageSize": 20,
        "pageCount": 1,
        "total": 1
      }
    }
  }
}
```

### 3. Mark Notification as Seen

**PUT** `/api/notifications/:id/seen`

```json
{
  "userId": "user123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": "user123",
    "title": "New Message",
    "message": "You have received a new message",
    "status": "seen",
    "type": "info",
    "updatedAt": "2024-01-15T10:35:00.000Z"
  }
}
```

### 4. Mark All Notifications as Seen

**PUT** `/api/notifications/mark-all-seen`

```json
{
  "userId": "user123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "updatedCount": 5
  }
}
```

### 5. Get Unread Notification Count

**GET** `/api/notifications/unread-count/:userId`

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 3
  }
}
```

### 6. Send Multicast Notification

**POST** `/api/notifications/multicast`

```json
{
  "userIds": ["user123", "user456", "user789"],
  "title": "System Announcement",
  "message": "The system will be under maintenance tonight",
  "type": "warning",
  "data": {
    "maintenanceStart": "2024-01-15T22:00:00.000Z",
    "maintenanceEnd": "2024-01-16T02:00:00.000Z"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "userId": "user123",
        "success": true,
        "data": { /* notification data */ }
      },
      {
        "userId": "user456",
        "success": true,
        "data": { /* notification data */ }
      },
      {
        "userId": "user789",
        "success": false,
        "error": "User not found"
      }
    ],
    "totalSent": 2,
    "totalFailed": 1
  }
}
```

### 7. Delete Notification

**DELETE** `/api/notifications/:id`

```json
{
  "userId": "user123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

## Notification Types

- `info` - General information (default)
- `warning` - Warning messages
- `success` - Success messages
- `error` - Error messages

## Notification Status

- `unread` - Notification has not been seen (default)
- `seen` - Notification has been marked as seen

## Database Schema

The notification content type includes the following fields:

- `userId` (string, required) - ID of the user receiving the notification
- `title` (string, required) - Notification title
- `message` (text, required) - Notification message content
- `status` (enum) - "unread" or "seen"
- `type` (enum) - "info", "warning", "success", or "error"
- `data` (json) - Additional data payload
- `fcmToken` (string) - Firebase Cloud Messaging token
- `sentAt` (datetime) - When the notification was sent
- `createdAt` (datetime) - When the record was created
- `updatedAt` (datetime) - When the record was last updated

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200` - Success
- `400` - Bad Request (missing required fields)
- `404` - Not Found (notification not found or access denied)
- `500` - Internal Server Error

## Usage Examples

### Frontend Integration (JavaScript)

```javascript
// Send notification
const sendNotification = async (userId, title, message, fcmToken) => {
  const response = await fetch('/api/notifications/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      title,
      message,
      fcmToken,
      type: 'info'
    })
  });
  
  return response.json();
};

// Get user notifications
const getUserNotifications = async (userId, page = 1) => {
  const response = await fetch(`/api/notifications/user/${userId}?page=${page}`);
  return response.json();
};

// Mark notification as seen
const markAsSeen = async (notificationId, userId) => {
  const response = await fetch(`/api/notifications/${notificationId}/seen`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId })
  });
  
  return response.json();
};
```

### Mobile App Integration

For mobile apps, you'll need to:

1. Initialize Firebase SDK in your mobile app
2. Get FCM token from the device
3. Send the FCM token to your backend when user logs in
4. Use the token when sending notifications via this API

## Security Considerations

1. **Authentication**: Currently, the API endpoints have `auth: false`. Consider enabling authentication for production use.
2. **User Validation**: Always validate that users can only access their own notifications.
3. **Rate Limiting**: Implement rate limiting to prevent spam.
4. **FCM Token Security**: Store FCM tokens securely and update them regularly.

## Troubleshooting

### Common Issues

1. **Firebase initialization fails**: Check your environment variables and service account key.
2. **Push notifications not received**: Verify FCM token is valid and the device is online.
3. **Database errors**: Ensure the notification content type is properly created in Strapi.

### Logs

Check Strapi logs for detailed error messages:

```bash
npm run develop
```

Look for Firebase-related error messages in the console output.