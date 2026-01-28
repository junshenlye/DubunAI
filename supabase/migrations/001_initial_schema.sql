-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CONVERSATIONS TABLE
-- ============================================
CREATE TABLE conversations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT NOT NULL DEFAULT 'New Conversation',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- NODES TABLE (the core DAG structure)
-- ============================================
CREATE TABLE nodes (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id   UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

  -- DAG edges: empty = root, one = linear, many = merge
  parent_ids        UUID[] NOT NULL DEFAULT '{}',

  -- Node classification
  type              TEXT NOT NULL CHECK (type IN (
                      'user',
                      'assistant',
                      'explore_root',
                      'explore_branch',
                      'merge'
                    )),

  -- State machine
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
                      'pending',
                      'streaming',
                      'completed',
                      'partial',
                      'failed'
                    )),

  -- Role for LLM context
  role              TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),

  -- Content fields
  input             TEXT NOT NULL DEFAULT '',
  reasoning         TEXT,
  output            TEXT,
  summary           TEXT,

  -- Branch metadata
  branch_label      TEXT,
  branch_id         UUID,
  merge_strategy    TEXT,

  -- Ordering within a branch
  sequence          INTEGER NOT NULL DEFAULT 0,

  -- Flexible metadata
  metadata          JSONB NOT NULL DEFAULT '{}'::JSONB,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- BRANCHES TABLE (lightweight branch registry)
-- ============================================
CREATE TABLE branches (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id   UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  label             TEXT NOT NULL,
  description       TEXT,
  parent_node_id    UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  root_node_id      UUID REFERENCES nodes(id),
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'merged', 'abandoned')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_nodes_conversation_id ON nodes(conversation_id);
CREATE INDEX idx_nodes_branch_id ON nodes(branch_id);
CREATE INDEX idx_nodes_parent_ids ON nodes USING GIN(parent_ids);
CREATE INDEX idx_nodes_conversation_sequence ON nodes(conversation_id, sequence);
CREATE INDEX idx_branches_conversation_id ON branches(conversation_id);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nodes_updated_at
  BEFORE UPDATE ON nodes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ENABLE REALTIME (run in Supabase SQL editor)
-- ============================================
-- ALTER PUBLICATION supabase_realtime ADD TABLE nodes;
-- ALTER PUBLICATION supabase_realtime ADD TABLE branches;
