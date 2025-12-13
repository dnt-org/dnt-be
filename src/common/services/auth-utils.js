'use strict';

const jwt = require('jsonwebtoken');

/**
 * Decodes and validates a JWT token.
 * 
 * @param {string} token The JWT token string.
 * @returns {object} The decoded payload if valid.
 * @throws {Error} Throws error if token is missing, invalid, or payload is malformed.
 */
const decodeAndValidateToken = (token) => {
  if (!token) {
    throw new Error('No token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Validate payload structure (ensure it's an object with cccd)
    if (typeof decoded !== 'object' || !decoded.cccd) {
      console.error('Invalid token payload structure:', decoded);
      throw new Error('Invalid token payload');
    }

    return decoded;
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'NotBeforeError' || err.name === 'TokenExpiredError') {
      console.error('JWT Verification Error:', err.name);
      throw new Error('Invalid token');
    } 
    // Re-throw other unexpected errors
    console.error('Unexpected error during token validation:', err);
    throw err; 
  }
};

/**
 * Fetches a user from the database based on the JWT payload.
 * 
 * @param {object} payload The decoded and validated JWT payload.
 * @param {object} strapi The Strapi instance.
 * @returns {object} The user entity.
 * @throws {Error} Throws error if user is not found.
 */
const getUserFromPayload = async (payload, strapi) => {
  if (!payload || !payload.cccd) {
     throw new Error('Invalid payload provided for user lookup');
  }

  const user = await strapi.db.query('plugin::users-permissions.user').findOne({
    where: { id: payload.id },
    populate: ['wallet', 'favorite_wallets'], // Populate relations needed by wallet service
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

/**
 * Gets the user associated with a JWT token.
 *
 * @param {string} token The JWT token string.
 * @param {object} strapi The Strapi instance.
 * @returns {object} The user entity.
 * @throws {Error} Throws errors from underlying functions (invalid token, user not found, etc.)
 */
const getUserFromToken = async (token, strapi) => {
  const payload = decodeAndValidateToken(token); // Can throw 'No token provided', 'Invalid token', 'Invalid token payload'
  const user = await getUserFromPayload(payload, strapi); // Can throw 'User not found'
  return user;
};

module.exports = {
  decodeAndValidateToken,
  getUserFromPayload,
  getUserFromToken,
}; 