// Path: ./src/api/auth/controllers/recovery.js

'use strict';

const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Constants for security
const MAX_LOGIN_FAILURES = 5;
const MAX_RECOVERY_FAILURES = 5;
const RESET_TOKEN_EXPIRY_MINUTES = 10;
const TEMP_BLOCK_DURATION_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Generate a secure reset token
 * @returns {string} Reset token in format RST-{random}
 */
const generateResetToken = () => {
    const randomBytes = crypto.randomBytes(32).toString('hex');
    return `RST-${randomBytes}`;
};

/**
 * Hash recovery string with salt for secure storage
 * @param {string} recoveryString - Plain text recovery string
 * @returns {Promise<string>} Hashed recovery string
 */
const hashRecoveryString = async (recoveryString) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(recoveryString.toLowerCase().trim(), salt);
};

/**
 * Verify recovery string against stored hash
 * @param {string} inputRecoveryString - User provided recovery string
 * @param {string} storedHash - Stored hashed recovery string
 * @returns {Promise<boolean>} True if match
 */
const verifyRecoveryString = async (inputRecoveryString, storedHash) => {
    return bcrypt.compare(inputRecoveryString.toLowerCase().trim(), storedHash);
};

/**
 * Create audit log entry for password reset actions
 * @param {object} strapi - Strapi instance
 * @param {object} data - Audit log data
 */
const createAuditLog = async (strapi, data) => {
    try {
        // Check if audit-trail content type exists
        const auditTrailExists = strapi.contentTypes['api::audit-trail.audit-trail'];

        if (auditTrailExists) {
            await strapi.entityService.create('api::audit-trail.audit-trail', {
                data: {
                    product_id: `USER-${data.userId || 'UNKNOWN'}`,
                    event: data.action,
                    msg_details: JSON.stringify({
                        ...data.details,
                        ip_address: data.ipAddress,
                        user_agent: data.userAgent
                    }),
                    action_by: data.userId ? `User ID: ${data.userId}` : 'System',
                    action_at: new Date(),
                }
            });
        } else {
            // Log to console if audit trail doesn't exist
            console.log('[AUDIT]', JSON.stringify({
                ...data,
                timestamp: new Date().toISOString()
            }));
        }
    } catch (error) {
        // Don't fail the main operation if audit logging fails
        console.error('[AUDIT] Failed to create audit log:', error);
    }
};

/**
 * POST /api/v1/auth/recover/verify
 * Verify recovery string and return reset token
 */
