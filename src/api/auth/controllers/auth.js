// Path: ./src/api/auth/controllers/auth.js

'use strict';

const { sanitize } = require('@strapi/utils');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const crypto = require('crypto');
const { getUserApproveMode } = require('../../../common/services/system-config');
const { createFileEntry } = require('../../../common/files-utils');
const { pushNotification } = require('../../../common/notification');
const { getUserFromToken } = require('../../../common/services/auth-utils');

// In-memory storage for QR codes (in production, use Redis or database)
const qrCodeStore = new Map();

const login = async (ctx) => {
  const { cccd, password } = ctx.request.body;

  if (!cccd || !password) {
    return ctx.badRequest('cccd and password are required');
  }
  console.log(ctx.request.body);

  const existingUser = await strapi.db.query('plugin::users-permissions.user').findOne({
    // @ts-ignore
    where: { cccd: cccd },
    populate: ["avt.url"],
  });




  if (existingUser == null) {
    return ctx.unauthorized('Invalid credentials');
  }

  const validPassword = await verifyPassword(
    password,
    existingUser.password
  );

  if (!validPassword) {
    return ctx.unauthorized('Invalid credentials');
  }

  console.log(existingUser);


  const token = jwt.sign({ cccd: existingUser.cccd, id: existingUser.id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

  return ctx.send({ token, user: existingUser });


}

const verifyPassword = async (plainTextPassword, hashedPassword) => {
  try {
    const match = await bcrypt.compare(plainTextPassword, hashedPassword);
    return match; // Returns true if the passwords match, false otherwise
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false; // Or throw error, depending on your needs.
  }
}

const register = async (ctx) => {
  const {
    username,
    email,
    password,
    cccd,
    reference_id,
    full_name,
    mobile_number,
    bank_number,
    bank_name,
    address_no,
    address_on_map,
    avt,// This will be the URL of the image
    signature,

  } = ctx.request.body;

  console.log(ctx.request.body);
  if (!password || !cccd) {
    return ctx.badRequest('Missing required fields');
  }

  try {
    const existingUser = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: {
        $or: [{ cccd: cccd }],
      },
    });

    if (existingUser) {
      if (existingUser.cccd === cccd) {
        return ctx.badRequest('CCCD already exists');
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a file entry for the avatar
    let avatarFile = await createFileEntry(avt);
    let signatureFile = await createFileEntry(signature);
    console.log(signatureFile);

    const userApproveMode = await getUserApproveMode(); // Get the current transaction approve mode

    // Get the authenticated role
    const authenticatedRole = await strapi.query('plugin::users-permissions.role').findOne({
      where: { type: 'authenticated' },
    });

    const user = await strapi.db.query('plugin::users-permissions.user').create({
      data: {
        username,
        email,
        password: hashedPassword,
        cccd,
        reference_id,
        full_name,
        mobile_number,
        bank_number,
        bank_name,
        address_no,
        address_on_map,
        avt: avatarFile ? avatarFile.id : null,
        signature: signatureFile ? signatureFile.id : null,
        confirmed: userApproveMode === 'manual mode' ? false : true,
        role: authenticatedRole.id, // Assign the authenticated role
      },
    });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    // Get the populated user with avatar
    const populatedUser = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: user.id },
      populate: ['avt'],
    });

    // Remove sensitive information and format avatar URL
    const { password: _, avt: __, ...userWithoutPassword } = populatedUser;
    const userWithAvatar = {
      ...userWithoutPassword,
      avt: populatedUser.avt ? populatedUser.avt.url : null
    };

    await pushNotification(user.id, "N1")
    ctx.send({
      jwt: token,
      user: userWithAvatar,
    });

  } catch (err) {
    console.error("Registration Error", err);
    ctx.internalServerError('An error occurred during registration');
  }
}

