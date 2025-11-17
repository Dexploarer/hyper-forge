CREATE INDEX "idx_dialogues_created_by_date" ON "dialogues" USING btree ("created_by","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_npcs_created_by_date" ON "npcs" USING btree ("created_by","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_npcs_archetype_name" ON "npcs" USING btree ("archetype","name");--> statement-breakpoint
CREATE INDEX "idx_quests_created_by_date" ON "quests" USING btree ("created_by","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_quests_difficulty_type" ON "quests" USING btree ("difficulty","quest_type");