const verifyRecovery = async (ctx) => {
    const { bankAccountId, recoveryString } = ctx.request.body;

    // Validate required fields
    if (!bankAccountId || !recoveryString) {
        return ctx.badRequest('bankAccountId and recoveryString are required');
    }

    const clientIp = ctx.request.ip || ctx.request.header['x-forwarded-for'] || ctx.request.header['x-real-ip'];
    const userAgent = ctx.request.header['user-agent'] || 'unknown';

    try {
        // Find user by bank account number (bank_number field)
        const user = await strapi.db.query('plugin::users-permissions.user').findOne({
            where: { bank_number: bankAccountId },
        });

        if (!user) {
            // Log failed attempt - user not found
            await createAuditLog(strapi, {
                action: 'RECOVERY_VERIFY_FAILED',
                userId: null,
                details: {
                    reason: 'USER_NOT_FOUND',
                    bankAccountId: bankAccountId.substring(0, 4) + '****'
                },
                ipAddress: clientIp,
                userAgent,
            });

            return ctx.badRequest({
                verificationResult: 'FAIL',
                error: 'INVALID_RECOVERY_STRING'
            });
        }

        // Check if account is permanently BLOCKED
        if (user.blocked) {
            ctx.response.status = 403;
            return ctx.body = {
                verificationResult: 'FAIL',
                error: 'PERMANENTLY_BLOCKED',
                message: 'Account is permanently blocked. Please contact support.',
                isBlocked: true,
                requiresSupport: true
            };
        }

        // Check if account is TEMP_BLOCKED (cannot recovery during this time)
        const isTempBlocked = user.temp_blocked_until && new Date(user.temp_blocked_until) > new Date();
        if (isTempBlocked) {
            const remainingMinutes = Math.ceil((new Date(user.temp_blocked_until) - new Date()) / 60000);

            await createAuditLog(strapi, {
                action: 'RECOVERY_VERIFY_BLOCKED',
                userId: user.id,
                details: { reason: 'TEMP_BLOCKED', remainingMinutes },
                ipAddress: clientIp,
                userAgent,
            });

            ctx.response.status = 403;
            return ctx.body = {
                verificationResult: 'FAIL',
                error: 'TEMP_BLOCKED',
                message: `Account is temporarily blocked for ${remainingMinutes} more minutes. Cannot recovery during this time.`,
                remainingMinutes,
                tempBlockedUntil: user.temp_blocked_until
            };
        }

        // Check if user has a recovery string set
        if (!user.recovery_string) {
            await createAuditLog(strapi, {
                action: 'RECOVERY_VERIFY_FAILED',
                userId: user.id,
                details: { reason: 'NO_RECOVERY_STRING_SET' },
                ipAddress: clientIp,
                userAgent,
            });

            return ctx.badRequest({
                verificationResult: 'FAIL',
                error: 'RECOVERY_NOT_CONFIGURED'
            });
        }

        // Verify recovery string (secure comparison)
        const isValidRecovery = await verifyRecoveryString(recoveryString, user.recovery_string);

        if (!isValidRecovery) {
            // Check if user is in final chance mode - any wrong = BLOCKED immediately
            if (user.is_in_final_chance) {
                await strapi.db.query('plugin::users-permissions.user').update({
                    where: { id: user.id },
                    data: {
                        blocked: true,
                        is_in_final_chance: false,
                    },
                });

                console.log(`[Recovery] User ${bankAccountId} PERMANENTLY BLOCKED - failed recovery in final chance mode.`);

                await createAuditLog(strapi, {
                    action: 'RECOVERY_VERIFY_FAILED',
                    userId: user.id,
                    details: { reason: 'FINAL_CHANCE_FAILED', blocked: true },
                    ipAddress: clientIp,
                    userAgent,
                });

                ctx.response.status = 403;
                return ctx.body = {
                    verificationResult: 'FAIL',
                    error: 'PERMANENTLY_BLOCKED',
                    message: 'Wrong recovery string in final chance. Account is now permanently blocked. Please contact support.',
                    isBlocked: true,
                    requiresSupport: true
                };
            }

            // Normal mode: increment recovery failure count
            const newFailureCount = (user.recovery_failure_count || 0) + 1;
            const updateData = { recovery_failure_count: newFailureCount };

            // TEMP_BLOCK for 10 minutes if max failures reached, set final chance flag
            if (newFailureCount >= MAX_RECOVERY_FAILURES) {
                updateData.temp_blocked_until = new Date(Date.now() + TEMP_BLOCK_DURATION_MS);
                updateData.is_in_final_chance = true;
                updateData.recovery_failure_count = 0; // Reset counter
            }

            await strapi.db.query('plugin::users-permissions.user').update({
                where: { id: user.id },
                data: updateData,
            });

            await createAuditLog(strapi, {
                action: 'RECOVERY_VERIFY_FAILED',
                userId: user.id,
                details: {
                    reason: 'INVALID_RECOVERY_STRING',
                    failureCount: newFailureCount,
                    tempBlocked: newFailureCount >= MAX_RECOVERY_FAILURES
                },
                ipAddress: clientIp,
                userAgent,
            });

            if (newFailureCount >= MAX_RECOVERY_FAILURES) {
                ctx.response.status = 403;
                return ctx.body = {
                    verificationResult: 'FAIL',
                    error: 'TEMP_BLOCKED',
                    message: 'Too many failed recovery attempts. Account is temporarily blocked for 10 minutes.',
                    remainingMinutes: 10
                };
            }

            return ctx.badRequest({
                verificationResult: 'FAIL',
                error: 'INVALID_RECOVERY_STRING',
                attemptsRemaining: MAX_RECOVERY_FAILURES - newFailureCount
            });
        }

        // Recovery string is valid - generate reset token
        const resetToken = generateResetToken();
        const resetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);

        // Store reset token and reset failure counters, clear temp block
        await strapi.db.query('plugin::users-permissions.user').update({
            where: { id: user.id },
            data: {
                reset_token: resetToken,
                reset_token_expires_at: resetTokenExpiresAt,
                recovery_failure_count: 0,
                login_failure_count: 0,
                temp_blocked_until: null, // Clear temp block on successful recovery
            },
        });

        await createAuditLog(strapi, {
            action: 'RECOVERY_VERIFY_SUCCESS',
            userId: user.id,
            details: { resetTokenExpiry: resetTokenExpiresAt.toISOString() },
            ipAddress: clientIp,
            userAgent,
        });

        return ctx.send({
            verificationResult: 'PASS',
            resetToken: resetToken
        });

    } catch (error) {
        console.error('[Recovery] Verify error:', error);
        return ctx.internalServerError('An error occurred during recovery verification');
    }
};

