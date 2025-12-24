ALTER TABLE "transactions" DROP CONSTRAINT "transactions_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_profiles" DROP CONSTRAINT "user_profiles_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_settings" DROP CONSTRAINT "user_settings_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "currency" text DEFAULT 'INR';--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;