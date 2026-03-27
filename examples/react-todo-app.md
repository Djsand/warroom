# React Todo App

> Task: "Build a React todo app with local storage persistence"

---

🏗️ **Architect**: Proposed structure:

```
src/
  App.jsx           — root component, manages todo state
  components/
    TodoList.jsx    — renders list of TodoItem components
    TodoItem.jsx    — single todo with toggle and delete
    TodoInput.jsx   — controlled input for adding todos
  hooks/
    useLocalStorage.js — custom hook: syncs state to localStorage
```

Key decisions:
- `useLocalStorage` hook wraps `useState` with read/write to `localStorage`
- Todos stored as `{ id, text, completed, createdAt }`
- IDs generated with `crypto.randomUUID()`
- All state mutations return new arrays (immutable updates)

@Challenger: thoughts?

---

😈 **Challenger**: Three real problems:

1. **Race condition on mount.** `useLocalStorage` likely reads from localStorage in an initializer, then writes back on every change via `useEffect`. But if two tabs are open, tab A writes, tab B's effect fires with stale state, and tab B overwrites tab A's changes. No cross-tab sync at all.

2. **No cleanup in useEffect.** If the hook uses `useEffect` to write to localStorage on state change, and the component unmounts mid-write (React 18 strict mode double-mounts in dev), you get writes from a stale closure. The hook needs a cleanup function or at minimum a ref to track the current value.

3. **`crypto.randomUUID()` is not available in all browsers.** It requires a secure context (HTTPS) and is missing in older browsers. For a todo app, `Date.now().toString(36) + Math.random().toString(36).slice(2)` is sufficient and universally supported.

---

🏗️ **Architect**: All valid. Revisions:

1. Add a `storage` event listener in `useLocalStorage` to sync across tabs. When another tab writes, the listener updates local state without triggering a write-back loop.
2. Use a ref to track the latest value. The `useEffect` cleanup checks whether the component is still mounted before writing. Also: write synchronously in the setter function rather than in an effect — eliminates the stale closure problem entirely.
3. Switch to `Date.now()` + random suffix for IDs. No crypto dependency.

@Builder: proceed with revised spec.

---

💻 **Builder**: Implemented. 5 files, 160 lines total.

**hooks/useLocalStorage.js**
```javascript
import { useState, useEffect, useCallback } from 'react';

function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    setStoredValue((prev) => {
      const nextValue = value instanceof Function ? value(prev) : value;
      window.localStorage.setItem(key, JSON.stringify(nextValue));
      return nextValue;
    });
  }, [key]);

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === key) {
        setStoredValue(e.newValue ? JSON.parse(e.newValue) : initialValue);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [key, initialValue]);

  return [storedValue, setValue];
}
```

**App.jsx**
```javascript
function App() {
  const [todos, setTodos] = useLocalStorage('todos', []);

  const addTodo = (text) => {
    setTodos((prev) => [...prev, {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      text,
      completed: false,
      createdAt: new Date().toISOString(),
    }]);
  };

  const toggleTodo = (id) => {
    setTodos((prev) => prev.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  };

  return (
    <div>
      <TodoInput onAdd={addTodo} />
      <TodoList todos={todos} onToggle={toggleTodo} onDelete={deleteTodo} />
    </div>
  );
}
```

@Reviewer @Breaker: ready for review.

---

🔍 **Reviewer**: Clean implementation. The synchronous write inside the setter callback is the right call — avoids the stale closure footgun entirely. Cross-tab sync via the `storage` event is correct.

Two issues:

1. **Missing `key` prop in TodoList.** The `map()` in TodoList must use `todo.id` as the key. If it uses array index, reordering or deleting causes React to mismatch component state with the wrong todo. This is a real bug — toggling a todo could toggle the wrong one after a deletion.

2. **`initialValue` in the storage event handler dependency array.** If `initialValue` is an object literal (like `[]`), a new reference is created every render, causing the effect to re-run infinitely. Either memoize it in the parent or use a ref inside the hook.

Issue 1 is a bug. Issue 2 is a latent bug that triggers when the hook is used with object defaults.

---

🧪 **Breaker**: Stress-testing localStorage:

1. **localStorage is full.** `window.localStorage.setItem` throws `QuotaExceededError` when storage is full (~5MB). The `setValue` function calls `setItem` inside the state updater but has no try/catch. Result: the state update succeeds (React state changes) but the write fails silently. On next page load, the old data loads — the user's changes are lost with no error message. Fix: wrap `setItem` in try/catch, surface error to the user.

2. **Corrupted localStorage.** If another script writes invalid JSON to the `todos` key, `JSON.parse` throws on mount. The initializer catches this and falls back to `initialValue` — good. But the storage event handler has `JSON.parse(e.newValue)` with no try/catch. A corrupted cross-tab write crashes the app.

3. **Rapid toggling.** Clicking toggle 50 times in 1 second. Because `setValue` uses the functional updater pattern (`prev => ...`), each update sees the correct previous state. No bug here — the functional updater pattern is correct.

Bug 1 is critical — data loss with no feedback. Bug 2 crashes the app on corrupted external writes.

---

📊 **5 agents** · 6 messages · 1 revision · 3 bugs caught · 5 files · 95s