/**
 * POST /api/v1/auth/recover/reset
 * Reset password using reset token
 */
const resetPassword = async (ctx) => {
    const { resetToken, newPassword } = ctx.request.body;

    // Validate required fields
    if (!resetToken || !newPassword) {
        return ctx.badRequest('resetToken and newPassword are required');
    }

    const clientIp = ctx.request.ip || ctx.request.header['x-forwarded-for'] || ctx.request.header['x-real-ip'];
    const userAgent = ctx.request.header['user-agent'] || 'unknown';

    try {
        // Validate password policy
        const passwordValidation = validatePasswordPolicy(newPassword);
        if (!passwordValidation.valid) {
            return ctx.badRequest({
                error: 'PASSWORD_POLICY_FAILED',
                message: passwordValidation.message
            });
        }

        // Find user by reset token
        const user = await strapi.db.query('plugin::users-permissions.user').findOne({
            where: { reset_token: resetToken },
        });

        if (!user) {
            await createAuditLog(strapi, {
                action: 'PASSWORD_RESET_FAILED',
                userId: null,
                details: { reason: 'INVALID_RESET_TOKEN' },
                ipAddress: clientIp,
                userAgent,
            });

            return ctx.badRequest({
                error: 'INVALID_RESET_TOKEN',
                message: 'Reset token is invalid or has already been used.'
            });
        }

        // Check if token is expired
        if (!user.reset_token_expires_at || new Date(user.reset_token_expires_at) < new Date()) {
            // Clear expired token
            await strapi.db.query('plugin::users-permissions.user').update({
                where: { id: user.id },
                data: {
                    reset_token: null,
                    reset_token_expires_at: null,
                },
            });

            await createAuditLog(strapi, {
                action: 'PASSWORD_RESET_FAILED',
                userId: user.id,
                details: { reason: 'RESET_TOKEN_EXPIRED' },
                ipAddress: clientIp,
                userAgent,
            });

            return ctx.badRequest({
                error: 'RESET_TOKEN_EXPIRED',
                message: 'Reset token has expired. Please request a new one.'
            });
        }

        // Check if new password is same as current password
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return ctx.badRequest({
                error: 'PASSWORD_SAME_AS_PREVIOUS',
                message: 'New password must be different from the previous password.'
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password and clear reset token (single-use)
        await strapi.db.query('plugin::users-permissions.user').update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                reset_token: null,
                reset_token_expires_at: null,
                login_failure_count: 0,
                account_locked_until: null,
                confirmed: true, // Ensure user can login
            },
        });

        await createAuditLog(strapi, {
            action: 'PASSWORD_RESET_SUCCESS',
            userId: user.id,
            details: { method: 'RECOVERY_STRING' },
            ipAddress: clientIp,
            userAgent,
        });

        return ctx.send({
            success: true,
            message: 'Password has been reset successfully. You can now login with your new password.'
        });

    } catch (error) {
        console.error('[Recovery] Reset password error:', error);
        return ctx.internalServerError('An error occurred during password reset');
    }
};

/**
 * Validate password against security policy
 * @param {string} password - Password to validate
 * @returns {object} { valid: boolean, message: string }
 */
const validatePasswordPolicy = (password) => {
    const minLength = 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
        return { valid: false, message: `Password must be at least ${minLength} characters long.` };
    }

    if (!hasUppercase) {
        return { valid: false, message: 'Password must contain at least one uppercase letter.' };
    }

    if (!hasLowercase) {
        return { valid: false, message: 'Password must contain at least one lowercase letter.' };
    }

    if (!hasNumber) {
        return { valid: false, message: 'Password must contain at least one number.' };
    }

    if (!hasSpecialChar) {
        return { valid: false, message: 'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>).' };
    }

    return { valid: true, message: 'Password meets security requirements.' };
};

/**
 * Helper function to set recovery string during registration or update
 * Can be used by other controllers
 */
const setRecoveryString = async (strapi, userId, recoveryString) => {
    const hashedRecoveryString = await hashRecoveryString(recoveryString);

    await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: userId },
        data: { recovery_string: hashedRecoveryString },
    });

    return true;
};

/**
 * POST /api/v1/auth/recover/verify-otp
 * Verify OTP after successful recovery string verification
 * Returns a new token that allows password reset
 */
