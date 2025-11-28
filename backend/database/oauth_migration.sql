-- Google OAuth Integration Migration
-- Add Google OAuth columns to users table

ALTER TABLE users
ADD COLUMN google_id VARCHAR(255) UNIQUE DEFAULT NULL AFTER password,
ADD COLUMN oauth_provider VARCHAR(50) DEFAULT NULL AFTER google_id,
ADD COLUMN avatar_url TEXT DEFAULT NULL AFTER oauth_provider;

-- Create index for faster Google ID lookups
CREATE INDEX idx_google_id ON users(google_id);
CREATE INDEX idx_oauth_provider ON users(oauth_provider);

-- Update existing users to have NULL for OAuth fields (already set by DEFAULT)
-- This allows both traditional email/password and OAuth users

-- Note: google_id should be unique to prevent duplicate Google accounts
-- oauth_provider can be 'google', 'facebook', 'apple', etc. for future expansion
