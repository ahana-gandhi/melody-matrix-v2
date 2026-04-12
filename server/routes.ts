import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { insertMoodSessionSchema, insertJournalEntrySchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import * as crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "mm-salt-v2").digest("hex");
}

export function registerRoutes(httpServer: Server, app: Express) {
  // ── Auth ───────────────────────────────────────────────────────────────
  app.post("/api/auth/register", (req, res) => {
    try {
      const { name, email, password } = z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(6),
      }).parse(req.body);

      const existing = storage.getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ error: "Email already registered" });
      }

      const user = storage.createUser({
        name,
        email,
        passwordHash: hashPassword(password),
      });

      const { passwordHash: _, ...safeUser } = user;
      return res.json({ user: safeUser });
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    try {
      const { email, password } = z.object({
        email: z.string().email(),
        password: z.string(),
      }).parse(req.body);

      const user = storage.getUserByEmail(email);
      if (!user || user.passwordHash !== hashPassword(password)) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const { passwordHash: _, ...safeUser } = user;
      return res.json({ user: safeUser });
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  });

  // ── Mood Sessions ──────────────────────────────────────────────────────
  app.get("/api/sessions", (req, res) => {
    const userId = req.query.userId ? Number(req.query.userId) : undefined;
    const sessions = storage.getMoodSessions(userId);
    res.json(sessions);
  });

  app.post("/api/sessions", (req, res) => {
    try {
      const data = insertMoodSessionSchema.parse(req.body);
      const session = storage.createMoodSession(data);
      res.status(201).json(session);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.patch("/api/sessions/:id/mood-after", (req, res) => {
    try {
      const id = Number(req.params.id);
      const { moodAfter, notes } = z.object({
        moodAfter: z.number().min(1).max(5),
        notes: z.string().optional(),
      }).parse(req.body);
      const session = storage.updateMoodSessionAfterMood(id, moodAfter, notes);
      if (!session) return res.status(404).json({ error: "Session not found" });
      res.json(session);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // ── Journal Entries ────────────────────────────────────────────────────
  app.get("/api/journal", (req, res) => {
    const userId = req.query.userId ? Number(req.query.userId) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const entries = storage.getJournalEntries(userId, limit);
    res.json(entries);
  });

  app.post("/api/journal", (req, res) => {
    try {
      const data = insertJournalEntrySchema.parse(req.body);
      const entry = storage.createJournalEntry(data);
      res.status(201).json(entry);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/journal/:id", (req, res) => {
    const id = Number(req.params.id);
    storage.deleteJournalEntry(id);
    res.status(204).send();
  });

  return httpServer;
}
