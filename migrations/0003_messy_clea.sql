CREATE TABLE "behavioral_savings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"behavior_type" text NOT NULL,
	"estimated_amount" numeric(12, 2) NOT NULL,
	"xp_awarded" integer DEFAULT 0,
	"logged_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "behavioral_savings" ADD CONSTRAINT "behavioral_savings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;