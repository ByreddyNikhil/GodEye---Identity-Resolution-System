CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE identity_nodes (
  identity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_hash TEXT,
  domain TEXT,
  username TEXT,
  profile_age_years FLOAT DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE identity_edges (
  from_id UUID REFERENCES identity_nodes(identity_id),
  to_id UUID REFERENCES identity_nodes(identity_id),
  confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),
  source TEXT,
  relationship_type TEXT CHECK (relationship_type IN ('MATCH', 'NON_MATCH')),
  created_at TIMESTAMP DEFAULT now(),
  PRIMARY KEY (from_id, to_id)
);

CREATE INDEX idx_email_hash ON identity_nodes(email_hash);
CREATE INDEX idx_domain ON identity_nodes(domain);
CREATE INDEX idx_active_nodes ON identity_nodes(active)
WHERE active = true;

ALTER TABLE identity_nodes
ADD COLUMN active BOOLEAN DEFAULT true,
ADD COLUMN superseded_by UUID,
ADD CONSTRAINT fk_superseded_by
FOREIGN KEY (superseded_by)
REFERENCES identity_nodes(identity_id);
