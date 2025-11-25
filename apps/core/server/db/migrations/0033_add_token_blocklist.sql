-- Token Blocklist Migration
-- Creates table for JWT invalidation (logout, token revocation)

CREATE TABLE "token_blocklist" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "token_id" varchar(255) NOT NULL,
  "user_id" uuid,
  "reason" varchar(100),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  CONSTRAINT "token_blocklist_token_id_unique" UNIQUE("token_id")
);
--> statement-breakpoint
CREATE INDEX "idx_token_blocklist_token_id" ON "token_blocklist" USING btree ("token_id");
--> statement-breakpoint
CREATE INDEX "idx_token_blocklist_expires_at" ON "token_blocklist" USING btree ("expires_at");
