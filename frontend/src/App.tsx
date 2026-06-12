import { useState, useEffect, useCallback } from "react";

interface Todo {
  id: number;
  title: string;
  done: boolean;
  createdAt: string;
}

const API = "/api/todos";

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");

  const fetchTodos = useCallback(() => {
    fetch(API)
      .then((r) => r.json())
      .then(setTodos);
  }, []);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const addTodo = async () => {
    if (!input.trim()) return;
    await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: input.trim() }),
    });
    setInput("");
    fetchTodos();
  };

  const toggleTodo = async (id: number) => {
    await fetch(`${API}/${id}`, { method: "PATCH" });
    fetchTodos();
  };

  const deleteTodo = async (id: number) => {
    await fetch(`${API}/${id}`, { method: "DELETE" });
    fetchTodos();
  };

  const clearCompleted = async () => {
    await fetch(`${API}/done`, { method: "DELETE" });
    fetchTodos();
  };

  const hasCompleted = todos.some((t) => t.done);
  const total = todos.length;
  const done = todos.filter((t) => t.done).length;

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>📝 Todo List</h1>

      <p style={{ color: "#666", fontSize: 14 }}>
        {done}/{total} terminées
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTodo()}
          placeholder="Nouvelle tâche..."
          style={{ flex: 1, padding: "8px 12px", fontSize: 16 }}
        />
        <button onClick={addTodo} style={{ padding: "8px 20px", fontSize: 16 }}>
          Ajouter
        </button>
      </div>

      {hasCompleted && (
        <button
          onClick={clearCompleted}
          style={{
            padding: "6px 16px",
            fontSize: 14,
            marginBottom: 16,
            cursor: "pointer",
          }}
        >
          Supprimer les terminées
        </button>
      )}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {todos.map((todo) => (
          <li
            key={todo.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 0",
              borderBottom: "1px solid #eee",
            }}
          >
            <input
              type="checkbox"
              checked={todo.done}
              onChange={() => toggleTodo(todo.id)}
            />
            <span style={{ flex: 1, textDecoration: todo.done ? "line-through" : "none" }}>
              {todo.title}
            </span>
            <button
              onClick={() => deleteTodo(todo.id)}
              style={{ color: "#e00", background: "none", border: "none", cursor: "pointer" }}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      {todos.length === 0 && <p style={{ color: "#999" }}>Aucune tâche — ajoute-en une !</p>}
    </div>
  );
}