const verifyOtp = async (ctx) => {
    const { resetToken, otp } = ctx.request.body;

    // Validate required fields
    if (!resetToken || !otp) {
        return ctx.badRequest('resetToken and otp are required');
    }

    const clientIp = ctx.request.ip || ctx.request.header['x-forwarded-for'] || ctx.request.header['x-real-ip'];
    const userAgent = ctx.request.header['user-agent'] || 'unknown';

    try {
        // Find user by reset token
        const user = await strapi.db.query('plugin::users-permissions.user').findOne({
            where: { reset_token: resetToken },
        });

        if (!user) {
            await createAuditLog(strapi, {
                action: 'OTP_VERIFY_FAILED',
                userId: null,
                details: { reason: 'INVALID_RESET_TOKEN' },
                ipAddress: clientIp,
                userAgent,
            });

            return ctx.badRequest({
                verificationResult: 'FAIL',
                error: 'INVALID_RESET_TOKEN',
                message: 'Reset token is invalid or has already been used.'
            });
        }

        // Check if token is expired
        if (!user.reset_token_expires_at || new Date(user.reset_token_expires_at) < new Date()) {
            // Clear expired token
            await strapi.db.query('plugin::users-permissions.user').update({
                where: { id: user.id },
                data: {
                    reset_token: null,
                    reset_token_expires_at: null,
                },
            });

            await createAuditLog(strapi, {
                action: 'OTP_VERIFY_FAILED',
                userId: user.id,
                details: { reason: 'RESET_TOKEN_EXPIRED' },
                ipAddress: clientIp,
                userAgent,
            });

            return ctx.badRequest({
                verificationResult: 'FAIL',
                error: 'RESET_TOKEN_EXPIRED',
                message: 'Reset token has expired. Please request a new one.'
            });
        }

        // Verify OTP (currently hardcoded as "123456")
        const storedOtp = user.otp || '123456';
        if (otp !== storedOtp) {
            // Check if user is in final chance mode - any wrong = BLOCKED immediately
            if (user.is_in_final_chance) {
                await strapi.db.query('plugin::users-permissions.user').update({
                    where: { id: user.id },
                    data: {
                        blocked: true,
                        is_in_final_chance: false,
                        reset_token: null,
                        reset_token_expires_at: null,
                    },
                });

                console.log(`[OTP] User ${user.id} PERMANENTLY BLOCKED - failed OTP in final chance mode.`);

                await createAuditLog(strapi, {
                    action: 'OTP_VERIFY_FAILED',
                    userId: user.id,
                    details: { reason: 'FINAL_CHANCE_FAILED', blocked: true },
                    ipAddress: clientIp,
                    userAgent,
                });

                ctx.response.status = 403;
                return ctx.body = {
                    verificationResult: 'FAIL',
                    error: 'PERMANENTLY_BLOCKED',
                    message: 'Wrong OTP in final chance. Account is now permanently blocked. Please contact support.',
                    isBlocked: true,
                    requiresSupport: true
                };
            }

            await createAuditLog(strapi, {
                action: 'OTP_VERIFY_FAILED',
                userId: user.id,
                details: { reason: 'INVALID_OTP' },
                ipAddress: clientIp,
                userAgent,
            });

            return ctx.badRequest({
                verificationResult: 'FAIL',
                error: 'INVALID_OTP',
                message: 'Invalid OTP. Please try again.'
            });
        }

        // OTP verified successfully - generate a new password reset token
        const passwordResetToken = generateResetToken();
        const passwordResetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);

        // Update with new token for password reset
        await strapi.db.query('plugin::users-permissions.user').update({
            where: { id: user.id },
            data: {
                reset_token: passwordResetToken,
                reset_token_expires_at: passwordResetTokenExpiresAt,
            },
        });

        await createAuditLog(strapi, {
            action: 'OTP_VERIFY_SUCCESS',
            userId: user.id,
            details: { passwordResetTokenExpiry: passwordResetTokenExpiresAt.toISOString() },
            ipAddress: clientIp,
            userAgent,
        });

        return ctx.send({
            verificationResult: 'PASS',
            resetToken: passwordResetToken,
            message: 'OTP verified successfully. You can now reset your password.'
        });

    } catch (error) {
        console.error('[Recovery] Verify OTP error:', error);
        return ctx.internalServerError('An error occurred during OTP verification');
    }
};

module.exports = {
    verifyRecovery,
    verifyOtp,
    resetPassword,
    hashRecoveryString,
    setRecoveryString,
    MAX_LOGIN_FAILURES,
};
