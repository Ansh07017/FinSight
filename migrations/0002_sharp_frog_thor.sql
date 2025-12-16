ALTER TABLE "user_profiles" ADD COLUMN "goal_type" text DEFAULT 'monthly_amount';--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "target_value" varchar;