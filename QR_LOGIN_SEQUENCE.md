# QR Code Login Sequence Diagram

This document provides a visual sequence diagram for the QR code login flow currently implemented.

## Flow Diagram

### 1. Initialization Phase
```
User
 │
 └──► Clicks "Login with QR" on Web
       │
       └──► Web Browser
             │
             ├──► Request: POST /auth/generate-qr
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
             ├──► Request: POST /auth/verify-qr
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
 ├──► Request: POST /auth/check-qr { sessionId }
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

## State Management

### Session States
```
PENDING ──────► AUTHENTICATED ──────► EXPIRED/USED
   │                                      ▲
   └──────────────────────────────────────┘
           (5 minute timeout)
```

### Web Browser States
```
IDLE ──► WAITING_FOR_QR ──► POLLING ──► AUTHENTICATED
  ▲                           │              │
  └───────────────────────────┼──────────────┘
          (Timeout/Error)
```
