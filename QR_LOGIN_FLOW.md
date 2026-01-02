# QR Code Login Flow Documentation

This document describes the QR code login mechanism implemented in the DNT system, allowing users to log in to the web application by scanning a QR code with their authenticated mobile app.

## Overview

The flow consists of three main parties:
1.  **Web Client (Frontend)**: Displays the QR code and polls for status.
2.  **Mobile App**: Scans the QR code and authenticates the session.
3.  **Backend (Strapi)**: Manages the session lifecycle and verification.

## Flow Diagram

### 1. Initialization Phase
```
User
 │
 └──► Clicks "Login with QR" on Web
       │
       └──► Web Browser
             │
             ├──► Request: POST /api/auth/generate-qr
             │    │
             │    └──► Strapi Server
             │          │
             │          ├──► Generates Session ID & QR Code
             │          │    (State: PENDING)
             │          │
             │          └──► Returns: { sessionId, qrCode }
             │
             └──► Displays QR Code to User
                  (Starts Polling every 2s)
```

### 2. Authentication Phase
```
User
 │
 └──► Scans QR Code with Mobile App
       │
       └──► Mobile App (Logged In)
             │
             ├──► Request: POST /api/auth/verify-qr
             │    Headers: Authorization: Bearer <MobileToken>
             │    Body: { sessionId }
             │
             └──► Strapi Server
                   │
                   ├──► Validates Mobile Token
                   │
                   ├──► Updates Session Status ──► AUTHENTICATED
                   │    (Links User to Session)
                   │
                   └──► Returns: { success: true }
```

### 3. Completion Phase
```
Web Browser (Polling)
 │
 ├──► Request: POST /api/auth/check-qr { sessionId }
 │
 └──► Strapi Server
       │
       ├──► Checks Session Status
       │
       └──► If AUTHENTICATED:
            │
            ├──► Generates NEW JWT for Web
            │
            └──► Returns: { status: "authenticated", token, user }
                  │
                  └──► Web Browser
                        │
                        ├──► Stores Token
                        │
                        └──► Redirects to Dashboard
```

## API Endpoints

### 1. Generate QR Code
Creates a new login session and returns a QR code.

-   **Endpoint**: `POST /api/auth/generate-qr`
-   **Auth**: Public
-   **Response**:
    ```json
    {
      "sessionId": "uuid-string",
      "qrCode": "data:image/png;base64,...", // Base64 encoded image
      "expiresIn": 300 // Seconds (5 minutes)
    }
    ```

### 2. Verify QR Code (Mobile)
Authenticates the QR session using the mobile user's credentials.

-   **Endpoint**: `POST /api/auth/verify-qr`
-   **Auth**: Bearer Token (User must be logged in on mobile)
-   **Headers**:
    -   `Authorization`: `Bearer <jwt_token>`
-   **Body**:
    ```json
    {
      "sessionId": "uuid-string"
    }
    ```
-   **Response**:
    ```json
    {
      "success": true,
      "message": "Authentication successful",
      "token": "new_web_token",
      "user": { ... }
    }
    ```

### 3. Check QR Status (Web Polling)
Checks if the session has been authenticated.

-   **Endpoint**: `POST /api/auth/check-qr`
-   **Auth**: Public
-   **Body**:
    ```json
    {
      "sessionId": "uuid-string"
    }
    ```
-   **Response (Pending)**:
    ```json
    {
      "status": "pending",
      "message": "Waiting for mobile authentication"
    }
    ```
-   **Response (Success)**:
    ```json
    {
      "status": "authenticated",
      "token": "jwt_token",
      "user": { ... }
    }
    ```

## Security Considerations

1.  **Session Expiration**: QR sessions expire after 5 minutes.
2.  **One-Time Use**: Once a session is authenticated and consumed by the web client, it is deleted from the server.
3.  **Token Generation**: A new JWT token is generated for the web session upon successful mobile verification.
4.  **Authorization**: The `verify-qr` endpoint strictly requires a valid JWT token from the mobile app.

## Environment Variables

-   `MOBILE_APP_URL`: Used to construct the deep link embedded in the QR code (default: `http://localhost:5173/` or configured value).
