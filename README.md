# Project GodEye - Identity Resolution System

A comprehensive identity resolution platform that tracks and correlates user identities across multiple social media platforms while maintaining privacy compliance and preventing identity drift.

## 🎯 Overview

Project GodEye solves the challenge of identity resolution in an era where users maintain multiple online personas. It provides:

- **Monotonic Identity Merges**: Once identities are merged, they stay merged with human-auditable trails
- **Negative Edges**: Explicit "these are NOT the same person" relationships prevent future mistakes
- **Rate-Limited Identity Drift Prevention**: Caches platform responses to avoid unnecessary re-validation
- **Privacy-First Design**: GDPR/CCPA/DPDP compliant with salted hashing and data minimization
- **Two-Model Confidence Scoring**: Conservative + exploratory models prevent false attribution

## 🏗️ Architecture

### Components

```
projectgodeye/
├── brave-extension/          # Browser extension for signal collection
├── mcp-server/              # Model Context Protocol server for lookups
├── web-ui/                  # React dashboard for identity visualization
├── database/                # PostgreSQL schema with identity graphs
├── scripts/                 # Confidence scoring and utility functions
├── config/                  # Platform configuration (platforms.json)
├── n8n-workflows/           # Workflow automation
└── test-confidence-fusion.js # Testing utilities
```

### Data Flow

1. **Signal Collection**: Brave extension collects identity signals from social platforms
2. **Platform Lookups**: MCP server queries platforms with caching and rate limiting
3. **Confidence Scoring**: Two-model system (conservative + exploratory) evaluates matches
4. **Identity Resolution**: Graph database stores relationships with audit trails
5. **Human Oversight**: Web UI allows manual merges/splits with full traceability

**Example:** Reviewer clicks "Reject merge" → system writes NON_MATCH edge → future matches between these identities are blocked

## 🚀 Quick Start

### Prerequisites

- Node.js 16+
- PostgreSQL 13+
- Git

### Installation

```bash
git clone <repository-url>
cd projectgodeye

# Install dependencies for each component
npm install  # Root dependencies
cd mcp-server && npm install
cd ../web-ui && npm install
```

### Database Setup

```bash
# Create PostgreSQL database
createdb godeye_db

# Run schema
psql -d godeye_db -f database/schema.sql
```

### Configuration

Edit `config/platforms.json` to configure platform integrations:

```json
{
  "platforms": {
    "instagram": {
      "enabled": true,
      "base_url": "https://instagram.com",
      "confidence_weight": 0.6,
      "cache_ttl_minutes": 30
    }
  }
}
```

### Running the System

```bash
# Start MCP server
cd mcp-server
npm start

# Start web UI (in another terminal)
cd web-ui
npm start

# Load Brave extension in browser
# Navigate to chrome://extensions/ and load brave-extension/
```

### First Run Checklist

1. ✅ Create PostgreSQL database with `pgcrypto` extension enabled
2. ✅ Apply `database/schema.sql` to create tables and indexes
3. ✅ Create `config/platforms.json` with at least one enabled platform
4. ✅ Set required environment variables (`IDENTITY_SALT`, database credentials)
5. ✅ Start MCP server and verify it loads configuration without errors
6. ✅ Test platform lookup with curl to confirm end-to-end functionality
7. ✅ Load Brave extension and verify signal collection (optional)

## 📋 Features

### Identity Graph Management

- **Nodes**: Represent individual identities with hashed emails, usernames, domains
- **Edges**: Relationships between identities (MATCH/NON_MATCH) with confidence scores
- **Canonical Ordering**: Prevents duplicate edges and logical contradictions
- **Audit Trails**: Complete history of merges/splits for compliance

### Confidence Scoring

```javascript
// Two-model approach prevents false attribution
const result = calculateConfidence(conservativeScore, exploratoryScore, profileAge);

// AUTO_MERGE only when both models agree above threshold
if (conservative > 0.8 && exploratory > 0.8) {
  decision = "AUTO_MERGE";
}
```

### Platform Integration

- **Dynamic Configuration**: Add new platforms via JSON config (no code changes)
- **Caching**: 30-minute TTL prevents rate limiting and reduces API calls
- **Capability Scoping**: Each lookup specifies allowed fields for privacy

### Privacy & Compliance

- **Data Minimization**: Only stores necessary identity signals
- **Salted Hashing**: Email addresses are hashed with configurable salt
- **Audit Trails**: Full traceability for GDPR "right to explanation"
- **Manual Overrides**: Human-auditable corrections with NON_MATCH edges

## 🔧 Configuration

### Platform Configuration (`config/platforms.json`)

