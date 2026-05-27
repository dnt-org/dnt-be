'use strict';

/**
 * Global policy: require-cccd-verified
 *
 * Ensures the calling user has completed CCCD (identity) verification before
 * accessing a write endpoint.  Verification is considered complete when the
 * user has at least one business record in the `businesses` table — this is
 * created during the AdminControl / CCCD-scan flow.
 *
 * Usage in a route config:
 *   config: {
 *     auth: false,                              // routes manage JWT themselves
 *     policies: ['global::require-cccd-verified'],
 *   }
 *
 * Returns false (→ 403 Forbidden) when:
 *   - No Authorization header is present
 *   - The JWT is invalid or expired
 *   - The user does not exist
 *   - The user has no business record (CCCD not verified)
 */

const jwt = require('jsonwebtoken');

module.exports = async (policyContext, _config, { strapi }) => {
  const ctx = policyContext;

  // ── 1. Extract token ────────────────────────────────────────────────────────
  const authHeader = ctx.request.header.authorization || ctx.request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    ctx.status = 401;
    ctx.body = { error: 'UNAUTHORIZED', message: 'Authentication token is required' };
    return false;
  }

  const token = authHeader.slice(7); // strip "Bearer "

  // ── 2. Decode & verify JWT ──────────────────────────────────────────────────
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    ctx.status = 401;
    ctx.body = { error: 'INVALID_TOKEN', message: 'Invalid or expired token' };
    return false;
  }

  if (!decoded?.id) {
    ctx.status = 401;
    ctx.body = { error: 'INVALID_TOKEN', message: 'Token payload is malformed' };
    return false;
  }

  // ── 3. Confirm user exists ──────────────────────────────────────────────────
  const user = await strapi.db
    .query('plugin::users-permissions.user')
    .findOne({ where: { id: decoded.id } });

  if (!user) {
    ctx.status = 401;
    ctx.body = { error: 'USER_NOT_FOUND', message: 'User not found' };
    return false;
  }

  // ── 4. Check CCCD verification (business record presence) ──────────────────
  const business = await strapi.db.connection('businesses')
    .where({ user_id: user.id })
    .first();

  if (!business) {
    ctx.status = 403;
    ctx.body = {
      error: 'CCCD_NOT_VERIFIED',
      message: 'Bạn cần xác minh CCCD trước khi thực hiện thao tác này. Vui lòng hoàn tất xác minh tại trang quản lý tài khoản.',
    };
    return false;
  }

  // ── 5. Attach user to context for downstream controllers ──────────────────
  ctx.state.user = user;

  return true;
};
