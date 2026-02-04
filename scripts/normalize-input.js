const crypto = require('crypto');

function normalizeInput(data) {
  return {
    email_hash: data.emailHint
      ? crypto.createHash('sha256').update(data.emailHint).digest('hex')
      : null,
    domain: data.url,
    username: data.usernameHint?.toLowerCase() || null
  };
}

module.exports = { normalizeInput };
