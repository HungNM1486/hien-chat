CREATE TYPE "public"."content_type" AS ENUM('text', 'image', 'voice', 'file', 'poll');
-- Note: if enum exists, run: ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'poll';

CREATE TABLE IF NOT EXISTS "user_prekeys" (
  "user_id" uuid PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
  "identity_key_public" text NOT NULL,
  "signed_pre_key_public" text NOT NULL,
  "signed_pre_key_id" integer NOT NULL,
  "signed_pre_key_signature" text DEFAULT '' NOT NULL,
  "one_time_pre_keys" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "e2e_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "conversation_id" uuid NOT NULL REFERENCES "conversations"("id") ON DELETE CASCADE,
  "requester_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "status" varchar(16) DEFAULT 'pending' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "push_subscriptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "endpoint" text NOT NULL,
  "p256dh" text NOT NULL,
  "auth" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "pinned_messages" (
  "conversation_id" uuid NOT NULL REFERENCES "conversations"("id") ON DELETE CASCADE,
  "message_id" uuid NOT NULL REFERENCES "messages"("id") ON DELETE CASCADE,
  "pinned_by" uuid NOT NULL REFERENCES "users"("id"),
  "pinned_at" timestamp with time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("conversation_id", "message_id")
);