```json
{
  "platforms": {
    "platform_name": {
      "enabled": true,
      "base_url": "https://platform.com",
      "confidence_weight": 0.0,
      "cache_ttl_minutes": 30,
      "allowed_fields": ["platform", "username", "profile_url"]
    }
  },
  "global_settings": {
    "default_cache_ttl_minutes": 30,
    "max_cache_entries": 1000,
    "rate_limit_per_platform": 100,
    "rate_limit_window_minutes": 60
  }
}
```

### Environment Variables

```bash
# MCP Server
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-app-password
TELEGRAM_TOKEN=your-bot-token

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/godeye_db

# Identity Hashing
IDENTITY_SALT=your-secret-salt
```

## 🧪 Testing

```bash
# Run confidence scoring tests
node test-confidence-fusion.js

# Test MCP server APIs
curl -X POST http://localhost:3000/tool \
  -H "Content-Type: application/json" \
  -d '{"tool":"instagram_lookup","args":{"username":"test","allowed_fields":["platform","username"]}}'
```

## 🔒 Security & Privacy

### Data Protection

- **No Raw PII Storage**: Emails hashed, sensitive fields sanitized
- **Scoped Access**: Each lookup specifies exactly which fields are needed
- **Audit Logging**: All identity operations are logged with timestamps
- **Data Retention**: Configurable TTL for cached platform responses

### Compliance

- **GDPR**: Right to explanation via audit trails, right to correction via manual splits
- **CCPA**: Data minimization, opt-in collection, deletion capabilities
- **DPDP Act**: Proportionality principle, purpose limitation

### Brave Extension Safety

- **Platform Gating**: Only collects on LinkedIn, Instagram, Facebook
- **Focus Checking**: Only active when page has user focus
- **Error Handling**: Silent failures don't break user experience
- **User Control**: Extension requires explicit opt-in

## 📊 API Reference

### MCP Server Endpoints

#### POST /tool

Execute platform lookups and utility functions.

**Instagram Lookup:**
```json
{
  "tool": "instagram_lookup",
  "args": {
    "username": "johndoe",
    "allowed_fields": ["platform", "username", "profile_url", "confidence_weight"]
  }
}
```

**Response:**
```json
{
  "platform": "instagram",
  "username": "johndoe",
  "profile_url": "https://instagram.com/johndoe",
  "confidence_weight": 0.6
}
```

### Database Schema

#### identity_nodes
```sql
CREATE TABLE identity_nodes (
  identity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_hash TEXT,
  domain TEXT,
  username TEXT,
  profile_age_years FLOAT DEFAULT 0,
  active BOOLEAN DEFAULT true,
  superseded_by UUID REFERENCES identity_nodes(identity_id),
  created_at TIMESTAMP DEFAULT now()
);
```

#### identity_edges
```sql
CREATE TABLE identity_edges (
  from_id UUID REFERENCES identity_nodes(identity_id),
  to_id UUID REFERENCES identity_nodes(identity_id),
  confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),
  source TEXT,
  relationship_type TEXT CHECK (relationship_type IN ('MATCH', 'NON_MATCH')),
  confidence_source TEXT CHECK (confidence_source IN ('DETERMINISTIC', 'LLM', 'HUMAN', 'MCP')),
  created_at TIMESTAMP DEFAULT now(),
  PRIMARY KEY (from_id, to_id),
  CHECK (from_id < to_id)
);
```

## 🚦 Troubleshooting

### Common Issues

**MCP Server won't start:**
- Check PostgreSQL is running
- Verify `config/accounts.json` is valid JSON
- Ensure all npm dependencies are installed

**Extension not collecting signals:**
- Verify platform URLs match allowed domains
- Check browser console for errors
- Ensure page has focus when signals are collected

**Database connection errors:**
- Confirm PostgreSQL credentials
- Check `pgcrypto` extension is enabled
- Verify database schema is applied

### Performance Tuning

- **Cache TTL**: Adjust per-platform cache times in `accounts.json`
- **Database Indexes**: Partial indexes on `active` identities optimize queries
- **Rate Limiting**: Configure API call limits to prevent platform throttling

## 🔌 Adding New Platforms

Project GodEye supports dynamic platform integration through configuration - no code changes required. Follow this guide to add support for new social media platforms.

**Note:** If the platform requires a new lookup mechanism (API/scraping), a handler must be added to the MCP server. Configuration controls behavior, not data acquisition.

### Step-by-Step Guide

#### 1. Analyze the Platform
Before adding a platform, understand its identity signals:
- **Username patterns**: How users are identified (handles, IDs, etc.)
- **Profile structure**: What public information is available
- **API availability**: Does the platform offer public APIs or require scraping?
- **Rate limits**: What are the platform's usage restrictions?
- **Privacy policies**: What data collection is allowed?

#### 2. Configure Platform Settings
Add a new entry to `config/accounts.json`:

