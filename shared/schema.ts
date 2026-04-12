import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ── Users ──────────────────────────────────────────────────────────────────
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ── Mood Sessions ──────────────────────────────────────────────────────────
// Each time the user completes the assessment and generates music
export const moodSessions = sqliteTable("mood_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id"), // nullable — supports anonymous use
  issue: text("issue").notNull(), // anxiety | depression | relationship | stress | sleep
  instrument: text("instrument").notNull(),
  tempo: integer("tempo").notNull(),
  intensityScores: text("intensity_scores").notNull(), // JSON
  promptUsed: text("prompt_used").notNull(),
  moodBefore: integer("mood_before"), // 1-5 self-rated mood before
  moodAfter: integer("mood_after"),   // 1-5 self-rated mood after
  notes: text("notes"),               // free-text journal note
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const insertMoodSessionSchema = createInsertSchema(moodSessions).omit({
  id: true,
  createdAt: true,
});
export type InsertMoodSession = z.infer<typeof insertMoodSessionSchema>;
export type MoodSession = typeof moodSessions.$inferSelect;

// ── Journal Entries ────────────────────────────────────────────────────────
// Lightweight daily check-ins independent of sessions
export const journalEntries = sqliteTable("journal_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id"),
  mood: integer("mood").notNull(), // 1-5
  energy: integer("energy").notNull(), // 1-5
  note: text("note"),
  tags: text("tags"), // JSON array of strings e.g. ["anxious","tired"]
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({
  id: true,
  createdAt: true,
});
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type JournalEntry = typeof journalEntries.$inferSelect;
