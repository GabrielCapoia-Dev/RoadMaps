CREATE TABLE users (
  id uuid PRIMARY KEY,
  email text NOT NULL UNIQUE CHECK (email = lower(email)),
  password_hash text NOT NULL,
  name text NOT NULL,
  bio text NOT NULL DEFAULT '',
  verified_at timestamptz,
  onboarding_completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE email_verifications (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);
CREATE INDEX email_verifications_user ON email_verifications(user_id);
CREATE TABLE sessions (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);
CREATE INDEX sessions_user ON sessions(user_id);
CREATE INDEX sessions_expiry ON sessions(expires_at);
CREATE TABLE roadmaps (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES users,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Geral',
  tags text[] NOT NULL DEFAULT '{}',
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private','public')),
  graph jsonb NOT NULL DEFAULT '{"nodes":[],"edges":[]}',
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX roadmaps_owner ON roadmaps(owner_id);
CREATE INDEX roadmaps_public ON roadmaps(published_at DESC, id) WHERE visibility='public';
CREATE INDEX roadmaps_tags ON roadmaps USING gin(tags);
CREATE INDEX roadmaps_search ON roadmaps USING gin(to_tsvector('simple', title || ' ' || description));
CREATE TABLE roadmap_members (
  roadmap_id uuid NOT NULL REFERENCES roadmaps ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('editor','commenter','viewer')),
  PRIMARY KEY(roadmap_id,user_id)
);
CREATE INDEX roadmap_members_user ON roadmap_members(user_id);
CREATE TABLE node_progress (
  roadmap_id uuid NOT NULL REFERENCES roadmaps ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  node_id uuid NOT NULL,
  status text NOT NULL CHECK (status IN ('not_started','in_progress','completed')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(roadmap_id,user_id,node_id)
);
CREATE TABLE roadmap_reactions (
  roadmap_id uuid NOT NULL REFERENCES roadmaps ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('like','favorite','follow')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(roadmap_id,user_id,kind)
);
CREATE INDEX reactions_user ON roadmap_reactions(user_id,kind);
CREATE TABLE comments (
  id uuid PRIMARY KEY,
  roadmap_id uuid NOT NULL REFERENCES roadmaps ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  parent_id uuid REFERENCES comments ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX comments_roadmap ON comments(roadmap_id,created_at,id);
CREATE INDEX comments_parent ON comments(parent_id);
CREATE TABLE user_follows (
  follower_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  followed_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(follower_id,followed_id),
  CHECK(follower_id <> followed_id)
);
CREATE INDEX follows_target ON user_follows(followed_id);