const changePassword = async (ctx) => {
  const { cccd, new_password, confirm_password } = ctx.request.body;
  console.log(ctx.request.body);
  if (!cccd || !new_password || !confirm_password) {
    return ctx.badRequest('All fields are required');
  }

  if (new_password !== confirm_password) {
    return ctx.badRequest('New password and confirm password do not match');
  }

  try {
    // Find user by CCCD
    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { cccd: cccd },
      populate: ['wallet']
    });

    if (!user) {
      return ctx.notFound('User not found');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update password and set confirmed to true
    await strapi.db.query('plugin::users-permissions.user').update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        confirmed: true
      }
    });

    // Check if user has a wallet, create one if not exists
    if (!user.wallet) {
      // Create a wallet for the user
      const wallet = await strapi.entityService.create('api::wallet.wallet', {
        data: {
          cccd: user.cccd,
          total: 0,
          account_of_goods: 0,
          account_of_freelancer: 0,
          account_of_ailive: 0,
          pending_amount: 0,
          user_id: user.id,
          name: user.full_name || user.username,
          user: user.id
        }
      });

      // Link the wallet to the user
      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: user.id },
        data: { wallet: wallet.id }
      });

      console.log(`Created wallet for user ${user.id} with CCCD ${user.cccd}`);
    }

    return ctx.send({ message: 'Password updated successfully' });
  } catch (err) {
    console.error("Password Change Error:", err);
    return ctx.internalServerError('An error occurred while changing password');
  }
}

const getMe = async (ctx) => {
  try {
    // Get the token from the Authorization header
    const token = ctx.request.header.authorization?.split(' ')[1];

    if (!token) {
      return ctx.unauthorized('No token provided');
    }

    // Verify and decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded);
    // Find user by id from token
    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
      // @ts-ignore
      where: { cccd: decoded.cccd },
      populate: ["avt.url"],
    });
    console.log(user);

    if (!user) {
      return ctx.notFound('User not found');
    }

    // Remove sensitive information
    const { password, ...userWithoutPassword } = user;

    const userFinal = {
      ...userWithoutPassword,
      avt: userWithoutPassword.avt?.url
    }

    return ctx.send(userFinal);
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return ctx.unauthorized('Invalid token');
    }
    console.error("Get User Details Error:", err);
    return ctx.internalServerError('An error occurred while fetching user details');
  }
}

const updateUser = async (ctx) => {
  try {
    // Get the token from the Authorization header
    const token = ctx.request.header.authorization?.split(' ')[1];

    if (!token) {
      return ctx.unauthorized('No token provided');
    }

    // Verify and decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user by CCCD from token
    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
      // @ts-ignore
      where: { cccd: decoded.cccd },
    });

    if (!user) {
      return ctx.notFound('User not found');
    }

    // Get update data from request body
    const updateData = ctx.request.body;

    // Remove sensitive fields that shouldn't be updated through this endpoint
    delete updateData.password;
    delete updateData.cccd;
    delete updateData.id;

    // Handle avatar update if provided
    if (updateData.avt) {
      // Create a new file entry for the avatar
      const avatarFile = await strapi.db.query('plugin::upload.file').create({
        data: {
          name: `avatar-${Date.now()}`,
          url: updateData.avt,
          provider: 'cloudinary',
          mime: 'image/jpeg',
          size: 0,
          hash: `avatar-${Date.now()}`,
          ext: '.jpg',
          folderPath: '/',
        },
      });
      updateData.avt = avatarFile.id;
    }

    // Update user
    const updatedUser = await strapi.db.query('plugin::users-permissions.user').update({
      where: { id: user.id },
      data: updateData,
      populate: ['avt'],
    });

    // Remove password and format avatar URL
    const { password, avt: __, ...userWithoutPassword } = updatedUser;
    const userWithAvatar = {
      ...userWithoutPassword,
      avt: updatedUser.avt ? updatedUser.avt.url : null
    };

    return ctx.send(userWithAvatar);
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return ctx.unauthorized('Invalid token');
    }
    console.error("Update User Error:", err);
    return ctx.internalServerError('An error occurred while updating user');
  }
}

