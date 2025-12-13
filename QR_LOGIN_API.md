# QR Code Login API Documentation

This API provides QR code-based authentication for mobile app login integration.

## Endpoints

### 1. Generate QR Code
**POST** `/api/auth/generate-qr`

Generates a QR code for mobile login.

**Response:**
```json
{
  "sessionId": "uuid-string",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "expiresIn": 300
}
```

### 2. Verify QR Code (Mobile App)
**POST** `/api/auth/verify-qr`

Called by mobile app to authenticate user after scanning QR code.

**Request Body:**
```json
{
  "sessionId": "uuid-string",
  "cccd": "user-cccd",
  "password": "user-password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Authentication successful",
  "token": "jwt-token",
  "user": {
    "id": 1,
    "cccd": "123456789",
    "username": "user"
  }
}
```

### 3. Complete QR Login (Web Client)
**POST** `/api/auth/qr-login`

Polled by web client to check if mobile authentication is complete.

**Request Body:**
```json
{
  "sessionId": "uuid-string"
}
```

**Response (Pending):**
```json
{
  "status": "pending",
  "message": "Waiting for mobile authentication"
}
```

**Response (Authenticated):**
```json
{
  "status": "authenticated",
  "token": "jwt-token",
  "user": {
    "id": 1,
    "cccd": "123456789",
    "username": "user"
  }
}
```

## Usage Flow

1. **Web Client**: Call `/api/auth/generate-qr` to get QR code
2. **Web Client**: Display QR code to user
3. **Mobile App**: Scan QR code and extract sessionId
4. **Mobile App**: Call `/api/auth/verify-qr` with user credentials
5. **Web Client**: Poll `/api/auth/qr-login` until authentication is complete
6. **Web Client**: Receive JWT token and user data

## Security Features

- QR codes expire after 5 minutes
- Sessions are single-use only
- Automatic cleanup of expired sessions
- JWT tokens with 7-day expiration
- Password verification using bcrypt

## Environment Variables

Add to your `.env` file:
```
MOBILE_APP_URL=myapp://login
JWT_SECRET=your-jwt-secret
```

## Mobile App Integration

The QR code contains a deep link URL in the format:
```
myapp://login?sessionId=uuid&timestamp=1234567890
```

Your mobile app should:
1. Parse the sessionId from the QR code
2. Prompt user for credentials
3. Call the verify-qr endpoint
4. Handle the authentication response