```json
{
  "platforms": {
    "newplatform": {
      "enabled": true,
      "base_url": "https://newplatform.com",
      "confidence_weight": 0.5,
      "cache_ttl_minutes": 30,
      "allowed_fields": ["platform", "username", "profile_url", "confidence_weight"]
    }
  }
}
```

#### 3. Set Confidence Weights
Choose appropriate confidence weights based on platform reliability:

| Platform Type | Confidence Weight | Reasoning |
|---------------|------------------|-----------|
| Professional Networks (LinkedIn) | 0.9 | High-quality, verified business data |
| Photo/Video Platforms (Instagram, TikTok) | 0.6-0.7 | User-generated content, some verification |
| Social Networks (Facebook, Twitter) | 0.7-0.8 | Mix of personal and public data |
| Messaging Apps (Snapchat, WhatsApp) | 0.3-0.4 | Ephemeral content, less persistent |
| Gaming Platforms (Discord, Steam) | 0.5-0.6 | Username-based, some verification |

#### 4. Configure Allowed Fields
Define which fields can be collected for privacy compliance:

```json
"allowed_fields": [
  "platform",           // Always required
  "username",           // Primary identifier
  "display_name",       // Human-readable name
  "profile_url",        // Link to profile
  "confidence_weight",  // Platform reliability score
  "verified_status",    // If account is verified
  "follower_count"      // Public metrics (be careful with PII)
]
```

#### 5. Test the Integration
```bash
# Restart MCP server to load new config
cd mcp-server
npm start

# Test the new lookup function
curl -X POST http://localhost:3000/tool \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "newplatform_lookup",
    "args": {
      "username": "testuser",
      "allowed_fields": ["platform", "username", "profile_url"]
    }
  }'
```

### Complete Example: Adding Twitter/X

```json
{
  "platforms": {
    "twitter": {
      "enabled": true,
      "base_url": "https://twitter.com",
      "confidence_weight": 0.7,
      "cache_ttl_minutes": 30,
      "allowed_fields": [
        "platform",
        "username",
        "display_name",
        "profile_url",
        "confidence_weight",
        "verified_status",
        "follower_count"
      ]
    }
  }
}
```

### Best Practices

#### Privacy & Compliance
- **Minimize data collection**: Only collect what's necessary for identity resolution
- **Respect platform ToS**: Ensure your collection methods comply with terms of service
- **GDPR considerations**: Implement proper consent mechanisms if collecting user data
- **Data retention**: Use appropriate cache TTLs to avoid storing stale data

#### Performance & Reliability
- **Rate limiting**: Set cache TTLs to respect platform API limits
- **Error handling**: Implement graceful degradation when platforms are unavailable
- **Monitoring**: Log lookup success/failure rates for platform health monitoring
- **Fallbacks**: Consider multiple lookup methods (API, scraping, etc.)

#### Configuration Management
- **Version control**: Keep platform configs in git for change tracking
- **Environment-specific**: Use different configs for dev/staging/production
- **Documentation**: Update this README when adding new platforms
- **Testing**: Validate new platforms with existing confidence scoring

### Troubleshooting New Platforms

**Lookup function not found:**
- Verify platform is enabled in config
- Check JSON syntax is valid
- Restart MCP server after config changes

**API rate limiting:**
- Increase cache_ttl_minutes
- Implement exponential backoff
- Consider paid API tiers

**Data quality issues:**
- Adjust confidence_weight based on platform reliability
- Review allowed_fields for completeness
- Check data normalization in scripts/normalize-input.js

**Privacy compliance:**
- Audit collected fields against regulations
- Implement proper data deletion mechanisms
- Document data usage purposes

### Advanced Integration

For platforms requiring custom logic (OAuth, complex APIs, etc.), extend the MCP server:

```javascript
// In mcp-server/server.js
const customLookups = {
  custom_platform_lookup: async ({ args }) => {
    // Custom implementation here
    const data = await customAPI.lookup(args.username);
    return filterFields(data, args.allowed_fields);
  }
};

// Add to tools object
Object.assign(tools, customLookups);
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add platform configurations to `config/accounts.json`
4. Test with existing confidence scoring
5. Submit pull request

## 📄 License

This project implements privacy-preserving identity resolution for research and compliance purposes. See individual component licenses for details.

## ⚠️ Legal Notice

This system is designed to comply with privacy regulations including GDPR, CCPA, and DPDP Act. Always consult legal counsel before deploying identity resolution systems. The system includes comprehensive audit trails and manual override capabilities to support regulatory requirements.

## 🔗 Related Projects

- [Brave Browser](https://brave.com/) - Privacy-focused browser
- [n8n](https://n8n.io/) - Workflow automation
- [PostgreSQL](https://postgresql.org/) - Database
- [React](https://reactjs.org/) - Web UI framework

---

**Built for the future of privacy-preserving identity resolution.**
