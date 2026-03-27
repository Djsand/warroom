# React Todo App

> Task: "Build a React todo app with local storage persistence"

---

🏗️ **Architect**: Proposed structure:

```
src/
  App.tsx          — root component, renders TodoList
  components/
    TodoList.tsx   — manages state, syncs to localStorage
    TodoItem.tsx   — single todo with toggle/delete
    AddTodo.tsx    — input form
  hooks/
    useLocalStorage.ts — generic hook for localStorage-backed state
```

Key decisions:
- `useLocalStorage` hook handles serialization/deserialization
- State lives in `TodoList`, not App — keeps App as a thin shell
- No external state library — `useState` + custom hook is sufficient for this scope
- Optimistic UI: state updates immediately, localStorage writes async via `useEffect`

@Challenger: thoughts?

---

😈 **Challenger**: Three issues, one is subtle:

1. **Stale closure in useEffect.** If `useLocalStorage` uses `useEffect(() => localStorage.setItem(key, JSON.stringify(value)), [value])`, the effect captures a stale `key` if the key ever changes. The dependency array needs `[key, value]`.

2. **No error handling on `JSON.parse`.** If localStorage contains corrupted data (user manually edited it, different app wrote to the same key), `JSON.parse` throws and the entire component crashes. Need a try/catch with fallback to the initial value.

3. **Race condition with multiple tabs.** User opens two tabs, adds a todo in tab A, then adds a todo in tab B. Tab B overwrites tab A's changes because it read stale state on mount. Need a `storage` event listener to sync across tabs.

Issue 3 is the most interesting — most todo app tutorials ignore it entirely, and users hit it immediately.

---

🏗️ **Architect**: All valid. Revisions:

1. Dependency array: `[key, value]` — straightforward fix
2. `JSON.parse` wrapped in try/catch, falls back to `initialValue` and logs a warning
3. Add `window.addEventListener('storage', handler)` in the hook that updates state when another tab writes to the same key. Important: the `storage` event only fires in *other* tabs, not the one that wrote — so no infinite loop risk.

One constraint on the cross-tab sync: it replaces local state entirely with the remote value. If both tabs modify at the same time, last-write-wins. For a todo app, that's acceptable. For a collaborative editor, it wouldn't be.

@Builder: proceed.

---

💻 **Builder**: Implemented. 5 files.

**src/hooks/useLocalStorage.ts**
```typescript
import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch {
      console.warn(`Failed to parse localStorage key "${key}", using default`);
      return initialValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setValue(JSON.parse(e.newValue));
        } catch {
          // Ignore corrupted cross-tab data
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [key]);

  return [value, setValue] as const;
}
```

**src/components/TodoItem.tsx**
```typescript
interface TodoItemProps {
  id: string;
  text: string;
  completed: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TodoItem({ id, text, completed, onToggle, onDelete }: TodoItemProps) {
  return (
    <li style={{ textDecoration: completed ? 'line-through' : 'none' }}>
      <input type="checkbox" checked={completed} onChange={() => onToggle(id)} />
      <span>{text}</span>
      <button onClick={() => onDelete(id)}>Delete</button>
    </li>
  );
}
```

@Reviewer @Breaker: ready for review.

---

🔍 **Reviewer**: Mostly clean. Two issues:

1. **Missing `key` prop.** If `TodoList` renders `todos.map(todo => <TodoItem .../>)`, React will warn and re-render the entire list on every change. Need `key={todo.id}` on each `TodoItem`.

2. **`id` generation.** Using `Date.now()` for IDs means two rapid additions get the same ID. Use `crypto.randomUUID()` instead — it's available in all modern browsers and guaranteed unique.

Both are standard React mistakes. Fix them and it's shippable.

---

🧪 **Breaker**: Testing edge cases:

1. **localStorage full (QuotaExceededError).** When storage hits the 5MB limit, `localStorage.setItem` throws. The current code has no try/catch around the write — the component crashes and loses the in-memory state too. Fix: wrap setItem in try/catch, show a warning toast, keep in-memory state intact.

2. **`storage` event with `null` newValue.** Another tab calls `localStorage.removeItem(key)`. The current handler checks `e.newValue !== null` so it silently ignores the deletion — but the local tab still shows stale data. Should reset to `initialValue` when the key is removed.

3. **500 todos.** Rendering is fine, but `JSON.stringify` on every keystroke in the add form (because React re-renders) means serializing the entire array on every character. Not a crash, but noticeable lag. Could debounce the localStorage write or move it out of the render cycle.

4. **XSS via todo text.** If `text` contains `<script>`, React's JSX escaping handles it — confirmed safe. No issue.

Bug 1 is the most critical — data loss on a full localStorage.

---

📊 **5 agents** · 6 messages · 1 revision · 3 bugs caught · 5 files · 95s
