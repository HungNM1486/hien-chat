ALTER TABLE "e2e_requests" ADD COLUMN IF NOT EXISTS "salt" text;--> statement-breakpoint
ALTER TABLE "e2e_requests" ADD COLUMN IF NOT EXISTS "verifier" text;--> statement-breakpoint
UPDATE "e2e_requests" SET "salt" = '', "verifier" = '' WHERE "salt" IS NULL OR "verifier" IS NULL;--> statement-breakpoint
UPDATE "conversations"
SET "settings" = jsonb_set("settings", '{encryptionMode}', '"standard"', true)
WHERE "id" IN (
  SELECT "conversation_id"
  FROM "e2e_requests"
  WHERE "verifier" = ''
);--> statement-breakpoint
UPDATE "e2e_requests" SET "status" = 'legacy' WHERE "verifier" = '';--> statement-breakpoint
ALTER TABLE "e2e_requests" ALTER COLUMN "salt" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "e2e_requests" ALTER COLUMN "verifier" SET NOT NULL;
