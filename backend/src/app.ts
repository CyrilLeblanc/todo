// ************************************************************
// BACKEND — Express app factory (no listen)
// ************************************************************
// Exporte une fonction qui crée l'application Express configurée
// pour pouvoir être utilisée dans les tests via supertest.

import express, { Express } from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

export function createApp(prisma: PrismaClient): Express {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // ---- ROUTES CRUD ----

  // GET /api/todos — Récupérer toutes les todos
  app.get("/api/todos", async (_req, res) => {
    const todos = await prisma.todo.findMany({ orderBy: { createdAt: "desc" } });
    res.json(todos);
  });

  // POST /api/todos — Créer une todo (body: { title: string })
  app.post("/api/todos", async (req, res) => {
    const { title } = req.body;
    if (!title || typeof title !== "string") {
      res.status(400).json({ error: "title is required" });
      return;
    }
    const todo = await prisma.todo.create({ data: { title } });
    res.status(201).json(todo);
  });

  // PATCH /api/todos/:id — Basculer le statut done/non-done
  app.patch("/api/todos/:id", async (req, res) => {
    const id = Number(req.params.id);
    const todo = await prisma.todo.findUnique({ where: { id } });
    if (!todo) {
      res.status(404).json({ error: "not found" });
      return;
    }
    const updated = await prisma.todo.update({
      where: { id },
      data: { done: !todo.done },
    });
    res.json(updated);
  });

  // DELETE /api/todos/:id — Supprimer une todo
  app.delete("/api/todos/:id", async (req, res) => {
    const id = Number(req.params.id);
    await prisma.todo.delete({ where: { id } }).catch(() => null);
    res.status(204).send();
  });

  return app;
}
