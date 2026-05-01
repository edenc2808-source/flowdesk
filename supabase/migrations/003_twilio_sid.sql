-- Add Twilio SID column for status callback tracking
ALTER TABLE messages ADD COLUMN IF NOT EXISTS twilio_sid text;
CREATE INDEX IF NOT EXISTS messages_twilio_sid_idx ON messages(twilio_sid) WHERE twilio_sid IS NOT NULL;
