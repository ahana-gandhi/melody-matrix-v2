import { db } from "./db";
import { users, moodSessions, journalEntries } from "@shared/schema";
import type {
  User, InsertUser,
  MoodSession, InsertMoodSession,
  JournalEntry, InsertJournalEntry,
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUserByEmail(email: string): User | undefined;
  getUserById(id: number): User | undefined;
  createUser(user: InsertUser): User;

  // Mood Sessions
  getMoodSessions(userId?: number): MoodSession[];
  createMoodSession(session: InsertMoodSession): MoodSession;
  updateMoodSessionAfterMood(id: number, moodAfter: number, notes?: string): MoodSession | undefined;

  // Journal Entries
  getJournalEntries(userId?: number, limit?: number): JournalEntry[];
  createJournalEntry(entry: InsertJournalEntry): JournalEntry;
  deleteJournalEntry(id: number): void;
}

export const storage: IStorage = {
  // ── Users ──────────────────────────────────────────────────────────────
  getUserByEmail(email) {
    return db.select().from(users).where(eq(users.email, email)).get();
  },
  getUserById(id) {
    return db.select().from(users).where(eq(users.id, id)).get();
  },
  createUser(user) {
    return db.insert(users).values(user).returning().get();
  },

  // ── Mood Sessions ──────────────────────────────────────────────────────
  getMoodSessions(userId) {
    if (userId !== undefined) {
      return db
        .select()
        .from(moodSessions)
        .where(eq(moodSessions.userId, userId))
        .orderBy(desc(moodSessions.createdAt))
        .all();
    }
    return db
      .select()
      .from(moodSessions)
      .orderBy(desc(moodSessions.createdAt))
      .all();
  },
  createMoodSession(session) {
    return db.insert(moodSessions).values(session).returning().get();
  },
  updateMoodSessionAfterMood(id, moodAfter, notes) {
    return db
      .update(moodSessions)
      .set({ moodAfter, notes })
      .where(eq(moodSessions.id, id))
      .returning()
      .get();
  },

  // ── Journal Entries ────────────────────────────────────────────────────
  getJournalEntries(userId, limit = 50) {
    if (userId !== undefined) {
      return db
        .select()
        .from(journalEntries)
        .where(eq(journalEntries.userId, userId))
        .orderBy(desc(journalEntries.createdAt))
        .limit(limit)
        .all();
    }
    return db
      .select()
      .from(journalEntries)
      .orderBy(desc(journalEntries.createdAt))
      .limit(limit)
      .all();
  },
  createJournalEntry(entry) {
    return db.insert(journalEntries).values(entry).returning().get();
  },
  deleteJournalEntry(id) {
    db.delete(journalEntries).where(eq(journalEntries.id, id)).run();
  },
};