const searchByCCCD = async (ctx) => {
  const { cccd } = ctx.request.query;

  if (!cccd) {
    return ctx.badRequest('CCCD number is required');
  }

  try {
    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { cccd },
      populate: ['avt', 'role'],
    });

    if (!user) {
      return ctx.notFound('User not found');
    }

    // Remove sensitive information
    const { password, resetPasswordToken, confirmationToken, ...userWithoutSensitiveData } = user;

    // Format avatar URL if exists
    const formattedUser = {
      ...userWithoutSensitiveData,
      avt: user.avt ? user.avt.url : null
    };

    return ctx.send(formattedUser);
  } catch (err) {
    console.error("Search User Error:", err);
    return ctx.internalServerError('An error occurred while searching for user');
  }
}

// Generate QR code for mobile login
const generateQR = async (ctx) => {
  try {
    // Generate a unique session ID
    const sessionId = crypto.randomUUID();
    const timestamp = Date.now();

    // Create QR code data
    const qrData = {
      sessionId,
      timestamp,
      type: 'mobile_login',
      appUrl: process.env.MOBILE_APP_URL || 'myapp://login'
    };

    // Store session data with expiration (5 minutes)
    qrCodeStore.set(sessionId, {
      ...qrData,
      status: 'pending',
      expiresAt: timestamp + (5 * 60 * 1000) // 5 minutes
    });

    // Generate QR code as base64 image
    const qrCodeUrl = `${qrData.appUrl}?sessionId=${sessionId}&timestamp=${timestamp}`;
    const qrCodeImage = await QRCode.toDataURL(qrCodeUrl);

    return ctx.send({
      sessionId,
      qrCode: qrCodeImage,
      expiresIn: 300 // 5 minutes in seconds
    });
  } catch (error) {
    console.error('QR generation error:', error);
    return ctx.internalServerError('Failed to generate QR code');
  }
};

const generateQRinfo = async (ctx) => {
  try {
    // Extract and validate authorization header
    const authHeader = ctx.request.header.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ctx.unauthorized('Authorization token required');
    }

    // Extract user data from JWT token
    const token = authHeader.split(' ')[1];
    const user = await getUserFromToken(token, strapi);
    
    if (!user) {
      return ctx.unauthorized('Invalid or expired token');
    }

    // Get user data from database with avatar populated
    const existingUser = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { cccd: user.cccd },
      populate: ["avt"],
    });
    if (!existingUser) {
      return ctx.notFound('User not found');
    }

    // Extract avatar and cccd from user data
    const avatar = existingUser.avt?.url || null;
    const cccd = existingUser.cccd;

    // Validate required fields exist
    if (!cccd) {
      return ctx.badRequest('User missing required field: cccd');
    }

    // Validate avatar URL if it exists
    if (avatar) {
      try {
        new URL(avatar);
      } catch (urlError) {
        return ctx.badRequest('Avatar must be a valid URL');
      }
    }

    // Generate a unique session ID
    const sessionId = crypto.randomUUID();
    const timestamp = Date.now();

    // Create QR code data with avatar and cccd
    const qrData = {
      sessionId,
      timestamp,
      type: 'mobile_login',
      appUrl: process.env.MOBILE_APP_URL || 'myapp://login',
      avatar: avatar || '', // Link to avatar image or empty string
      stk: cccd, // Text field for STK (cccd)
      userId: existingUser.id // Include user ID for reference
    };

    // Store session data with expiration (5 minutes)
    qrCodeStore.set(sessionId, {
      ...qrData,
      status: 'pending',
      expiresAt: timestamp + (5 * 60 * 1000) // 5 minutes
    });

    // Generate QR code URL with all parameters
    const qrCodeUrl = `${qrData.appUrl}?sessionId=${sessionId}&timestamp=${timestamp}&avatar=${encodeURIComponent(avatar || '')}&stk=${encodeURIComponent(cccd)}`;

    // Generate QR code as base64 image
    const qrCodeImage = await QRCode.toDataURL(JSON.stringify(qrData));

    return ctx.send({
      sessionId,
      qrCode: qrCodeImage,
      avatar: avatar || null,
      stk: cccd,
      expiresIn: 300 // 5 minutes in seconds
    });
  } catch (error) {
    console.error('QR generation error:', error);
    return ctx.internalServerError('Failed to generate QR code');
  }
};

