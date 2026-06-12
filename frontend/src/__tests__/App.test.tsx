import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import App from "../App";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Shorthand: create a mock fetch that returns JSON with the given status. */
function mockJsonResponse(body: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  });
}

/** Convenience — reset and stub global.fetch before each test. */
function stubFetch(mockFn: ReturnType<typeof vi.fn>) {
  vi.stubGlobal("fetch", mockFn);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("App", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // -----------------------------------------------------------------------
  // 1. Rendu initial
  // -----------------------------------------------------------------------
  it("affiche le titre et le message quand il n'y a aucune tâche", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockJsonResponse([]));
    stubFetch(fetchMock);

    render(<App />);

    // Attendre que le fetch initial soit résolu et que React re-rende
    // Le titre inclut un emoji : "📝 Todo List"
    expect(await screen.findByText(/Todo List/)).toBeInTheDocument();
    expect(screen.getByText("Aucune tâche — ajoute-en une !")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/todos");
  });

  // -----------------------------------------------------------------------
  // 2. Ajout d'une todo via le bouton
  // -----------------------------------------------------------------------
  it("ajoute une todo quand on remplit l'input et clique sur Ajouter", async () => {
    const user = userEvent.setup();

    // Premier fetch (GET) -> liste vide
    // Deuxième fetch (POST) -> 201
    // Troisième fetch (GET) -> liste avec la nouvelle todo
    const newTodo = { id: 1, title: "Acheter du pain", done: false, createdAt: "2026-06-12T10:00:00Z" };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockJsonResponse([]))
      .mockResolvedValueOnce(mockJsonResponse(newTodo, 201))
      .mockResolvedValueOnce(mockJsonResponse([newTodo]));

    stubFetch(fetchMock);
    render(<App />);

    const input = screen.getByPlaceholderText("Nouvelle tâche...");
    await user.type(input, "Acheter du pain");
    await user.click(screen.getByRole("button", { name: "Ajouter" }));

    // Le composant refetch après le POST, donc la todo doit apparaître
    expect(await screen.findByText("Acheter du pain")).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // 3. Ajout via la touche Entrée
  // -----------------------------------------------------------------------
  it("ajoute une todo quand on appuie sur Entrée dans l'input", async () => {
    const user = userEvent.setup();

    const newTodo = { id: 2, title: "Faire les courses", done: false, createdAt: "2026-06-12T10:00:00Z" };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockJsonResponse([]))
      .mockResolvedValueOnce(mockJsonResponse(newTodo, 201))
      .mockResolvedValueOnce(mockJsonResponse([newTodo]));

    stubFetch(fetchMock);
    render(<App />);

    const input = screen.getByPlaceholderText("Nouvelle tâche...");
    await user.type(input, "Faire les courses{Enter}");

    expect(await screen.findByText("Faire les courses")).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // 4. Ajout vide — ne rien faire
  // -----------------------------------------------------------------------
  it("n'ajoute rien si l'input est vide et qu'on clique sur Ajouter", async () => {
    const user = userEvent.setup();

    const fetchMock = vi.fn().mockResolvedValue(mockJsonResponse([]));
    stubFetch(fetchMock);
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Ajouter" }));

    // Seul le GET initial doit avoir été appelé — pas de POST
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/todos");
    expect(screen.getByText("Aucune tâche — ajoute-en une !")).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // 5. Toggle done — line-through
  // -----------------------------------------------------------------------
  it("applique un line-through quand on coche une todo", async () => {
    const user = userEvent.setup();

    const existingTodo = { id: 10, title: "Ranger le bureau", done: false, createdAt: "2026-06-12T10:00:00Z" };
    const toggledTodo = { ...existingTodo, done: true };

    // GET initial -> liste avec une todo
    // PATCH -> 200
    // GET refetch -> todo avec done: true
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockJsonResponse([existingTodo]))
      .mockResolvedValueOnce(mockJsonResponse(toggledTodo, 200))
      .mockResolvedValueOnce(mockJsonResponse([toggledTodo]));

    stubFetch(fetchMock);
    render(<App />);

    // Attendre que la todo apparaisse
    const todoText = await screen.findByText("Ranger le bureau");
    expect(todoText).toBeInTheDocument();
    expect(todoText).not.toHaveStyle({ textDecoration: "line-through" });

    // Trouver le checkbox dans le même <li> et le cocher
    const listItem = todoText.closest("li")!;
    const checkbox = within(listItem).getByRole("checkbox");
    await user.click(checkbox);

    // Après toggle, le texte doit avoir line-through
    const updatedText = await screen.findByText("Ranger le bureau");
    expect(updatedText).toHaveStyle({ textDecoration: "line-through" });
  });

  // -----------------------------------------------------------------------
  // 6. Suppression — la todo disparaît
  // -----------------------------------------------------------------------
  it("supprime la todo quand on clique sur le bouton de suppression", async () => {
    const user = userEvent.setup();

    const existingTodo = { id: 20, title: "Jeter les papiers", done: false, createdAt: "2026-06-12T10:00:00Z" };

    // GET initial -> une todo
    // DELETE -> 200
    // GET refetch -> liste vide
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockJsonResponse([existingTodo]))
      .mockResolvedValueOnce(mockJsonResponse(null, 200))
      .mockResolvedValueOnce(mockJsonResponse([]));

    stubFetch(fetchMock);
    render(<App />);

    // Attendre que la todo apparaisse
    const todoText = await screen.findByText("Jeter les papiers");
    expect(todoText).toBeInTheDocument();

    // Trouver le bouton de suppression (le caractère X) dans le même <li>
    const listItem = todoText.closest("li")!;
    const deleteButton = within(listItem).getByRole("button", { name: "✕" });
    await user.click(deleteButton);

    // Après suppression, le message "aucune tâche" doit réapparaître
    expect(await screen.findByText("Aucune tâche — ajoute-en une !")).toBeInTheDocument();
    expect(screen.queryByText("Jeter les papiers")).not.toBeInTheDocument();
  });
});
