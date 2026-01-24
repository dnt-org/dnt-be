'use strict';

/**
 * Google reCAPTCHA verification service
 * This service validates reCAPTCHA tokens with Google's API
 */

const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

/**
 * Check if reCAPTCHA is enabled
 * @returns {boolean}
 */
const isRecaptchaEnabled = () => {
    console.log('[Debug] BYPASS_VERIFICATIONS:', process.env.BYPASS_VERIFICATIONS);
    console.log('[Debug] RECAPTCHA_ENABLED:', process.env.RECAPTCHA_ENABLED);

    const bypass = process.env.BYPASS_VERIFICATIONS ? process.env.BYPASS_VERIFICATIONS.trim() : 'false';
    if (bypass === 'true') {
        return false;
    }
    return process.env.RECAPTCHA_ENABLED === 'true';
};

/**
 * Verify reCAPTCHA token with Google API
 * @param {string} token - The reCAPTCHA token from frontend
 * @param {string} remoteIp - Optional. The user's IP address
 * @returns {Promise<{success: boolean, score?: number, action?: string, errorCodes?: string[]}>}
 */
const verifyRecaptcha = async (token, remoteIp = null) => {
    // If reCAPTCHA is disabled, always return success
    if (!isRecaptchaEnabled()) {
        console.log('[reCAPTCHA] Verification skipped - reCAPTCHA is disabled');
        return { success: true, skipped: true };
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    if (!secretKey || secretKey === 'your_recaptcha_secret_key_here') {
        console.warn('[reCAPTCHA] Secret key not configured. Skipping verification.');
        return { success: true, skipped: true };
    }

    if (!token) {
        console.log('[reCAPTCHA] No token provided');
        return { success: false, errorCodes: ['missing-input-response'] };
    }

    try {
        // Build the verification request body
        const params = new URLSearchParams();
        params.append('secret', secretKey);
        params.append('response', token);
        if (remoteIp) {
            params.append('remoteip', remoteIp);
        }

        // Make request to Google's verification API
        const response = await fetch(RECAPTCHA_VERIFY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
        });

        if (!response.ok) {
            console.error('[reCAPTCHA] Google API returned non-OK status:', response.status);
            return { success: false, errorCodes: ['api-error'] };
        }

        const result = await response.json();

        console.log('[reCAPTCHA] Verification result:', {
            success: result.success,
            score: result.score, // Only for v3
            action: result.action, // Only for v3
            errorCodes: result['error-codes'],
        });

        return {
            success: result.success,
            score: result.score,
            action: result.action,
            challengeTs: result.challenge_ts,
            hostname: result.hostname,
            errorCodes: result['error-codes'],
        };
    } catch (error) {
        console.error('[reCAPTCHA] Verification error:', error);
        return { success: false, errorCodes: ['network-error'] };
    }
};

/**
 * Get human-readable error message for reCAPTCHA error codes
 * @param {string[]} errorCodes 
 * @returns {string}
 */
const getRecaptchaErrorMessage = (errorCodes) => {
    if (!errorCodes || errorCodes.length === 0) {
        return 'reCAPTCHA verification failed';
    }

    const errorMessages = {
        'missing-input-secret': 'reCAPTCHA secret key is missing',
        'invalid-input-secret': 'reCAPTCHA secret key is invalid',
        'missing-input-response': 'reCAPTCHA token is missing',
        'invalid-input-response': 'reCAPTCHA token is invalid or expired',
        'bad-request': 'Invalid reCAPTCHA request',
        'timeout-or-duplicate': 'reCAPTCHA token expired or already used',
        'network-error': 'Network error while verifying reCAPTCHA',
        'api-error': 'Error communicating with reCAPTCHA server',
    };

    const messages = errorCodes.map(code => errorMessages[code] || code);
    return messages.join(', ');
};

module.exports = {
    verifyRecaptcha,
    isRecaptchaEnabled,
    getRecaptchaErrorMessage,
};
