# QR Code Login Sequence Diagram

This document provides a visual sequence diagram for the QR code login flow.

## Sequence Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant W as Web Browser
    participant M as Mobile App
    participant S as Strapi Server
    participant D as Database

    Note over U,D: Phase 1: QR Code Generation
    U->>W: Click "Login with QR"
    W->>S: POST /auth/generate-qr
    S->>S: Generate sessionId & QR code
    S-->>W: {sessionId, qrCode, expiresIn}
    W->>W: Display QR code + timer
    W->>U: Show QR code (5min countdown)

    Note over U,D: Phase 2: Mobile Authentication
    U->>M: Scan QR code
    M->>M: Extract sessionId from QR
    M->>U: Prompt for credentials
    U->>M: Enter CCCD + Password
    M->>S: POST /auth/verify-qr {sessionId, cccd, password}
    S->>D: Validate user credentials
    D-->>S: User data (if valid)
    S->>S: Generate JWT token
    S->>S: Update session status to "authenticated"
    S-->>M: {success: true, token, user}
    M->>U: Show "Login Success"

    Note over U,D: Phase 3: Web Login Completion
    loop Every 3 seconds
        W->>S: POST /auth/qr-login {sessionId}
        S->>S: Check session status
        alt Session authenticated
            S-->>W: {status: "authenticated", token, user}
            W->>W: Store JWT token
            W->>U: Redirect to dashboard
        else Session pending
            S-->>W: {status: "pending"}
            W->>W: Continue polling
        end
    end

    Note over U,D: Error Scenarios
    alt QR Code Expires (5 minutes)
        S->>S: Auto-cleanup expired session
        W->>U: Show "QR Expired" + "Generate New"
    else Invalid Credentials
        S-->>M: {error: "Invalid credentials"}
        M->>U: Show error message
        Note over M: User can retry or scan new QR
    else Session Already Used
        M->>S: POST /auth/verify-qr (duplicate)
        S-->>M: {error: "Session already used"}
        M->>U: Show error + "Scan new QR"
    end
```

## Timeline Breakdown

### Immediate Actions (0-5 seconds)
1. User clicks login button
2. QR code generated and displayed
3. User scans QR with mobile app

### Authentication Phase (5-30 seconds)
4. Mobile app prompts for credentials
5. User enters CCCD and password
6. Mobile app sends verification request
7. Server validates and responds

### Completion Phase (30-35 seconds)
8. Web browser receives authentication status
9. User is logged in and redirected

### Total Flow Duration
- **Typical**: 30-60 seconds
- **Maximum**: 5 minutes (QR expiration)

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
        (Generate New QR)     │
                              ▼
                          QR_EXPIRED
```

### Mobile App States
```
IDLE ──► SCANNING ──► CREDENTIAL_INPUT ──► AUTHENTICATING ──► SUCCESS
                           │                    │              │
                           ▼                    ▼              ▼
                       CANCELLED           ERROR_STATE      COMPLETED
```

## API Call Patterns

### Web Browser API Calls
```
1. POST /auth/generate-qr
   └─► Response: {sessionId, qrCode, expiresIn}

2. POST /auth/qr-login (polling every 3s)
   └─► Response: {status: "pending"} OR {status: "authenticated", token, user}
```

### Mobile App API Calls
```
1. POST /auth/verify-qr
   └─► Request: {sessionId, cccd, password}
   └─► Response: {success: true, token, user} OR {error: "message"}
```

## Security Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   QR Generation │    │  Authentication │    │   Token Issue   │
│                 │    │                 │    │                 │
│ • Generate UUID │    │ • Validate CCCD │    │ • Generate JWT  │
│ • Set 5min TTL  │    │ • Check password│    │ • 7-day expiry  │
│ • Create QR PNG │    │ • Verify session│    │ • Sign with key │
│ • Store in RAM  │    │ • Single-use    │    │ • Return token  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Error Handling Matrix

| Scenario | Web Behavior | Mobile Behavior | Server Action |
|----------|--------------|-----------------|---------------|
| QR Expired | Show "Generate New" | N/A | Cleanup session |
| Invalid Credentials | Keep polling | Show error | Keep session pending |
| Network Error | Retry polling | Show retry button | N/A |
| Session Used | Keep polling | Show "Scan new QR" | Return error |
| Server Down | Show connection error | Show connection error | N/A |

## Performance Considerations

### Polling Optimization
- **Interval**: 3 seconds (balance between UX and server load)
- **Timeout**: 5 minutes maximum
- **Exponential Backoff**: On network errors

### Memory Management
- **Session Storage**: In-memory Map (auto-cleanup)
- **QR Code**: Generated on-demand, not stored
- **Cleanup**: Every 60 seconds for expired sessions

### Scalability
- **Concurrent Sessions**: Limited by server memory
- **QR Generation**: CPU-intensive, consider caching
- **Database Queries**: Optimized user lookup by CCCD index

This sequence diagram provides a comprehensive view of the QR code login system's flow, timing, and error handling mechanisms.