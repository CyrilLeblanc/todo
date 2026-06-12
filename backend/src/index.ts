// ************************************************************
// BACKEND — Express + Prisma + TypeScript
// ************************************************************
// Serveur REST minimal avec 4 endpoints CRUD sur /api/todos.
// Prisma gère la connexion PostgreSQL et les migrations.

import { createApp } from "./app";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const app = createApp(prisma);
const PORT = process.env.PORT || 3001;

// ---- LANCEMENT ----
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
