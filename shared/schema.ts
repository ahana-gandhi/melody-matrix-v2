import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ── Users ──────────────────────────────────────────────────────────────────
// Anonymous accounts: no email, just a generated username + passphrase.
// Users write down or screenshot their credentials — we never collect PII.
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),   // e.g. "calm-river-4821"
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
export const moodSessions = sqliteTable("mood_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id"),
  issue: text("issue").notNull(),
  instrument: text("instrument").notNull(),
  tempo: integer("tempo").notNull(),
  intensityScores: text("intensity_scores").notNull(),
  promptUsed: text("prompt_used").notNull(),
  moodBefore: integer("mood_before"),
  moodAfter: integer("mood_after"),
  notes: text("notes"),
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
export const journalEntries = sqliteTable("journal_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id"),
  mood: integer("mood").notNull(),
  energy: integer("energy").notNull(),
  note: text("note"),
  tags: text("tags"),
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
