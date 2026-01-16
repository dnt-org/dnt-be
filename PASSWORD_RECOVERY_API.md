# Password Recovery API Documentation

## Overview

This document describes the Password Recovery flow implemented for the DNT platform. The feature allows users to reset their password using a recovery string that was set during registration or later via settings.

## API Endpoints

### 1. Verify Recovery String

**Endpoint:** `POST /api/v1/auth/recover/verify`

**Description:** Verify the user's bank account ID and recovery string to receive a reset token.

**Request:**
```json
{
  "bankAccountId": "0123456789",
  "recoveryString": "my-first-pet"
}
```

**Success Response (200):**
```json
{
  "verificationResult": "PASS",
  "resetToken": "RST-abc123..."
}
```

**Error Responses:**

| Error Code | Description |
|------------|-------------|
| `INVALID_RECOVERY_STRING` | Bank account or recovery string is incorrect |
| `RECOVERY_NOT_CONFIGURED` | User has not set up a recovery string |
| `ACCOUNT_TEMPORARILY_LOCKED` | Account locked due to too many failed attempts |

---

### 2. Reset Password

**Endpoint:** `POST /api/v1/auth/recover/reset`

**Description:** Reset password using the reset token received from verify endpoint.

**Request:**
```json
{
  "resetToken": "RST-abc123...",
  "newPassword": "N3wP@ssw0rd!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password has been reset successfully. You can now login with your new password."
}
```

**Error Responses:**

| Error Code | Description |
|------------|-------------|
| `INVALID_RESET_TOKEN` | Token is invalid or already used |
| `RESET_TOKEN_EXPIRED` | Token has expired (10 minute limit) |
| `PASSWORD_POLICY_FAILED` | New password doesn't meet requirements |
| `PASSWORD_SAME_AS_PREVIOUS` | New password must be different from old |

---

### 3. Set Recovery String

**Endpoint:** `POST /api/auth/set-recovery-string`

**Description:** Set or update the recovery string for password recovery. Requires authentication and current password verification.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request:**
```json
{
  "currentPassword": "CurrentP@ss123",
  "recoveryString": "my-favorite-color"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Recovery string has been set successfully"
}
```

---

## Password Policy

New passwords must meet the following requirements:
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&*(),.?":{}|<>)

---

## Security Features

### Login Failure Tracking
- After **5 consecutive failed login attempts**, the user is required to use password recovery
- Login attempts counter resets on successful login or password reset

### Recovery Failure Protection
- After **3 failed recovery verification attempts**, the account is temporarily locked
- Lock duration: **30 minutes**

### Reset Token Security
- Single-use tokens - automatically invalidated after use
- Token expiration: **10 minutes**
- Secure random generation using crypto module

### Recovery String Storage
- Recovery strings are hashed using bcrypt with salt
- Case-insensitive comparison (converted to lowercase before hashing)

---

## Database Schema Changes

New fields added to `up_users` table:

| Field | Type | Description |
|-------|------|-------------|
| `recovery_string` | string | Hashed recovery string |
| `login_failure_count` | integer | Count of consecutive login failures |
| `recovery_failure_count` | integer | Count of recovery verification failures |
| `account_locked_until` | datetime | Timestamp when account lock expires |
| `reset_token` | string | Current password reset token |
| `reset_token_expires_at` | datetime | Reset token expiration time |

---

## Flow Diagrams

### Forgot Password Flow
```
User clicks "Forgot Password"
    ↓
Enter Bank Account ID + Recovery String
    ↓
POST /api/v1/auth/recover/verify
    ↓
[Success] → Receive resetToken → Enter New Password
    ↓
POST /api/v1/auth/recover/reset
    ↓
[Success] → Redirect to Login
```

### Login Failure Flow
```
User enters wrong password
    ↓
login_failure_count++ 
    ↓
[Count < 5] → Show "Invalid credentials" + attempts remaining
    ↓
[Count >= 5] → Force password recovery
    ↓
Redirect to Recovery Flow
```

---

## Audit Logging

All password recovery actions are logged in the `audit_trails` table:

| Event | Description |
|-------|-------------|
| `RECOVERY_VERIFY_FAILED` | Failed verification attempt |
| `RECOVERY_VERIFY_BLOCKED` | Verification blocked - account locked |
| `RECOVERY_VERIFY_SUCCESS` | Successful verification |
| `PASSWORD_RESET_FAILED` | Failed password reset attempt |
| `PASSWORD_RESET_SUCCESS` | Successful password reset |
