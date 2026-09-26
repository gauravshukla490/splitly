ALTER TABLE "expense_splits" ALTER COLUMN "exchange_rate" SET DEFAULT '1';--> statement-breakpoint
ALTER TABLE "expenses" ALTER COLUMN "group_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" ALTER COLUMN "currency" SET DEFAULT 'INR';--> statement-breakpoint
ALTER TABLE "settlements" ALTER COLUMN "currency" SET DEFAULT 'INR';--> statement-breakpoint
ALTER TABLE "expense_splits" ADD COLUMN "paid" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "category" varchar(50) DEFAULT 'Other' NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "split_type" varchar(20) DEFAULT 'equal' NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "date" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "group_member" ADD COLUMN "role" varchar(20) DEFAULT 'member' NOT NULL;--> statement-breakpoint
ALTER TABLE "group_member" ADD COLUMN "joined_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "description" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "settlements" ADD COLUMN "group_id" uuid;--> statement-breakpoint
ALTER TABLE "settlements" ADD COLUMN "related_expense_ids" uuid[];--> statement-breakpoint
ALTER TABLE "settlements" ADD COLUMN "date" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "settlements" ADD COLUMN "created_by" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "settlements" ADD CONSTRAINT "settlements_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "settlements" ADD CONSTRAINT "settlements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