// Verify QR code and authenticate user from mobile app
const verifyQR = async (ctx) => {
  try {
    const { sessionId, cccd, password } = ctx.request.body;

    if (!sessionId || !cccd || !password) {
      return ctx.badRequest('sessionId, cccd, and password are required');
    }

    // Check if session exists and is valid
    const session = qrCodeStore.get(sessionId);
    if (!session) {
      return ctx.badRequest('Invalid or expired session');
    }

    if (Date.now() > session.expiresAt) {
      qrCodeStore.delete(sessionId);
      return ctx.badRequest('Session expired');
    }

    if (session.status !== 'pending') {
      return ctx.badRequest('Session already used');
    }

    // Verify user credentials
    const existingUser = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { cccd: cccd },
      populate: ["avt.url"],
    });

    if (!existingUser) {
      return ctx.unauthorized('Invalid credentials');
    }

    const validPassword = await verifyPassword(password, existingUser.password);
    if (!validPassword) {
      return ctx.unauthorized('Invalid credentials');
    }

    // Generate JWT token
    const token = jwt.sign(
      { cccd: existingUser.cccd, id: existingUser.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Update session status
    qrCodeStore.set(sessionId, {
      ...session,
      status: 'authenticated',
      token,
      user: existingUser
    });

    return ctx.send({
      success: true,
      message: 'Authentication successful',
      token,
      user: existingUser
    });
  } catch (error) {
    console.error('QR verification error:', error);
    return ctx.internalServerError('Failed to verify QR code');
  }
};

// Complete QR login process (called by web client)
const qrLogin = async (ctx) => {
  try {
    const { sessionId } = ctx.request.body;

    if (!sessionId) {
      return ctx.badRequest('sessionId is required');
    }

    // Check session status
    const session = qrCodeStore.get(sessionId);
    if (!session) {
      return ctx.badRequest('Invalid or expired session');
    }

    if (Date.now() > session.expiresAt) {
      qrCodeStore.delete(sessionId);
      return ctx.badRequest('Session expired');
    }

    if (session.status === 'pending') {
      return ctx.send({
        status: 'pending',
        message: 'Waiting for mobile authentication'
      });
    }

    if (session.status === 'authenticated') {
      // Clean up session
      qrCodeStore.delete(sessionId);

      return ctx.send({
        status: 'authenticated',
        token: session.token,
        user: session.user
      });
    }

    return ctx.badRequest('Invalid session status');
  } catch (error) {
    console.error('QR login error:', error);
    return ctx.internalServerError('Failed to complete QR login');
  }
};

// Clean up expired sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of qrCodeStore.entries()) {
    if (now > session.expiresAt) {
      qrCodeStore.delete(sessionId);
    }
  }
}, 60000); // Clean up every minute

const verifyBankNumber = async (ctx) => {
  try {
    const { bankNumber, bankName, accountName } = ctx.request.body;
    if (!bankNumber || !bankName || !accountName) {
      return ctx.badRequest('bankNumber, bankName, and accountName are required');
    }
    return ctx.send({
      success: true,
      message: 'Bank number is valid'
    });
  } catch (error) {
    console.error('Bank number verification error:', error);
    return ctx.internalServerError('Failed to verify bank number');
  }
}

module.exports = {
  login, register, changePassword, getMe, updateUser, searchByCCCD,
  generateQR, verifyQR, qrLogin, verifyBankNumber, generateQRinfo
};