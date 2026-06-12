import request from "supertest";
import { createApp } from "../app";

// ---- Mock de PrismaClient ----

const mockTodoFindMany = jest.fn();
const mockTodoCreate = jest.fn();
const mockTodoFindUnique = jest.fn();
const mockTodoUpdate = jest.fn();
const mockTodoDelete = jest.fn();

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    todo: {
      findMany: mockTodoFindMany,
      create: mockTodoCreate,
      findUnique: mockTodoFindUnique,
      update: mockTodoUpdate,
      delete: mockTodoDelete,
    },
  })),
}));

// Import après le mock pour que le constructeur soit intercepté
import { PrismaClient } from "@prisma/client";

// ---- Helpers ----

function buildApp() {
  const prisma = new PrismaClient();
  return { app: createApp(prisma), prisma };
}

// ---- Tests ----

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/todos", () => {
  it("retourne un tableau vide quand il n'y a pas de todos", async () => {
    mockTodoFindMany.mockResolvedValue([]);

    const { app } = buildApp();

    const res = await request(app).get("/api/todos");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
    expect(mockTodoFindMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
    });
  });

  it("retourne la liste des todos", async () => {
    const fakeTodos = [
      { id: 1, title: "Acheter du pain", done: false, createdAt: "2025-01-01T00:00:00.000Z" },
      { id: 2, title: "Faire les courses", done: true, createdAt: "2025-01-02T00:00:00.000Z" },
    ];
    mockTodoFindMany.mockResolvedValue(fakeTodos);

    const { app } = buildApp();

    const res = await request(app).get("/api/todos");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(fakeTodos);
  });
});

describe("POST /api/todos", () => {
  it("crée une todo et retourne 201", async () => {
    const newTodo = {
      id: 1,
      title: "Acheter du pain",
      done: false,
      createdAt: "2025-01-01T00:00:00.000Z",
    };
    mockTodoCreate.mockResolvedValue(newTodo);

    const { app } = buildApp();

    const res = await request(app)
      .post("/api/todos")
      .send({ title: "Acheter du pain" });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(newTodo);
    expect(mockTodoCreate).toHaveBeenCalledWith({
      data: { title: "Acheter du pain" },
    });
  });

  it("retourne 400 si le title est manquant", async () => {
    const { app } = buildApp();

    const res = await request(app)
      .post("/api/todos")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "title is required" });
    expect(mockTodoCreate).not.toHaveBeenCalled();
  });

  it("retourne 400 si le title n'est pas une string", async () => {
    const { app } = buildApp();

    const res = await request(app)
      .post("/api/todos")
      .send({ title: 42 });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "title is required" });
    expect(mockTodoCreate).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/todos/:id", () => {
  it("bascule le statut done d'une todo existante", async () => {
    const existingTodo = {
      id: 1,
      title: "Acheter du pain",
      done: false,
      createdAt: "2025-01-01T00:00:00.000Z",
    };
    const updatedTodo = {
      id: 1,
      title: "Acheter du pain",
      done: true,
      createdAt: "2025-01-01T00:00:00.000Z",
    };

    mockTodoFindUnique.mockResolvedValue(existingTodo);
    mockTodoUpdate.mockResolvedValue(updatedTodo);

    const { app } = buildApp();

    const res = await request(app).patch("/api/todos/1");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updatedTodo);
    expect(mockTodoFindUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(mockTodoUpdate).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { done: true },
    });
  });

  it("retourne 404 si la todo n'existe pas", async () => {
    mockTodoFindUnique.mockResolvedValue(null);

    const { app } = buildApp();

    const res = await request(app).patch("/api/todos/999");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "not found" });
    expect(mockTodoUpdate).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/todos/:id", () => {
  it("supprime une todo et retourne 204", async () => {
    mockTodoDelete.mockResolvedValue({ id: 1 });

    const { app } = buildApp();

    const res = await request(app).delete("/api/todos/1");

    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
    expect(mockTodoDelete).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it("retourne 204 même si la todo n'existe pas (catch)", async () => {
    mockTodoDelete.mockRejectedValue(new Error("Record not found"));

    const { app } = buildApp();

    const res = await request(app).delete("/api/todos/999");

    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
  });
});
