const crypto = require('crypto');

const salt = process.env.IDENTITY_SALT || 'default-salt';

function hashEmail(email) {
  return crypto.createHmac('sha256', salt).update(email).digest('hex');
}

function sanitizeProfile(profile) {
  // Remove or mask sensitive fields
  const sanitized = { ...profile };
  delete sanitized.email;
  delete sanitized.phone;
  return sanitized;
}

module.exports = { hashEmail, sanitizeProfile };
