# QR Code Login Flow for End Users

This document describes the complete flow for end users to login using QR codes with mobile app integration.

## Overview

The QR code login system allows users to authenticate on web applications by scanning a QR code with their mobile device, eliminating the need to type credentials on the web interface.

## User Flow Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Browser   │    │   Mobile App    │    │  Strapi Server  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │ 1. User clicks        │                       │
         │   "Login with QR"     │                       │
         │                       │                       │
         │ 2. POST /auth/generate-qr                     │
         │──────────────────────────────────────────────▶│
         │                       │                       │
         │ 3. Returns QR code + sessionId                │
         │◀──────────────────────────────────────────────│
         │                       │                       │
         │ 4. Display QR code    │                       │
         │   to user             │                       │
         │                       │                       │
         │                       │ 5. User scans QR      │
         │                       │    with mobile app    │
         │                       │                       │
         │                       │ 6. App extracts       │
         │                       │    sessionId from QR  │
         │                       │                       │
         │                       │ 7. App prompts user   │
         │                       │    for credentials    │
         │                       │                       │
         │                       │ 8. POST /auth/verify-qr│
         │                       │    {sessionId, cccd,   │
         │                       │     password}          │
         │                       │──────────────────────▶│
         │                       │                       │
         │                       │ 9. Server validates   │
         │                       │    credentials &       │
         │                       │    updates session    │
         │                       │                       │
         │                       │ 10. Returns success   │
         │                       │     + JWT token       │
         │                       │◀──────────────────────│
         │                       │                       │
         │                       │ 11. App shows         │
         │                       │     "Login Success"   │
         │                       │                       │
         │ 12. Web polls for login status                │
         │     POST /auth/qr-login {sessionId}           │
         │──────────────────────────────────────────────▶│
         │                       │                       │
         │ 13. Returns authenticated status + JWT        │
         │◀──────────────────────────────────────────────│
         │                       │                       │
         │ 14. Web redirects to  │                       │
         │     dashboard/home    │                       │
         │                       │                       │
```

## Detailed Step-by-Step Process

### Phase 1: QR Code Generation (Web)

1. **User Action**: User visits the login page and clicks "Login with QR Code"
2. **Web Request**: Browser sends `POST /api/auth/generate-qr`
3. **Server Response**: Returns:
   ```json
   {
     "sessionId": "550e8400-e29b-41d4-a716-446655440000",
     "qrCode": "data:image/png;base64,iVBORw0KGgo...",
     "expiresIn": 300
   }
   ```
4. **Display**: Web page shows the QR code image with a 5-minute countdown timer

### Phase 2: Mobile Authentication

5. **QR Scan**: User opens mobile app and scans the QR code
6. **QR Content**: The QR code contains: `myapp://login?sessionId=550e8400-e29b-41d4-a716-446655440000&timestamp=1640995200000`
7. **App Processing**: Mobile app extracts the `sessionId` from the deep link
8. **Credential Input**: App prompts user to enter their CCCD and password
9. **Authentication Request**: App sends `POST /api/auth/verify-qr`:
   ```json
   {
     "sessionId": "550e8400-e29b-41d4-a716-446655440000",
     "cccd": "123456789",
     "password": "userpassword"
   }
   ```
10. **Server Validation**: 
    - Checks if session exists and is valid
    - Verifies user credentials against database
    - Generates JWT token
    - Updates session status to "authenticated"
11. **Mobile Response**: App receives success confirmation and JWT token

### Phase 3: Web Login Completion

12. **Polling**: Web page continuously polls `POST /api/auth/qr-login` every 2-3 seconds
13. **Status Check**: Server checks session status:
    - If still "pending": Returns `{"status": "pending"}`
    - If "authenticated": Returns JWT token and user data
14. **Login Success**: Web receives authentication data and logs user in
15. **Redirect**: User is redirected to the main application dashboard

## Error Scenarios

### QR Code Expiration
- **Trigger**: 5 minutes pass without mobile authentication
- **Web Behavior**: Shows "QR Code Expired" message with "Generate New QR" button
- **Server Action**: Automatically cleans up expired session

### Invalid Credentials
- **Trigger**: User enters wrong CCCD or password on mobile
- **Mobile Response**: Shows "Invalid credentials" error
- **Web Behavior**: Continues waiting (session remains "pending")
- **User Action**: Can retry on mobile or generate new QR

### Session Already Used
- **Trigger**: Attempting to use the same QR code twice
- **Server Response**: Returns "Session already used" error
- **Required Action**: Generate new QR code

### Network Issues
- **Mobile**: Shows connection error, allows retry
- **Web**: Continues polling, shows "Waiting for mobile authentication"

## Security Considerations

1. **Time-Limited Sessions**: QR codes expire after 5 minutes
2. **Single-Use Sessions**: Each QR code can only be used once
3. **Secure Transmission**: All API calls use HTTPS
4. **JWT Tokens**: 7-day expiration with secure signing
5. **Password Hashing**: Uses bcrypt for password verification
6. **Session Cleanup**: Automatic removal of expired sessions

## Mobile App Requirements

### Deep Link Handling
The mobile app must register the custom URL scheme:
```
myapp://login
```

### QR Code Scanning
Implement QR code scanner that can:
- Detect and parse QR codes
- Extract sessionId and timestamp parameters
- Handle malformed or invalid QR codes

### API Integration
Implement HTTP client to call:
- `POST /api/auth/verify-qr` for authentication
- Handle network errors and retries
- Parse JSON responses

### User Interface
- QR scanner screen
- Credential input form (CCCD + Password)
- Success/error message display
- Loading states during API calls

## Web Application Requirements

### QR Code Display
- Generate and display QR code image
- Show countdown timer (5 minutes)
- "Generate New QR" button for expired codes

### Polling Implementation
```javascript
const pollForAuth = async (sessionId) => {
  const interval = setInterval(async () => {
    try {
      const response = await fetch('/api/auth/qr-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      
      const data = await response.json();
      
      if (data.status === 'authenticated') {
        clearInterval(interval);
        // Store JWT token and redirect
        localStorage.setItem('token', data.token);
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Polling error:', error);
    }
  }, 3000); // Poll every 3 seconds
  
  // Stop polling after 5 minutes
  setTimeout(() => clearInterval(interval), 300000);
};
```

## Environment Configuration

Add to `.env` file:
```env
# Mobile app deep link URL scheme
MOBILE_APP_URL=myapp://login

# JWT secret for token signing
JWT_SECRET=your-secure-jwt-secret-key

# Optional: Custom QR code expiration (in milliseconds)
QR_EXPIRATION_MS=300000
```

This flow provides a seamless and secure authentication experience where users can login to web applications using their mobile devices without typing credentials on potentially untrusted computers or public devices.