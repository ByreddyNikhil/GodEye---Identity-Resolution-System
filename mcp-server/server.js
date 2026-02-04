const express = require('express');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
app.use(express.json());

// Ensure logs directory exists
const LOGS_DIR = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// Error logging function
function logError(error, context = '') {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ERROR: ${error.message}\nStack: ${error.stack}\nContext: ${context}\n\n`;
  const logFile = path.join(LOGS_DIR, `error-${new Date().toISOString().split('T')[0]}.log`);

  try {
    fs.appendFileSync(logFile, logEntry);
  } catch (logErr) {
    console.error('Failed to write to error log:', logErr);
  }
}

/* ---------------- CONFIG LOAD ---------------- */

const CONFIG_PATH = path.join(__dirname, '..', 'config', 'platforms.json');
const CONFIG = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
const { platforms, global_settings } = CONFIG;

/* ---------------- CONFIG VALIDATION ---------------- */

function validateConfig(config) {
  try {
    for (const [name, p] of Object.entries(config.platforms)) {
      if (typeof p.enabled !== 'boolean') {
        throw new Error(`Platform ${name}: enabled must be boolean`);
      }
      if (!['professional', 'social', 'weak_social', 'deterministic'].includes(p.type)) {
        throw new Error(`Platform ${name}: invalid type`);
      }
      if (typeof p.confidence_weight !== 'number' || p.confidence_weight < 0 || p.confidence_weight > 1) {
        throw new Error(`Platform ${name}: confidence_weight must be 0–1`);
      }
      if (!Array.isArray(p.allowed_fields) || !p.allowed_fields.includes('platform')) {
        throw new Error(`Platform ${name}: allowed_fields must include "platform"`);
      }
    }
  } catch (error) {
    logError(error, 'Config validation failed');
    throw error;
  }
}

try {
  validateConfig(CONFIG);
} catch (error) {
  console.error('Configuration validation failed:', error.message);
  process.exit(1);
}

/* ---------------- TRANSPORTS ---------------- */

const gmailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

const telegramBot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: false });

/* ---------------- SIMPLE IN-MEMORY CACHE ---------------- */

const cache = new Map();

function getCacheKey(tool, args) {
  return `${tool}:${JSON.stringify(args)}`;
}

function getCachedResult(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function setCachedResult(key, value, ttlMinutes) {
  cache.set(key, {
    value,
    expiry: Date.now() + ttlMinutes * 60 * 1000
  });
}

/* ---------------- FIELD SANITIZATION ---------------- */

function filterFields(obj, allowedFields) {
  const filtered = {};
  allowedFields.forEach(field => {
    if (obj.hasOwnProperty(field)) {
      filtered[field] = obj[field];
    }
  });
  return filtered;
}

/* ---------------- PLATFORM LOOKUP FACTORY ---------------- */

function createLookupFunction(platform, config) {
  return async (args) => {
    try {
      const cacheKey = getCacheKey(`${platform}_lookup`, args);
      const cached = getCachedResult(cacheKey);
      if (cached) return cached;

      const data = {
        platform,
        confidence_weight: config.confidence_weight
      };

      if (args.username) {
        data.username = args.username;
        data.display_name = args.username;
        data.profile_url = `${config.base_url}/${args.username}`;
      }

      if (args.profile_url) {
        data.profile_url = args.profile_url;
      }

      // Enforce privacy boundary: config controls allowed fields
      const result = filterFields(data, config.allowed_fields);

      const ttl =
        config.cache_ttl_minutes ??
        global_settings.default_cache_ttl_minutes ??
        10;

      setCachedResult(cacheKey, result, ttl);
      return result;
    } catch (error) {
      logError(error, `Platform lookup failed: ${platform}`);
      throw error;
    }
  };
}

/* ---------------- TOOLS REGISTRY ---------------- */

const tools = {
  gmail_send: async ({ to, subject, body }) => {
    try {
      await gmailTransporter.sendMail({
        from: process.env.GMAIL_USER,
        to,
        subject,
        text: body
      });
      return { status: 'sent' };
    } catch (error) {
      logError(error, 'Gmail send failed');
      throw error;
    }
  },

  telegram_notify: async ({ chatId, message }) => {
    try {
      await telegramBot.sendMessage(chatId, message);
      return { status: 'sent' };
    } catch (error) {
      logError(error, 'Telegram notify failed');
      throw error;
    }
  }
};

// Dynamically register platform lookups
Object.entries(platforms).forEach(([platform, config]) => {
  if (config.enabled) {
    tools[`${platform}_lookup`] = createLookupFunction(platform, config);
  }
});

/* ---------------- TOOL EXECUTION ENDPOINT ---------------- */

app.post('/tool', async (req, res) => {
  const { tool, args } = req.body;

  if (!tools[tool]) {
    return res.status(400).json({ error: `Unknown tool: ${tool}` });
  }

  try {
    const result = await tools[tool](args || {});
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ---------------- DEBUG ---------------- */

app.get('/debug/platforms', (req, res) => {
  res.json(Object.keys(platforms));
});

/* ---------------- START ---------------- */

try {
  app.listen(3000, () => {
    console.log('MCP Server running on port 3000');
  });
} catch (error) {
  logError(error, 'Server startup failed');
  console.error('Failed to start server:', error.message);
  process.exit(1);
}
